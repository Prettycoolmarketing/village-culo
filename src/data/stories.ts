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
    summary: 'Every founder has months of untouched footage sitting on their phone. Here\'s the system I use to turn a camera roll into a content engine — and how CULO makes it repeatable inside Canva.',
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[3], topics[1], topics[2]],
    contentTypes: ['reel', 'blog', 'carousel'],
    reelUrl: 'https://www.instagram.com/prettycoolmarketing_/',
    carouselImages: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
    ],
    blog: `I've spent 15 years behind a camera. And the single most consistent thing I've seen across every kind of client — from outback tour groups to Brisbane founders — is this: people are already capturing the content. They're just not doing anything with it.

Your camera roll is not a graveyard. It's an untapped content engine.

## The scroll test

Here's what I ask every new client to do on our first call: open your camera roll, scroll back 90 days, and count the videos.

They always find more than they expected. Behind-the-scenes moments. Walk-and-talks. Clips where they explained something clearly. Footage from events. Screenshots of client wins.

I've seen founders find six weeks of content in under ten minutes. The footage exists. The story exists. The system to use it is what's missing.

## How camera roll marketing works

The idea behind camera roll marketing is simple: your everyday footage is more valuable than any polished studio shoot, because it's real. Audiences — and algorithms — reward specificity and authenticity over production value.

Here's the workflow:

**Step 1: Scroll and flag.** Once a fortnight, spend 15 minutes going through your camera roll. Mark anything that shows your work, your thinking, your process, or a genuine moment worth sharing.

**Step 2: Find the story.** A video of you explaining a concept isn't just a video. It's a reel. It's a blog. It's a carousel. It's a quote card. One piece of footage becomes multiple pieces of content when you ask: what's the story here?

**Step 3: Batch create.** Don't create one piece at a time. Use the footage to create everything at once — in a single two-hour session every fortnight. This is where CULO inside Canva changes everything.

## What CULO does with your camera roll

CULO is built around this exact workflow. You upload your footage to the media library inside Canva, answer a few questions about the story you're telling, and CULO produces talking head reels, voice-over reels, carousels, vlogs and blog posts — complete with subtitles, hooks and captions.

You don't need to be a video editor. You don't need to hire a content team. You need your phone, Canva, and a system.

Your camera roll is full of genuine moments. Stop ignoring them.`,
    ideaIds: ['idea-camera-roll', 'idea-authentic-content'],
    relatedStoryIds: ['story-content-system', 'story-culo-built'],
    ctaLabel: 'Try CULO in Canva',
    ctaUrl: 'https://prettycoolmarketing.com/culo',
    status: 'featured',
    featured: true,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
    seoTitle: 'Your Camera Roll Is Your Biggest Marketing Asset — Shakas',
    seoDescription: 'How to turn your phone footage into a content engine. The camera roll marketing method behind CULO.',
  },
  {
    id: 'story-content-system',
    slug: 'being-bad-at-posting-isnt-your-problem',
    title: "Being Bad at Posting Isn't Your Problem",
    summary: 'Not having a system is. I spent years posting inconsistently and burning out — until I stopped trying to create through willpower and built something that runs without it.',
    coverImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[2], topics[1], topics[9]],
    contentTypes: ['blog', 'reel'],
    reelUrl: 'https://www.instagram.com/prettycoolmarketing_/',
    blog: `"Being bad at posting isn't your problem. Not having a system is."

That's the line I put at the top of the Pretty Cool Marketing website. And I put it there because it's the thing I wish someone had told me when I first started trying to build a content presence.

I had great ideas. I had the skills to execute. I had the footage from 15 years of videography. What I didn't have was a process that ran independent of how motivated I felt on any given Tuesday morning.

## Why willpower fails content

The content creation problem most founders have isn't creativity. It's decision fatigue. Every time you sit down to create something, you have to decide what to create, for which platform, in what format, with what angle, with what call to action.

Those decisions compound. They exhaust you before you've made a single piece of content. And when you're exhausted, you stop.

A system removes those decisions in advance. When you have a system, you don't ask "what should I create?" You follow the process. The answer appears.

## The Pretty Cool Marketing approach

At PCM, we build systems around one core principle: story first, format second.

Everything starts as a story. Not a caption, not a post idea — a real experience, a lesson, a client outcome, a moment from the last few weeks that's worth sharing. Once the story is clear, the formats follow: reel, blog, carousel, caption. The story decides the format, not the platform.

From there, we batch. We don't create daily. We create fortnightly — in two-hour sessions using CULO inside Canva — and we publish from there.

Then we distribute. One story. Multiple formats. Multiple platforms. Automatic distribution across the Village. That's the system.

## What changes when you have one

You stop dreading content. You stop apologising for inconsistency. You start building something that compounds.

Pretty Cool Marketing exists to build this for founders who are done trying to wing it. If that's you, we should talk.`,
    ideaIds: ['idea-content-systems', 'idea-founder-burnout'],
    relatedStoryIds: ['story-camera-roll', 'story-culo-built'],
    ctaLabel: 'Work With Pretty Cool Marketing',
    ctaUrl: 'https://prettycoolmarketing.com',
    status: 'published',
    featured: true,
    createdAt: '2024-04-02',
    updatedAt: '2024-04-02',
  },
  {
    id: 'story-culo-built',
    slug: 'why-i-built-culo-inside-canva',
    title: 'Why I Built CULO Inside Canva',
    summary: 'After 15 years in videography and watching founders sit on footage they never used, I built a content app. Here\'s why it lives inside Canva — and why that was the only decision that made sense.',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    founderId: 'shakas',
    businessId: 'culo',
    location: brisbane,
    industry: marketing,
    topics: [topics[4], topics[2], topics[0]],
    contentTypes: ['blog', 'carousel'],
    carouselImages: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
      'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&q=80',
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
    ],
    blog: `The idea for CULO started not at a desk, but on an outback tour.

When Mitch and I were running Stagger Inn Adventures — taking people through some of the most remote parts of Australia — I had a camera in my hand almost every day. I was capturing landscapes, people, stories from the road. The footage was extraordinary. But even I struggled to turn it into consistent content.

And I was a videographer with 15 years of experience.

If I couldn't make it consistent, how was a founder supposed to?

## The pattern I kept seeing

After Stagger Inn, when I founded Pretty Cool Marketing, I started seeing the same thing in every client. Footage sitting untouched on phones. Stories going untold. Not because founders didn't have anything worth sharing — they always did. But because the gap between raw footage and published content was too big, too technical, too time-consuming.

The tools that existed either required video editing skills, design skills, or a team. None of them fit into the one hour a week a busy founder could realistically give to content.

## Why Canva

When I started building CULO, the first question was: where does it live?

Not a standalone app. Founders won't download another app they open twice and forget about. Not a browser tool. Too much friction. Not a subscription on top of their existing stack. Cost fatigue kills adoption.

Canva was the answer. Most founders are already in Canva. It's where they design their posts, build their presentations, create their materials. Canva already has their brand colours, their fonts, their templates.

Building CULO inside Canva meant zero behaviour change. You're already there. CULO just gives you something useful to do while you're in it.

## What CULO actually does

You answer initial questions about your business, your audience and your brand. CULO generates 3 additional personalised questions. You upload your raw footage to the media library. From there, CULO produces:

- Talking head reels with on-screen hooks and subtitles
- Voice-over reels with scripted narration
- Behind-the-scenes vlogs
- Quick-rhythm edit reels
- Carousels with copy and layout
- Long-form blog posts

Five or more pieces of content. From one story. In the tool you already use.

Stop working your CULO off just to be on social media.`,
    ideaIds: ['idea-tools-that-fit', 'idea-content-systems'],
    relatedStoryIds: ['story-content-system', 'story-camera-roll', 'story-stagger-inn'],
    ctaLabel: 'Try CULO in Canva',
    ctaUrl: 'https://prettycoolmarketing.com/culo',
    status: 'published',
    featured: true,
    createdAt: '2024-05-01',
    updatedAt: '2024-05-01',
  },
  {
    id: 'story-ai-marketing-truth',
    slug: 'ai-can-write-your-captions-but-not-your-story',
    title: "AI Can Write Your Captions — But It Can't Write Your Story",
    summary: 'AI is a remarkable amplifier. It is a terrible source. Here\'s the distinction that changes how CULO uses AI — and how you should too.',
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[0], topics[1], topics[8]],
    contentTypes: ['reel', 'blog'],
    reelUrl: 'https://www.instagram.com/shakasdesigner/',
    blog: `The first thing most people do when they discover AI content tools is ask: "Write me a week of Instagram captions."

AI will do it. In about four seconds, you'll have a week of content.

It will also sound like every other founder who typed the same thing into the same tool. Generic hooks. Vague lessons. Advice that could apply to anyone and therefore applies to no one.

## The problem isn't AI. It's the prompt.

AI is exceptional at structure. At formatting. At taking raw material and shaping it into something publishable. At scaling one story into ten pieces of content. These are genuinely useful capabilities for founders.

What AI cannot do is live your experience. It cannot have sat in the outback watching a sunrise after leading a tour group through a night drive. It cannot have made the call to pivot your business in year two. It cannot have had the client conversation that changed your thinking.

Those are yours. And they're the only things worth saying.

## The CULO approach to AI

CULO starts with your footage, not a blank prompt. That's intentional.

When you come to CULO with real material — a video of a lesson you learned, a clip from a client session, footage from your week — the AI has something to work with. It takes your specificity and helps you structure and scale it.

You answer questions about your business, your audience, your brand. CULO asks three more personalised questions to dig deeper into the story. From that, it generates talking head reels, voice-overs, carousels and blogs.

The AI does the formatting. You supply the story. That's the correct relationship.

## What to do instead

Stop asking AI what to say. Start asking it how to say what you've already lived.

Your lived experience is your competitive advantage. AI just helps you share it more efficiently. The founders who win with this aren't using AI to replace their story — they're using it to tell it better.

Give CULO the real thing. The rest follows.`,
    ideaIds: ['idea-authentic-content', 'idea-ai-limits'],
    relatedStoryIds: ['story-camera-roll', 'story-culo-built'],
    ctaLabel: 'Try CULO in Canva',
    ctaUrl: 'https://prettycoolmarketing.com/culo',
    status: 'published',
    featured: false,
    createdAt: '2024-05-20',
    updatedAt: '2024-05-20',
  },
  {
    id: 'story-stagger-inn',
    slug: 'stagger-inn-adventures-what-outback-tours-taught-me-about-story',
    title: 'What Running Outback Tours Taught Me About Storytelling',
    summary: 'Before Pretty Cool Marketing and CULO, Mitch and I ran a tour company through regional Australia. What we learned out there shaped everything I now believe about founder content.',
    coverImage: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=800&q=80',
    founderId: 'shakas',
    businessId: 'stagger-inn-adventures',
    location: brisbane,
    industry: marketing,
    topics: [topics[1], topics[8], topics[13]],
    contentTypes: ['blog'],
    blog: `Stagger Inn Adventures started the way most good things start — with a conversation, a van, and no real plan.

Mitch and I built a tour company that took people through regional Australia. Outback landscapes. Remote communities. Places most people only see on a screen. We had cameras, we had stories, and we had the privilege of watching people experience something genuinely extraordinary.

It didn't last forever. Most first businesses don't. But what it gave me was a framework for thinking about story that I've never been able to shake.

## What you learn when the story is happening

When you're leading a tour through somewhere remote and remarkable, you can't manufacture the moment. It either happens or it doesn't. Your job is to be present enough to recognise it when it does, and capable enough to capture it when it arrives.

I was behind a camera almost every day out there. And the footage that hit hardest — the clips that made people feel something — wasn't the sweeping drone shots or the golden hour landscapes. It was the moments in between. A traveller's reaction to something they'd never seen. A quiet conversation over a campfire. Someone holding something ancient and realising how small their worries were.

Small. Human. Real.

## The lesson I carry into marketing

When I founded Pretty Cool Marketing, the thing I kept coming back to was this: founders already have extraordinary stories. Their daily business life — the clients they serve, the problems they solve, the decisions they make — is more interesting than any studio shoot.

The gap isn't content. It's capture.

Stagger Inn taught me that the best story is the one already happening. Your job isn't to invent content. Your job is to notice it, document it, and give it somewhere to live.

That's camera roll marketing. That's what CULO is built on. And that's what we started learning in a van in the outback years before any of it had a name.`,
    ideaIds: ['idea-authentic-content', 'idea-camera-roll'],
    relatedStoryIds: ['story-culo-built', 'story-camera-roll'],
    ctaLabel: 'See Stagger Inn on Instagram',
    ctaUrl: 'https://instagram.com/staggerinnadventures',
    status: 'published',
    featured: false,
    createdAt: '2024-06-15',
    updatedAt: '2024-06-15',
  },
  {
    id: 'story-wheres-robyn',
    slug: 'why-a-marketing-founder-is-writing-a-novel',
    title: "Why a Marketing Founder Is Writing a Psychological Drama Novel",
    summary: "I'm writing Where's Robyn — a psychological drama. Here's what it has to do with everything I've built, and why the storytelling instinct that drives CULO turned out to have a lot more to say.",
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
    founderId: 'shakas',
    businessId: 'wheres-robyn',
    location: brisbane,
    industry: marketing,
    topics: [topics[1], topics[13], topics[8]],
    contentTypes: ['blog'],
    blog: `People ask me why a marketing founder is writing a novel.

The honest answer is that I've always been a storyteller first. The videography came from it. The tour company came from it. The belief that founder content should be rooted in real experience — that comes from it too.

Pretty Cool Marketing and CULO exist because I believe story is the most durable form of communication. That it builds trust faster than advertising, credibility faster than credentials, and connection faster than anything a brand campaign can manufacture.

Writing a novel is just the same belief taken somewhere deeper.

## What Where's Robyn is about

Where's Robyn is a psychological drama. I'm not going to say more than that yet — the manuscript is still finding its shape and I want to respect the process enough not to narrate it while it's happening.

What I can say is that the same instincts I use to find the story in a piece of founder footage are the instincts I'm using to find the story in this novel. The craft is different. The core is the same.

## What writing fiction is teaching me about marketing

The discipline of long-form fiction is breaking habits I didn't know I had. In marketing, you write for clarity. In fiction, you write for feeling. Those are different muscles and using both at once is making both stronger.

I'm finding that the founders whose content resonates most are the ones who write like storytellers, not marketers. Specific. Patient. Willing to sit in a moment before rushing to the lesson.

Where's Robyn is teaching me how to do that better.

## Follow the progress

I'll share updates as they come. If you want to follow along, the best place is Instagram — @shakasdesigner.`,
    ideaIds: ['idea-authentic-content'],
    relatedStoryIds: ['story-stagger-inn', 'story-camera-roll'],
    ctaLabel: 'Follow @shakasdesigner',
    ctaUrl: 'https://instagram.com/shakasdesigner',
    status: 'published',
    featured: false,
    createdAt: '2024-07-01',
    updatedAt: '2024-07-01',
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
