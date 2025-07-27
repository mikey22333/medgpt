import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Define log levels
const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
} as const;

type LogLevel = keyof typeof LogLevels;

// Schema for log entry
const LogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  level: z.enum(Object.keys(LogLevels) as [LogLevel, ...LogLevel[]]),
  message: z.string(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  error: z.any().optional(),
  stack: z.string().optional(),
  durationMs: z.number().optional(),
}).catchall(z.any()); // Allow additional properties

type LogEntry = z.infer<typeof LogEntrySchema>;

interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  meta?: Record<string, any>;
}

export class Logger {
  private name: string;
  private level: number;
  private requestId?: string;
  private sessionId?: string;
  private userId?: string;
  private meta: Record<string, any>;
  private static globalMeta: Record<string, any> = {};
  private static transports: Array<(entry: LogEntry) => void> = [];

  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'app';
    this.level = LogLevels[options.level || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')];
    this.requestId = options.requestId;
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.meta = options.meta || {};
  }

  // Create a child logger with additional context
  child(meta: Record<string, any>): Logger {
    return new Logger({
      name: this.name,
      level: Object.keys(LogLevels).find(
        (key) => LogLevels[key as LogLevel] === this.level
      ) as LogLevel,
      requestId: this.requestId,
      sessionId: this.sessionId,
      userId: this.userId,
      meta: { ...this.meta, ...meta },
    });
  }

  // Set global metadata for all loggers
  static setGlobalMeta(meta: Record<string, any>): void {
    this.globalMeta = { ...this.globalMeta, ...meta };
  }

  // Add a transport function
  static addTransport(transport: (entry: LogEntry) => void): void {
    this.transports.push(transport);
  }

  // Clear all transports
  static clearTransports(): void {
    this.transports = [];
  }

  // Log a message at the specified level
  private log(level: LogLevel, message: string, data: any = {}): void {
    if (LogLevels[level] > this.level) return;

    const timestamp = new Date().toISOString();
    const error = data?.error || data?.err || null;
    const stack = error?.stack;
    
    // Remove error from data to avoid duplication
    const { error: _, err: __, ...restData } = data;

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      requestId: this.requestId,
      sessionId: this.sessionId,
      userId: this.userId,
      ...(error && { error: error.message || String(error) }),
      ...(stack && { stack }),
      ...this.meta,
      ...Logger.globalMeta,
      ...restData,
    };

    // Validate the log entry
    const result = LogEntrySchema.safeParse(entry);
    if (!result.success) {
      console.error('Invalid log entry:', result.error);
      return;
    }

    const validatedEntry = result.data;

    // Format the log message
    const formattedMessage = this.formatMessage(validatedEntry);

    // Output to console based on environment
    if (process.env.NODE_ENV !== 'test') {
      // Map log levels to console methods safely
      const consoleMethodMap: Record<LogLevel, (...args: any[]) => void> = {
        error: console.error,
        warn: console.warn,
        info: console.info,
        http: console.log, // Use console.log for http level
        debug: console.debug || console.log,
        trace: console.log,
      };
      
      const consoleMethod = consoleMethodMap[level] || console.log;
      consoleMethod(formattedMessage);
    }

    // Send to all registered transports
    for (const transport of Logger.transports) {
      try {
        transport(validatedEntry);
      } catch (err) {
        console.error('Error in log transport:', err);
      }
    }
  }

  // Format the log message for console output
  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, ...rest } = entry;
    const time = new Date(timestamp).toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    let formatted = `[${time}] ${levelUpper} ${this.name}: ${message}`;
    
    // Add additional data if present
    const data: Record<string, any> = { ...rest };
    
    // Remove standard fields from data display
    const fieldsToRemove = ['requestId', 'sessionId', 'userId'];
    fieldsToRemove.forEach(field => {
      if (field in data) {
        delete data[field];
      }
    });
    
    if (Object.keys(data).length > 0) {
      try {
        formatted += ' ' + JSON.stringify(data, null, 2);
      } catch (e) {
        formatted += ' [unable to stringify log data]';
      }
    }
    
    return formatted;
  }

  // Log methods for each level
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  http(message: string, meta?: any): void {
    this.log('http', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  trace(message: string, meta?: any): void {
    this.log('trace', message, meta);
  }

  // Create a request-scoped logger
  static requestLogger(req: any, res: any, next: () => void): void {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const sessionId = req.session?.id;
    const userId = req.user?.id;

    const logger = new Logger({
      name: 'http',
      requestId,
      sessionId,
      userId,
    });

    // Add request logger to the request object
    req.logger = logger;
    req.requestId = requestId;

    // Log the start of the request
    const startTime = Date.now();
    logger.http(`--> ${req.method} ${req.originalUrl}`);

    // Log the end of the request
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.http(
        `<-- ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`,
        {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: duration,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        }
      );
    });

    next();
  }
}

// Create a default logger instance
export const logger = new Logger({
  name: 'app',
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
});

// Add console transport in development
if (process.env.NODE_ENV === 'development') {
  Logger.addTransport((entry) => {
    // You could send logs to a logging service here
    // e.g., LogRocket, Sentry, etc.
  });
}

// Add error tracking in production
if (process.env.NODE_ENV === 'production') {
  Logger.addTransport((entry) => {
    if (entry.level === 'error' || entry.level === 'warn') {
      // Send to error tracking service
      // e.g., Sentry.captureException(entry.error || entry.message, { extra: entry });
    }
  });
}
