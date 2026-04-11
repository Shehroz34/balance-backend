import { Request, Response } from "express";
import { ExternalCalendarEvent } from "../models/external-calendar-event.model";
import { Task } from "../models/task.model";
import { User } from "../models/User";
import { Wellbeing } from "../models/wellbeing.model";
import { sortTasksForSchedule } from "../utils/scheduler";
import { generateDailyPlan } from "../utils/planner";
import {
  getAvailableWorkMinutesForDay,
  resolveWellbeingPlanningContext,
} from "../utils/wellbeing-planner";

async function getTodayWellbeingForUser(userId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return Wellbeing.findOne({
    user: userId,
    date: {
      $gte: startOfToday,
      $lte: endOfToday,
    },
  });
}

export async function getSuggestedSchedule(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tasks = await Task.find({
      user: req.userId,
      status: "pending",
    });

    const wellbeing = await getTodayWellbeingForUser(req.userId);
    const sortedTasks = sortTasksForSchedule(tasks, {
      wellbeingLevel: wellbeing?.wellbeingLevel,
    });

    return res.json({
      message: "Suggested schedule generated successfully",
      totalTasks: sortedTasks.length,
      tasks: sortedTasks,
      appliedWellbeingLevel: wellbeing?.wellbeingLevel ?? 4,
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

    const wellbeing = await getTodayWellbeingForUser(req.userId);
    const normalAvailableMinutes = getAvailableWorkMinutesForDay(
      user.availableFrom,
      user.availableTo,
      user.breakStart,
      user.breakEnd
    );
    const wellbeingPlanning = resolveWellbeingPlanningContext(
      wellbeing?.wellbeingLevel,
      normalAvailableMinutes,
      wellbeing?.note
    );

    const sortedTasks = sortTasksForSchedule(tasks, {
      wellbeingLevel: wellbeing?.wellbeingLevel,
    });
    const busyCalendarEvents = await ExternalCalendarEvent.find({
      user: req.userId,
    }).sort({ start: 1 });

    const result = generateDailyPlan(
      sortedTasks,
      {
        availableFrom: user.availableFrom,
        availableTo: user.availableTo,
        breakStart: user.breakStart,
        breakEnd: user.breakEnd,
        freeDays: user.freeDays ?? [],
      },
      busyCalendarEvents.map((event) => ({
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      })),
      wellbeingPlanning
    );

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
      appliedWellbeingLevel: wellbeingPlanning.appliedWellbeingLevel,
      effectiveWorkHours:
        wellbeingPlanning.effectiveWorkMinutes == null
          ? null
          : Number((wellbeingPlanning.effectiveWorkMinutes / 60).toFixed(2)),
      reservedRestMinutes: wellbeingPlanning.reservedRestMinutes,
      wellbeingNote: wellbeingPlanning.wellbeingNote ?? "",
      scheduleLightened: wellbeingPlanning.scheduleLightened,
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

    // A full replan should discard any manually dragged task times first.
    await Task.updateMany(
      {
        user: req.userId,
        status: "pending",
      },
      {
        $set: {
          startTime: null,
          endTime: null,
        },
      }
    );

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const remainingTasks = await Task.find({
      user: req.userId,
      status: "pending",
    });

    const wellbeing = await getTodayWellbeingForUser(req.userId);
    const normalAvailableMinutes = getAvailableWorkMinutesForDay(
      user.availableFrom,
      user.availableTo,
      user.breakStart,
      user.breakEnd
    );
    const wellbeingPlanning = resolveWellbeingPlanningContext(
      wellbeing?.wellbeingLevel,
      normalAvailableMinutes,
      wellbeing?.note
    );

    const sortedRemainingTasks = sortTasksForSchedule(remainingTasks, {
      wellbeingLevel: wellbeing?.wellbeingLevel,
    });
    const busyCalendarEvents = await ExternalCalendarEvent.find({
      user: req.userId,
    }).sort({ start: 1 });

    const result = generateDailyPlan(
      sortedRemainingTasks,
      {
        availableFrom: user.availableFrom,
        availableTo: user.availableTo,
        breakStart: user.breakStart,
        breakEnd: user.breakEnd,
        freeDays: user.freeDays ?? [],
      },
      busyCalendarEvents.map((event) => ({
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      })),
      wellbeingPlanning
    );

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
      appliedWellbeingLevel: wellbeingPlanning.appliedWellbeingLevel,
      effectiveWorkHours:
        wellbeingPlanning.effectiveWorkMinutes == null
          ? null
          : Number((wellbeingPlanning.effectiveWorkMinutes / 60).toFixed(2)),
      reservedRestMinutes: wellbeingPlanning.reservedRestMinutes,
      wellbeingNote: wellbeingPlanning.wellbeingNote ?? "",
      scheduleLightened: wellbeingPlanning.scheduleLightened,
      plan: result.plan,
      summaries: result.summaries,
    });
  } catch (error) {
    console.error("REPLAN SCHEDULE ERROR:", error);
    return res.status(500).json({ message: "Failed to re-plan schedule" });
  }
}
