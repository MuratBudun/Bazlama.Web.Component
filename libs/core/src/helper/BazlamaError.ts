/*
    Bazlama Web Component Project
    Custom Error Classes for Bazlama Web Component
    2024-8-9
    Version 1.0
    muratbudun@gmail.com
*/

/**
 * Error context information for debugging
 */
export interface IBazlamaErrorContext {
  componentName?: string;
  propertyName?: string;
  decoratorName?: string;
  methodName?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Base error class for Bazlama Web Component library
 */
export class BazlamaError extends Error {
  public readonly context?: IBazlamaErrorContext;
  public readonly timestamp: Date;

  constructor(message: string, context?: IBazlamaErrorContext) {
    super(`[Bazlama] ${message}`);
    this.name = "BazlamaError";
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BazlamaError);
    }
  }

  /**
   * Returns a formatted error message with context
   */
  public toString(): string {
    let result = this.message;
    if (this.context) {
      const contextParts: string[] = [];
      if (this.context.componentName) contextParts.push(`Component: ${this.context.componentName}`);
      if (this.context.propertyName) contextParts.push(`Property: ${this.context.propertyName}`);
      if (this.context.decoratorName) contextParts.push(`Decorator: ${this.context.decoratorName}`);
      if (this.context.methodName) contextParts.push(`Method: ${this.context.methodName}`);
      if (contextParts.length > 0) {
        result += ` (${contextParts.join(", ")})`;
      }
    }
    return result;
  }
}

/**
 * Error thrown when a decorator is applied incorrectly
 */
export class BazlamaDecoratorError extends BazlamaError {
  constructor(message: string, context?: IBazlamaErrorContext) {
    super(message, context);
    this.name = "BazlamaDecoratorError";
  }
}

/**
 * Error thrown when a property definition is not found or invalid
 */
export class BazlamaPropertyError extends BazlamaError {
  constructor(message: string, context?: IBazlamaErrorContext) {
    super(message, context);
    this.name = "BazlamaPropertyError";
  }
}

/**
 * Error thrown when an event action configuration is invalid
 */
export class BazlamaEventActionError extends BazlamaError {
  constructor(message: string, context?: IBazlamaErrorContext) {
    super(message, context);
    this.name = "BazlamaEventActionError";
  }
}

/**
 * Warning logger that doesn't throw but logs with consistent formatting
 * Use for non-critical issues that shouldn't stop execution
 */
export function bazlamaWarn(message: string, context?: IBazlamaErrorContext): void {
  const error = new BazlamaError(message, context);
  console.warn(error.toString());
}

/**
 * Error logger that logs with consistent formatting
 * Use when you want to log error but not throw
 */
export function bazlamaLogError(message: string, context?: IBazlamaErrorContext): void {
  const error = new BazlamaError(message, context);
  console.error(error.toString());
}
