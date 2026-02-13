/**
 * Request Deduplication Service
 * Prevents duplicate API requests and manages request cancellation
 */

class PendingRequest {
  promise: Promise<any>;
  abortController: AbortController | null;
  timestamp: number;
  subscribers: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }>;

  constructor(promise: Promise<any>, abortController: AbortController | null) {
    this.promise = promise;
    this.abortController = abortController;
    this.timestamp = Date.now();
    this.subscribers = [];
  }

  /**
   * Add a subscriber to this pending request
   */
  subscribe(resolve: (value: any) => void, reject: (reason?: any) => void) {
    this.subscribers.push({ resolve, reject });
  }

  /**
   * Resolve all subscribers with the result
   */
  resolveAll(result: any) {
    this.subscribers.forEach(({ resolve }) => resolve(result));
    this.subscribers = [];
  }

  /**
   * Reject all subscribers with the error
   */
  rejectAll(error: any) {
    this.subscribers.forEach(({ reject }) => {
      try {
        reject(error);
      } catch (e) {
        // Ignore errors from reject calls
      }
    });
    this.subscribers = [];
  }

  /**
   * Cancel the request
   */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
    // Don't reject subscribers here to avoid unhandled promise rejections in tests
    // The abort signal will handle the rejection
  }

  /**
   * Check if request is expired
   */
  isExpired(timeout: number = 30000) {
    return Date.now() - this.timestamp > timeout;
  }
}

class RequestDeduplicationService {
  pendingRequests: Map<string, PendingRequest>;
  config: any;
  cleanupTimer: ReturnType<typeof setInterval> | null;

  constructor(config: any = {}) {
    this.pendingRequests = new Map();
    this.config = {
      timeout: 30000, // 30 seconds
      cleanupInterval: 10000, // 10 seconds
      maxPendingRequests: 50,
      ...config
    };

    // Start cleanup interval
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Generate a unique key for the request
   */
  generateKey(url: string, options: any = {}) {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body || '';

    const keyData = {
      url,
      method,
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body)
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Execute a request with deduplication
   */
  async dedupe(key: string, requestFn: (signal: AbortSignal) => Promise<any>, abortSignal: AbortSignal | null = null) {
    // Check if there's already a pending request for this key
    const existingRequest = this.pendingRequests.get(key);

    if (existingRequest) {
      // Return a promise that resolves when the existing request completes
      return new Promise((resolve, reject) => {
        existingRequest.subscribe(resolve, reject);

        // If the caller provides an abort signal, handle cancellation
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            reject(new Error('Request aborted'));
          });
        }
      });
    }

    // Create a new abort controller for this request
    const abortController = new AbortController();

    // If caller provides abort signal, forward the abort
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        abortController.abort();
      });
    }

    // Create the request promise
    const requestPromise = requestFn(abortController.signal);

    // Create pending request entry
    const pendingRequest = new PendingRequest(requestPromise, abortController);
    this.pendingRequests.set(key, pendingRequest);

    try {
      const result = await requestPromise;

      // Resolve all subscribers
      pendingRequest.resolveAll(result);

      // Clean up
      this.pendingRequests.delete(key);

      return result;
    } catch (error) {
      // Reject all subscribers
      pendingRequest.rejectAll(error);

      // Clean up
      this.pendingRequests.delete(key);

      throw error;
    }
  }

  /**
   * Cancel a specific request by key
   */
  cancel(key: string) {
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      pendingRequest.cancel();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    for (const [key, pendingRequest] of this.pendingRequests) {
      pendingRequest.cancel();
    }
    this.pendingRequests.clear();
  }

  /**
   * Cancel requests matching a pattern
   */
  cancelMatching(predicate: (key: string, request: PendingRequest) => boolean) {
    const keysToCancel: string[] = [];

    for (const [key, pendingRequest] of this.pendingRequests) {
      if (predicate(key, pendingRequest)) {
        pendingRequest.cancel();
        keysToCancel.push(key);
      }
    }

    keysToCancel.forEach(key => this.pendingRequests.delete(key));

    return keysToCancel.length;
  }

  /**
   * Get information about pending requests
   */
  getPendingRequests() {
    const requests: any[] = [];

    for (const [key, pendingRequest] of this.pendingRequests) {
      requests.push({
        key,
        timestamp: pendingRequest.timestamp,
        subscriberCount: pendingRequest.subscribers.length,
        age: Date.now() - pendingRequest.timestamp
      });
    }

    return requests;
  }

  /**
   * Get statistics about the deduplication service
   */
  getStats() {
    const pendingCount = this.pendingRequests.size;
    const totalSubscribers = Array.from(this.pendingRequests.values())
      .reduce((sum, req) => sum + req.subscribers.length, 0);

    return {
      pendingRequests: pendingCount,
      totalSubscribers,
      averageSubscribersPerRequest: pendingCount > 0 ? totalSubscribers / pendingCount : 0,
      maxPendingRequests: this.config.maxPendingRequests
    };
  }

  /**
   * Clean up expired requests
   */
  cleanup() {
    const expiredKeys: string[] = [];

    for (const [key, pendingRequest] of this.pendingRequests) {
      if (pendingRequest.isExpired(this.config.timeout)) {
        pendingRequest.cancel();
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.pendingRequests.delete(key));

    // Also enforce max pending requests limit
    if (this.pendingRequests.size > this.config.maxPendingRequests) {
      const sortedRequests = Array.from(this.pendingRequests.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = sortedRequests.slice(0, this.pendingRequests.size - this.config.maxPendingRequests);

      toRemove.forEach(([key, pendingRequest]) => {
        pendingRequest.cancel();
        this.pendingRequests.delete(key);
      });
    }

    return expiredKeys.length;
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.cancelAll();
  }
}

// Request deduplication utilities
export const RequestDeduplicationUtils = {
  /**
   * Create a deduped fetch function
   */
  createDedupedFetch: (deduplicationService: RequestDeduplicationService) => {
    return async (url: string, options: any = {}) => {
      const key = deduplicationService.generateKey(url, options);

      return deduplicationService.dedupe(key, async (abortSignal) => {
        const response = await fetch(url, {
          ...options,
          signal: abortSignal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      }, options.signal);
    };
  },

  /**
   * Create a deduped API client method
   */
  createDedupedApiMethod: (deduplicationService: RequestDeduplicationService, apiMethod: any) => {
    return async (...args: any[]) => {
      const key = deduplicationService.generateKey(apiMethod.name, { args });

      return deduplicationService.dedupe(key, async (abortSignal) => {
        return apiMethod(...args, { signal: abortSignal });
      });
    };
  }
};

// Create singleton deduplication service
export const requestDeduplicationService = new RequestDeduplicationService({
  timeout: 30000,
  cleanupInterval: 10000,
  maxPendingRequests: 50
});

export { RequestDeduplicationService, PendingRequest };
