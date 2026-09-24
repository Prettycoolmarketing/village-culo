import { useState } from 'react'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Link } from 'react-router-dom'

// Read-first staff training. Plain text and real links, not a video —
// video training comes later per Mitchell (see the placeholder section at
// the bottom). This explains what the Village actually is, what each CAPO
// section does and why it exists, in real detail — written for someone
// reading it for the first time, not a summary of something they already
// know — and calls out who's actually responsible for what today.

const TARGET_PROFILE_PROMPT = `Who we're looking for:

A real Australian founder, business owner or practitioner who already posts organically on YouTube, Instagram or a podcast about their business, expertise or lived experience.

They should have:
- An actual, ongoing body of content — not a brand-new account with one or two posts.
- A real business, practice or area of genuine expertise behind what they post (not just a personal lifestyle account).
- Content that shows real experience, opinions or lessons — not just polished marketing/ad content with nothing personal in it.
- An Australian base, even if their audience is international.

Good signs:
- They talk about how they built their business, mistakes they made, lessons learned, or their day-to-day reality.
- They answer real questions their audience actually asks them.
- Their content would make sense restructured into a proper written article, not just a caption.

Not a fit:
- Pure entertainment/meme accounts with no real business or expertise behind them.
- Reseller/dropshipping-style accounts with no genuine personal story or expertise.
- Anyone who mainly posts generic, AI-written-sounding content already.`

const ENRICH_PROMPT = `Fill in the missing details for each row in this sheet — LinkedIn profile URL, Instagram URL, YouTube channel URL — using the podcast, YouTube or article link already in the row as your primary source, since that's the most reliable evidence of who this actually is.

Australians only — if you can't confirm this person is Australian-based, leave the row blank and flag it in a comment instead of guessing.

Before filling in a LinkedIn link, confirm it's genuinely the same person as the podcast guest: matching name, matching business, matching location. If you can't confirm the match, write "UNVERIFIED — check manually" in a comment on that cell rather than filling in a link that might be the wrong person.

Prioritise information found through the original podcast/YouTube episode itself (show notes, episode description, host's own links) over a generic web search — that's a stronger, more reliable connection than a name search turning up someone who just happens to share a name.`

const SOURCE_PROMPT = `Search recent episodes of [podcast name] for guests who are real Australian founders or business owners running their own company or practice.

For each one, add a new row to this sheet with: their full name, the specific episode link they appeared on, their LinkedIn profile URL, their Instagram URL, their YouTube channel if they have one, and their business name.

Skip anyone who isn't Australian-based. Skip pure media personalities, presenters or athletes who don't run their own business — we want founders, not people who just talk to founders. If you can't confirm someone is a real founder with genuine expertise, leave them out rather than guessing.`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-[#2D2A26] mb-3">{title}</h2>
      <div className="text-sm text-[#6B7280] leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 mb-4">
      <h3 className="text-sm font-bold text-[#2D2A26] mb-2">{title}</h3>
      <div className="text-sm text-[#6B7280] leading-relaxed space-y-2.5">{children}</div>
    </div>
  )
}

function LinkCard({ to, label, desc }: { to: string; label: string; desc: string }) {
  return (
    <Link to={to} className="block bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 hover:border-[#C86A43]/40 transition-colors">
      <p className="text-sm font-semibold text-[#2D2A26]">{label} <span className="text-[#C86A43] font-normal">→</span></p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>
    </Link>
  )
}

function CopyPromptButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
    >
      {copied ? 'Copied ✓' : label}
    </button>
  )
}

