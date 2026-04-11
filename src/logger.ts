/**
 * Platform-agnostic logger interface.
 *
 * Both Homebridge's `Logging` and Matterbridge's `AnsiLogger`
 * implement these methods natively, so no adapter is needed.
 */
export interface IotasLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
