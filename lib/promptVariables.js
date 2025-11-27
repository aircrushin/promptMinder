/**
 * Prompt Variables Utility Library
 * 处理提示词中的动态变量 {{variable}} 语法
 */

/**
 * 从文本中提取所有的变量
 * @param {string} text - 包含变量的文本
 * @returns {string[]} - 变量名数组
 */
export function extractVariables(text) {
  if (!text || typeof text !== 'string') return [];
  
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = variableRegex.exec(text)) !== null) {
    const variableName = match[1].trim();
    if (variableName && !variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

/**
 * 替换文本中的变量为实际值
 * @param {string} text - 包含变量的文本
 * @param {Object} variables - 变量值对象 {variableName: value}
 * @returns {string} - 替换后的文本
 */
export function replaceVariables(text, variables = {}) {
  if (!text || typeof text !== 'string') return text;
  
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    return variables[trimmedName] !== undefined ? variables[trimmedName] : match;
  });
}

/**
 * 验证变量名是否有效
 * @param {string} variableName - 变量名
 * @returns {boolean} - 是否有效
 */
export function isValidVariableName(variableName) {
  if (!variableName || typeof variableName !== 'string') return false;
  
  // 变量名只能包含字母、数字、下划线和连字符
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  return validNameRegex.test(variableName.trim());
}

/**
 * 获取变量的建议类型（基于变量名）
 * @param {string} variableName - 变量名
 * @returns {string} - 'text' | 'textarea' | 'number' | 'email' | 'url'
 */
export function getVariableType(variableName) {
  if (!variableName) return 'text';
  
  const name = variableName.toLowerCase();
  
  // 长文本类型
  if (name.includes('content') || name.includes('description') || 
      name.includes('text') || name.includes('paragraph') ||
      name.includes('story') || name.includes('article') ||
      name.includes('prompt') || name.includes('input')) {
    return 'textarea';
  }
  
  // 数字类型
  if (name.includes('number') || name.includes('count') || 
      name.includes('age') || name.includes('year') ||
      name.includes('quantity') || name.includes('amount')) {
    return 'number';
  }
  
  // 邮箱类型
  if (name.includes('email') || name.includes('mail')) {
    return 'email';
  }
  
  // URL类型
  if (name.includes('url') || name.includes('link') || 
      name.includes('website') || name.includes('site')) {
    return 'url';
  }
  
  // 默认为文本
  return 'text';
}

/**
 * 获取变量的友好显示名称
 * @param {string} variableName - 变量名
 * @returns {string} - 友好的显示名称
 */
export function getVariableDisplayName(variableName) {
  if (!variableName) return '';
  
  // 将下划线和连字符替换为空格，并转换为标题格式
  return variableName
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * 获取变量的占位符文本
 * @param {string} variableName - 变量名
 * @returns {string} - 占位符文本
 */
export function getVariablePlaceholder(variableName) {
  if (!variableName) return '';
  
  const name = variableName.toLowerCase();
  const displayName = getVariableDisplayName(variableName);
  
  // 根据变量名提供智能占位符
  if (name.includes('name')) return `Enter ${displayName.toLowerCase()}...`;
  if (name.includes('email')) return 'user@example.com';
  if (name.includes('url') || name.includes('link')) return 'https://example.com';
  if (name.includes('age')) return 'Enter age...';
  if (name.includes('content') || name.includes('text')) return `Enter ${displayName.toLowerCase()} here...`;
  if (name.includes('title')) return `Enter ${displayName.toLowerCase()}...`;
  if (name.includes('description')) return `Describe ${displayName.toLowerCase()}...`;
  
  return `Enter ${displayName.toLowerCase()}...`;
}

/**
 * 分析提示词内容，返回详细的变量信息
 * @param {string} content - 提示词内容
 * @returns {Object} - 包含变量信息的对象
 */
export function analyzePromptVariables(content) {
  const variables = extractVariables(content);
  
  return {
    hasVariables: variables.length > 0,
    variableCount: variables.length,
    variables: variables.map(name => ({
      name,
      displayName: getVariableDisplayName(name),
      type: getVariableType(name),
      placeholder: getVariablePlaceholder(name),
      required: true, // 默认所有变量都是必需的
      defaultValue: ''
    }))
  };
}

/**
 * 验证变量值
 * @param {string} variableName - 变量名
 * @param {string} value - 变量值
 * @param {string} type - 变量类型
 * @returns {Object} - 验证结果 {isValid: boolean, error?: string}
 */
export function validateVariableValue(variableName, value, type = 'text') {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${getVariableDisplayName(variableName)} is required`
    };
  }
  
  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          isValid: false,
          error: 'Please enter a valid email address'
        };
      }
      break;
      
    case 'url':
      try {
        new URL(value);
      } catch {
        return {
          isValid: false,
          error: 'Please enter a valid URL'
        };
      }
      break;
      
    case 'number':
      if (isNaN(Number(value))) {
        return {
          isValid: false,
          error: 'Please enter a valid number'
        };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * 生成变量使用示例
 * @param {string[]} variables - 变量名数组
 * @returns {Object} - 示例对象
 */
export function generateVariableExamples(variables) {
  const examples = {};
  
  variables.forEach(name => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('name')) {
      examples[name] = 'John Doe';
    } else if (lowerName.includes('email')) {
      examples[name] = 'john@example.com';
    } else if (lowerName.includes('age')) {
      examples[name] = '25';
    } else if (lowerName.includes('company')) {
      examples[name] = 'Acme Corp';
    } else if (lowerName.includes('product')) {
      examples[name] = 'Amazing Product';
    } else if (lowerName.includes('topic') || lowerName.includes('subject')) {
      examples[name] = 'Artificial Intelligence';
    } else if (lowerName.includes('language')) {
      examples[name] = 'English';
    } else if (lowerName.includes('content') || lowerName.includes('text')) {
      examples[name] = 'This is sample content for demonstration purposes.';
    } else {
      examples[name] = `Sample ${getVariableDisplayName(name)}`;
    }
  });
  
  return examples;
}

export default {
  extractVariables,
  replaceVariables,
  isValidVariableName,
  getVariableType,
  getVariableDisplayName,
  getVariablePlaceholder,
  analyzePromptVariables,
  validateVariableValue,
  generateVariableExamples
}; 