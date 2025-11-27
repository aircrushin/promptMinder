/**
 * Tests for Request Deduplication Service
 */

import { RequestDeduplicationService, PendingRequest, RequestDeduplicationUtils } from '../../lib/request-deduplication';

describe('PendingRequest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create pending request with correct properties', () => {
    const mockPromise = Promise.resolve('test');
    const mockController = new AbortController();
    
    const pendingRequest = new PendingRequest(mockPromise, mockController);
    
    expect(pendingRequest.promise).toBe(mockPromise);
    expect(pendingRequest.abortController).toBe(mockController);
    expect(pendingRequest.timestamp).toBe(Date.now());
    expect(pendingRequest.subscribers).toEqual([]);
  });

  test('should handle subscribers correctly', () => {
    const pendingRequest = new PendingRequest(Promise.resolve(), new AbortController());
    const mockResolve = jest.fn();
    const mockReject = jest.fn();
    
    pendingRequest.subscribe(mockResolve, mockReject);
    
    expect(pendingRequest.subscribers).toHaveLength(1);
    expect(pendingRequest.subscribers[0]).toEqual({
      resolve: mockResolve,
      reject: mockReject
    });
  });

  test('should resolve all subscribers', () => {
    const pendingRequest = new PendingRequest(Promise.resolve(), new AbortController());
    const mockResolve1 = jest.fn();
    const mockResolve2 = jest.fn();
    const mockReject1 = jest.fn();
    const mockReject2 = jest.fn();
    
    pendingRequest.subscribe(mockResolve1, mockReject1);
    pendingRequest.subscribe(mockResolve2, mockReject2);
    
    const result = 'test result';
    pendingRequest.resolveAll(result);
    
    expect(mockResolve1).toHaveBeenCalledWith(result);
    expect(mockResolve2).toHaveBeenCalledWith(result);
    expect(mockReject1).not.toHaveBeenCalled();
    expect(mockReject2).not.toHaveBeenCalled();
    expect(pendingRequest.subscribers).toHaveLength(0);
  });

  test('should reject all subscribers', () => {
    const pendingRequest = new PendingRequest(Promise.resolve(), new AbortController());
    const mockResolve1 = jest.fn();
    const mockResolve2 = jest.fn();
    const mockReject1 = jest.fn();
    const mockReject2 = jest.fn();
    
    pendingRequest.subscribe(mockResolve1, mockReject1);
    pendingRequest.subscribe(mockResolve2, mockReject2);
    
    const error = new Error('test error');
    pendingRequest.rejectAll(error);
    
    expect(mockReject1).toHaveBeenCalledWith(error);
    expect(mockReject2).toHaveBeenCalledWith(error);
    expect(mockResolve1).not.toHaveBeenCalled();
    expect(mockResolve2).not.toHaveBeenCalled();
    expect(pendingRequest.subscribers).toHaveLength(0);
  });

  test('should cancel request and call abort controller', () => {
    const mockController = new AbortController();
    const abortSpy = jest.spyOn(mockController, 'abort');
    
    const pendingRequest = new PendingRequest(Promise.resolve(), mockController);
    
    pendingRequest.cancel();
    
    expect(abortSpy).toHaveBeenCalled();
  });

  test('should detect expiration correctly', () => {
    const pendingRequest = new PendingRequest(Promise.resolve(), new AbortController());
    
    expect(pendingRequest.isExpired(5000)).toBe(false);
    
    jest.advanceTimersByTime(5001);
    expect(pendingRequest.isExpired(5000)).toBe(true);
  });
});

