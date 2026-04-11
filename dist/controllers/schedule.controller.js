"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestedSchedule = getSuggestedSchedule;
exports.getPlannedSchedule = getPlannedSchedule;
exports.getReplannedSchedule = getReplannedSchedule;
const external_calendar_event_model_1 = require("../models/external-calendar-event.model");
const task_model_1 = require("../models/task.model");
const User_1 = require("../models/User");
const wellbeing_model_1 = require("../models/wellbeing.model");
const scheduler_1 = require("../utils/scheduler");
const planner_1 = require("../utils/planner");
const wellbeing_planner_1 = require("../utils/wellbeing-planner");
async function getTodayWellbeingForUser(userId) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return wellbeing_model_1.Wellbeing.findOne({
        user: userId,
        date: {
            $gte: startOfToday,
            $lte: endOfToday,
        },
    });
}
async function getSuggestedSchedule(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const tasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        });
        const wellbeing = await getTodayWellbeingForUser(req.userId);
        const sortedTasks = (0, scheduler_1.sortTasksForSchedule)(tasks, {
            wellbeingLevel: wellbeing?.wellbeingLevel,
        });
        return res.json({
            message: "Suggested schedule generated successfully",
            totalTasks: sortedTasks.length,
            tasks: sortedTasks,
            appliedWellbeingLevel: wellbeing?.wellbeingLevel ?? 4,
        });
    }
    catch (error) {
        console.error("SUGGESTED SCHEDULE ERROR:", error);
        return res.status(500).json({ message: "Failed to generate schedule" });
    }
}
async function getPlannedSchedule(req, res) {
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
        });
        const wellbeing = await getTodayWellbeingForUser(req.userId);
        const normalAvailableMinutes = (0, wellbeing_planner_1.getAvailableWorkMinutesForDay)(user.availableFrom, user.availableTo, user.breakStart, user.breakEnd);
        const wellbeingPlanning = (0, wellbeing_planner_1.resolveWellbeingPlanningContext)(wellbeing?.wellbeingLevel, normalAvailableMinutes, wellbeing?.note);
        const sortedTasks = (0, scheduler_1.sortTasksForSchedule)(tasks, {
            wellbeingLevel: wellbeing?.wellbeingLevel,
        });
        const busyCalendarEvents = await external_calendar_event_model_1.ExternalCalendarEvent.find({
            user: req.userId,
        }).sort({ start: 1 });
        const result = (0, planner_1.generateDailyPlan)(sortedTasks, {
            availableFrom: user.availableFrom,
            availableTo: user.availableTo,
            breakStart: user.breakStart,
            breakEnd: user.breakEnd,
            freeDays: user.freeDays ?? [],
        }, busyCalendarEvents.map((event) => ({
            start: event.start,
            end: event.end,
            allDay: event.allDay,
        })), wellbeingPlanning);
        const scheduledCount = result.summaries.filter((t) => t.status === "scheduled").length;
        const splitCount = result.summaries.filter((t) => t.status === "splitAcrossDays").length;
        const atRiskCount = result.summaries.filter((t) => t.status === "atRisk").length;
        const missedCount = result.summaries.filter((t) => t.status === "missedDeadline").length;
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
            effectiveWorkHours: wellbeingPlanning.effectiveWorkMinutes == null
                ? null
                : Number((wellbeingPlanning.effectiveWorkMinutes / 60).toFixed(2)),
            reservedRestMinutes: wellbeingPlanning.reservedRestMinutes,
            wellbeingNote: wellbeingPlanning.wellbeingNote ?? "",
            scheduleLightened: wellbeingPlanning.scheduleLightened,
            plan: result.plan,
            summaries: result.summaries,
        });
    }
    catch (error) {
        console.error("PLANNED SCHEDULE ERROR:", error);
        return res.status(500).json({ message: "Failed to generate planned schedule" });
    }
}
async function getReplannedSchedule(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // A full replan should discard any manually dragged task times first.
        await task_model_1.Task.updateMany({
            user: req.userId,
            status: "pending",
        }, {
            $set: {
                startTime: null,
                endTime: null,
            },
        });
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const remainingTasks = await task_model_1.Task.find({
            user: req.userId,
            status: "pending",
        });
        const wellbeing = await getTodayWellbeingForUser(req.userId);
        const normalAvailableMinutes = (0, wellbeing_planner_1.getAvailableWorkMinutesForDay)(user.availableFrom, user.availableTo, user.breakStart, user.breakEnd);
        const wellbeingPlanning = (0, wellbeing_planner_1.resolveWellbeingPlanningContext)(wellbeing?.wellbeingLevel, normalAvailableMinutes, wellbeing?.note);
        const sortedRemainingTasks = (0, scheduler_1.sortTasksForSchedule)(remainingTasks, {
            wellbeingLevel: wellbeing?.wellbeingLevel,
        });
        const busyCalendarEvents = await external_calendar_event_model_1.ExternalCalendarEvent.find({
            user: req.userId,
        }).sort({ start: 1 });
        const result = (0, planner_1.generateDailyPlan)(sortedRemainingTasks, {
            availableFrom: user.availableFrom,
            availableTo: user.availableTo,
            breakStart: user.breakStart,
            breakEnd: user.breakEnd,
            freeDays: user.freeDays ?? [],
        }, busyCalendarEvents.map((event) => ({
            start: event.start,
            end: event.end,
            allDay: event.allDay,
        })), wellbeingPlanning);
        const scheduledCount = result.summaries.filter((t) => t.status === "scheduled").length;
        const splitCount = result.summaries.filter((t) => t.status === "splitAcrossDays").length;
        const atRiskCount = result.summaries.filter((t) => t.status === "atRisk").length;
        const missedCount = result.summaries.filter((t) => t.status === "missedDeadline").length;
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
            effectiveWorkHours: wellbeingPlanning.effectiveWorkMinutes == null
                ? null
                : Number((wellbeingPlanning.effectiveWorkMinutes / 60).toFixed(2)),
            reservedRestMinutes: wellbeingPlanning.reservedRestMinutes,
            wellbeingNote: wellbeingPlanning.wellbeingNote ?? "",
            scheduleLightened: wellbeingPlanning.scheduleLightened,
            plan: result.plan,
            summaries: result.summaries,
        });
    }
    catch (error) {
        console.error("REPLAN SCHEDULE ERROR:", error);
        return res.status(500).json({ message: "Failed to re-plan schedule" });
    }
}
