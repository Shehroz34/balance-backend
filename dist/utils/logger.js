"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function write(level, message, meta) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (meta === undefined) {
        console[level](prefix);
        return;
    }
    console[level](prefix, meta);
}
exports.logger = {
    debug(message, meta) {
        write("debug", message, meta);
    },
    info(message, meta) {
        write("info", message, meta);
    },
    warn(message, meta) {
        write("warn", message, meta);
    },
    error(message, meta) {
        write("error", message, meta);
    },
};
