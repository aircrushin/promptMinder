export const METHOD_FIELDS = ['goal', 'steps', 'variables', 'corrections', 'example', 'notes'];

const SECTION_NAMES = {
  zh: ['任务目标', '执行方法', '输入变量', '纠正与约束', '参考示例', '待确认事项'],
  en: ['Goal', 'Method', 'Input variables', 'Corrections and constraints', 'Reference example', 'Items to confirm'],
};

export function normalizeMethod(value) {
  return Object.fromEntries(METHOD_FIELDS.map((key) => [
    key, typeof value?.[key] === 'string' ? value[key].trim().slice(0, 6000) : '',
  ]));
}

export function formatConversationMethod(method, language = 'zh', included = {}) {
  const labels = SECTION_NAMES[language] || SECTION_NAMES.zh;
  return METHOD_FIELDS.flatMap((key, index) => {
    const value = method[key]?.trim();
    return included[key] === false || !value ? [] : [`## ${labels[index]}\n${value}`];
  }).join('\n\n');
}