describe('RequestDeduplicationService', () => {
  let service;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new RequestDeduplicationService({
      timeout: 5000,
      cleanupInterval: 1000,
      maxPendingRequests: 3
    });
  });

  afterEach(() => {
    service.destroy();
    jest.useRealTimers();
  });

  test('should generate consistent keys', () => {
    const url = '/api/test';
    const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
    
    const key1 = service.generateKey(url, options);
    const key2 = service.generateKey(url, options);

    expect(key1).toBe(key2);
    expect(typeof key1).toBe('string');
    expect(key1.length).toBeGreaterThan(0);

    const parsed = JSON.parse(Buffer.from(key1, 'base64').toString('utf8'));
    expect(parsed).toMatchObject({
      url,
      method: 'GET'
    });
  });

  test('should deduplicate identical requests', async () => {
    const mockRequestFn = jest.fn().mockResolvedValue('test result');
    const key = 'test-key';
    
    // Start two identical requests
    const promise1 = service.dedupe(key, mockRequestFn);
    const promise2 = service.dedupe(key, mockRequestFn);
    
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    expect(result1).toBe('test result');
    expect(result2).toBe('test result');
    expect(mockRequestFn).toHaveBeenCalledTimes(1);
  });

  test('should handle request errors correctly', async () => {
    const error = new Error('Request failed');
    const mockRequestFn = jest.fn().mockRejectedValue(error);
    const key = 'test-key';
    
    const promise1 = service.dedupe(key, mockRequestFn);
    const promise2 = service.dedupe(key, mockRequestFn);
    
    await expect(promise1).rejects.toThrow('Request failed');
    await expect(promise2).rejects.toThrow('Request failed');
    expect(mockRequestFn).toHaveBeenCalledTimes(1);
  });

  test('should handle abort signals correctly', async () => {
    const mockRequestFn = jest.fn().mockImplementation((signal) => {
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error('Request aborted'));
        });
        setTimeout(() => resolve('result'), 1000);
      });
    });
    
    const abortController = new AbortController();
    const key = 'test-key';
    
    const promise = service.dedupe(key, mockRequestFn, abortController.signal);
    
    // Abort the request
    abortController.abort();

    await expect(promise).rejects.toThrow('Request aborted');
  });

  test('should forward abort signal to request function and reject promise', async () => {
    const mockRequestFn = jest.fn().mockImplementation((signal) => {
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error('Request aborted'));
        });
        setTimeout(() => resolve('result'), 1000);
      });
    });

    const controller = new AbortController();
    const key = 'abort-key';

    const promise = service.dedupe(key, mockRequestFn, controller.signal);

    // Abort the request using the external controller
    controller.abort();

    expect(mockRequestFn).toHaveBeenCalledTimes(1);
    const receivedSignal = mockRequestFn.mock.calls[0][0];
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal.aborted).toBe(true);

    await expect(promise).rejects.toThrow('Request aborted');
  });

  test('should cancel specific requests', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('result'), 1000);
      });
    });
    
    const key = 'test-key';
    service.dedupe(key, mockRequestFn);
    
    expect(service.pendingRequests.has(key)).toBe(true);
    
    // Cancel the request
    service.cancel(key);
    
    expect(service.pendingRequests.has(key)).toBe(false);
  });

  test('should cancel all requests', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('result'), 1000);
      });
    });
    
    service.dedupe('key1', mockRequestFn);
    service.dedupe('key2', mockRequestFn);
    
    expect(service.pendingRequests.size).toBe(2);
    
    service.cancelAll();
    
    expect(service.pendingRequests.size).toBe(0);
  });

  test('should cancel requests matching predicate', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('result'), 1000);
      });
    });
    
    service.dedupe('key1', mockRequestFn);
    service.dedupe('key2', mockRequestFn);
    service.dedupe('other', mockRequestFn);
    
    expect(service.pendingRequests.size).toBe(3);
    
    const cancelledCount = service.cancelMatching((key) => key.startsWith('key'));
    
    expect(cancelledCount).toBe(2);
    expect(service.pendingRequests.size).toBe(1);
    expect(service.pendingRequests.has('other')).toBe(true);
  });

  test('should provide pending requests information', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });
    
    service.dedupe('key1', mockRequestFn);
    service.dedupe('key1', mockRequestFn); // Should be deduped
    service.dedupe('key2', mockRequestFn);
    
    const pendingRequests = service.getPendingRequests();
    
    expect(pendingRequests).toHaveLength(2);
    expect(pendingRequests[0]).toMatchObject({
      key: expect.any(String),
      timestamp: expect.any(Number),
      subscriberCount: expect.any(Number),
      age: expect.any(Number)
    });
  });

  test('should provide accurate statistics', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });
    
    service.dedupe('key1', mockRequestFn);
    service.dedupe('key1', mockRequestFn); // Deduped
    service.dedupe('key2', mockRequestFn);
    
    const stats = service.getStats();
    
    expect(stats.pendingRequests).toBe(2);
    expect(stats.totalSubscribers).toBe(1); // One subscriber for the deduped request
    expect(stats.maxPendingRequests).toBe(3);
  });

  test('should cleanup expired requests', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });
    
    service.dedupe('key1', mockRequestFn);
    service.dedupe('key2', mockRequestFn);
    
    expect(service.pendingRequests.size).toBe(2);
    
    // Advance time to expire requests
    jest.advanceTimersByTime(5001);
    
    const cleanedCount = service.cleanup();
    
    expect(cleanedCount).toBe(2);
    expect(service.pendingRequests.size).toBe(0);
  });

  test('should enforce max pending requests limit', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });
    
    // Add requests up to the limit
    service.dedupe('key1', mockRequestFn);
    service.dedupe('key2', mockRequestFn);
    service.dedupe('key3', mockRequestFn);
    service.dedupe('key4', mockRequestFn); // Should trigger cleanup
    
    expect(service.pendingRequests.size).toBe(4);
    
    // Trigger cleanup
    service.cleanup();
    
    expect(service.pendingRequests.size).toBe(3);
  });

  test('should run automatic cleanup', () => {
    const mockRequestFn = jest.fn().mockImplementation(() => {
      return new Promise(() => {}); // Never resolves
    });
    
    service.dedupe('key1', mockRequestFn);
    
    // Advance time to expire request
    jest.advanceTimersByTime(5001);
    
    // Advance time to trigger cleanup interval
    jest.advanceTimersByTime(1000);
    
    expect(service.pendingRequests.size).toBe(0);
  });
});

describe('RequestDeduplicationUtils', () => {
  let service;

  beforeEach(() => {
    service = new RequestDeduplicationService();
  });

  afterEach(() => {
    service.destroy();
  });

  test('should create deduped fetch function', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    });
    
    global.fetch = mockFetch;
    
    const dedupedFetch = RequestDeduplicationUtils.createDedupedFetch(service);
    
    const promise1 = dedupedFetch('/api/test');
    const promise2 = dedupedFetch('/api/test');
    
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    expect(result1).toEqual({ data: 'test' });
    expect(result2).toEqual({ data: 'test' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('should create deduped API method', async () => {
    const mockApiMethod = jest.fn().mockResolvedValue('api result');
    
    const dedupedMethod = RequestDeduplicationUtils.createDedupedApiMethod(service, mockApiMethod);
    
    const promise1 = dedupedMethod('arg1', 'arg2');
    const promise2 = dedupedMethod('arg1', 'arg2');
    
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    expect(result1).toBe('api result');
    expect(result2).toBe('api result');
    expect(mockApiMethod).toHaveBeenCalledTimes(1);
  });
});