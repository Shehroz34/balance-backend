"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../utils/env");
async function connectDB() {
    const uri = (0, env_1.mustGetEnv)("MONGO_URI");
    await mongoose_1.default.connect(uri);
    console.log("✅ MongoDB connected");
}
