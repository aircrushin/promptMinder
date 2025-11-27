/**
 * Background Data Prefetching Service
 * Implements intelligent prefetching based on user behavior patterns
 */

import { cachedApiClient } from './cached-api-client';
import { requestCache } from './api-cache';

class PrefetchStrategy {
  constructor(name, priority = 1, condition = () => true) {
    this.name = name;
    this.priority = priority;
    this.condition = condition;
  }

  shouldPrefetch(context) {
    return this.condition(context);
  }
}

class DataPrefetchingService {
  constructor(config = {}) {
    this.config = {
      maxConcurrentPrefetches: 3,
      prefetchDelay: 100, // ms
      maxPrefetchAge: 300000, // 5 minutes
      enableIntelligentPrefetching: true,
      ...config
    };

    this.prefetchQueue = [];
    this.activePrefetches = new Set();
    this.prefetchHistory = new Map();
    this.userBehaviorPatterns = new Map();
    this.strategies = new Map();
    
    // Initialize default strategies
    this.initializeDefaultStrategies();
    
    // Start prefetch processor
    this.processingInterval = setInterval(() => {
      this.processPrefetchQueue();
    }, this.config.prefetchDelay);
  }

  /**
   * Initialize default prefetching strategies
   */
  initializeDefaultStrategies() {
    // Prefetch next page of prompts when user is browsing
    this.addStrategy(new PrefetchStrategy(
      'nextPagePrompts',
      3,
      (context) => context.currentPage && context.hasNextPage
    ));

    // Prefetch prompt details when user hovers over prompt cards
    this.addStrategy(new PrefetchStrategy(
      'promptDetails',
      2,
      (context) => context.hoveredPromptId && !context.alreadyLoaded
    ));

    // Prefetch tags when user is on prompts page
    this.addStrategy(new PrefetchStrategy(
      'tags',
      1,
      (context) => context.currentRoute === '/prompts' && !context.tagsLoaded
    ));

    // Prefetch related prompts based on current prompt
    this.addStrategy(new PrefetchStrategy(
      'relatedPrompts',
      2,
      (context) => context.currentPromptId && context.promptTags
    ));

    // Prefetch user's recent prompts
    this.addStrategy(new PrefetchStrategy(
      'recentPrompts',
      1,
      (context) => context.isAuthenticated && !context.recentPromptsLoaded
    ));
  }

