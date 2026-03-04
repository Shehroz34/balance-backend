import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { mustGetEnv } from "../utils/env";

export type AuthedRequest = Request & { userId?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header." });
    }
  
    const token = header.slice("Bearer ".length);
    try {
      const secret = mustGetEnv("JWT_SECRET");
      const payload = jwt.verify(token, secret) as { sub?: string };
      if (!payload.sub) return res.status(401).json({ message: "Invalid token payload." });
  
      req.userId = payload.sub;
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  }