/**
 * GEO工具库测试
 */

import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
  generateFAQPageSchema,
  generateBreadcrumbSchema,
  generatePromptSchema,
  generatePromptListSchema,
  generateWebPageSchema,
  generateSchemaGraph,
  generateGEODescription,
  generateGEOKeywords,
  generateAISummary,
} from '@/lib/geo-utils';

describe('GEO Utils', () => {
  describe('generateOrganizationSchema', () => {
    it('应该生成正确的组织结构化数据', () => {
      const schema = generateOrganizationSchema();
      
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Prompt Minder');
      expect(schema.url).toBeDefined();
      expect(schema.logo).toBeDefined();
      expect(schema.logo['@type']).toBe('ImageObject');
    });
  });

  describe('generateWebSiteSchema', () => {
    it('应该生成正确的网站结构化数据', () => {
      const schema = generateWebSiteSchema();
      
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Prompt Minder');
      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction[0]['@type']).toBe('SearchAction');
    });
  });

  describe('generateSoftwareApplicationSchema', () => {
    it('应该生成正确的软件应用结构化数据', () => {
      const schema = generateSoftwareApplicationSchema();
      
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema.applicationCategory).toBe('ProductivityApplication');
      expect(schema.offers).toBeDefined();
      expect(schema.featureList).toBeInstanceOf(Array);
      expect(schema.featureList.length).toBeGreaterThan(0);
    });
  });

  describe('generateFAQPageSchema', () => {
    const faqs = [
      { question: '问题1', answer: '答案1' },
      { question: '问题2', answer: '答案2' },
    ];

    it('应该生成正确的FAQ页面结构化数据', () => {
      const schema = generateFAQPageSchema(faqs, 'zh');
      
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]['@type']).toBe('Question');
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    });

    it('应该支持英文语言', () => {
      const schema = generateFAQPageSchema(faqs, 'en');
      expect(schema.inLanguage).toBe('en');
    });
  });

  describe('generateBreadcrumbSchema', () => {
    const items = [
      { name: '首页', url: '/' },
      { name: '提示词', url: '/prompts' },
      { name: '详情', url: null },
    ];

    it('应该生成正确的面包屑结构化数据', () => {
      const schema = generateBreadcrumbSchema(items);
      
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0]['@type']).toBe('ListItem');
    });
  });

  describe('generatePromptSchema', () => {
    const prompt = {
      id: 'test-id',
      title: '测试提示词',
      description: '这是一个测试描述',
      content: '这是提示词内容',
      tags: ['测试', 'AI'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };

    it('应该生成正确的提示词结构化数据', () => {
      const schema = generatePromptSchema(prompt);
      
      expect(schema['@type']).toBe('CreativeWork');
      expect(schema.name).toBe('测试提示词');
      expect(schema.description).toBe('这是一个测试描述');
      expect(schema.text).toBe('这是提示词内容');
      expect(schema.keywords).toBe('测试, AI');
    });

    it('应该正确处理字符串格式的标签', () => {
      const promptWithStringTags = { ...prompt, tags: '测试,AI' };
      const schema = generatePromptSchema(promptWithStringTags);
      expect(schema.keywords).toBe('测试,AI');
    });
  });

  describe('generatePromptListSchema', () => {
    const prompts = [
      { id: '1', title: '提示词1', content: '内容1' },
      { id: '2', title: '提示词2', content: '内容2' },
    ];

    it('应该生成正确的提示词列表结构化数据', () => {
      const schema = generatePromptListSchema(prompts);
      
      expect(schema['@type']).toBe('ItemList');
      expect(schema.numberOfItems).toBe(2);
      expect(schema.itemListElement).toHaveLength(2);
    });

    it('应该支持自定义选项', () => {
      const schema = generatePromptListSchema(prompts, {
        name: '自定义名称',
        description: '自定义描述',
      });
      
      expect(schema.name).toBe('自定义名称');
      expect(schema.description).toBe('自定义描述');
    });
  });

  describe('generateWebPageSchema', () => {
    it('应该生成正确的网页结构化数据', () => {
      const schema = generateWebPageSchema({
        name: '测试页面',
        description: '页面描述',
        url: '/test',
        datePublished: '2024-01-01',
      });
      
      expect(schema['@type']).toBe('WebPage');
      expect(schema.name).toBe('测试页面');
      expect(schema.description).toBe('页面描述');
    });
  });

  describe('generateSchemaGraph', () => {
    it('应该生成正确的Schema图谱结构', () => {
      const schemas = [
        { '@type': 'Organization', name: 'Test' },
        { '@type': 'WebSite', name: 'Test Site' },
      ];
      
      const graph = generateSchemaGraph(schemas);
      
      expect(graph['@context']).toBe('https://schema.org');
      expect(graph['@graph']).toHaveLength(2);
    });
  });

  describe('generateGEODescription', () => {
    it('应该生成GEO优化的描述', () => {
      const content = '这是一段很长的内容用于测试描述生成功能';
      const description = generateGEODescription(content, {
        prefix: '【测试】',
        maxLength: 50,
      });
      
      expect(description.startsWith('【测试】')).toBe(true);
      expect(description.length).toBeLessThanOrEqual(50);
    });

    it('应该清理特殊字符', () => {
      const content = '# 标题\n**粗体** _斜体_';
      const description = generateGEODescription(content);
      
      expect(description).not.toContain('#');
      expect(description).not.toContain('*');
      expect(description).not.toContain('_');
    });
  });

  describe('generateGEOKeywords', () => {
    it('应该生成GEO优化的关键词', () => {
      const prompt = {
        tags: ['React', 'JavaScript'],
      };
      
      const keywords = generateGEOKeywords(prompt);
      
      expect(keywords).toContain('React');
      expect(keywords).toContain('JavaScript');
      expect(keywords).toContain('AI提示词');
      expect(keywords).toContain('Prompt');
    });

    it('应该处理字符串格式的标签', () => {
      const prompt = {
        tags: 'React,JavaScript',
      };
      
      const keywords = generateGEOKeywords(prompt);
      expect(keywords).toContain('React');
    });
  });

  describe('generateAISummary', () => {
    it('应该生成AI友好的内容摘要', () => {
      const content = '段落1\n\n段落2\n\n段落3\n\n段落4';
      const summary = generateAISummary(content);
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeLessThanOrEqual(303); // 300 + '...'
    });

    it('应该处理空内容', () => {
      const summary = generateAISummary('');
      expect(summary).toBe('');
    });

    it('应该处理null内容', () => {
      const summary = generateAISummary(null);
      expect(summary).toBe('');
    });
  });
});
