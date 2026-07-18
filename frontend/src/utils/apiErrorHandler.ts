export interface ApiError {
  error: {
    type: string;
    message: string;
    detail?: string;
    timestamp: string;
    status_code: number;
    details?: Record<string, any>;
  };
}

export class ApiErrorHandler {
  /**
   * Handle API errors and return user-friendly messages
   */
  static handleError(error: any): string {
    if (!error) return "An unknown error occurred";

    // Handle HTTP errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // Handle FastAPI validation errors
      if (status === 422 && data?.detail) {
        return this.formatValidationErrors(data.detail);
      }
      
      // Handle standard API errors
      if (data?.error) {
        return this.formatApiError(data.error);
      }
      
      // Handle HTTP status codes
      return this.getHttpErrorMessage(status);
    }

    // Handle network errors
    if (error.message?.includes("Network Error")) {
      return "Network error: Please check your internet connection";
    }

    // Handle other errors
    if (error.message) {
      return error.message;
    }

    return "An unexpected error occurred";
  }

  /**
   * Format FastAPI validation errors
   */
  private static formatValidationErrors(detail: any): string {
    if (Array.isArray(detail)) {
      return detail.map(err => {
        const field = err.loc?.join('.');
        const message = err.msg;
        return `${field}: ${message}`;
      }).join('; ');
    }
    
    if (typeof detail === 'string') {
      return detail;
    }
    
    return "Invalid request data";
  }

  /**
   * Format API error with type-specific messages
   */
  private static formatApiError(error: any): string {
    switch (error.type) {
      case 'validation_error':
        return error.detail || 'Invalid request data';
      
      case 'authentication_error':
        return 'Invalid API credentials. Please check your API key';
      
      case 'authorization_error':
        return 'You are not authorized to perform this action';
      
      case 'not_found':
        return error.details?.resource || 'Resource not found';
      
      case 'rate_limit_exceeded':
        return 'Rate limit exceeded. Please try again later';
      
      case 'external_api_error':
        const provider = error.details?.provider;
        return `${provider} service error: ${error.details?.external_error}`;
      
      case 'insufficient_quota':
        const quotaProvider = error.details?.provider;
        return `${quotaProvider} quota exceeded. Please upgrade your plan`;
      
      case 'model_not_available':
        const model = error.details?.model;
        const modelProvider = error.details?.provider;
        return `Model '${model}' is not available for ${modelProvider}`;
      
      case 'invalid_request':
        return error.detail || 'Invalid request';
      
      default:
        return error.message || 'An error occurred';
    }
  }

  /**
   * Get HTTP status code messages
   */
  private static getHttpErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad request',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      422: 'Invalid request data',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout'
    };

    return messages[status] || `HTTP error ${status}`;
  }

  /**
   * Handle specific API errors with retry logic
   */
  static handleWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let attempt = 0;
      
      const tryAgain = () => {
        attempt++;
        
        if (attempt > maxRetries) {
          reject(new Error('Maximum retry attempts reached'));
          return;
        }
        
        setTimeout(() => {
          apiCall()
            .then(resolve)
            .catch(error => {
              // Only retry on network errors or 5xx server errors
              if (error.response?.status >= 500 || error.message?.includes('Network Error')) {
                console.log(`Retry attempt ${attempt}/${maxRetries}`);
                tryAgain();
              } else {
                reject(error);
              }
            });
        }, retryDelay * attempt);
      };
      
      tryAgain();
    });
  }

  /**
   * Log API errors for debugging
   */
  static logError(error: any, context?: string) {
    console.error(`API Error${context ? ` (${context})` : ''}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    if (!error.response) {
      return true; // Network errors are retryable
    }
    
    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors and rate limiting
  }
}

// Export a convenience hook for React components
export function useApiErrorHandler() {
  return ApiErrorHandler;
}