"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlannerSchedule = getPlannerSchedule;
const external_calendar_event_model_1 = require("../models/external-calendar-event.model");
const task_model_1 = require("../models/task.model");
const User_1 = require("../models/User");
const planner_1 = require("../utils/planner");
const scheduler_1 = require("../utils/scheduler");
const logger_1 = require("../utils/logger");
async function getPlannerSchedule(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const tasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        }).sort({ deadline: 1 });
        const busyCalendarEvents = await external_calendar_event_model_1.ExternalCalendarEvent.find({
            user: req.userId,
        }).sort({ start: 1 });
        // Tasks that were moved directly in the calendar should keep their explicit times.
        const manuallyScheduledTasks = tasks.filter((task) => task.startTime && task.endTime);
        const tasksNeedingPlanner = tasks.filter((task) => !task.startTime || !task.endTime);
        const plannedResult = (0, planner_1.generateDailyPlan)((0, scheduler_1.sortTasksForSchedule)(tasksNeedingPlanner), {
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
        const manualEvents = manuallyScheduledTasks.map((task) => ({
            id: String(task._id),
            taskId: String(task._id),
            title: task.title,
            startTime: new Date(task.startTime).toISOString(),
            endTime: new Date(task.endTime).toISOString(),
        }));
        const generatedEvents = plannedResult.plan.map((block, index) => {
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
        const schedule = [...manualEvents, ...generatedEvents].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        logger_1.logger.info("Planner schedule generated", {
            userId: req.userId,
            totalEvents: schedule.length,
            manualEvents: manualEvents.length,
            generatedEvents: generatedEvents.length,
        });
        return res.json(schedule);
    }
    catch (error) {
        logger_1.logger.error("Planner schedule generation failed", error);
        return res.status(500).json({ message: "Failed to generate planner schedule" });
    }
}
