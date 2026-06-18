import type { RetailOutboxTask } from "../types/retail-b2c";

export interface RetailOutboxWorker {
  enqueue(task: RetailOutboxTask): Promise<RetailOutboxTask>;
  markReady(taskId: string): Promise<void>;
  markFailed(taskId: string, reason: string): Promise<void>;
}
