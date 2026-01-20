import "dotenv/config";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await authStorage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }

          if (!user.password) {
            return done(null, false, { 
              message: "Este usuário não possui senha configurada. Use o registro para criar uma conta." 
            });
          }

          const isValid = await bcrypt.compare(password, user.password);
          
          if (!isValid) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as any).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) {
        console.error("[Auth] Login error:", err);
        return res.status(500).json({ message: "Erro interno do servidor" });
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Email ou senha incorretos" 
        });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[Auth] Session error:", loginErr);
          return res.status(500).json({ message: "Erro ao criar sessão" });
        }
        
        console.log("[Auth] User logged in successfully:", (user as any).email);
        return res.json({ 
          message: "Login realizado com sucesso",
          user: {
            id: (user as any).id,
            email: (user as any).email,
            firstName: (user as any).firstName,
            lastName: (user as any).lastName,
          }
        });
      });
    })(req, res, next);
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email e senha são obrigatórios" 
        });
      }

      // Check if user already exists
      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Este email já está cadastrado" 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await authStorage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Auto-login after registration
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[Auth] Auto-login error:", loginErr);
          return res.status(201).json({ 
            message: "Usuário criado com sucesso. Faça login para continuar.",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          });
        }

        return res.status(201).json({ 
          message: "Usuário criado e logado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });
      });
    } catch (error: any) {
      console.error("[Auth] Registration error:", error);
      res.status(500).json({ 
        message: "Erro ao criar usuário",
        error: error.message 
      });
    }
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Redirect for compatibility with frontend
  app.get("/api/login", (req, res) => {
    // Frontend should use POST /api/login, but if GET is called, redirect to home
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check if user is authenticated via passport session
  if (!req.isAuthenticated()) {
    console.log("[Auth] User not authenticated - req.isAuthenticated() = false");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  
  if (!user) {
    console.log("[Auth] User object is missing from session");
    return res.status(401).json({ message: "Unauthorized" });
  }

  // User is authenticated, proceed
  return next();
};
