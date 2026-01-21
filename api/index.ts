import express, { type Request, Response, NextFunction } from "express";
// Use dynamic imports for server modules to avoid path issues in Vercel
const getRegisterRoutes = () => import("../server/routes").then(m => m.registerRoutes);
const getServeStatic = () => import("../server/static").then(m => m.serveStatic);

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes (async setup)
let appInitialized = false;
const initPromise = (async () => {
  if (appInitialized) return;
  
  try {
    // Create a dummy http server for compatibility
    const { createServer } = await import("http");
    const httpServer = createServer(app);
    
    // Dynamically import registerRoutes to avoid path resolution issues
    const registerRoutes = await getRegisterRoutes();
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Error:", err);
    });
  } catch (error: any) {
    console.error("[Init] Failed to initialize app:", error);
    throw error;
  }

  // Serve static files in production (but not in Vercel - handled by Vercel itself)
  // Check if we're in Vercel by looking for VERCEL environment variable
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    const serveStatic = await getServeStatic();
    serveStatic(app);
  } else if (process.env.VERCEL) {
    // In Vercel, only serve index.html for non-API routes (SPA routing)
    app.get("*", (req, res, next) => {
      // Skip if it's an API route or asset file
      if (req.path.startsWith("/api") || req.path.startsWith("/assets/") || req.path.includes(".")) {
        return next();
      }
      
      // For SPA routing, serve index.html
      const fs = require("fs");
      const path = require("path");
      
      // Try to find index.html in the build output
      const possiblePaths = [
        path.resolve(process.cwd(), ".vercel/output/static/index.html"),
        path.resolve(process.cwd(), "dist/public/index.html"),
      ];
      
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.sendFile(indexPath);
        }
      }
      
      // If index.html not found, continue to next middleware
      next();
    });
  }
  
  appInitialized = true;
})();

// Vercel serverless function handler
// This handler accepts both Vercel's native format and standard Node.js format
export default async function handler(
  req: any,
  res: any
) {
  try {
    // Wait for app initialization
    await initPromise;
    
    // Handle the request through Express
    return new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      // Ensure response is handled correctly
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any, cb?: any) {
        if (!resolved) {
          resolved = true;
          originalEnd(chunk, encoding, (err?: Error) => {
            if (err) reject(err);
            else resolve();
            if (cb) cb(err);
          });
        } else {
          originalEnd(chunk, encoding, cb);
        }
      };
      
      // Timeout handler
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (!res.headersSent) {
            res.status(504).json({ message: "Gateway Timeout" });
          }
          resolve();
        }
      }, 55000); // 55 seconds (max is 60)
      
      app(req, res, (err?: any) => {
        clearTimeout(timeout);
        if (err) {
          if (!resolved) {
            resolved = true;
            if (!res.headersSent) {
              res.status(500).json({ 
                message: "Internal Server Error",
                error: process.env.NODE_ENV === "development" ? err.message : undefined
              });
            }
            resolve();
          }
        } else if (!res.headersSent && !resolved) {
          // No response was sent, resolve
          resolved = true;
          resolve();
        }
      });
    });
  } catch (error: any) {
    console.error("[Handler] Fatal error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
}
