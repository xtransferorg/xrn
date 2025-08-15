import chalk from 'chalk'

/** Debug flag to control stack trace display */
const debugFlag = true

/**
 * Start a timer with an optional label
 * @param label - Optional label for the timer
 */
export function time(label?: string): void {
  console.time(label)
}

/**
 * End a timer and display the elapsed time
 * @param label - Label of the timer to end
 */
export function timeEnd(label?: string): void {
  console.timeEnd(label)
}

/**
 * Log error messages to stderr
 * @param message - Error messages to log
 */
export function error(...message: string[]): void {
  console.error(...message)
}

/**
 * Print an error and provide additional info (the stack trace) in debug mode
 * @param e - Error object to log
 */
export function exception(e: Error): void {
  error(chalk.red(e.toString()) + (debugFlag ? '\n' + chalk.gray(e.stack) : ''))
}

/**
 * Log warning messages with yellow color
 * @param message - Warning messages to log
 */
export function warn(...message: string[]): void {
  console.warn(...message.map(value => chalk.yellow(value)))
}

/**
 * Log messages to stdout
 * @param message - Messages to log
 */
export function log(...message: string[]): void {
  console.log(...message)
}

/**
 * Clear the terminal of all text
 * Uses platform-specific clear commands for Windows and Unix-like systems
 */
export function clear(): void {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H')
}

/**
 * Log a message and exit the current process
 * If the `code` is non-zero then `console.error` will be used instead of `console.log`
 * 
 * @param message - Message to log before exiting
 * @param code - Exit code (defaults to 1 for error)
 */
export function exit(message: string | Error, code = 1): never {
  if (message instanceof Error) {
    exception(message)
    process.exit(code)
  }

  if (message) {
    if (code === 0) log(message)
    else error(message)
  }

  process.exit(code)
}

/**
 * Re-export of all logging functions for easier auto-importing
 * Provides a centralized interface for all logging operations
 */
export const Log = {
  time,
  timeEnd,
  error,
  exception,
  warn,
  log,
  clear,
  exit,
}
