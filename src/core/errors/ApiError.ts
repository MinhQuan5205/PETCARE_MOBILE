export class ApiError extends Error {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly error: string | null;
  public readonly timestamp: string;
  public readonly path: string;

  constructor(
    message: string,
    statusCode: number,
    error: string | null = null,
    path: string = '',
    timestamp: string = new Date().toISOString()
  ) {
    super(message);
    this.name = 'ApiError';
    this.success = false;
    this.statusCode = statusCode;
    this.error = error;
    this.timestamp = timestamp;
    this.path = path;

    // Fix prototype chain for instanceof checks in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
