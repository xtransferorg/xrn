export class Logger {
  debug: boolean = false;

  setDebug(debug: boolean) {
    this.debug = debug;
  }

  log(...args: any[]) {
    if (this.debug) {
      console.log(...args);
    }
  }

  info(...args: any[]) {
    console.info(...args);
  }

  warn(...args: any[]) {
    console.warn(...args);
  }

  error(...args: any[]) {
    console.error(...args);
  }
}

export const logger = new Logger();
