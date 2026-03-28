import { createEvents, type EventAttributes } from "ics";

export interface ScheduledCalendarTask {
  title: string;
  description?: string;
  date: string;
  startHour: number;
  startMinute: number;
  duration: number;
  user: string;
  status: string;
}

function buildEvent(task: ScheduledCalendarTask): EventAttributes {
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

export async function generateCalendarIcs(
  tasks: ScheduledCalendarTask[]
): Promise<string> {
  const events = tasks.map(buildEvent);

  return new Promise((resolve, reject) => {
    // Generate a single ICS file that contains all planned events.
    createEvents(events, (error, value) => {
      if (error) {
        return reject(error);
      }

      resolve(value);
    });
  });
}
