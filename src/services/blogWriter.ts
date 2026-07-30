import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface GeneratedBlog {
  title: string
  blog: string
  subtitle: string
  insight: string
  topics: string[]
  questions: string[]
}

interface GenerateBlogInput {
  voiceBrief: string
  founderName: string
  caption?: string
  transcript?: string
  platform: string
  kind?: string
}

export async function generateBlogFromVoiceBrief(input: GenerateBlogInput): Promise<{ blog?: GeneratedBlog; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Not available in this environment' }
  const { data, error } = await supabase.functions.invoke<{ blog?: GeneratedBlog; error?: string }>('generate-blog', { body: input })
  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }
  if (!data?.blog) return { error: 'AI returned nothing usable' }
  return { blog: data.blog }
}

// The prompt a founder can hand to any AI (ChatGPT, Claude, whatever they
// already use) to help them actually write their own Voice & Brand Brief,
// rather than staring at a blank textarea. Generic on purpose — every
// founder's real chapters/voice/rules are different; this just gets them
// talking about the right things in the right shape.
export const VOICE_BRIEF_INTERVIEW_PROMPT = `I run a business (or several) and I'm building a permanent, connected profile of my work on CULO Village. I need you to interview me and then write me a "Voice & Brand Brief" document — a single reference document that an AI writer can use later to turn my old, scattered social media content (Reels, posts, photos) into real blog posts in my actual voice, without inventing anything about me.

Ask me questions, one topic at a time, until you have enough to write the brief. Cover:

1. Who I am — my name, what I actually do, and the real chapters of my story (different businesses, roles, turning points — in order, roughly).
2. The problem I originally set out to solve, in my own words, not marketing language.
3. What my current business/product actually does, and why I built it the way I did.
4. Who I'm writing for — who reads my stuff, and what they're struggling with.
5. My actual voice — am I formal or casual, do I swear, do I use short punchy sentences or long reflective ones, what words do I never use, what phrases sound like me vs. sound fake.
6. 2-3 short pieces of writing I've already done that sound like "me" — so you can learn my real voice from examples, not just my description of it.
7. Specific facts that must never be wrong or invented — real dates, real business names, real numbers, anything sensitive I don't want mentioned.
8. What I want to become known for / associated with over time (the long-term positioning, not just today's offer).

Once you have my answers, write the brief with these sections:
- Who I am and my real chapters (in order)
- The problem/founding story
- What I've built and why
- My audience and what they need to hear
- My voice and writing rules (tone, sentence style, words to use, words to avoid)
- Facts that must stay accurate (a plain list)
- What I want to be known for
- 2-3 example passages in my real voice, for style reference

Keep it to something a person could realistically upload as one document — clear, organized, and honest, not padded with generic business language.`
