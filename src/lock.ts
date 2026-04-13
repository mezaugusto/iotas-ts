export function autoRelockSeconds(enabled: number, timeoutSeconds: number): number {
  return enabled === 1 ? timeoutSeconds : 0;
}

export function isAutoRelockEnabled(seconds: number): number {
  return seconds > 0 ? 1 : 0;
}
