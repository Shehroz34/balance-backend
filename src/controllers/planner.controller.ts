import { Request, Response } from "express";

import { ExternalCalendarEvent } from "../models/external-calendar-event.model";
import { Task } from "../models/task.model";
import { User } from "../models/User";
import { Wellbeing } from "../models/wellbeing.model";
import { generateDailyPlan } from "../utils/planner";
import { sortTasksForSchedule } from "../utils/scheduler";
import { logger } from "../utils/logger";
import {
  getAvailableWorkMinutesForDay,
  resolveWellbeingPlanningContext,
} from "../utils/wellbeing-planner";

interface PlannerEvent {
  id: string;
  taskId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export async function getPlannerSchedule(req: Request, res: Response) {
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
    }).sort({ deadline: 1 });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const wellbeing = await Wellbeing.findOne({
      user: req.userId,
      date: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    const busyCalendarEvents = await ExternalCalendarEvent.find({
      user: req.userId,
    }).sort({ start: 1 });

    // Tasks that were moved directly in the calendar should keep their explicit times.
    const manuallyScheduledTasks = tasks.filter((task) => task.startTime && task.endTime);
    const tasksNeedingPlanner = tasks.filter((task) => !task.startTime || !task.endTime);

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

    const plannedResult = generateDailyPlan(
      sortTasksForSchedule(tasksNeedingPlanner, {
        wellbeingLevel: wellbeing?.wellbeingLevel,
      }),
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

    const manualEvents: PlannerEvent[] = manuallyScheduledTasks.map((task) => ({
      id: String(task._id),
      taskId: String(task._id),
      title: task.title,
      startTime: new Date(task.startTime as Date).toISOString(),
      endTime: new Date(task.endTime as Date).toISOString(),
    }));

    const generatedEvents: PlannerEvent[] = plannedResult.plan.map((block, index) => {
      const [startHour, startMinute] = block.start.split(":").map(Number);
      const [endHour, endMinute] = block.end.split(":").map(Number);
      const [year, month, day] = block.date.split("-").map(Number);

      const start = new Date(year, month - 1, day, startHour, startMinute);
      const end = new Date(year, month - 1, day, endHour, endMinute);

      return {
        id: `${block.taskId}-${index}`,
        taskId: block.taskId,
        title: block.title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    });

    const schedule = [...manualEvents, ...generatedEvents].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    logger.info("Planner schedule generated", {
      userId: req.userId,
      totalEvents: schedule.length,
      manualEvents: manualEvents.length,
      generatedEvents: generatedEvents.length,
    });

    return res.json(schedule);
  } catch (error) {
    logger.error("Planner schedule generation failed", error);
    return res.status(500).json({ message: "Failed to generate planner schedule" });
  }
}
