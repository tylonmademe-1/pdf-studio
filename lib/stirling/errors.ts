export class StirlingError extends Error {
  public statusCode: number;
  public code: string;
  public userMessage: string;

  constructor(message: string, statusCode = 500, code = "STIRLING_ERROR", userMessage?: string) {
    super(message);
    this.name = "StirlingError";
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage =
      userMessage || "An error occurred while processing your document. Please try again.";
  }
}

export class StirlingValidationError extends StirlingError {
  constructor(message: string, userMessage?: string) {
    super(message, 400, "VALIDATION_ERROR", userMessage || message);
    this.name = "StirlingValidationError";
  }
}

export class StirlingConnectionError extends StirlingError {
  constructor(message: string) {
    super(
      message,
      503,
      "BACKEND_UNAVAILABLE",
      "The PDF processing service is currently unreachable. Please check service connectivity."
    );
    this.name = "StirlingConnectionError";
  }
}

export class StirlingTimeoutError extends StirlingError {
  constructor(message: string) {
    super(
      message,
      504,
      "GATEWAY_TIMEOUT",
      "Document processing timed out. For large or complex files, please reduce file size or try again."
    );
    this.name = "StirlingTimeoutError";
  }
}

export class StirlingProcessingError extends StirlingError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      502,
      "PROCESSING_FAILED",
      userMessage || "The PDF engine failed to process the document. Please verify the file is not corrupted."
    );
    this.name = "StirlingProcessingError";
  }
}

export function normalizeError(err: unknown): {
  statusCode: number;
  code: string;
  message: string;
} {
  if (err instanceof StirlingError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.userMessage,
    };
  }

  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return {
        statusCode: 504,
        code: "GATEWAY_TIMEOUT",
        message: "Request timed out while communicating with the PDF engine.",
      };
    }

    if (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND")) {
      return {
        statusCode: 503,
        code: "BACKEND_UNAVAILABLE",
        message: "Cannot connect to the PDF processing engine. Please ensure the service is running.",
      };
    }
  }

  // Safe fallback: never expose internal stack trace or server paths
  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred during processing. Please try again.",
  };
}
