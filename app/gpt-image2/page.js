import GptImage2Gallery from './GptImage2Gallery';
import { gptImage2Prompts } from './data';

export const metadata = {
  title: 'GPT Image 2 Prompts | PromptMinder',
  description: '精选 GPT Image 2 图片生成提示词案例，支持筛选、复制提示词与导入提示词库。',
};

export default function GptImage2Page() {
  return <GptImage2Gallery prompts={gptImage2Prompts} />;
}
