"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableWorkMinutesForDay = getAvailableWorkMinutesForDay;
exports.resolveWellbeingPlanningContext = resolveWellbeingPlanningContext;
exports.sortTasksForWellbeing = sortTasksForWellbeing;
const priorityScore = {
    high: 3,
    medium: 2,
    low: 1,
};
const difficultyScore = {
    easy: 1,
    medium: 2,
    hard: 3,
};
function getAvailableWorkMinutesForDay(availableFrom, availableTo, breakStart, breakEnd) {
    const workStart = parseTimeToMinutes(availableFrom);
    const workEnd = parseTimeToMinutes(availableTo);
    const breakStartMinutes = parseTimeToMinutes(breakStart);
    const breakEndMinutes = parseTimeToMinutes(breakEnd);
    const rawWorkMinutes = Math.max(0, workEnd - workStart);
    const overlappingBreakMinutes = Math.max(0, Math.min(workEnd, breakEndMinutes) - Math.max(workStart, breakStartMinutes));
    return Math.max(0, rawWorkMinutes - overlappingBreakMinutes);
}
function resolveWellbeingPlanningContext(wellbeingLevel, normalAvailableMinutes, wellbeingNote) {
    const appliedWellbeingLevel = wellbeingLevel ?? 4;
    if (appliedWellbeingLevel === 4) {
        return {
            appliedWellbeingLevel,
            effectiveWorkMinutes: null,
            reservedRestMinutes: 0,
            scheduleLightened: false,
            wellbeingNote,
        };
    }
    const cappedWorkMinutes = {
        1: 120,
        2: 240,
        3: 300,
    };
    const effectiveWorkMinutes = Math.min(normalAvailableMinutes, cappedWorkMinutes[appliedWellbeingLevel]);
    return {
        appliedWellbeingLevel,
        effectiveWorkMinutes,
        reservedRestMinutes: Math.max(0, normalAvailableMinutes - effectiveWorkMinutes),
        scheduleLightened: true,
        wellbeingNote,
    };
}
function sortTasksForWellbeing(tasks, wellbeingLevel = 4, now = new Date()) {
    return [...tasks].sort((a, b) => {
        const urgencyA = getUrgencyWeight(a, now);
        const urgencyB = getUrgencyWeight(b, now);
        if (urgencyA !== urgencyB) {
            return urgencyB - urgencyA;
        }
        const wellbeingScoreA = getWellbeingPreferenceScore(a, wellbeingLevel, now);
        const wellbeingScoreB = getWellbeingPreferenceScore(b, wellbeingLevel, now);
        if (wellbeingScoreA !== wellbeingScoreB) {
            return wellbeingScoreA - wellbeingScoreB;
        }
        if (a.status !== b.status) {
            return a.status === "pending" ? -1 : 1;
        }
        const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (deadlineDiff !== 0) {
            return deadlineDiff;
        }
        const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
        if (priorityDiff !== 0) {
            return priorityDiff;
        }
        return a.duration - b.duration;
    });
}
function getUrgencyWeight(task, now) {
    const hoursToDeadline = (new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursToDeadline <= 24) {
        return 3;
    }
    if (hoursToDeadline <= 48) {
        return 2;
    }
    if (hoursToDeadline <= 72) {
        return 1;
    }
    return 0;
}
function getWellbeingPreferenceScore(task, wellbeingLevel, now) {
    if (wellbeingLevel === 4) {
        return 0;
    }
    const difficultyPenaltyByLevel = {
        1: 30,
        2: 18,
        3: 10,
    };
    const priorityDiscountByLevel = {
        1: 3,
        2: 2,
        3: 1,
    };
    const difficultyPenalty = difficultyScore[task.difficulty] * difficultyPenaltyByLevel[wellbeingLevel];
    const urgencyDiscount = getUrgencyWeight(task, now) * 16;
    const priorityDiscount = priorityScore[task.priority] * priorityDiscountByLevel[wellbeingLevel];
    return difficultyPenalty - urgencyDiscount - priorityDiscount + task.duration / 60;
}
function parseTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}
