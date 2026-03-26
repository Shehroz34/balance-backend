"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mustGetEnv = mustGetEnv;
function mustGetEnv(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing env var: ${name}`);
    return value;
}
