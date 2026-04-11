import { Request, Response } from "express";

import { Wellbeing } from "../models/wellbeing.model";

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getEndOfToday() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

export async function saveTodayWellbeing(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { wellbeingLevel, note = "" } = req.body as {
      wellbeingLevel: 1 | 2 | 3 | 4;
      note?: string;
    };

    const startOfToday = getStartOfToday();

    const wellbeing = await Wellbeing.findOneAndUpdate(
      {
        user: req.userId,
        date: startOfToday,
      },
      {
        user: req.userId,
        date: startOfToday,
        wellbeingLevel,
        note,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: "Wellbeing saved successfully",
      wellbeing,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save wellbeing" });
  }
}

export async function getTodayWellbeing(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const wellbeing = await Wellbeing.findOne({
      user: req.userId,
      date: {
        $gte: getStartOfToday(),
        $lte: getEndOfToday(),
      },
    });

    return res.status(200).json({
      wellbeing,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch wellbeing" });
  }
}
