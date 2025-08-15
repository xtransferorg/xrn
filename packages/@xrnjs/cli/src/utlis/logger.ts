import chalk from "chalk";
import winston from "winston";

/**
 * Color mapping for different log levels
 * Maps log levels to chalk colors for console output
 */
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
};

/**
 * Custom log format function
 * Formats log messages with colored level indicators and additional arguments
 * 
 * @param level - Log level (error, warn, info, etc.)
 * @param message - Main log message
 * @param args - Additional arguments to include in the log
 * @returns Formatted log string
 */
const customFormat = winston.format.printf(({ level, message, ...args }) => {
  const color = colors[level] || "white";
  return `${chalk[color](`[${level.toUpperCase()}]`)} ${message} ${
    Object.keys(args).length ? JSON.stringify(args) : ""
  }`;
});

/**
 * Winston logger instance with custom configuration
 * Provides structured logging with colored output and console transport
 * Log level is set to 'debug' in development and 'info' in production
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(customFormat),
  transports: [
    new winston.transports.Console({
      debugStdout: true,
    }),
  ],
});

export default logger;
