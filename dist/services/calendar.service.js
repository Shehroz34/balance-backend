"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCalendarIcs = generateCalendarIcs;
const ics_1 = require("ics");
function buildEvent(task) {
    const [year, month, day] = task.date.split("-").map(Number);
    return {
        title: task.title,
        description: task.description || `Status: ${task.status}`,
        start: [year, month, day, task.startHour, task.startMinute],
        duration: {
            hours: Math.floor(task.duration / 60),
            minutes: task.duration % 60,
        },
        status: "CONFIRMED",
        busyStatus: "BUSY",
        organizer: {
            name: "Smart Scheduler",
            email: `${task.user}@smart-scheduler.local`,
        },
    };
}
async function generateCalendarIcs(tasks) {
    const events = tasks.map(buildEvent);
    return new Promise((resolve, reject) => {
        // Generate a single ICS file that contains all planned events.
        (0, ics_1.createEvents)(events, (error, value) => {
            if (error) {
                return reject(error);
            }
            resolve(value);
        });
    });
}