  /**
   * Add a prefetching strategy
   */
  addStrategy(strategy) {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Remove a prefetching strategy
   */
  removeStrategy(name) {
    this.strategies.delete(name);
  }

  /**
   * Record user behavior for intelligent prefetching
   */
  recordUserBehavior(action, context = {}) {
    const key = `${action}:${JSON.stringify(context)}`;
    const current = this.userBehaviorPatterns.get(key) || { count: 0, lastSeen: 0 };
    
    this.userBehaviorPatterns.set(key, {
      count: current.count + 1,
      lastSeen: Date.now(),
      context
    });

    // Trigger intelligent prefetching based on patterns
    if (this.config.enableIntelligentPrefetching) {
      this.triggerIntelligentPrefetching(action, context);
    }
  }

  /**
   * Trigger intelligent prefetching based on user patterns
   */
  triggerIntelligentPrefetching(action, context) {
    // If user frequently views prompt details after hovering, prefetch details
    if (action === 'hover' && context.promptId) {
      const viewPattern = this.userBehaviorPatterns.get(`view:${JSON.stringify({ promptId: context.promptId })}`);
      if (viewPattern && viewPattern.count > 2) {
        this.prefetchPromptDetails(context.promptId);
      }
    }

    // If user frequently navigates to next page, prefetch it
    if (action === 'scroll' && context.scrollPercentage > 80) {
      const nextPagePattern = this.userBehaviorPatterns.get('navigate:nextPage');
      if (nextPagePattern && nextPagePattern.count > 1) {
        this.prefetchNextPage(context);
      }
    }

    // If user frequently filters by tags, prefetch tag data
    if (action === 'filter' && context.tag) {
      this.prefetchTaggedPrompts(context.tag);
    }
  }

  /**
   * Prefetch prompt details
   */
  async prefetchPromptDetails(promptId, priority = 2) {
    const prefetchItem = {
      id: `prompt-details-${promptId}`,
      type: 'promptDetails',
      priority,
      requestFn: () => cachedApiClient.request(`/api/prompts/${promptId}`),
      context: { promptId }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  /**
   * Prefetch next page of prompts
   */
  async prefetchNextPage(context, priority = 3) {
    const { currentPage = 1, filters = {} } = context;
    const nextPage = currentPage + 1;
    
    const prefetchItem = {
      id: `prompts-page-${nextPage}`,
      type: 'promptsPage',
      priority,
      requestFn: () => cachedApiClient.getPrompts({ 
        ...filters, 
        page: nextPage 
      }),
      context: { page: nextPage, filters }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  /**
   * Prefetch tags
   */
  async prefetchTags(priority = 1) {
    const prefetchItem = {
      id: 'tags',
      type: 'tags',
      priority,
      requestFn: () => cachedApiClient.getTags(),
      context: {}
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  /**
   * Prefetch prompts by tag
   */
  async prefetchTaggedPrompts(tag, priority = 2) {
    const prefetchItem = {
      id: `tagged-prompts-${tag}`,
      type: 'taggedPrompts',
      priority,
      requestFn: () => cachedApiClient.getPrompts({ tags: [tag] }),
      context: { tag }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  /**
   * Prefetch related prompts based on current prompt
   */
  async prefetchRelatedPrompts(promptId, tags = [], priority = 2) {
    if (tags.length === 0) return;

    const prefetchItem = {
      id: `related-prompts-${promptId}`,
      type: 'relatedPrompts',
      priority,
      requestFn: () => cachedApiClient.getPrompts({ 
        tags,
        exclude: [promptId],
        limit: 5
      }),
      context: { promptId, tags }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  /**
   * Prefetch user's recent prompts
   */
  async prefetchRecentPrompts(userId, priority = 1) {
    const prefetchItem = {
      id: `recent-prompts-${userId}`,
      type: 'recentPrompts',
      priority,
      requestFn: () => cachedApiClient.getPrompts({ 
        userId,
        sortBy: 'updatedAt',
        order: 'desc',
        limit: 10
      }),
      context: { userId }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  /**
   * Add item to prefetch queue
   */
  addToPrefetchQueue(prefetchItem) {
    // Check if already in queue or recently prefetched
    const existingIndex = this.prefetchQueue.findIndex(item => item.id === prefetchItem.id);
    if (existingIndex !== -1) {
      // Update priority if higher
      if (prefetchItem.priority > this.prefetchQueue[existingIndex].priority) {
        this.prefetchQueue[existingIndex].priority = prefetchItem.priority;
      }
      return;
    }

    // Check if recently prefetched
    const lastPrefetch = this.prefetchHistory.get(prefetchItem.id);
    if (lastPrefetch && Date.now() - lastPrefetch < this.config.maxPrefetchAge) {
      return;
    }

    // Add to queue
    this.prefetchQueue.push({
      ...prefetchItem,
      timestamp: Date.now()
    });

    // Sort by priority (higher priority first)
    this.prefetchQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process prefetch queue
   */
  async processPrefetchQueue() {
    if (this.prefetchQueue.length === 0) return;
    if (this.activePrefetches.size >= this.config.maxConcurrentPrefetches) return;

    const item = this.prefetchQueue.shift();
    if (!item) return;

    // Check if item is too old
    if (Date.now() - item.timestamp > this.config.maxPrefetchAge) {
      return;
    }

    this.activePrefetches.add(item.id);

    try {
      await item.requestFn();
      this.prefetchHistory.set(item.id, Date.now());
    } catch (error) {
      console.warn(`Prefetch failed for ${item.id}:`, error);
    } finally {
      this.activePrefetches.delete(item.id);
    }
  }

  /**
   * Prefetch based on current context and strategies
   */
  async prefetchForContext(context) {
    const applicableStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.shouldPrefetch(context))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      await this.executePrefetchStrategy(strategy, context);
    }
  }

  /**
   * Execute a specific prefetch strategy
   */
  async executePrefetchStrategy(strategy, context) {
    switch (strategy.name) {
      case 'nextPagePrompts':
        await this.prefetchNextPage(context, strategy.priority);
        break;
      case 'promptDetails':
        if (context.hoveredPromptId) {
          await this.prefetchPromptDetails(context.hoveredPromptId, strategy.priority);
        }
        break;
      case 'tags':
        await this.prefetchTags(strategy.priority);
        break;
      case 'relatedPrompts':
        if (context.currentPromptId && context.promptTags) {
          await this.prefetchRelatedPrompts(
            context.currentPromptId, 
            context.promptTags, 
            strategy.priority
          );
        }
        break;
      case 'recentPrompts':
        if (context.userId) {
          await this.prefetchRecentPrompts(context.userId, strategy.priority);
        }
        break;
    }
  }

  /**
   * Get prefetch statistics
   */
  getStats() {
    return {
      queueLength: this.prefetchQueue.length,
      activePrefetches: this.activePrefetches.size,
      totalPrefetched: this.prefetchHistory.size,
      behaviorPatterns: this.userBehaviorPatterns.size,
      strategies: this.strategies.size,
      maxConcurrentPrefetches: this.config.maxConcurrentPrefetches
    };
  }

  /**
   * Clear prefetch queue and history
   */
  clear() {
    this.prefetchQueue = [];
    this.prefetchHistory.clear();
    this.userBehaviorPatterns.clear();
  }

  /**
   * Destroy the service
   */
  destroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.clear();
  }
}

// Prefetch utilities for React components
export const PrefetchUtils = {
  /**
   * Create a prefetch trigger for hover events
   */
  createHoverPrefetch: (prefetchService, getContext) => {
    let hoverTimeout;
    
    return {
      onMouseEnter: (event) => {
        hoverTimeout = setTimeout(() => {
          const context = getContext(event);
          prefetchService.recordUserBehavior('hover', context);
          prefetchService.prefetchForContext(context);
        }, 200); // Delay to avoid excessive prefetching
      },
      onMouseLeave: () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
      }
    };
  },

  /**
   * Create a prefetch trigger for scroll events
   */
  createScrollPrefetch: (prefetchService, getContext) => {
    let scrollTimeout;
    
    return (event) => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        const context = getContext(event);
        prefetchService.recordUserBehavior('scroll', context);
        prefetchService.prefetchForContext(context);
      }, 300);
    };
  },

  /**
   * Create a prefetch trigger for route changes
   */
  createRoutePrefetch: (prefetchService) => {
    return (route, context = {}) => {
      prefetchService.recordUserBehavior('navigate', { route, ...context });
      prefetchService.prefetchForContext({ currentRoute: route, ...context });
    };
  }
};

// Create singleton prefetching service
export const dataPrefetchingService = new DataPrefetchingService({
  maxConcurrentPrefetches: 3,
  prefetchDelay: 100,
  maxPrefetchAge: 300000,
  enableIntelligentPrefetching: true
});

export { DataPrefetchingService, PrefetchStrategy };