"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
const planner_routes_1 = __importDefault(require("./routes/planner.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const request_logger_middleware_1 = require("./middleware/request-logger.middleware");
const logger_1 = require("./utils/logger");
function createApp() {
    const app = (0, express_1.default)();
    const allowedOrigin = "http://localhost:5173";
    app.use(request_logger_middleware_1.requestLogger);
    app.use((req, _res, next) => {
        logger_1.logger.debug("Incoming origin", {
            method: req.method,
            path: req.originalUrl,
            origin: req.headers.origin ?? null,
        });
        next();
    });
    app.use((0, cors_1.default)({
        origin: allowedOrigin,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.get("/health", (_req, res) => res.json({ status: "ok" }));
    app.use("/calendar", calendar_routes_1.default);
    app.use("/planner", planner_routes_1.default);
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/tasks", task_routes_1.default);
    app.use("/api/schedule", schedule_routes_1.default);
    app.use("/api/users", user_routes_1.default);
    app.use((err, req, res, _next) => {
        logger_1.logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
        res.status(500).json({ message: "Internal server error" });
    });
    return app;
}
