import type { Story } from '../types'
import { locations } from './locations'
import { industries } from './industries'
import { topics } from './topics'

const brisbane  = locations[0]
const goldCoast = locations[1]
const sydney    = locations[2]
const melbourne = locations[3]

const marketing   = industries[0]
const photography = industries[1]
const design      = industries[2]
const technology  = industries[3]
const fitness     = industries[4]

export const stories: Story[] = [
  // ─── Shakas / Pretty Cool Marketing Stories ────────────────────────────────
  {
    id: 'story-camera-roll',
    slug: 'your-camera-roll-is-your-biggest-marketing-asset',
    title: 'Your Camera Roll Is Your Biggest Marketing Asset',
    summary: 'Every founder has hundreds of untouched videos sitting on their phone. Here\'s how to turn your camera roll into a content engine that runs for months.',
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[3], topics[1], topics[2]],
    contentTypes: ['reel', 'blog', 'carousel'],
    reelUrl: 'https://www.instagram.com/reel/example1',
    carouselImages: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
    ],
    blog: `Most founders I talk to have the same problem: they know they should be creating content, but they feel like they have nothing to create.

But they're wrong.

I was working with a Brisbane marketing consultant when she told me she had no content ideas. I asked her to open her camera roll. In five minutes, she found 23 videos — behind-the-scenes footage from client workshops, a coffee meeting with a collaborator, a walk-and-talk with her business partner, and short clips of her talking through strategy insights.

That was eight weeks of content. Sitting right there on her phone.

## The truth about your camera roll

Founders are already documenting their work. They're filming things, taking photos, having conversations worth recording. But they're not doing anything with it.

Your camera roll is not a graveyard. It's an untapped content engine.

## How to start

**Step 1: Open your camera roll now and scroll back 90 days.**

Look for:
- Behind-the-scenes moments from client work
- Conversations that felt significant
- Moments where you explained something clearly
- Footage from events, workshops or travel
- Screenshots of results or client feedback

**Step 2: Identify the story behind the footage.**

A raw video of you explaining a concept isn't just a video. It's a reel. It's a blog post. It's a carousel. It's a quote.

One piece of footage can become multiple pieces of content when you know how to extract the story from it. This is exactly what CULO does inside Canva — takes raw footage and transforms it into blogs, reels and carousels without you having to start from scratch.

**Step 3: Batch your content.**

Don't create piece by piece. Spend two hours going through your camera roll and identifying 20–30 moments worth sharing. Create them all at once.

This is how content systems work. Not daily inspiration — batched creation from real material you already have.

## Why authentic beats polished

The reason camera roll content outperforms studio productions is simple: it's real.

Audiences can tell the difference between a founder sharing a genuine moment and a brand publishing a produced campaign. The former builds trust. The latter builds awareness.

Trust converts. Awareness rarely does.

Your camera roll is full of genuine moments. Stop ignoring them.`,
    ideaIds: ['idea-camera-roll', 'idea-authentic-content'],
    relatedStoryIds: ['story-content-system', 'story-culo-built'],
    ctaLabel: 'Try CULO in Canva',
    ctaUrl: 'https://prettycoolmarketing.com/culo',
    status: 'featured',
    featured: true,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
    seoTitle: 'Your Camera Roll Is Your Biggest Marketing Asset',
    seoDescription: 'How to turn your phone footage into months of content.',
  },
  {
    id: 'story-content-system',
    slug: 'how-i-built-a-content-system-that-runs-without-me',
    title: 'How I Built a Content System That Runs Without Me',
    summary: 'I spent two years posting inconsistently and burning out. Then I built a system. This is what changed.',
    coverImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[2], topics[0], topics[4]],
    contentTypes: ['blog', 'reel'],
    reelUrl: 'https://www.instagram.com/reel/example2',
    blog: `For two years I posted when I felt like it. Which meant I posted inconsistently. Which meant nothing compounded, nothing built, and I burned out every three months wondering why content wasn't working for me.

The problem wasn't my ideas. It wasn't my writing. It wasn't even my time.

The problem was I was trying to create content through willpower instead of through systems.

## What a content system actually is

A content system isn't a content calendar. It's not a list of post ideas. It's not a scheduling tool.

A content system is a repeatable process that removes the decision-making from content creation.

When you have a system, you don't ask "what should I post today?" You follow the process, and the answer appears.

## The four-part system I use

**1. Story first, format second.**

Every piece of content starts as a Story. Not a post, not a caption — a Story. I ask: what happened recently that's worth sharing? What did I learn? What did a client experience?

Once I have the story, I decide which formats it deserves. Some stories become reels. Some become blogs. Some become both. But the story comes first.

**2. Batched creation.**

I create content once a fortnight for two hours. In that session, I go through my camera roll, recent client work and any notes I've made, and I identify ten stories worth telling. Then I create them all in that session using CULO inside Canva.

The rest of the month I don't think about content creation. I think about delivery.

**3. Distribution follows publishing.**

When I publish a story, it doesn't just go on Instagram. It goes on the Village homepage, my founder profile, the Stories page, the Ideas page, location pages and the Archive. One story, distributed everywhere, automatically.

That's the CULO Village model. Publish once.

**4. Review once a month.**

At the end of each month I look at what stories performed, which topics resonated, and what's worth expanding. Then I plan the next batch.

Four steps. That's the whole system.

## The result

Since building this system I've published more consistently than any other period in my business. Not because I'm more motivated. Because I removed motivation from the equation.

Systems beat willpower every single time.`,
    ideaIds: ['idea-content-systems', 'idea-founder-burnout'],
    relatedStoryIds: ['story-camera-roll', 'story-culo-built'],
    ctaLabel: 'Book a Strategy Session',
    ctaUrl: 'https://prettycoolmarketing.com/book',
    status: 'published',
    featured: true,
    createdAt: '2024-04-02',
    updatedAt: '2024-04-02',
  },
  {
    id: 'story-culo-built',
    slug: 'why-i-built-culo-inside-canva',
    title: 'Why I Built CULO Inside Canva',
    summary: 'Founders don\'t need another app. They need a tool that fits inside the workflow they already have. Here\'s why Canva was the right home for CULO.',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[4], topics[0], topics[13]],
    contentTypes: ['blog', 'carousel'],
    carouselImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
      'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=600&q=80',
    ],
    blog: `Every time I built a content tool for founders, the same thing happened. They'd use it for a week, get excited about the features, then quietly stop opening it.

Not because the tool was bad. Because it required a behaviour change.

Founders already have a workflow. They already have a tool they use every day. Adding a new app — even a great one — means switching contexts, logging into something new, learning a new interface.

Most founders won't do it consistently. Not because they're lazy. Because the friction compounds.

## Why Canva

When I started building CULO, I knew the content creation tool had to live where founders already spent time.

Canva is already open on most marketing founders' screens. It's where they design their social posts, build their pitch decks, create their presentations.

Building CULO inside Canva meant I didn't have to convince anyone to open a new app. I just had to build something useful inside a tool they already trusted.

## What CULO does inside Canva

CULO is a content operating system built as a Canva app. Founders upload their footage, answer a few prompts about the story they want to tell, and CULO generates:

- A structured blog post
- A reel script and captions
- A carousel layout
- A short-form caption
- A call to action

Then they can edit everything inside Canva using the tools they already know, and publish directly to CULO Village with one click.

No new interface to learn. No app switching. The tool fits the workflow.

## What this taught me about building tools for founders

The best tool is not the most powerful tool. It's the one that gets used.

When you're building for time-poor founders, friction is your enemy. Every additional step, every new login, every different interface is a reason to stop. Build where people already are. Fit the workflow. Remove the friction.

That's the only insight behind CULO. It's not clever. But it works.`,
    ideaIds: ['idea-tools-that-fit', 'idea-content-systems'],
    relatedStoryIds: ['story-content-system', 'story-camera-roll'],
    ctaLabel: 'Try CULO in Canva',
    ctaUrl: 'https://prettycoolmarketing.com/culo',
    status: 'published',
    featured: false,
    createdAt: '2024-05-01',
    updatedAt: '2024-05-01',
  },
  {
    id: 'story-ai-marketing-truth',
    slug: 'the-truth-about-ai-marketing-for-founders',
    title: 'The Truth About AI Marketing for Founders',
    summary: 'AI can write your captions but it can\'t live your story. Here\'s what AI is actually good for, and what it will never replace.',
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[0], topics[8], topics[1]],
    contentTypes: ['reel', 'blog'],
    reelUrl: 'https://www.instagram.com/reel/example4',
    blog: `Everyone is talking about AI marketing as if it's going to replace the need for human story. It won't.

Here's what AI is genuinely exceptional at: structure, formatting, repurposing, scaling and removing the blank page problem. If you have a story and you need to turn it into a blog post, a caption, a carousel and a reel script — AI can do that remarkably well.

What AI cannot do is live your life. It cannot have the client conversation you had last Tuesday. It cannot feel the uncertainty you felt when you launched your first product. It cannot experience the moment a client's business changed because of your work.

Those moments are yours. And they're worth more than any AI can generate.

## Where founders go wrong with AI

Most founders using AI for marketing are using it wrong. They're asking it to generate ideas from scratch — to come up with what to say without giving it any raw material.

AI given nothing produces generic content. Content that sounds like everyone else. Content that doesn't build authority or trust because it carries no real experience.

The correct workflow is the opposite:

You live the story. You capture the moment. You give AI the raw material — the footage, the notes, the context. Then AI helps you structure and scale it.

AI is an amplifier, not a source.

## The CULO approach

This is exactly why CULO starts with your footage, not a blank prompt. You upload the real thing — the behind-the-scenes moment, the client result, the lesson from your week — and CULO helps structure it into content that carries the authenticity of the original experience.

The AI does the formatting. You supply the story.

That's the right relationship between a founder and an AI content tool.

## What this means for your marketing

Stop asking AI what to say. Start asking AI how to say what you've already lived.

The founders who win with AI are the ones who have the most genuine stories to feed it. The depth of your experience is still your competitive advantage. AI just helps you share it more efficiently.`,
    ideaIds: ['idea-authentic-content', 'idea-ai-limits'],
    relatedStoryIds: ['story-camera-roll', 'story-culo-built'],
    ctaLabel: 'Try CULO in Canva',
    ctaUrl: 'https://prettycoolmarketing.com/culo',
    status: 'published',
    featured: false,
    createdAt: '2024-05-20',
    updatedAt: '2024-05-20',
  },
  // ─── Other founder stories ─────────────────────────────────────────────────
  {
    id: 'story-brand-photos',
    slug: 'why-most-brand-photos-dont-look-like-the-founder',
    title: 'Why Most Brand Photos Don\'t Look Like the Founder',
    summary: 'The biggest mistake founders make with brand photography is trying to look like someone they\'re not. Here\'s how to fix it.',
    coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    founderId: 'lucia-romano',
    businessId: 'romano-visuals',
    location: brisbane,
    industry: photography,
    topics: [topics[14], topics[8], topics[1]],
    contentTypes: ['carousel', 'blog'],
    carouselImages: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=600&q=80',
    ],
    blog: `I've photographed hundreds of founders. And the most common mistake isn't bad lighting or an awkward pose.

It's founders trying to look like someone they're not.

They've looked at competitors. They've studied the polished personal brand shots in their industry. They've decided there's a certain way a founder in their field is supposed to look. And then they try to replicate it.

The result is photos that are technically fine but feel completely wrong. Because they don't look like the actual person.

## Why this happens

Brand photography anxiety is real. Most founders feel uncomfortable in front of a camera. They've rarely been professionally photographed. They don't know what to do with their hands, where to look, or how to just be themselves when someone is pointing a lens at them.

So they perform. They adopt a version of themselves they think looks more professional, more polished, more credible.

The irony is that the performance makes them look less credible. Audiences are incredibly good at detecting inauthenticity, even in still images.

## How to fix it

The best brand photos I've ever taken looked like this: I turned up with my camera, we had a coffee, we talked about the founder's business and what made them start it, and I photographed them during that conversation.

They weren't posing. They were just talking about something they cared about.

Those shots — mid-conversation, genuine expression, completely unguarded — outperform every staged photo I've ever seen.

Before your next shoot, tell your photographer: "I want to look like myself on my best day." Not corporate. Not glamorous. Like yourself, just a little more intentional.

That's what great brand photography is.`,
    ideaIds: ['idea-authentic-content'],
    relatedStoryIds: ['story-camera-roll'],
    ctaLabel: 'Book a Brand Shoot',
    ctaUrl: 'https://romanovisuals.com.au/book',
    status: 'published',
    featured: true,
    createdAt: '2024-04-15',
    updatedAt: '2024-04-15',
  },
  {
    id: 'story-content-burnout',
    slug: 'i-posted-every-day-for-90-days-heres-what-actually-happened',
    title: 'I Posted Every Day for 90 Days — Here\'s What Actually Happened',
    summary: 'The results weren\'t what the internet told me to expect. But the lessons were far more valuable than the numbers.',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    founderId: 'james-okafor',
    businessId: 'okafor-studio',
    location: sydney,
    industry: technology,
    topics: [topics[9], topics[10], topics[13]],
    contentTypes: ['blog', 'reel'],
    reelUrl: 'https://www.instagram.com/reel/example6',
    blog: `I ran the experiment so you don't have to.

90 days. One post every single day. No breaks. The kind of consistency every content creator tells you is the non-negotiable foundation of audience growth.

Here's what actually happened.

**The numbers:** My Instagram following grew from 1,847 to 2,094. That's 247 followers in 90 days, or roughly 2.7 per day. I got 4 DMs that turned into genuine conversations. I signed zero clients directly from Instagram during this period.

The internet had told me consistent daily posting was the path to compound growth. The numbers disagreed.

## What I learned instead

Something more useful happened in those 90 days than follower growth.

I got very good at identifying which stories were worth telling. By day 30, I could feel the difference between a post that would land and a post that was just content for the sake of it. By day 60, I'd started writing differently — more specific, more honest, less trying to sound like a thought leader.

The daily discipline didn't build my audience. It built my editorial instinct.

## The real problem with daily posting

Daily posting optimises for volume. But audience trust is built on depth, not frequency.

I'd rather post 12 times in a year and have each post be a genuine story that builds authority, than post 365 times and have most of them be noise.

The most consistent feedback I've gotten about content that actually drove enquiries wasn't from my high-frequency period. It was from three pieces I took a week each to write.

Post less. Say more. Mean it every time.`,
    ideaIds: ['idea-content-systems', 'idea-founder-burnout'],
    relatedStoryIds: ['story-content-system'],
    ctaLabel: 'Get a Content Audit',
    ctaUrl: 'https://okaforstudio.com/audit',
    status: 'published',
    featured: false,
    createdAt: '2024-05-05',
    updatedAt: '2024-05-05',
  },
  {
    id: 'story-brand-without-budget',
    slug: 'how-to-build-a-recognisable-brand-without-a-big-budget',
    title: 'How to Build a Recognisable Brand Without a Big Budget',
    summary: 'Consistency beats money every single time. Here\'s the minimal visual system I give every founder I work with.',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    founderId: 'maya-chen',
    businessId: 'maya-chen-design',
    location: melbourne,
    industry: design,
    topics: [topics[6], topics[8], topics[9]],
    contentTypes: ['carousel', 'blog'],
    carouselImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&q=80',
    ],
    blog: `The founders I work with consistently underestimate what's possible with a small visual budget and a clear visual system.

They see businesses with beautiful, cohesive branding and assume it required an expensive agency and months of work. Sometimes it did. But often, the brands that look the most considered simply made a small number of decisions and stuck to them.

## The minimal visual system

Here's what I give every founder I work with in their first session:

**One primary colour.** Not a palette of twelve. One colour that shows up everywhere. Your website headline. Your email signature. Your social media cover photo.

**One heading font and one body font.** That's it. Playfair Display for headings and Inter for body text is what I use personally. Whatever you choose, use it consistently and stop changing it.

**Three image treatment rules.** How will your photos look? Warm and natural? Clean and minimal? Moody and editorial? Pick a direction and apply it to every image you share.

**One consistent CTA.** What do you want people to do when they encounter your brand? Book a call? Visit your website? Download a guide? One thing. The same call to action every time.

That's the system. Four decisions, applied consistently over six months, will make your brand more recognisable than most brands with ten times the budget.

## Why it works

Brands feel established when they look the same over time. The visual consistency signals stability and care. It tells your audience that you've thought about this, that you pay attention to detail, that you can be trusted.

You don't need a big budget to be consistent. You need decisions and discipline.

Make the decisions once. Then stop changing them.`,
    ideaIds: ['idea-authentic-content'],
    relatedStoryIds: ['story-brand-photos'],
    ctaLabel: 'View Brand Packages',
    ctaUrl: 'https://mayachendesign.com/brand',
    status: 'published',
    featured: false,
    createdAt: '2024-05-12',
    updatedAt: '2024-05-12',
  },
  {
    id: 'story-client-results-content',
    slug: 'how-i-turn-every-client-result-into-content',
    title: 'How I Turn Every Client Result Into Content',
    summary: 'My clients give me permission to document their transformations. Those clips now run as ads, reels and testimonials without me filming anything new.',
    coverImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    founderId: 'tom-riley',
    businessId: 'riley-performance',
    location: goldCoast,
    industry: fitness,
    topics: [topics[5], topics[3], topics[1]],
    contentTypes: ['reel', 'carousel'],
    reelUrl: 'https://www.instagram.com/reel/example8',
    carouselImages: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    ],
    ideaIds: ['idea-camera-roll', 'idea-authentic-content'],
    relatedStoryIds: ['story-camera-roll'],
    ctaLabel: 'Apply for Coaching',
    ctaUrl: 'https://rileyperf.com/apply',
    status: 'published',
    featured: false,
    createdAt: '2024-06-01',
    updatedAt: '2024-06-01',
  },
]

export const getStory        = (id: string)   => stories.find(s => s.id === id)
export const getStoryBySlug  = (slug: string) => stories.find(s => s.slug === slug)
export const getFeaturedStories    = () => stories.filter(s => s.featured && s.status !== 'archived')
export const getStoriesByFounder   = (founderId: string)   => stories.filter(s => s.founderId === founderId)
export const getStoriesByBusiness  = (businessId: string)  => stories.filter(s => s.businessId === businessId)
export const getStoriesByLocation  = (locationId: string)  => stories.filter(s => s.location.id === locationId)
export const getStoriesByTopic     = (topicId: string)     => stories.filter(s => s.topics.some(t => t.id === topicId))
