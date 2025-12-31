export type SandboxStatus = 'online' | 'offline' | 'killed' | 'starting';

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

export const mockSandboxes: Sandbox[] = [
  {
    id: 'sb-1',
    name: 'Production Agent',
    status: 'online',
    uptime: '4 days 12 hours',
    tasksCompleted: 128,
    memoryUsage: '2.4 GB',
    region: 'London (LHR)',
    repository: 'https://github.com/Captain-App/main-repo'
  },
  {
    id: 'sb-2',
    name: 'Feature Explorer',
    status: 'offline',
    uptime: '0 mins',
    tasksCompleted: 42,
    memoryUsage: '0 GB',
    region: 'New York (JFK)',
    repository: 'https://github.com/Captain-App/experimental'
  },
  {
    id: 'sb-3',
    name: 'Documentation Bot',
    status: 'online',
    uptime: '12 hours 5 mins',
    tasksCompleted: 312,
    memoryUsage: '1.1 GB',
    region: 'Tokyo (NRT)',
    repository: 'https://github.com/Captain-App/docs'
  }
];

