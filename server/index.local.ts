import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

// Simple logging function for local development
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup routes
  const server = await registerRoutes(app);

  // CORS middleware for local development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });

  // Start server on port 5000 for backend API only
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`Backend API server running on port ${port}`);
    log(`Frontend should run on http://localhost:5173`);
  });
})();