interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;
  private isDevelopment: boolean;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement & { src?: string; href?: string };
        this.error('Resource Loading Error', {
          element: target,
          source: target?.src || target?.href
        });
      }
    }, true);
  }

  private createLogEntry(level: string, message: string, context?: Record<string, unknown>): LogEntry {
    let user = {};
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        user = JSON.parse(userStr);
      }
    } catch (error) {
      // If parsing fails, use empty object
      user = {};
    }
    
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: user?.id,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Skip console logging to avoid console statements

    // Send critical errors to monitoring service in production
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToMonitoringService(entry);
    }
  }

  private async sendToMonitoringService(entry: LogEntry): Promise<void> {
    try {
      // In a real application, you would send this to a monitoring service
      // like Sentry, LogRocket, or your own logging endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }

  public error(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('error', message, context);
    this.addLog(entry);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, context);
      this.addLog(entry);
    }
  }

  // Performance monitoring
  public trackPerformance(name: string, duration: number, context?: Record<string, unknown>): void {
    this.info(`Performance: ${name}`, {
      duration,
      ...context
    });
  }

  // User action tracking
  public trackUserAction(action: string, context?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, context);
  }

  // API call tracking
  public trackApiCall(method: string, url: string, duration: number, status: number, context?: Record<string, unknown>): void {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API Call: ${method} ${url}`, {
      duration,
      status,
      ...context
    });
  }

  // Get logs for debugging or sending to support
  public getLogs(level?: string): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear logs
  public clearLogs(): void {
    this.logs = [];
  }

  // Export logs as JSON for debugging
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Get session information
  public getSessionInfo(): { sessionId: string; startTime: string; userAgent: string } {
    return {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
  }
}

// Create singleton instance
const logger = Logger.getInstance();

export { logger };
export default logger;
export { Logger, LogEntry };