"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyPlan = generateDailyPlan;
function pad(num) {
    return num.toString().padStart(2, "0");
}
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${pad(hours)}:${pad(minutes)}`;
}
function formatDate(date) {
    return date.toISOString().split("T")[0];
}
function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}
function getWeekdayName(date) {
    return [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ][date.getDay()];
}
function parseTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}
function getDateTimeFromDayAndMinutes(day, totalMinutes) {
    const result = new Date(day);
    result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return result;
}
function getBusyIntervalsForDay(day, busyIntervals) {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return busyIntervals
        .map((interval) => {
        const start = interval.start > dayStart ? interval.start : dayStart;
        const end = interval.end < dayEnd ? interval.end : dayEnd;
        if (end <= dayStart || start >= dayEnd || end <= start) {
            return null;
        }
        return {
            start: start.getHours() * 60 + start.getMinutes(),
            end: end.getHours() * 60 + end.getMinutes(),
        };
    })
        .filter((interval) => interval !== null)
        .sort((a, b) => a.start - b.start);
}
function generateDailyPlan(tasks, availability, busyIntervals = []) {
    const WORK_START = parseTimeToMinutes(availability.availableFrom);
    const WORK_END = parseTimeToMinutes(availability.availableTo);
    const BREAK_START = parseTimeToMinutes(availability.breakStart);
    const BREAK_END = parseTimeToMinutes(availability.breakEnd);
    const BREAK_GAP = 15;
    const freeDays = new Set(availability.freeDays ?? []);
    const plan = [];
    const summaries = [];
    let currentDay = new Date();
    currentDay.setHours(0, 0, 0, 0);
    let currentTime = WORK_START;
    for (const task of tasks) {
        const originalDuration = task.duration;
        let remainingDuration = task.duration;
        let scheduledDuration = 0;
        let blockCount = 0;
        const deadline = new Date(task.deadline);
        while (remainingDuration > 0) {
            if (freeDays.has(getWeekdayName(currentDay))) {
                currentDay = addDays(currentDay, 1);
                currentTime = WORK_START;
                continue;
            }
            const dayBusyIntervals = getBusyIntervalsForDay(currentDay, busyIntervals);
            const overlappingBusyInterval = dayBusyIntervals.find((interval) => currentTime >= interval.start && currentTime < interval.end);
            if (overlappingBusyInterval) {
                currentTime = overlappingBusyInterval.end;
                continue;
            }
            if (currentTime >= BREAK_START && currentTime < BREAK_END) {
                currentTime = BREAK_END;
            }
            if (currentTime >= WORK_END) {
                currentDay = addDays(currentDay, 1);
                currentTime = WORK_START;
                continue;
            }
            const currentDateTime = getDateTimeFromDayAndMinutes(currentDay, currentTime);
            if (currentDateTime >= deadline) {
                break;
            }
            const nextBusyStart = dayBusyIntervals.find((interval) => interval.start > currentTime)?.start ??
                WORK_END;
            const breakBoundary = currentTime < BREAK_START ? BREAK_START : WORK_END;
            const segmentEnd = Math.min(breakBoundary, nextBusyStart, WORK_END);
            const availableMinutes = segmentEnd - currentTime;
            if (availableMinutes <= 0) {
                currentTime = segmentEnd;
                continue;
            }
            const minutesUntilDeadline = Math.floor((deadline.getTime() - currentDateTime.getTime()) / (1000 * 60));
            if (minutesUntilDeadline <= 0) {
                break;
            }
            const blockDuration = Math.min(remainingDuration, availableMinutes, minutesUntilDeadline);
            if (blockDuration <= 0) {
                break;
            }
            blockCount++;
            plan.push({
                taskId: String(task._id),
                title: task.title,
                date: formatDate(currentDay),
                start: formatTime(currentTime),
                end: formatTime(currentTime + blockDuration),
                duration: blockDuration,
                priority: task.priority,
                deadline: task.deadline,
                status: "scheduled",
            });
            currentTime += blockDuration;
            remainingDuration -= blockDuration;
            scheduledDuration += blockDuration;
            if (remainingDuration === 0) {
                currentTime += BREAK_GAP;
            }
        }
        let summaryStatus;
        let reason;
        if (scheduledDuration === 0) {
            summaryStatus = "missedDeadline";
            reason = "No time available before the deadline.";
        }
        else if (remainingDuration > 0) {
            summaryStatus = "atRisk";
            reason = "Task could only be partially scheduled before the deadline.";
        }
        else if (blockCount > 1) {
            summaryStatus = "splitAcrossDays";
            reason = "Task was split into multiple schedule blocks.";
        }
        else {
            summaryStatus = "scheduled";
        }
        summaries.push({
            taskId: String(task._id),
            title: task.title,
            totalDuration: originalDuration,
            scheduledDuration,
            remainingDuration,
            deadline: task.deadline,
            priority: task.priority,
            status: summaryStatus,
            reason,
        });
    }
    for (const block of plan) {
        const taskSummary = summaries.find((s) => s.taskId === block.taskId);
        if (!taskSummary)
            continue;
        if (taskSummary.status === "splitAcrossDays") {
            block.status = "splitAcrossDays";
        }
        else if (taskSummary.status === "atRisk") {
            block.status = "atRisk";
        }
        else {
            block.status = "scheduled";
        }
    }
    return { plan, summaries };
}
