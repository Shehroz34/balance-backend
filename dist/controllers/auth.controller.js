"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const env_1 = require("../utils/env");
function signToken(userId) {
    const secret = (0, env_1.mustGetEnv)("JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    return jsonwebtoken_1.default.sign({ sub: userId }, secret, {
        expiresIn: expiresIn,
    });
}
async function register(req, res) {
    try {
        const { name = "", email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }
        const existing = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: "Email already in use." });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        const user = await User_1.User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });
        const token = signToken(String(user._id));
        return res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }
        const ok = await bcrypt_1.default.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ message: "Invalid credentials." });
        }
        const token = signToken(String(user._id));
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
}
