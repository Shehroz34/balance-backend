import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { mustGetEnv } from "../utils/env";

function signToken(userId: string): string {
    const secret = mustGetEnv("JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  
    return jwt.sign({ sub: userId }, secret, {
      expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    });
  }

export async function register(req: Request, res: Response) {
    try {
      const { name = "", email, password } = req.body as { name?: string; email?: string; password?: string };
  
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }
  
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: "Email already in use." });
      }
  
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
  
      const token = signToken(String(user._id));
  
      return res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error." });
    }
  }

  export async function login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
  
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }
  
      // passwordHash is select:false, so we must explicitly select it
      const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
  
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
  
      const token = signToken(String(user._id));
  
      return res.status(200).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error." });
    }
  }