export function VillageTrainingPage() {

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Staff Training</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Read this properly before touching anything else in CAPO — it's written for the first time you're
          seeing any of this, not as a quick summary. It explains what The Culo Village actually is, what
          each section does and exactly how it works, and what your own responsibilities are.
        </p>
      </div>

      <Section title="What The Culo Village actually is">
        <p>
          The Culo Village is a publishing platform for founders. Most founders already have real content
          scattered across YouTube, podcasts, Instagram, and their own blog or website — videos, episodes,
          posts, articles. Individually, none of that is very findable. It's buried in a feed, or on a
          platform search engines barely index, and nobody outside their existing audience ever sees it.
        </p>
        <p>
          A founder connects those accounts to the Village, and the Village pulls that content in and
          restructures it into proper, standalone articles that live permanently on their own profile page.
          Each article is a real, structured web page — not a repost, and not just a link back to the
          original — built so search engines and AI systems (like ChatGPT) can actually read it, understand
          what it's about, and cite the founder as the source. That's the whole point: turning content that
          already exists but is invisible into something genuinely discoverable.
        </p>
        <p>
          <strong className="text-[#2D2A26]">Culo Creatives</strong> is a separate but connected product — an
          app that lives inside Canva. A founder uploads raw, messy footage (talking-head clips, B-roll,
          voice notes) and Culo Creatives turns it into finished reels, carousels and blog posts, written and
          edited in that founder's own voice rather than generic AI output. Whatever Culo Creatives makes
          still has to be published into the Village afterward, the same way anything else does — Creatives
          is the tool that makes the content, the Village is where it actually lives and gets found.
        </p>
        <p>
          Everything you'll do in CAPO exists to serve one of three goals: bring more founders into the
          Village, help the ones already here get their work published, or manage the business side (leads
          and paying clients) of getting them there.
        </p>
      </Section>

      <Section title="What each section is for">
        <SubSection title="Founder Management">
          <p>
            This is the full list of every founder account that exists in the Village, and it holds two
            genuinely different kinds of founder, which is important to understand before you touch anything
            here.
          </p>
          <p>
            <strong className="text-[#2D2A26]">Real self-signups</strong> are people who found the Village
            themselves (through the website, through Canva, through a referral) and created their own
            account with their own email and password. They already fully own and control their profile —
            there's nothing for you to do for these founders except keep an eye on their status if needed.
          </p>
          <p>
            <strong className="text-[#2D2A26]">Curated profiles</strong> are the opposite: a founder profile
            that <em>we</em> build on someone's behalf, using their existing public content, before they've
            ever signed up or even necessarily know the Village exists yet. This is where a "curated JSON
            list" comes in — a prepared file listing a batch of real founders (their name, bio, social
            links, business details, and so on), which gets brought into the Village all at once through
            Bulk Import. Every founder in that list gets a real, live profile page immediately, but with{' '}
            <strong className="text-[#2D2A26]">no login attached to it yet</strong> — nobody can sign into it
            or edit it, because the real person hasn't claimed it.
          </p>
          <p>
            "Claiming" is how a curated profile turns into a real account: the actual founder proves it's
            them (usually by signing up with a matching email, or by clicking a claim link you send them),
            and from that point on they can log in and manage their own profile like anyone else. That's what
            the <strong className="text-[#2D2A26]">"Copy link to claim"</strong> button next to a curated,
            unclaimed profile is for — it copies that founder's own public profile URL so you can send it to
            them directly (by email, DM, whatever's appropriate) and say "this is your page, here's how to
            claim it."
          </p>
          <p>
            The <strong className="text-[#2D2A26]">"Set Curated"</strong> button only ever applies to a
            profile that has no real account behind it yet — you won't see it on a real self-signup, because
            there's nothing to curate about someone who already owns their own profile.
          </p>
          <p>
            <strong className="text-[#2D2A26]">Bulk Import</strong> (linked from this page) is the actual tool
            for adding a whole prepared list of founders to the Village in one go, from a JSON file built in
            the Village's own import format. This is covered in detail further down this page, since it's
            one of your main day-to-day responsibilities.
          </p>
        </SubSection>

        <SubSection title="Email Management">
          <p>
            This is every email address the Village has ever collected, in one place — every founder who's
            joined (whether through the main website or through Canva), plus anyone who's shown interest but
            not joined yet. Nothing here is a separate, disconnected list; it's one Members list, with a
            small tag on each row showing how that person actually joined (Village or Canva), so you can tell
            at a glance without it being treated as a different category of person.
          </p>
          <p>
            There are two ways emails actually go out from here, and they work completely differently:
          </p>
          <p>
            <strong className="text-[#2D2A26]">Newsletter</strong> is a manual, one-off email — you write it,
            and when you send it, it goes out to everyone currently on the list at that moment. This is what
            you'd use for something like "here's what's new in the Village this month," sent whenever you
            decide to send it, to whoever's on the list right then.
          </p>
          <p>
            <strong className="text-[#2D2A26]">Sequences</strong> are the opposite — fully automatic, drip-fed
            emails that a new member gets over their first days/weeks, and you don't need to do anything to
            trigger them. The moment someone joins, they're automatically enrolled into the sequence that
            matches how they joined: a Village signup goes into Sequence A, a Canva Creatives signup goes
            into Sequence B, and someone who becomes a Pretty Cool Marketing lead goes into Sequence C. Each
            sequence has its own pre-written steps that send out on a schedule, on their own, every day,
            without anyone having to click send. Your only real involvement with Sequences is knowing they
            exist and that they're already running correctly — you don't need to manually enrol anyone or
            watch over them day to day.
          </p>
          <p>
            One more detail worth knowing: a Canva-sourced signup only gets counted in a Newsletter send once
            they've actually started paying for Creatives via Stripe. Someone who signed up through Canva but
            hasn't subscribed yet won't receive a Newsletter blast — they will still get their own automatic
            Sequence B nurture emails in the meantime, since that's a different system with a different
            purpose (encouraging them toward paying, not a general broadcast).
          </p>
        </SubSection>

        <SubSection title="Leads">
          <p>
            This is people who've enquired about a Pretty Cool Marketing service — Blog Management, Social
            Media Management, Village Creatives, Content Creator, or Full Service — but haven't actually
            become a paying client yet. Think of this as the waiting room before Client Tracker: someone
            fills in an enquiry, lands here, and your job is to follow up, answer questions, and move them
            toward actually signing on. Once they do, they move into Client Tracker and stop being a "lead."
          </p>
        </SubSection>

        <SubSection title="Client Tracker">
          <p>
            This is every real, currently paying Pretty Cool Marketing client — the actual day-to-day tool for
            managing an active client relationship once someone converts from a lead. For each client you can
            see which service tier they're on (and therefore what's actually owed to them each month — e.g.
            Blog Management means 30 published articles a month, Social Media Management means content
            production and scheduling across their platforms, and so on), what's already been delivered, and
            what's still outstanding. This is the tool you'll use constantly once a lead becomes a client —
            it's where you track whether the work the client is paying for is actually getting done on
            schedule.
          </p>
        </SubSection>
      </Section>

      <Section title="Your responsibilities">
        <p>
          Day to day, your job has two main parts: building out the Village's founder list, and managing
          client work through the tracker.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Find and curate real Australian founders who fit the target profile (see the section below),
            and build them into a prepared list.</li>
          <li>Create curated founder profiles from that source material, either one at a time through the
            founder builder, or as a whole prepared batch through Bulk Import.</li>
          <li>Keep an eye on Founder Management for anyone who's claimed a curated profile, so you know
            when it's become a real person's own account rather than one we built for them.</li>
          <li>Manage the Client Tracker for every active Pretty Cool Marketing client — status, what's been
            delivered, what's still outstanding.</li>
          <li>Check Leads regularly for anyone ready to move from enquiry to paying client.</li>
        </ul>
      </Section>

      <Section title="Building your own founder list: the full workflow">
        <p>
          Getting a real person from "someone we've never heard of" to "a claimed, live Village profile"
          is six steps, in order. Each one matters — skipping the verification steps is how a wrong LinkedIn
          link or a US-based founder ends up in the Village by mistake.
        </p>

        <SubSection title="Step 1 — Find candidates, mostly from podcasts">
          <p>
            Start from a real source, not a cold guess. The best source by far is a podcast's guest list —
            podcast guests are already pre-vetted for having a real story to tell, the host has already done
            the work of finding someone worth talking to, and the episode itself usually links straight to
            the guest's business, Instagram and sometimes their LinkedIn in the show notes. YouTube channels
            and Instagram accounts work too, but podcast scraping consistently turns up the strongest matches
            to what we're actually looking for.
          </p>
          <p>Below is the exact brief for who counts as a good fit — copy it to keep next to you while you're looking through episodes, or paste it into Claude to help you judge a specific candidate.</p>
          <CopyPromptButton text={TARGET_PROFILE_PROMPT} label="Copy the target profile" />
        </SubSection>

        <SubSection title="Step 2 — Enrich and verify with Claude in Excel">
          <p>
            Once you've got names in the sheet, you don't have to manually hunt down every LinkedIn and
            Instagram link yourself — Claude is built directly into Excel (you'll see it as a panel on the
            right of the spreadsheet, the same as the screenshot you'd have seen when this was set up for
            you). You can talk to it in plain English, right there in the sheet, and it will search the web,
            read what it finds, and fill in the cells for you.
          </p>
          <p>
            <strong className="text-[#2D2A26]">Why this matters:</strong> a name search on its own can easily
            surface the wrong person, especially for a common name. The instruction below tells Claude to
            treat the podcast/YouTube episode itself as the source of truth, and to flag anything it can't
            actually confirm rather than guessing — a link that's confidently wrong is worse than a blank
            cell, because a blank cell gets noticed and checked, a wrong one doesn't.
          </p>
          <p>Paste this into the Claude panel to enrich and verify rows you've already added:</p>
          <CopyPromptButton text={ENRICH_PROMPT} label="Copy the enrichment prompt" />
          <p className="pt-2">
            And use this one when you want Claude to go find new candidates itself, straight from a specific
            podcast's episode list, rather than you scrolling through it manually:
          </p>
          <CopyPromptButton text={SOURCE_PROMPT} label="Copy the sourcing prompt" />
          <p className="pt-2">
            Either way, read back over what Claude fills in before moving on — it's a genuine time-saver, not
            a replacement for actually checking the row makes sense.
          </p>
        </SubSection>

        <SubSection title="Step 3 — Follow them on LinkedIn">
          <p>
            Once a row has a verified LinkedIn link, follow (or connect with) that person using the Sales
            Navigator access you'll be given. This isn't optional busywork — showing up in their network
            before they ever hear from the Village makes the eventual claim message land as a real, warm
            outreach instead of a cold one out of nowhere.
          </p>
        </SubSection>

        <SubSection title="Step 4 — Import into the Village">
          <p>
            Once a batch of rows is fully verified — real Australian founder, correct LinkedIn confirmed,
            enough detail to build a real profile from — that's what actually goes into the Village, through
            Bulk Import (linked below). This is the point where a name on a spreadsheet becomes a real,
            live, curated profile page.
          </p>
        </SubSection>

        <SubSection title="Step 5 — Check over each imported profile">
          <p>
            After importing, open each new profile and check it actually reads correctly — right business,
            right bio, links that actually work. Bulk Import moves fast; this step catches anything that
            came through wrong before a real person ever sees their own page.
          </p>
        </SubSection>

        <SubSection title="Step 6 — Warm LinkedIn message to invite them to claim">
          <p>
            Last step: message them on LinkedIn (you're already connected from Step 3) letting them know
            their Village profile exists and how to claim it — use "Copy link to claim" on their profile in
            Founder Management to get their exact profile URL to send.
          </p>
        </SubSection>

        <SubSection title="Tracking what's been imported">
          <p>
            Duplicate the shared spreadsheet for each new batch and label it clearly (e.g. by date or by
            source podcast), rather than editing one master sheet forever — that way it's always obvious
            which list has already been through Bulk Import and which is still being built. Keep the Status
            column up to date on the original as you go: To Review while you're still researching, Approved
            once verified and ready, Imported once it's actually live in the Village.
          </p>
        </SubSection>

        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 mt-2">
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">Research template</p>
          <p className="text-xs text-[#9CA3AF] mb-3">
            A spreadsheet for tracking candidates as you find them — one row per person, with a Status
            column so it's clear what's still to review versus already approved. This is a working list for
            you, not the final import file; once a batch is approved, Mitchell turns it into the actual
            Village import.
          </p>
          <a
            href="/templates/founder-candidates-template.xlsx"
            download
            className="inline-flex text-xs font-semibold px-4 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors"
          >
            Download the template →
          </a>
        </div>
      </Section>

      <Section title="Where to actually do this">
        <div className="space-y-3">
          <LinkCard to="/dashboard/village/founders" label="Founder Management" desc="Every founder account — real and curated." />
          <LinkCard to="/dashboard/bulk-import" label="Bulk Import" desc="Add a whole prepared list of founders to the Village at once." />
          <LinkCard to="/dashboard/curated-profiles/new" label="Add one curated founder" desc="Build a single founder profile by hand." />
          <LinkCard to="/dashboard/pcm/leads" label="Leads" desc="People who've enquired but haven't signed on yet." />
          <LinkCard to="/dashboard/pcm" label="Client Tracker" desc="Every active Pretty Cool Marketing client." />
        </div>
      </Section>

      <Section title="Video training">
        <p>Coming soon — this page will be updated with a walkthrough video once it's ready.</p>
      </Section>
    </div>
  )
}
