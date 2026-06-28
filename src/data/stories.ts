import type { Story } from '../types'
import { locations } from './locations'
import { industries } from './industries'
import { topics } from './topics'

const brisbane  = locations[0]
const melbourne = locations[3]

const marketing   = industries[0]
const photography = industries[1]
const retail      = industries[8]

export const stories: Story[] = [
  // ─── Shakas / Pretty Cool Marketing Stories ────────────────────────────────
  {
    id: 'story-camera-roll',
    slug: 'your-camera-roll-is-your-biggest-marketing-asset',
    title: 'Your Camera Roll Is Your Biggest Marketing Asset',
    summary: 'Every founder has months of untouched footage sitting on their phone. Here\'s the system I use to turn a camera roll into a content engine — and how CULO makes it repeatable inside Canva.',
    coverImage: '/placeholders/village-story.svg',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[3], topics[1], topics[2]],
    contentTypes: ['reel', 'blog', 'carousel'],
    reelUrl: 'https://www.instagram.com/prettycoolmarketing_/',
    carouselImages: [
      '/assets/shakas-on-the-road.jpg',
      '/placeholders/village-story.svg',
      '/placeholders/village-story.svg',
      '/placeholders/village-story.svg',
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
    status: 'archived',
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
    coverImage: '/assets/culo-brand-cover.png',
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

Then we distribute. One story. Multiple formats. Multiple platforms. That's the system.

## What changes when you have one

You stop dreading content. You stop apologising for inconsistency. You start building something that compounds.

Pretty Cool Marketing exists to build this for founders who are done trying to wing it. If that's you, we should talk.`,
    ideaIds: ['idea-content-systems'],
    relatedStoryIds: ['story-camera-roll', 'story-culo-built'],
    ctaLabel: 'Work With Pretty Cool Marketing',
    ctaUrl: 'https://prettycoolmarketing.com',
    status: 'archived',
    featured: true,
    createdAt: '2024-04-02',
    updatedAt: '2024-04-02',
  },
  {
    id: 'story-culo-built',
    slug: 'why-i-built-culo-inside-canva',
    title: 'Why I Built CULO Inside Canva',
    summary: 'After 15 years in videography and watching founders sit on footage they never used, I built a content app. Here\'s why it lives inside Canva — and why that was the only decision that made sense.',
    coverImage: '/assets/culo-app-in-canva.jpg',
    founderId: 'shakas',
    businessId: 'culo',
    location: brisbane,
    industry: marketing,
    topics: [topics[4], topics[2], topics[0]],
    contentTypes: ['blog', 'carousel'],
    carouselImages: [
      '/assets/culo-app-in-canva.jpg',
      '/assets/culo-brand-cover.png',
      '/assets/shakas-on-the-road.jpg',
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
    status: 'archived',
    featured: true,
    createdAt: '2024-05-01',
    updatedAt: '2024-05-01',
  },
  {
    id: 'story-ai-marketing-truth',
    slug: 'ai-can-write-your-captions-but-not-your-story',
    title: "AI Can Write Your Captions — But It Can't Write Your Story",
    summary: 'AI is a remarkable amplifier. It is a terrible source. Here\'s the distinction that changes how CULO uses AI — and how you should too.',
    coverImage: '/placeholders/village-story.svg',
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
    status: 'archived',
    featured: false,
    createdAt: '2024-05-20',
    updatedAt: '2024-05-20',
  },
  {
    id: 'story-stagger-inn',
    slug: 'stagger-inn-adventures-what-outback-tours-taught-me-about-story',
    title: 'What Running Outback Tours Taught Me About Storytelling',
    summary: 'Before Pretty Cool Marketing and CULO, Mitch and I ran a tour company through regional Australia. What we learned out there shaped everything I now believe about founder content.',
    coverImage: '/assets/shakas-on-the-road.jpg',
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
    status: 'archived',
    featured: false,
    createdAt: '2024-06-15',
    updatedAt: '2024-06-15',
  },
  {
    id: 'story-wheres-robyn',
    slug: 'why-a-marketing-founder-is-writing-a-novel',
    title: "Why a Marketing Founder Is Writing a Psychological Drama Novel",
    summary: "I'm writing Where's Robyn — a psychological drama. Here's what it has to do with everything I've built, and why the storytelling instinct that drives CULO turned out to have a lot more to say.",
    coverImage: '/placeholders/village-story.svg',
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

Where's Robyn is a psychological drama. It's a multimedia project — novel, TV pilot script, and a Screen Australia submission in progress. A woman named Robyn vanishes — not taken, not missing. Gone by choice. The story follows the people left behind and what her absence reveals about each of them.

I'm not going to say more than that yet — the manuscript is still finding its shape and I want to respect the process enough not to narrate it while it's happening.

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
    status: 'archived',
    featured: false,
    createdAt: '2024-07-01',
    updatedAt: '2024-07-01',
  },
  // ─── Content Creating Days ────────────────────────────────────────────────
  {
    id: 'story-content-creating-days',
    slug: 'why-we-created-content-creating-days',
    title: "Why We Created Content Creating Days",
    summary: "A full day, in person, where you leave with content made — not another strategy document. Here's why PCM moved beyond workshops into hands-on content days across Brisbane and the Gold Coast.",
    coverImage: '/placeholders/village-story.svg',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    location: brisbane,
    industry: marketing,
    topics: [topics[2], topics[1], topics[3]],
    contentTypes: ['blog', 'reel'],
    blog: `Every content workshop I'd ever been to ended the same way.

You'd leave energised. You'd have a notebook full of ideas. You'd have a strategy, a framework, a 30-day plan.

And then real life happened. The strategy stayed in the notebook. The content didn't get made.

## The problem with teaching people to create content

Teaching content strategy is not the same as helping people create content. The gap between knowledge and action is exactly where most founders get stuck.

That's why we created Content Creating Days.

## What a Content Creating Day is

A full day. In person. Brisbane or Gold Coast. You bring your phone, your stories, and your footage. You leave with real content made — not ideas. Not a content calendar. Actual posts, reels and captions that are ready to publish.

We work through the camera roll audit together. We find the stories. We batch create using CULO inside Canva. We caption, schedule and review. By the end of the day you have a fortnight of content and the system to repeat it.

$197. Brisbane and Gold Coast. Limited spots per day so everyone gets hands-on time.

## Why in person matters

There's something that happens when you're in a room with other founders creating content together. The hesitation drops. The perfectionism loosens. You see someone else post something real and imperfect, and it gives you permission to do the same.

Content Creating Days are not just about the content you leave with. They're about breaking the psychological pattern that's been keeping you from creating consistently.

Show up. Make the content. Go home and publish it.`,
    ideaIds: ['idea-content-systems', 'idea-camera-roll'],
    relatedStoryIds: ['story-content-system', 'story-camera-roll'],
    ctaLabel: 'Book a Content Creating Day',
    ctaUrl: 'https://prettycoolmarketing.com',
    status: 'archived',
    featured: true,
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
  },
  // ─── Billow Beach origin story ─────────────────────────────────────────────
  {
    id: 'story-billow-beach-origin',
    slug: 'the-10-year-dream-that-became-billow-beach',
    title: 'The 10-Year Dream That Became Billow Beach',
    summary: 'A 3-in-1 beach bag with a built-in XL towel and pillow. A literal decade-long idea that finally became real. This is the Billow Beach origin story.',
    coverImage: '/assets/billow-beach-lifestyle.jpg',
    founderId: 'shakas',
    businessId: 'billow-beach',
    location: brisbane,
    industry: retail,
    topics: [topics[13], topics[8], topics[1]],
    contentTypes: ['blog', 'reel'],
    blog: `Some ideas follow you.

The Billow Beach idea was one of those. I'd had it in my head for about 10 years — one of those concepts that feels so obvious you can't believe it doesn't exist yet. A beach bag that has everything built in. Bag. Towel. Pillow. One carry. Nothing to unpack.

Every beach trip was the same annoyance: three things to grab, two things to forget, nothing that worked together. And I kept thinking: why isn't there a bag that just solves this?

## From idea to object

Taking an idea you've had for a decade and turning it into a physical product is humbling.

Sourcing. Sampling. Materials. Sizing. Logistics. Each step revealed something I didn't know. I'd built digital products, run tours, run campaigns — but a physical product is a different kind of problem. It's slower. More unforgiving. You can't iterate in real time.

Claudia Martinez photographed the first real version of the bag. Working with her changed how I understood the product. She didn't photograph a bag — she photographed a lifestyle. A moment of arriving at the beach and having everything sorted. That shift in framing is what Billow Beach needed visually to become something people want, not just something useful.

Murrakee — the model in the campaign — brought presence and authenticity that I couldn't have planned. Representation in beachwear and lifestyle matters. Seeing someone like Murrakee hold the Billow Beach bag makes the brand something more than a product story.

## What it taught me about building

The best businesses solve problems you've personally lived.

Billow Beach exists because I've stood on a beach trying to find somewhere to put everything for a decade and been annoyed every single time. That's the real brief. Not a market research document or a competitor analysis — a genuine, repeated frustration that finally got solved.

If you've had an idea following you around for years, that's not a coincidence.`,
    ideaIds: ['idea-authentic-content', 'idea-story-is-everywhere'],
    relatedStoryIds: ['story-stagger-inn'],
    ctaLabel: 'See Billow Beach',
    ctaUrl: 'https://prettycoolmarketing.com',
    status: 'archived',
    featured: false,
    createdAt: '2025-02-01',
    updatedAt: '2025-02-01',
  },
  // ─── Simone Pansino — We The Stars ────────────────────────────────────────
  {
    id: 'story-simone-pansino',
    slug: 'from-law-to-lifestyle-simone-pansino-we-the-stars',
    title: 'From Law to Lifestyle: Simone Pansino Built the Brand She Was Afraid to Start',
    summary: 'She left a legal career to build a fashion brand from her own creative vision. Here\'s how Simone Pansino turned colour, styling and imagination into We The Stars.',
    coverImage: '/placeholders/village-story.svg',
    founderId: 'simone-pansino',
    businessId: 'we-the-stars',
    location: brisbane,
    industry: retail,
    topics: [topics[13], topics[8], topics[6]],
    contentTypes: ['blog'],
    blog: `Simone Pansino had a legal career. It was stable, respectable, and completely wrong for her.

"My dream was created from my vision of expressing my creativity, colours, a love of styling and playing dress ups. Creating something based on my creative visions has been scary and has been a major learning curve."

That quote is from Simone herself — and it captures something most career-change founders won't say publicly: that doing the thing you actually want to do is scary. That the learning curve is real. That the stability you gave up doesn't disappear just because the dream is exciting.

## What We The Stars is

We The Stars is a Brisbane lifestyle and fashion brand built from creative vision rather than market research. Simone didn't start with a gap analysis. She started with what she loved — colour, styling, the joy of getting dressed — and built a brand around that.

That approach is rarer than it sounds. Most founders build from external demand. Simone built from internal truth. The result is a brand that feels like a person, not a product category.

## On collaboration and community

Simone's collaboration with Billow Beach came from exactly that quality — two founders building from genuine creative vision, finding alignment in how they saw the world rather than in a formal partnership brief.

When creators build from authentic vision, they tend to find each other. That's how the CULO ecosystem works: not curated connections but natural ones.

## The lesson

The legal career was never going to hold. When you have a creative vision that won't go away, it doesn't go away — it just waits.

Simone built We The Stars while it waited. Now it doesn't have to wait anymore.`,
    ideaIds: ['idea-authentic-content'],
    relatedStoryIds: ['story-billow-beach-origin'],
    ctaLabel: 'See We The Stars',
    ctaUrl: 'https://wethestars.com.au',
    status: 'archived',
    featured: false,
    createdAt: '2025-03-01',
    updatedAt: '2025-03-01',
  },
  // ─── Claudia Martinez — Cross-collaboration ───────────────────────────────
  {
    id: 'story-claudia-martinez',
    slug: 'the-power-of-cross-collaboration-claudia-martinez-billow-beach',
    title: 'The Power of Cross-Collaboration — Claudia Martinez x Billow Beach',
    summary: 'A luxury lifestyle photographer in Brunswick. A beach bag founder in Brisbane. Here\'s how Claudia Martinez and Billow Beach found each other — and what the collaboration produced.',
    coverImage: '/assets/billow-beach-lifestyle.jpg',
    founderId: 'claudia-martinez',
    businessId: 'claudia-martinez-photography',
    location: melbourne,
    industry: photography,
    topics: [topics[14], topics[8], topics[1]],
    contentTypes: ['blog'],
    blog: `Claudia Martinez has been photographing lifestyle and interiors for over 13 years.

RMIT trained. Brunswick-based. Specialising in editorial lifestyle photography that transforms products into aspirational experiences. When Billow Beach came to Claudia with a beach bag and a brief, what she produced wasn't product photography — it was a world.

"Building a business doesn't happen in isolation. It's about finding the right people — those who elevate, interpret, and amplify your vision."

## What luxury lifestyle photography actually does

There's a difference between a photo that shows a product and a photo that makes you want to live inside the moment it captures.

Claudia's work with Billow Beach did the second thing. The bag wasn't the subject — the experience of arriving at the beach with everything sorted, feeling like a little luxury — that was the subject. The bag just happened to be in the frame.

That's the shift that turns a useful product into a brand people are proud to carry.

## On finding the right collaborators

The Billow Beach x Claudia Martinez collaboration happened because both founders were building from creative vision rather than category playbooks. That alignment made the creative brief almost unnecessary — they already saw the same thing.

The best collaborations in the CULO ecosystem work like this. Not formal partnerships but natural resonances between people building from the same underlying values.

Claudia's presence in this ecosystem reflects that principle: the right photographer doesn't just capture your product. They expand what your brand can mean.`,
    ideaIds: ['idea-authentic-content'],
    relatedStoryIds: ['story-billow-beach-origin'],
    ctaLabel: 'See Claudia\'s Work',
    ctaUrl: 'https://claudiamartinez.com.au',
    status: 'archived',
    featured: false,
    createdAt: '2025-03-15',
    updatedAt: '2025-03-15',
  },
  // ─── Murrakee — Rising Talent ─────────────────────────────────────────────
  {
    id: 'story-murrakee',
    slug: 'murrakee-rising-talent-billow-beach',
    title: 'Murrakee: The Rising Talent Behind the Billow Beach Campaign',
    summary: 'An Indigenous model and creator from Queensland. Strength, softness and presence that redefines what lifestyle and beachwear look like in Australia.',
    coverImage: '/assets/billow-beach-lifestyle.jpg',
    founderId: 'murrakee',
    businessId: 'billow-beach',
    location: brisbane,
    industry: marketing,
    topics: [topics[8], topics[6], topics[1]],
    contentTypes: ['blog'],
    blog: `Representation in lifestyle and beachwear in Australia has historically been narrow.

Murrakee changes that.

An Indigenous model and creator based in Brisbane, working across Queensland — from the Gold Coast to the regions — Murrakee brings a quality to fashion and lifestyle campaigns that can't be manufactured: genuine presence.

## Why representation in beachwear matters

"Representation matters. When young Indigenous women are seen in beachwear, lifestyle, and fashion campaigns — it challenges the status quo."

That's the quiet power of what Murrakee brings to the Billow Beach campaign. Not diversity for a press release. Authentic representation that expands who gets to be part of Australian lifestyle imagery.

For Billow Beach — a brand built on simplicity, quality and the genuine experience of going to the beach — working with Murrakee was the right creative decision. The bag is for everyone who goes to the beach. The campaign should reflect that.

## The CULO Rising Talent recognition

CULO Village's Rising Talent feature exists to amplify creators and founders who are doing something genuinely worth watching — before the mainstream catches up.

Murrakee is that.

The work is happening across Brisbane, Gold Coast and the broader Queensland coastal region. For brands, agencies and media looking for authentic, powerful creative presence — pay attention.`,
    ideaIds: ['idea-authentic-content'],
    relatedStoryIds: ['story-billow-beach-origin', 'story-claudia-martinez'],
    ctaLabel: 'See Billow Beach',
    ctaUrl: 'https://prettycoolmarketing.com',
    status: 'archived',
    featured: false,
    createdAt: '2025-04-01',
    updatedAt: '2025-04-01',
  },
]

export const getStory        = (id: string)   => stories.find(s => s.id === id)
export const getStoryBySlug  = (slug: string) => stories.find(s => s.slug === slug)
export const getFeaturedStories    = () => stories.filter(s => s.featured && s.status !== 'archived')
export const getStoriesByFounder   = (founderId: string)   => stories.filter(s => s.founderId === founderId)
export const getStoriesByBusiness  = (businessId: string)  => stories.filter(s => s.businessId === businessId)
export const getStoriesByLocation  = (locationId: string)  => stories.filter(s => s.location.id === locationId && s.status !== 'archived')
export const getStoriesByTopic     = (topicId: string)     => stories.filter(s => s.topics.some(t => t.id === topicId))
