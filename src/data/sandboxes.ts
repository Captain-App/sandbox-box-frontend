export type SandboxStatus =
  | "online"
  | "offline"
  | "killed"
  | "starting"
  | "creating";

export interface Sandbox {
  id: string;
  name: string;
  status: SandboxStatus;
  uptime: string;
  tasksCompleted: number;
  memoryUsage: string;
  region: string;
  repository?: string;
}

// Mock data removed. Use api.getSessions() instead.
