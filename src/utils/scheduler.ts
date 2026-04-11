import { ITask } from "../models/task.model";
import { sortTasksForWellbeing, type WellbeingLevel } from "./wellbeing-planner";

export function sortTasksForSchedule(
  tasks: ITask[],
  options: { wellbeingLevel?: WellbeingLevel } = {}
): ITask[] {
  return sortTasksForWellbeing(tasks, options.wellbeingLevel ?? 4);
}

  
