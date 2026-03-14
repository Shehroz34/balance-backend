import { Request, Response } from "express";
import { Task } from "../models/task.model";
import { User } from "../models/User";
import { sortTasksForSchedule } from "../utils/scheduler";
import { generateDailyPlan } from "../utils/planner";

export async function getSuggestedSchedule(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tasks = await Task.find({
      user: req.userId,
      status: "pending",
    });

    const sortedTasks = sortTasksForSchedule(tasks);

    return res.json({
      message: "Suggested schedule generated successfully",
      totalTasks: sortedTasks.length,
      tasks: sortedTasks,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate schedule" });
  }
}

export async function getPlannedSchedule(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tasks = await Task.find({
      user: req.userId,
      status: "pending",
    });

    const sortedTasks = sortTasksForSchedule(tasks);

    const plannedSchedule = generateDailyPlan(sortedTasks, {
      availableFrom: user.availableFrom,
      availableTo: user.availableTo,
      breakStart: user.breakStart,
      breakEnd: user.breakEnd,
    });

    return res.json({
      message: "Planned schedule generated successfully",
      availability: {
        availableFrom: user.availableFrom,
        availableTo: user.availableTo,
        breakStart: user.breakStart,
        breakEnd: user.breakEnd,
      },
      totalTasks: sortedTasks.length,
      totalBlocks: plannedSchedule.length,
      plan: plannedSchedule,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate planned schedule" });
  }
}
