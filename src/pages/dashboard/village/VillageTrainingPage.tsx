import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Link } from 'react-router-dom'

// Read-first staff training. Plain text and real links, not a video —
// video training comes later per Mitchell (see the placeholder section at
// the bottom). This explains what the Village actually is, what each CAPO
// section does and why it exists, and calls out who's actually
// responsible for what today.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#2D2A26] mb-2">{title}</h2>
      <div className="text-sm text-[#6B7280] leading-relaxed space-y-3">{children}</div>
    </section>
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

export function VillageTrainingPage() {
  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Staff Training</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Read this before touching anything else in CAPO. It explains what The Culo Village actually is,
          what each section does and why, and what your own responsibilities are.
        </p>
      </div>

      <Section title="What The Culo Village actually is">
        <p>
          The Culo Village is a publishing platform for founders. A founder connects the places they've
          already posted content (YouTube, podcasts, Instagram, their own blog), and the Village restructures
          that scattered content into proper, structured articles that live permanently on their own profile
          — real pages that search engines and AI systems can actually read and cite, not just another post
          buried in a feed.
        </p>
        <p>
          <strong className="text-[#2D2A26]">Culo Creatives</strong> is a separate but connected product: an app
          inside Canva that turns a founder's raw footage into finished reels, carousels and blogs, in their
          own voice. What it makes gets published into the Village the same way anything else does.
        </p>
        <p>
          Everything in CAPO exists to either bring founders into the Village, help them publish, or manage
          the business side of getting them there.
        </p>
      </Section>

      <Section title="What each section is for">
        <p><strong className="text-[#2D2A26]">Founder Management</strong> — every founder account, both real
          self-signups and profiles we've built for them from the imported JSON list ("curated" profiles).
          Curated profiles have no real login yet; "Copy link to claim" sends them their own profile URL so
          the real person can claim it. Bulk Import (linked from here) is where a whole list of founders gets
          added to the Village at once, from a prepared JSON file.</p>
        <p><strong className="text-[#2D2A26]">Email Management</strong> — everyone who's ever joined or shown
          interest, in one list, tagged by how they joined (Village, Canva). The Newsletter tab sends a
          one-off email to everyone; Sequences are the automated drip emails new members get depending on how
          they joined (Village members get one sequence, Canva subscribers get another, Pretty Cool Marketing
          leads get a third) — this runs on its own, nothing to manage day to day.</p>
        <p><strong className="text-[#2D2A26]">Leads</strong> — people who've enquired about a Pretty Cool
          Marketing service (Blog Management, Social Media Management, etc.) but haven't become a paying
          client yet.</p>
        <p><strong className="text-[#2D2A26]">Client Tracker</strong> — real, paying Pretty Cool Marketing
          clients: what service they're on, what's been delivered, what's still owed. This is the main
          day-to-day tool for managing an actual client relationship once a lead converts.</p>
      </Section>

      <Section title="Your responsibilities">
        <p>
          Day to day, your job has two parts: building out the Village's founder list, and managing client
          work through the tracker.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Create curated founder profiles from source material, either one at a time or as a prepared
            list, and add them to the Village through Bulk Import.</li>
          <li>Keep an eye on Founder Management for anyone who's claimed a curated profile, so you know
            it's now a real person managing their own page.</li>
          <li>Manage the Client Tracker for every active Pretty Cool Marketing client — status, what's
            been delivered, what's outstanding.</li>
          <li>Check Leads regularly for anyone ready to move from enquiry to paying client.</li>
        </ul>
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
