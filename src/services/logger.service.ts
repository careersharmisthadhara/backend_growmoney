// ─────────────────────────────────────────────────────
// LOGGER SERVICE
// OOP concept: Encapsulation
// All logging logic hidden inside this class
// Handler just calls logger.info() — doesn't
// know HOW logging works internally
// ─────────────────────────────────────────────────────

export enum LogLevel {
  INFO  = 'INFO',
  WARN  = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  private serviceName: string;

  // Constructor — initialise with service name
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  // Private method — internal implementation hidden
  private log(level: LogLevel, message: string, data?: object): void {
    const logEntry = {
      timestamp:   new Date().toISOString(),
      level,
      service:     this.serviceName,
      message,
      ...(data && { data }), // spread data only if provided
    };

    // CloudWatch captures console.log automatically
    if (level === LogLevel.ERROR) {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  // Public methods — what the outside world can call
  info(message: string, data?: object): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: object): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: object): void {
    this.log(LogLevel.ERROR, message, data);
  }

  debug(message: string, data?: object): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
}