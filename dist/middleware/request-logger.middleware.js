"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../utils/logger");
function requestLogger(req, res, next) {
    const startedAt = Date.now();
    res.on("finish", () => {
        logger_1.logger.info(`${req.method} ${req.originalUrl}`, {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            ip: req.ip,
        });
    });
    next();
}
