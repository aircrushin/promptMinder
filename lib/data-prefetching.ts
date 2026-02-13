/**
 * Background Data Prefetching Service
 * Implements intelligent prefetching based on user behavior patterns
 */

import { cachedApiClient } from './cached-api-client';
import { requestCache } from './api-cache';

class PrefetchStrategy {
  name: string;
  priority: number;
  condition: (context: any) => boolean;

  constructor(name: string, priority: number = 1, condition: (context: any) => boolean = () => true) {
    this.name = name;
    this.priority = priority;
    this.condition = condition;
  }

  shouldPrefetch(context: any) {
    return this.condition(context);
  }
}

class DataPrefetchingService {
  config: any;
  prefetchQueue: any[];
  activePrefetches: Set<string>;
  prefetchHistory: Map<string, number>;
  userBehaviorPatterns: Map<string, any>;
  strategies: Map<string, PrefetchStrategy>;
  processingInterval: ReturnType<typeof setInterval> | null;

  constructor(config: any = {}) {
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

  initializeDefaultStrategies() {
    this.addStrategy(new PrefetchStrategy(
      'nextPagePrompts',
      3,
      (context) => context.currentPage && context.hasNextPage
    ));

    this.addStrategy(new PrefetchStrategy(
      'promptDetails',
      2,
      (context) => context.hoveredPromptId && !context.alreadyLoaded
    ));

    this.addStrategy(new PrefetchStrategy(
      'tags',
      1,
      (context) => context.currentRoute === '/prompts' && !context.tagsLoaded
    ));

    this.addStrategy(new PrefetchStrategy(
      'relatedPrompts',
      2,
      (context) => context.currentPromptId && context.promptTags
    ));

    this.addStrategy(new PrefetchStrategy(
      'recentPrompts',
      1,
      (context) => context.isAuthenticated && !context.recentPromptsLoaded
    ));
  }

  addStrategy(strategy: PrefetchStrategy) {
    this.strategies.set(strategy.name, strategy);
  }

  removeStrategy(name: string) {
    this.strategies.delete(name);
  }

  recordUserBehavior(action: string, context: any = {}) {
    const key = `${action}:${JSON.stringify(context)}`;
    const current = this.userBehaviorPatterns.get(key) || { count: 0, lastSeen: 0 };

    this.userBehaviorPatterns.set(key, {
      count: current.count + 1,
      lastSeen: Date.now(),
      context
    });

    if (this.config.enableIntelligentPrefetching) {
      this.triggerIntelligentPrefetching(action, context);
    }
  }

  triggerIntelligentPrefetching(action: string, context: any) {
    if (action === 'hover' && context.promptId) {
      const viewPattern = this.userBehaviorPatterns.get(`view:${JSON.stringify({ promptId: context.promptId })}`);
      if (viewPattern && viewPattern.count > 2) {
        this.prefetchPromptDetails(context.promptId);
      }
    }

    if (action === 'scroll' && context.scrollPercentage > 80) {
      const nextPagePattern = this.userBehaviorPatterns.get('navigate:nextPage');
      if (nextPagePattern && nextPagePattern.count > 1) {
        this.prefetchNextPage(context);
      }
    }

    if (action === 'filter' && context.tag) {
      this.prefetchTaggedPrompts(context.tag);
    }
  }

  async prefetchPromptDetails(promptId: string, priority: number = 2) {
    const prefetchItem = {
      id: `prompt-details-${promptId}`,
      type: 'promptDetails',
      priority,
      requestFn: () => cachedApiClient.request(`/api/prompts/${promptId}`),
      context: { promptId }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  async prefetchNextPage(context: any, priority: number = 3) {
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

  async prefetchTags(priority: number = 1) {
    const prefetchItem = {
      id: 'tags',
      type: 'tags',
      priority,
      requestFn: () => cachedApiClient.getTags(),
      context: {}
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  async prefetchTaggedPrompts(tag: string, priority: number = 2) {
    const prefetchItem = {
      id: `tagged-prompts-${tag}`,
      type: 'taggedPrompts',
      priority,
      requestFn: () => cachedApiClient.getPrompts({ tags: [tag] }),
      context: { tag }
    };

    this.addToPrefetchQueue(prefetchItem);
  }

  async prefetchRelatedPrompts(promptId: string, tags: string[] = [], priority: number = 2) {
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

  async prefetchRecentPrompts(userId: string, priority: number = 1) {
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

  addToPrefetchQueue(prefetchItem: any) {
    const existingIndex = this.prefetchQueue.findIndex((item: any) => item.id === prefetchItem.id);
    if (existingIndex !== -1) {
      if (prefetchItem.priority > this.prefetchQueue[existingIndex].priority) {
        this.prefetchQueue[existingIndex].priority = prefetchItem.priority;
      }
      return;
    }

    const lastPrefetch = this.prefetchHistory.get(prefetchItem.id);
    if (lastPrefetch && Date.now() - lastPrefetch < this.config.maxPrefetchAge) {
      return;
    }

    this.prefetchQueue.push({
      ...prefetchItem,
      timestamp: Date.now()
    });

    this.prefetchQueue.sort((a: any, b: any) => b.priority - a.priority);
  }

  async processPrefetchQueue() {
    if (this.prefetchQueue.length === 0) return;
    if (this.activePrefetches.size >= this.config.maxConcurrentPrefetches) return;

    const item = this.prefetchQueue.shift();
    if (!item) return;

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

  async prefetchForContext(context: any) {
    const applicableStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.shouldPrefetch(context))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      await this.executePrefetchStrategy(strategy, context);
    }
  }

  async executePrefetchStrategy(strategy: PrefetchStrategy, context: any) {
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

  clear() {
    this.prefetchQueue = [];
    this.prefetchHistory.clear();
    this.userBehaviorPatterns.clear();
  }

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
  createHoverPrefetch: (prefetchService: DataPrefetchingService, getContext: (event: any) => any) => {
    let hoverTimeout: ReturnType<typeof setTimeout> | undefined;

    return {
      onMouseEnter: (event: any) => {
        hoverTimeout = setTimeout(() => {
          const context = getContext(event);
          prefetchService.recordUserBehavior('hover', context);
          prefetchService.prefetchForContext(context);
        }, 200);
      },
      onMouseLeave: () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
      }
    };
  },

  createScrollPrefetch: (prefetchService: DataPrefetchingService, getContext: (event: any) => any) => {
    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

    return (event: any) => {
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

  createRoutePrefetch: (prefetchService: DataPrefetchingService) => {
    return (route: string, context: any = {}) => {
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
