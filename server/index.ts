import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import cookieParser from "cookie-parser";
import cors from "cors";
import { initializeDefaultProfile } from "./init";

const app = express();

// CORS configuration to allow frontend on localhost:5000
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true,
}));

app.use(cookieParser());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}
app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await initializeDefaultProfile();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Frontend is now served separately by Vite dev server on port 5000
  // Backend (port 3000) only serves API routes
  // Vite setup removed to prevent serving UI from backend

  // Backend API server port (default 3000)
  // Frontend runs separately on port 5000 (Vite dev server)
  const port = parseInt(process.env.PORT || "3000", 10);
  const preferredHost = 'localhost';
  const fallbackHost = "127.0.0.1";

  async function tryListen(opts: {
    port: number;
    host: string;
    reusePort?: boolean;
  }) {
    return new Promise<void>((resolve, reject) => {
      server.listen(opts, () => {
        console.log(`Server listening on http://${opts.host}:${opts.port}`);
        resolve();
      });
      server.once("error", (err: any) => {
        reject(err);
      });
    });
  }

  (async () => {
    try {
      // First attempt: use preferred host and try reusePort if not explicitly disabled
      await tryListen({ port, host: preferredHost, reusePort: true });
    } catch (err: any) {
      // If ENOTSUP or unsupported socket option occurs, retry with safer settings
      if (err && err.code === "ENOTSUP") {
        console.warn(
          `ENOTSUP when binding to ${preferredHost}:${port} with reusePort. Retrying with safer options...`
        );
        try {
          // Try without reusePort but same host
          await tryListen({ port, host: preferredHost, reusePort: false });
        } catch (err2: any) {
          console.warn(`Retry without reusePort failed: ${err2?.code || err2}`);
          // If still failing, try loopback (127.0.0.1)
          try {
            console.warn(
              `Attempting to bind to loopback ${fallbackHost}:${port}...`
            );
            await tryListen({ port, host: fallbackHost, reusePort: false });
          } catch (err3: any) {
            console.error("All listen attempts failed.", err3);
            process.exit(1);
          }
        }
      } else if (err && err.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Kill the process using it or change PORT.`
        );
        process.exit(1);
      } else if (err && err.code === "EACCES") {
        console.error(
          `Permission denied binding to port ${port}. Try running as admin or choose port >1024.`
        );
        process.exit(1);
      } else {
        console.error("Unexpected server.listen error:", err);
        process.exit(1);
      }
    }
  })();
})();
