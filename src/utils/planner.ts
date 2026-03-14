import { ITask } from "../models/task.model";

interface PlannedTask {
  taskId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  priority: string;
  deadline: Date;
}

interface AvailabilitySettings {
  availableFrom: string;
  availableTo: string;
  breakStart: string;
  breakEnd: string;
}

function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function generateDailyPlan(
  tasks: ITask[],
  availability: AvailabilitySettings
): PlannedTask[] {
  const WORK_START = parseTimeToMinutes(availability.availableFrom);
  const WORK_END = parseTimeToMinutes(availability.availableTo);
  const BREAK_START = parseTimeToMinutes(availability.breakStart);
  const BREAK_END = parseTimeToMinutes(availability.breakEnd);
  const BREAK_GAP = 15;

  const planned: PlannedTask[] = [];

  let currentDay = new Date();
  let currentTime = WORK_START;

  for (const task of tasks) {
    let remainingDuration = task.duration;

    while (remainingDuration > 0) {
      if (currentTime >= BREAK_START && currentTime < BREAK_END) {
        currentTime = BREAK_END;
      }

      if (currentTime >= WORK_END) {
        currentDay = addDays(currentDay, 1);
        currentTime = WORK_START;
        continue;
      }

      let segmentEnd = currentTime < BREAK_START ? BREAK_START : WORK_END;
      let availableMinutes = segmentEnd - currentTime;

      if (availableMinutes <= 0) {
        currentTime = segmentEnd;
        continue;
      }

      const blockDuration = Math.min(remainingDuration, availableMinutes);

      planned.push({
        taskId: String(task._id),
        title: task.title,
        date: formatDate(currentDay),
        start: formatTime(currentTime),
        end: formatTime(currentTime + blockDuration),
        duration: blockDuration,
        priority: task.priority,
        deadline: task.deadline,
      });

      currentTime += blockDuration;
      remainingDuration -= blockDuration;

      if (remainingDuration === 0) {
        currentTime += BREAK_GAP;
      }
    }
  }

  return planned;
}
