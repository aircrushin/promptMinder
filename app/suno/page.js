import SunoGallery from './SunoGallery';
import { sunoPrompts } from './data';

export const metadata = {
  title: 'Suno Prompts | PromptMinder',
  description: 'Curated Suno music-style prompt templates, with filtering, copy, and import into your prompt library.',
};

export default function SunoPage() {
  return <SunoGallery prompts={sunoPrompts} />;
}

