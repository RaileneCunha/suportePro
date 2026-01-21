import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Support both CommonJS and ES modules
const __filename = typeof __dirname !== "undefined" 
  ? path.join(__dirname, "static.js")
  : fileURLToPath(import.meta.url);
const __dirname_actual = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(__filename);

export function serveStatic(app: Express) {
  // Try multiple possible paths for dist/public
  const possiblePaths = [
    path.resolve(__dirname_actual, "../dist/public"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), ".vercel/output/static"),
  ];
  
  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      break;
    }
  }
  
  if (!distPath) {
    console.warn(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}`
    );
    // Still serve a basic response to avoid errors
    app.use("*", (_req, res) => {
      res.status(404).json({ message: "Static files not found. Please build the application first." });
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ message: "Index file not found" });
    }
  });
}
