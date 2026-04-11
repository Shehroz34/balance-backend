import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import calendarRoutes from "./routes/calendar.routes";
import plannerRoutes from "./routes/planner.routes";
import taskRoutes from "./routes/task.routes";
import scheduleRoutes from "./routes/schedule.routes";
import userRoutes from "./routes/user.routes";
import wellbeingRoutes from "./routes/wellbeing.routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();
  const allowedOrigin = "http://localhost:5173";
  
  app.use(requestLogger);
  app.use((req, _res, next) => {
    logger.debug("Incoming origin", {
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin ?? null,
    });
    next();
  });

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  );

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/calendar", calendarRoutes);
  app.use("/planner", plannerRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/schedule", scheduleRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/wellbeing", wellbeingRoutes);

  app.use(
    (err: unknown, req: Request, res: Response, _next: NextFunction) => {
      logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
      res.status(500).json({ message: "Internal server error" });
    }
  );

  return app;
}
