import winston from "winston";
import chalk from "chalk";
import util from "node:util";

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
};

const customFormat = winston.format.printf(
  ({ level, message, [Symbol.for("splat")]: splat }) => {
    const color = colors[level] || "white";
    const baseMessage =
      typeof message === "string"
        ? message
        : util.inspect(message, { depth: null, colors: false });
    const extra = Array.isArray(splat)
      ? splat
          .map((item) =>
            typeof item === "string"
              ? item
              : util.inspect(item, { depth: null, colors: false })
          )
          .join(" ")
      : "";
    return `${chalk[color](`[${level.toUpperCase()}]`)} ${baseMessage} ${extra}`;
  }
);

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(customFormat),
  transports: [
    new winston.transports.Console({
      debugStdout: true,
    }),
  ],
});

export default logger;
