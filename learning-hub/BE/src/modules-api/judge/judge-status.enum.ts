export enum JudgeStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  AC = 'AC',
  WA = 'WA',
  TLE = 'TLE',
  RE = 'RE',
  CE = 'CE',
  FAILED = 'FAILED',
}

export const TERMINAL_JUDGE_STATUSES: readonly JudgeStatus[] = [
  JudgeStatus.AC,
  JudgeStatus.WA,
  JudgeStatus.TLE,
  JudgeStatus.RE,
  JudgeStatus.CE,
  JudgeStatus.FAILED,
];
