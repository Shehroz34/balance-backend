
import { Request, Response } from "express";
import { User } from "../models/User";

export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}

export async function updateAvailability(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { availableFrom, availableTo, breakStart, breakEnd } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        availableFrom,
        availableTo,
        breakStart,
        breakEnd,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Availability updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update availability" });
  }
}
