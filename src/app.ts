import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import scheduleRoutes from "./routes/schedule.routes";
import userRoutes from "./routes/user.routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/schedule", scheduleRoutes);
  app.use("/api/users", userRoutes);

  return app;
}
