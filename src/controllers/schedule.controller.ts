import { Request, Response } from "express";
import { ExternalCalendarEvent } from "../models/external-calendar-event.model";
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
    console.error("SUGGESTED SCHEDULE ERROR:", error);
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
    const busyCalendarEvents = await ExternalCalendarEvent.find({
      user: req.userId,
    }).sort({ start: 1 });

    const result = generateDailyPlan(sortedTasks, {
      availableFrom: user.availableFrom,
      availableTo: user.availableTo,
      breakStart: user.breakStart,
      breakEnd: user.breakEnd,
      freeDays: user.freeDays ?? [],
    }, busyCalendarEvents.map((event) => ({
      start: event.start,
      end: event.end,
      allDay: event.allDay,
    })));

    const scheduledCount = result.summaries.filter(
      (t) => t.status === "scheduled"
    ).length;

    const splitCount = result.summaries.filter(
      (t) => t.status === "splitAcrossDays"
    ).length;

    const atRiskCount = result.summaries.filter(
      (t) => t.status === "atRisk"
    ).length;

    const missedCount = result.summaries.filter(
      (t) => t.status === "missedDeadline"
    ).length;

    return res.json({
      message: "Planned schedule generated successfully",
      availability: {
        availableFrom: user.availableFrom,
        availableTo: user.availableTo,
        breakStart: user.breakStart,
        breakEnd: user.breakEnd,
        freeDays: user.freeDays ?? [],
      },
      totalTasks: sortedTasks.length,
      totalBlocks: result.plan.length,
      stats: {
        scheduled: scheduledCount,
        splitAcrossDays: splitCount,
        atRisk: atRiskCount,
        missedDeadline: missedCount,
      },
      plan: result.plan,
      summaries: result.summaries,
    });
  } catch (error) {
    console.error("PLANNED SCHEDULE ERROR:", error);
    return res.status(500).json({ message: "Failed to generate planned schedule" });
  }
}

export async function getReplannedSchedule(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const remainingTasks = await Task.find({
      user: req.userId,
      status: "pending",
    });

    const sortedRemainingTasks = sortTasksForSchedule(remainingTasks);
    const busyCalendarEvents = await ExternalCalendarEvent.find({
      user: req.userId,
    }).sort({ start: 1 });

    const result = generateDailyPlan(sortedRemainingTasks, {
      availableFrom: user.availableFrom,
      availableTo: user.availableTo,
      breakStart: user.breakStart,
      breakEnd: user.breakEnd,
      freeDays: user.freeDays ?? [],
    }, busyCalendarEvents.map((event) => ({
      start: event.start,
      end: event.end,
      allDay: event.allDay,
    })));

    const scheduledCount = result.summaries.filter(
      (t) => t.status === "scheduled"
    ).length;

    const splitCount = result.summaries.filter(
      (t) => t.status === "splitAcrossDays"
    ).length;

    const atRiskCount = result.summaries.filter(
      (t) => t.status === "atRisk"
    ).length;

    const missedCount = result.summaries.filter(
      (t) => t.status === "missedDeadline"
    ).length;

    return res.json({
      message: "Schedule re-planned successfully",
      availability: {
        availableFrom: user.availableFrom,
        availableTo: user.availableTo,
        breakStart: user.breakStart,
        breakEnd: user.breakEnd,
        freeDays: user.freeDays ?? [],
      },
      totalTasks: sortedRemainingTasks.length,
      totalBlocks: result.plan.length,
      stats: {
        scheduled: scheduledCount,
        splitAcrossDays: splitCount,
        atRisk: atRiskCount,
        missedDeadline: missedCount,
      },
      plan: result.plan,
      summaries: result.summaries,
    });
  } catch (error) {
    console.error("REPLAN SCHEDULE ERROR:", error);
    return res.status(500).json({ message: "Failed to re-plan schedule" });
  }
}
