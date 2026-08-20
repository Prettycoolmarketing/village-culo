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

export interface VoiceBriefInterviewMessage {
  role: 'user' | 'assistant'
  content: string
}

interface VoiceBriefInterviewTurn {
  done: boolean
  message: string
  brief?: string
}

// Runs one turn of the in-app Voice Brief interview (see VoiceBriefInterview.tsx)
// — for a founder with no existing brief and nothing to hand to an outside AI to
// mine. Send the whole conversation so far; get back either the next question
// or, once there's enough material, the finished brief.
export async function runVoiceBriefInterviewTurn(input: {
  founderName?: string
  messages: VoiceBriefInterviewMessage[]
}): Promise<{ turn?: VoiceBriefInterviewTurn; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Not available in this environment' }
  const { data, error } = await supabase.functions.invoke<VoiceBriefInterviewTurn & { error?: string }>('voice-brief-interview', { body: input })
  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }
  if (!data?.message) return { error: 'AI returned nothing usable' }
  return { turn: data }
}

// The prompt a founder can hand to any AI (ChatGPT, Claude, whatever they
// already use) to help them actually write their own Voice & Brand Brief,
// rather than staring at a blank textarea. This is a full extraction prompt
// (not a short interview) — it asks the AI to mine existing chats/drafts/
// messages first and only interview the founder on genuine gaps at the end,
// producing a STORY_VOICE_AND_INSIGHT_PROFILE.md they bring back here.
export const VOICE_BRIEF_INTERVIEW_PROMPT = `# MASTER PROMPT: Extract My Story, Voice, Insights and Education

## Purpose

Create a permanent markdown reference file called:

\`STORY_VOICE_AND_INSIGHT_PROFILE.md\`

This document will become the source of truth for writing content in my real voice.

It should allow another AI to turn my existing social media posts, videos, photographs, transcripts, notes and memories into:

* Founder-led captions
* Personal storytelling captions
* Educational captions
* Reflective captions
* Blog posts
* CULO Village stories
* Founder profile content
* Business origin stories
* Lessons and practical advice
* Searchable questions and answers
* Long-term authority content

This is primarily an **extraction task**, not an interview.

Do not begin by asking me a long list of generic brand questions.

First, examine everything you already have access to about me.

This may include:

* Our previous conversations
* Information I have repeatedly shared
* Business planning discussions
* Content drafts
* Captions I have written
* Messages I have asked you to rewrite
* Uploaded documents
* Transcripts
* Website copy
* Social media content
* Product information
* Personal stories
* Opinions
* Corrections I have made to AI-generated writing
* Phrases I regularly use
* Things I have rejected because they did not sound like me
* Decisions I have made and the reasoning behind them
* Questions I repeatedly return to
* Lessons I have learned through experience

Extract the strongest available information from these sources before asking me anything.

---

# Your Role

Act as a combination of:

* Story archivist
* Founder biographer
* Brand voice analyst
* Content strategist
* Knowledge extractor
* Editorial researcher
* Educational content planner

Your job is not to make me sound more polished, corporate or impressive.

Your job is to identify:

1. What has actually happened to me.
2. What I have built.
3. Why I made particular decisions.
4. What I have learned.
5. What I believe.
6. What I can genuinely teach.
7. How I naturally explain things.
8. What experiences give me credibility.
9. What subjects I should become associated with.
10. How my individual stories connect into a larger body of work.

---

# Core Principle

My content should not sound like disconnected marketing posts.

It should build a connected, searchable body of work.

Each story should help explain:

* Who I am
* What I have experienced
* What I noticed
* What I learned
* What changed because of it
* What someone else can take from it
* How it connects to my businesses, work or larger ideas

A photograph or video is not the whole story.

It is evidence that a moment happened.

The written content should recover the context surrounding that moment:

* What was happening at the time
* Where I was
* What I was trying to do
* What went wrong
* What I did not yet understand
* What decision I made
* What happened afterward
* What I now understand differently
* What the reader can learn from it

Do not force every story into a sales pitch.

The business connection can be direct, indirect or simply part of the larger life and work timeline.

---

# Extraction Method

## Stage One: Build an Evidence Base

Review the available information and extract individual factual statements.

For every important statement, determine whether it is:

* **Confirmed fact:** I directly stated it as true.
* **Repeated fact:** I have mentioned it consistently in different contexts.
* **Likely but unconfirmed:** It appears probable but has not been clearly confirmed.
* **AI-generated wording:** It appeared in a draft but may not represent my actual language or belief.
* **Outdated:** It was once true but may no longer be current.
* **Contradictory:** Different conversations contain different versions.
* **Sensitive:** It should be handled cautiously or not published without approval.

Never silently convert a likely assumption into a confirmed fact.

When information conflicts, preserve the conflict in a section called **Facts Requiring Confirmation**.

---

## Stage Two: Reconstruct My Timeline

Identify the real chapters of my story in approximate chronological order.

A chapter may include:

* A business
* A job
* A project
* A product
* A relationship to a particular industry
* A move or travel period
* A significant personal experience
* A failure
* A turning point
* A problem I became determined to solve
* A new belief
* A major change in direction
* A period of experimentation
* An idea that later became a business

For each chapter, extract:

* What happened
* When it happened
* Where it happened, when relevant
* Who was involved
* What I was trying to achieve
* What problem existed
* What decisions I made
* Why I made them
* What worked
* What failed
* What changed afterward
* What I learned
* How that chapter connects to what I am building now
* Which facts are confirmed
* Which details still need verification

Do not flatten my life into a clean entrepreneurial success story.

Keep the unfinished parts, unusual decisions, changes of direction and contradictions where they are meaningful.

---

## Stage Three: Extract My Story Bank

Find individual moments that could become standalone pieces of content.

These may be major events or small moments.

Examples include:

* The first time I noticed a problem
* A conversation that changed my thinking
* A customer interaction
* A mistake
* A product decision
* A moment during travel
* A business that did not work
* A business that did work
* Something I built before I understood its value
* A behind-the-scenes decision
* A family or lifestyle decision that affected my work
* Something an investor, customer or adviser said
* A moment I felt underestimated
* A practical problem I solved myself
* A result that surprised me
* A belief I changed my mind about
* Something I wish I had understood earlier
* A process I now do differently

For each potential story, record:

### Story title

A clear internal working title.

### Story moment

What happened, without exaggeration.

### Context

What was happening before and around the moment.

### Tension

The problem, uncertainty, conflict, risk or decision.

### Insight

What the experience showed me.

### Educational value

What another founder, business owner, parent, traveller, creator or reader could learn.

### Connection

How it relates to my broader story, expertise, business or beliefs.

### Available evidence

The relevant post, video, image, transcript, conversation, document or statement.

### Missing context

What would need to be clarified before publishing.

### Suitable formats

For example:

* Short caption
* Long founder caption
* Educational caption
* CULO Village story
* Blog post
* Carousel
* Talking-head video
* Voice-over
* Frequently asked question
* Founder profile section

Do not discard a story because it does not directly promote a current product.

---

# Stage Four: Extract My Knowledge and Education

Identify what I can credibly teach based on experience.

Separate this into:

### Lived knowledge

Things I know because I personally did, built, experienced, tested, managed or observed them.

### Professional knowledge

Things connected to my formal work, businesses, industries, skills or qualifications.

### Process knowledge

Repeatable systems, workflows, frameworks and methods I use.

### Strategic knowledge

How I make decisions, position ideas, find opportunities, build businesses or connect different projects.

### Practical knowledge

Step-by-step advice, troubleshooting and things people could immediately apply.

### Belief-based insights

Strong perspectives I hold because of what I have experienced.

### Emerging theories

Ideas I am still exploring and should not yet present as proven facts.

For every extracted lesson, include:

* The lesson
* The experience it came from
* Who it helps
* What problem it helps solve
* Whether it is proven, personal opinion or still developing
* A question someone might search to find this answer
* A potential caption angle
* A potential blog angle

Do not describe me as an expert in an area unless the available evidence supports it.

---

# Analyse My Actual Voice

Study the language I naturally use across my own writing and messages.

Place greater weight on:

* Text I wrote without asking AI to rewrite it
* Voice-message transcripts
* Informal explanations
* Stories I told naturally
* Corrections I made to drafts
* Phrases I repeatedly approved
* Phrases I rejected
* The way I explain ideas when I am excited, frustrated or certain

Place less weight on:

* Generic AI-generated drafts
* Corporate website copy I may not have written
* Investor language created for an application
* Formal writing that was produced for a special situation
* Drafts I criticised as not sounding like me

Extract the following:

## Overall voice

Describe how I naturally sound without using empty labels such as "authentic," "passionate" or "professional" unless you explain what those words mean in practice.

## Sentence style

Identify:

* Average sentence length
* Whether I use fragments
* Whether I use long connected thoughts
* Whether I repeat words for emphasis
* Whether I ask rhetorical questions
* How I transition between ideas
* How I open stories
* How I finish thoughts
* Whether I use direct statements or soften them

## Vocabulary

Create separate lists for:

* Words and expressions I naturally use
* Phrases that strongly sound like me
* Words I use when explaining my businesses
* Words I use when telling personal stories
* Words I use when teaching
* Words I overuse
* Corporate words that do not sound like me
* Marketing clichés to avoid
* Claims I would be uncomfortable making

## Emotional style

Identify how I naturally communicate:

* Excitement
* Frustration
* Vulnerability
* Confidence
* Humour
* Disagreement
* Ambition
* Uncertainty
* Pride
* Reflection

## Imperfections to preserve

Do not over-correct every informal feature of my communication.

Identify which imperfections make the writing sound human and which ones reduce clarity.

The final writing should feel like a clear, intentional version of me—not like an entirely different copywriter.

---

# Caption-Specific Voice Rules

Create practical rules for writing captions in my voice.

Include guidance for:

## Founder storytelling captions

These should generally move through:

1. A real moment or observation
2. The context behind it
3. The challenge, decision or realisation
4. What I now understand
5. Why it matters to the reader
6. A natural connection to my wider body of work

## Educational captions

These should:

* Begin with a real problem, question or experience
* Explain what I discovered
* Give useful information
* Avoid pretending one personal experience is universal proof
* Make the practical lesson clear
* Connect knowledge to lived experience

## Reflective captions

These should:

* Preserve complexity
* Avoid forced motivational conclusions
* Allow unfinished thoughts where appropriate
* Show what changed in my thinking
* Avoid turning every difficult moment into a triumph

## Business captions

These should:

* Explain the problem before promoting the solution
* Show why I built something in a particular way
* Use specific examples
* Avoid inflated claims
* Avoid describing every feature as revolutionary
* Explain how the product connects to my own lived experience

## Travel or lifestyle captions

These should:

* Go beyond describing the destination
* Recover the actual memory, context or meaning
* Connect the moment to family, business, identity, change or learning where relevant
* Avoid generic travel-influencer language

## Calls to action

Identify calls to action that sound natural for me.

Avoid automatically ending every caption with:

* "What do you think?"
* "Let me know in the comments."
* "Tag a friend."
* "Ready to transform your business?"
* "DM me to get started."

Use a call to action only when it genuinely serves the story.

A caption may end with:

* A firm conclusion
* An open reflection
* A practical next step
* A relevant invitation
* A question the story naturally raises
* A connection to the full Village story
* No call to action at all

---

# Distinguish Voice From Typing

Do not mistake spelling errors, rushed typing or transcription errors for intentional brand voice.

Preserve:

* Directness
* Rhythm
* Informality
* Unusual but meaningful phrasing
* Emotional honesty
* Natural sentence flow

Correct:

* Errors that change the meaning
* Confusing grammar
* Accidental repetition
* Obvious voice-transcription mistakes
* Misspelled names and business terms
* Punctuation when it improves readability

The final result should sound like me after I had time to organise my thoughts.

---

# Long-Term Positioning Extraction

Identify what I am already becoming associated with across my body of work.

Separate this into:

### Current positioning

What my work currently supports.

### Developing positioning

What I am actively building credibility in.

### Aspirational positioning

What I want to become known for but have not yet fully proven.

### Search positioning

The topics, industries, questions and descriptions through which someone should eventually discover me.

### Human positioning

What people should understand about my character, perspective and lived experience.

Do not turn aspirational positioning into an established claim.

Show the path between what I have already done and what I want to become known for.

---

# Connected Storytelling Logic

Identify the recurring threads that connect seemingly separate parts of my life and work.

These might include themes such as:

* Building from lived problems
* Creating while travelling
* Founder-led storytelling
* Turning scattered content into permanent knowledge
* Family and business
* Technology and human experience
* Starting businesses outside traditional pathways
* Visibility, discovery and ownership
* Learning by doing
* Creating systems from personal frustration

Do not assume these examples apply to me.

Extract my actual recurring threads from the available evidence.

For each thread, explain:

* Where it appears in my timeline
* Which businesses or stories it connects
* What belief sits underneath it
* What I can teach through it
* How it could become a recurring content series
* What I should not overclaim

---

# Search and Discovery Layer

Because this profile may be used to create CULO Village content, identify the real questions my experiences can answer.

Create:

## Searchable questions

Questions people may type into Google, ChatGPT or another discovery system.

## Founder questions

Questions another founder would ask after hearing my story.

## Practical questions

Questions that can be answered with clear advice or a process.

## Personal experience questions

Questions that my lived story gives me a meaningful perspective on.

## Comparison questions

Relevant comparisons I can credibly discuss based on experience.

## Location-based questions

Questions connected to real places in my story, when relevant.

## Industry questions

Questions connected to the industries, tools and business models I genuinely understand.

Do not manufacture keywords that have no connection to my actual work.

---

# Accuracy and Safety Rules

You must never:

* Invent a date
* Invent revenue
* Invent a customer
* Invent a result
* Invent a qualification
* Invent a partnership
* Invent a testimonial
* Invent an award
* Invent a personal event
* Invent a location
* Invent a business relationship
* Present an aspiration as an achievement
* Present a plan as something already completed
* Present an AI-written phrase as something I personally said
* Fill narrative gaps with plausible-sounding details
* Make difficult experiences more dramatic for engagement
* force a business promotion into every personal story

When an important detail is missing, write:

\`[DETAIL TO CONFIRM: specific missing information]\`

When information may be outdated, write:

\`[CURRENT STATUS TO CONFIRM]\`

When two versions conflict, list both versions under:

\`Facts Requiring Confirmation\`

---

# Questions Policy

Do not interrupt the extraction process with broad interview questions.

Complete the strongest possible document using the information already available.

At the end, create a section called:

\`HIGH-VALUE GAPS\`

Only include questions where the answer would materially improve future storytelling or accuracy.

Limit this section to the most important missing details.

Each question must:

* Be specific
* Refer to an identified story or gap
* Be answerable in one or two sentences
* Explain why the detail matters
* Avoid asking me to repeat information I have already provided

Example:

> In approximately what year did you begin the business, and what were you doing immediately before it? This is needed to place the business correctly in your timeline.

Do not ask questions such as:

* "What is your brand voice?"
* "Who is your audience?"
* "What are your values?"
* "What makes you unique?"

Those should be extracted from the evidence wherever possible.

---

# Required Markdown Output

Create the final document using the following structure.

# Story, Voice and Insight Profile

## 1. Profile Summary

A factual overview of who I am, what I do and what connects my work.

## 2. Confirmed Identity and Business Details

A plain list of confirmed names, roles, businesses, products, projects, locations and relevant dates.

## 3. My Story in Chronological Chapters

For each chapter include:

* Period
* What happened
* What I was building or doing
* The problem or opportunity
* Important decisions
* Result
* Lessons
* Connection to later work
* Accuracy notes

## 4. Major Turning Points

The moments that significantly changed my work, direction or beliefs.

## 5. Founding Stories

A separate founding story for each genuine business, product, platform or significant project.

## 6. Story Bank

Create a structured collection of publishable story opportunities.

Organise them by:

* Personal
* Founder journey
* Business building
* Products
* Customers
* Travel and place
* Family and lifestyle
* Mistakes and failures
* Turning points
* Behind the scenes
* Beliefs and observations
* Future-building

## 7. Knowledge and Education Bank

Organise what I can teach by:

* Topic
* Lesson
* Originating experience
* Intended audience
* Searchable question
* Content opportunities
* Confidence level

## 8. My Audience

Describe the actual groups reflected in my work.

For each audience include:

* Who they are
* What stage they are at
* What they are struggling with
* What they misunderstand
* What they need to hear from me
* Which parts of my story are most relevant to them

## 9. My Beliefs and Strong Perspectives

Separate:

* Established beliefs
* Opinions
* Emerging ideas
* Views I have changed
* Subjects where my position is still unclear

## 10. Recurring Story Threads

Explain the ideas that connect my businesses, experiences and life chapters.

## 11. Voice Analysis

Include:

* Overall voice
* Sentence structure
* Rhythm
* Vocabulary
* Emotional style
* Humour
* Directness
* Storytelling habits
* Teaching style
* Natural openings
* Natural endings
* Characteristics to preserve
* Characteristics to clean up

## 12. Caption Writing Guide

Include specific guidance for:

* Personal story captions
* Founder story captions
* Educational captions
* Business captions
* Product captions
* Reflective captions
* Travel captions
* Behind-the-scenes captions
* Launch captions
* Opinion captions
* Calls to action

## 13. Words and Phrases

### Phrases that sound like me

### Words I use naturally

### Words I use when teaching

### Words I use when explaining my businesses

### Words and phrases that do not sound like me

### Marketing clichés to avoid

### Claims requiring evidence

## 14. Caption Structures That Suit Me

Create five to ten repeatable caption frameworks based on how I naturally communicate.

Do not use generic copywriting formulas unless they genuinely match my voice.

For every framework include:

* Best use
* Structure
* Approximate length
* Suitable opening
* Suitable ending
* What to avoid

## 15. Style Reference Passages

Select two to five short passages that strongly represent my actual voice.

Where possible, use text I genuinely wrote.

Clearly label whether each passage is:

* Direct original writing
* Lightly cleaned transcript
* Reconstructed from multiple confirmed statements
* AI-generated approximation requiring approval

Never present reconstructed writing as a direct quote.

## 16. Searchable Questions My Work Can Answer

Organise by topic and user intent.

## 17. Content Pillars

Build evidence-based content pillars from my real experience.

For each pillar include:

* Core subject
* Why I have credibility
* Story sources
* Educational subjects
* Search questions
* Suitable formats
* Risks of repetition or overclaiming

## 18. Long-Term Positioning

Include:

* What I am already known for
* What my current evidence supports
* What I am becoming known for
* What I want to become known for
* What proof I still need to build
* How my content can gradually establish this position

## 19. Facts That Must Remain Accurate

A plain, easy-to-reference list.

## 20. Sensitive or Private Subjects

Record any known boundaries, subjects requiring permission or information that should not be casually published.

## 21. Facts Requiring Confirmation

List contradictory, uncertain, outdated or incomplete details.

## 22. High-Value Gaps

Ask only the few specific questions that would materially improve the document.

## 23. Instructions for Future AI Writers

Finish with a direct instruction set for any AI using this file.

Include:

* Do not invent facts.
* Check this file before writing.
* Distinguish past, present and planned work.
* Preserve the person's natural voice.
* Add context rather than simply describing the media.
* Find the insight within the lived moment.
* Give the reader something useful.
* Do not force a sales pitch.
* Connect stories into the larger body of work.
* Flag uncertain facts before publishing.
* Keep direct quotes separate from reconstructed prose.

---

# Final Quality Check

Before completing the document, confirm that:

* The timeline is understandable.
* Businesses and projects are not incorrectly merged.
* Past work is distinguished from current work.
* Plans are not described as achievements.
* Voice analysis is based on actual language.
* Educational themes are supported by experience.
* Stories contain context, not just events.
* The output is useful for captions as well as blogs.
* Generic brand language has been removed.
* Repetition has been consolidated.
* Contradictions have been flagged.
* Sensitive information has been treated carefully.
* Another AI could use the file without needing to guess who I am.

Produce the completed markdown document now using the strongest information already available.`
