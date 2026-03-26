"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortTasksForSchedule = sortTasksForSchedule;
const priorityScore = {
    high: 3,
    medium: 2,
    low: 1,
};
function sortTasksForSchedule(tasks) {
    return tasks.sort((a, b) => {
        // pending tasks first
        if (a.status !== b.status) {
            return a.status === "pending" ? -1 : 1;
        }
        // earlier deadline first
        const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (deadlineDiff !== 0) {
            return deadlineDiff;
        }
        // higher priority first
        const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
        if (priorityDiff !== 0) {
            return priorityDiff;
        }
        // shorter duration first
        return a.duration - b.duration;
    });
}
