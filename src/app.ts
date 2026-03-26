import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import scheduleRoutes from "./routes/schedule.routes";
import userRoutes from "./routes/user.routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  app.use(cors({
    origin: clientOrigin,
    credentials: true,
  }));
  app.use(requestLogger);
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/schedule", scheduleRoutes);
  app.use("/api/users", userRoutes);

  app.use(
    (err: unknown, req: Request, res: Response, _next: NextFunction) => {
      logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
      res.status(500).json({ message: "Internal server error" });
    }
  );

  return app;
}
