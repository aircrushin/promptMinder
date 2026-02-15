// API 配置
export const API_CONFIG = {
  DEFAULT_MODEL: 'glm-4v-flash',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  DEFAULT_TOP_P: 0.7,
  DEFAULT_BASE_URL: 'https://open.bigmodel.cn/api/paas/v4',
};

// Toast 消息
export const TOAST_MESSAGES = {
  COPIED: '已复制到剪贴板',
  COPY_SUCCESS: '复制成功',
  COPY_FAILED: '复制失败',
  DELETE_SUCCESS: '删除成功',
  DELETE_FAILED: '删除失败',
  SAVE_SUCCESS: '保存成功',
  SAVE_FAILED: '保存失败',
  SHARE_SUCCESS: '分享链接已复制到剪贴板',
  SHARE_FAILED: '分享失败',
  IMPORT_SUCCESS: '导入成功',
  IMPORT_FAILED: '导入失败',
};

// 路由路径
export const ROUTES = {
  HOME: '/',
  PROMPTS: '/prompts',
  NEW_PROMPT: '/prompts/new',
  EDIT_PROMPT: (id: string) => `/prompts/${id}/edit`,
  VIEW_PROMPT: (id: string) => `/prompts/${id}`,
  PUBLIC: '/public',
  SHARE: (id: string) => `/share/${id}`,
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
};

// 默认值
export const DEFAULTS = {
  PROMPT_VERSION: '1.0.0',
  COVER_IMAGE: '/default-cover.jpg',
  PROMPT_TAG: 'Chatbot',
  LANGUAGE: 'zh',
};

// UI 配置
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 2000,
  MAX_SEARCH_RESULTS: 50,
  SKELETON_COUNT: 6,
};

// 表单验证
export const VALIDATION = {
  PROMPT_TITLE_MIN: 1,
  PROMPT_TITLE_MAX: 100,
  PROMPT_CONTENT_MIN: 10,
  PROMPT_CONTENT_MAX: 10000,
  DESCRIPTION_MAX: 500,
  TAG_NAME_MAX: 20,
};

// 页面不显示导航栏
export const NO_HEADER_FOOTER_PAGES = ['/sign-in', '/sign-up', '/'];

// 文件类型
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
};

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
}; 