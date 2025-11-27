import SharePromptDetailClient from './SharePromptDetailClient';
import { notFound } from 'next/navigation';

// Lazy helper to create supabase client at runtime instead of module eval
function getSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function getPrompt(id) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // If supabase isn't configured, return null so callers handle notFound gracefully
    console.error('Supabase not configured; cannot fetch prompt');
    return null;
  }

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !prompt) {
    return null;
  }

  // Fetch versions
  const { data: versions } = await supabase
    .from('prompts')
    .select('id, version, created_at')
    .eq('title', prompt.title)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  prompt.versions = versions || [];
  
  // Normalize tags to array
  if (prompt.tags && typeof prompt.tags === 'string') {
    prompt.tags = prompt.tags.split(',');
  } else if (!Array.isArray(prompt.tags)) {
    prompt.tags = [];
  }

  return prompt;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const prompt = await getPrompt(id);

  if (!prompt) {
    return {
      title: 'Prompt Not Found',
    };
  }

  const title = `${prompt.title} - Prompt Minder`;
  const description = prompt.description || `Check out this AI prompt: ${prompt.title}`;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com'}/share/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: prompt.created_at,
      authors: ['Prompt Minder User'],
      tags: prompt.tags ? (Array.isArray(prompt.tags) ? prompt.tags : prompt.tags.split(',')) : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharePromptPage({ params }) {
  const { id } = await params;
  const prompt = await getPrompt(id);

  if (!prompt) {
    notFound();
  }

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: prompt.title,
    description: prompt.description,
    text: prompt.content,
    dateCreated: prompt.created_at,
    author: {
      '@type': 'Person',
      name: 'Prompt Minder User', 
    },
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com'}/share/${id}`,
    keywords: prompt.tags ? (Array.isArray(prompt.tags) ? prompt.tags.join(',') : prompt.tags) : '',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SharePromptDetailClient initialPrompt={prompt} id={id} />
    </>
  );
}
