import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'

// Privacy Policy — mirrors the live policy at
// prettycoolmarketing.com/privacypolicy (last updated 22 June 2026), ported
// in full so there's a culovillage.com-hosted copy too. Keep the two in
// sync if either changes; this covers Pretty Cool Marketing, CULO Creatives
// and, by extension, The Culo Village.

const LAST_UPDATED = '22 June 2026'

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-heading text-lg font-bold text-charcoal mb-2">{n}. {title}</h3>
      <div className="font-body text-[15px] text-muted leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

function DataTable({ rows, headers }: { rows: string[][]; headers: [string, string] | [string, string, string] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left border-collapse mt-1">
        <thead>
          <tr className="border-b border-border">
            {headers.map(h => (
              <th key={h} className="px-1 py-2 font-heading text-sm font-bold text-charcoal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60">
              {row.map((cell, j) => <td key={j} className="px-1 py-2 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PrivacyPolicyPage() {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'Privacy Policy for Pretty Cool Marketing, Culo Creatives and The Culo Village.',
  })

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-charcoal py-24 md:py-36">
        <InnerContainer>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="font-body text-white/60 text-base">
            Last updated {LAST_UPDATED} · Pretty Cool Marketing &amp; CULO
          </p>
        </InnerContainer>
      </section>

      <section className="py-10 md:py-14">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-[15px] text-charcoal leading-relaxed mb-3">
            Pretty Cool Marketing is an Australian creative and content systems business helping founders,
            creators, and businesses build story-led content and publishing workflows.
          </p>
          <p className="font-body text-[15px] text-charcoal leading-relaxed mb-3">
            CULO is a Canva-integrated publishing, content creation, and storytelling tool built by Pretty
            Cool Marketing — this covers CULO Creatives in Canva and The Culo Village alike. It helps users
            organise, generate, edit, and publish content directly inside Canva.
          </p>
          <p className="font-body text-[15px] text-charcoal leading-relaxed mb-8">
            Pretty Cool Marketing is committed to protecting your privacy and handling your information
            responsibly in accordance with applicable privacy laws, including the Australian Privacy Act
            1988 (Cth) and the Australian Privacy Principles.
          </p>
          <p className="font-body text-sm text-muted mb-10">
            Contact: <a href="mailto:support@prettycoolmarketing.com" className="text-primary underline">support@prettycoolmarketing.com</a>
            {' '}· Website: <a href="https://prettycoolmarketing.com/culo" target="_blank" rel="noopener noreferrer" className="text-primary underline">prettycoolmarketing.com/culo</a>
          </p>

          <Clause n="1" title="Information We Collect">
            <p>Depending on how you use our services, we may collect:</p>
            <Bullets items={[
              'Canva user ID (to identify your account and persist your media library between sessions)',
              'Name and contact information',
              'Email address',
              'Business or brand information (name, industry, offers, voice style)',
              'Uploaded media and creative assets (photos, videos, audio, voice recordings)',
              'Usage and interaction data',
              'Form submissions and onboarding responses',
              'Content prompts and generated outputs',
              'Device, browser, and diagnostic information',
              'Transcripts generated from your video and audio content',
              'Payment or transaction information (processed by third-party providers; we do not store card details directly)',
            ]} />
          </Clause>

          <Clause n="2" title="Media & File Access">
            <p>When you connect third-party services such as Google Drive, Google Photos, or Dropbox, CULO
              only accesses files and media you explicitly select.</p>
            <p>We do not:</p>
            <Bullets items={[
              'Scan your full cloud library',
              'Index unrelated files',
              'Access media you have not selected',
              'Modify or delete files in your connected accounts',
            ]} />
            <p>Imported content may include photos, videos, B-roll footage, talking head clips, voiceovers,
              vlog clips, long-form video files, and other creative media assets.</p>
            <p>Imported media is used solely to support your requested workflows inside CULO and Canva.</p>
          </Clause>

          <Clause n="3" title="How We Use Your Information">
            <p>We use information to:</p>
            <Bullets items={[
              'Provide, operate, and improve our services',
              'Support media import and creative workflows',
              'Generate story-led content outputs including captions, hooks, blogs, and structured posts',
              'Process and render uploaded media',
              'Transcribe audio and video content',
              'Analyse long-form content where requested',
              'Personalise user workflows and generation outputs',
              'Respond to support enquiries',
              'Deliver purchased products or services',
              'Communicate service updates, launches, or offers (you may unsubscribe at any time)',
              'Monitor service performance, security, and reliability',
            ]} />
            <p><strong className="text-charcoal">We do not sell personal information or user data.</strong></p>
          </Clause>

          <Clause n="4" title="AI & Content Generation">
            <p>CULO uses artificial intelligence to generate hooks, captions, transcriptions, and other
              content outputs. This may include content structuring, caption generation, story shaping,
              blog generation, summarisation, transcript analysis, content repurposing, and media
              scripting.</p>
            <p>Specifically, CULO uses:</p>
            <Bullets items={[
              'OpenAI Whisper — transcribes speech from your video clips',
              "OpenAI GPT — generates hooks, captions, and social media content based on your brand profile and transcript",
            ]} />
            <p>Your video audio and brand profile are sent to OpenAI's API for processing. OpenAI's data
              handling is governed by their API Privacy Policy. OpenAI does not use API-submitted data to
              train models by default.</p>
            <p>Information processed by AI services may include prompts, onboarding responses, user-written
              content, transcript text, uploaded content metadata, and generated outputs. This processing
              occurs solely to provide requested functionality.</p>
            <p><strong className="text-charcoal">We do not use your content to train our own AI models.</strong></p>
            <p>You remain responsible for reviewing and approving all AI-generated content before
              publishing.</p>
          </Clause>

          <Clause n="5" title="Video Processing & Transcription">
            <p>Certain features process uploaded media to generate creative outputs. This may include video
              rendering, audio extraction, media merging, format conversion, transcript generation, clip
              analysis, and automated media preparation.</p>
            <p>Temporary processing files may be created during these workflows. These files are retained
              only as long as operationally necessary:</p>
            <Bullets items={[
              'Rendered video outputs: automatically deleted within 1 hour of download',
              'Extracted audio and temporary thumbnails: deleted immediately after processing',
              'Transcript and analysis files: retained with your media library until you request deletion',
            ]} />
          </Clause>

          <Clause n="6" title="Where Your Data Is Stored">
            <Bullets items={[
              'Uploaded videos and photos are stored on secure cloud infrastructure hosted by Cloudflare R2 and Railway',
              'Your brand profile and media library metadata are stored on our Railway server, backed up to Cloudflare R2',
              'All infrastructure is located in the United States',
            ]} />
            <p>Both Cloudflare and Railway maintain GDPR-compliant data processing agreements.</p>
          </Clause>

          <Clause n="7" title="Data Retention">
            <DataTable
              headers={['Data type', 'Retention']}
              rows={[
                ['Uploaded videos and photos', 'Until you delete them from your CULO media library'],
                ['Rendered video outputs', 'Automatically deleted within 1 hour'],
                ['Brand profile and settings', 'Until you request deletion'],
                ['Cloud-imported temporary files', 'Deleted within 24 hours, often within the active session'],
                ['Diagnostic logs', 'Retained for operational monitoring only'],
              ]}
            />
            <p className="mt-3">To request deletion of all your data, email:{' '}
              <a href="mailto:support@prettycoolmarketing.com" className="text-primary underline">support@prettycoolmarketing.com</a>
            </p>
          </Clause>

          <Clause n="8" title="Google API Data & Permissions">
            <p>CULO accesses user-selected files through Google APIs only with your explicit
              authorisation.</p>
            <p><strong className="text-charcoal">What we access.</strong> We request read-only access only,
              to allow you to browse and select your own files for import. This may include Google Drive
              and Google Photos (if enabled).</p>
            <p>We do not read unrelated files, modify your files, delete your files, or manage your account
              content.</p>
            <p><strong className="text-charcoal">Current permissions.</strong> drive.readonly — read-only
              access to files you explicitly select from Google Drive.</p>
            <p><strong className="text-charcoal">Pending permissions.</strong> photoslibrary.readonly —
              read-only access to your Google Photos library, allowing you to browse and import selected
              photos or albums. If activated, Google Photos access is subject to the same privacy
              commitments described in this policy.</p>
            <p><strong className="text-charcoal">How we use Google data.</strong> Google API data is used
              only to complete workflows you initiate — such as importing media into CULO or Canva. It is
              not used for advertising, profiling, unrelated analytics, or resale.</p>
            <p>Files temporarily processed through Google integrations are deleted from our servers within
              24 hours and in most cases retained only for the active session.</p>
            <p><strong className="text-charcoal">Limited Use Disclosure.</strong> CULO's use and transfer of
              information received from Google APIs adheres to the Google API Services User Data Policy,
              including the Limited Use requirements.</p>
            <p>
              Revoke access:{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline">myaccount.google.com/permissions</a>
              {' '}· Google Privacy Policy:{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">policies.google.com/privacy</a>
            </p>
          </Clause>

          <Clause n="9" title="Dropbox">
            <p>If you connect Dropbox, CULO accesses only files you explicitly select. We do not browse
              unrelated Dropbox content.</p>
            <p>Dropbox Privacy Policy:{' '}
              <a href="https://www.dropbox.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">dropbox.com/privacy</a>
            </p>
          </Clause>

          <Clause n="10" title="Canva Integration">
            <p>When using CULO through Canva, CULO interacts with Canva APIs to create assets, upload
              generated content, insert media into designs, and support editing and publishing workflows.
              Content added to your Canva design is also subject to Canva's own privacy policies.</p>
            <p>Canva Privacy Policy:{' '}
              <a href="https://www.canva.com/policies/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">canva.com/policies/privacy-policy</a>
            </p>
          </Clause>

          <Clause n="11" title="Third-Party Services">
            <p>We share data only with the service providers listed below, solely to operate the app:</p>
            <DataTable
              headers={['Provider', 'Purpose', 'Privacy Policy']}
              rows={[
                ['OpenAI', 'Speech-to-text, caption and hook generation', 'openai.com/policies'],
                ['Cloudflare', 'Video and media storage', 'cloudflare.com/privacypolicy'],
                ['Railway', 'Server hosting', 'railway.app/legal/privacy'],
                ['Google', 'Media import (Drive, Photos)', 'policies.google.com/privacy'],
                ['Dropbox', 'Media import', 'dropbox.com/privacy'],
                ['Stripe / Systeme.io', 'Payment processing (if applicable)', 'Per provider'],
              ]}
            />
            <p className="mt-3">We do not share your data with advertisers, data brokers, or any third
              party for marketing purposes.</p>
          </Clause>

          <Clause n="12" title="Payments">
            <p>If paid subscriptions or services are offered, payments are processed by third-party
              providers such as Stripe or Systeme.io. We do not store payment card details directly.</p>
          </Clause>

          <Clause n="13" title="Cookies & Analytics">
            <p>Our website and services may use cookies, analytics tools, and diagnostic systems to improve
              performance and understand usage. This may include browser and device information, usage
              patterns, referral sources, interaction metrics, and crash/error diagnostics. You may manage
              cookie settings via your browser.</p>
          </Clause>

          <Clause n="14" title="Data Storage & Security">
            <p>We take reasonable technical and organisational steps to protect your information, including
              HTTPS encryption, access controls, credential protection, environment-based secrets
              management, secured storage infrastructure, authenticated API access, and controlled
              third-party integrations.</p>
            <p>No system can guarantee absolute security.</p>
          </Clause>

          <Clause n="15" title="International Data Transfers">
            <p>Our servers and third-party infrastructure are located in Australia and the United States.
              By using our services, you consent to your data being processed in these locations where
              permitted by law.</p>
            <p>Where required under applicable law (including GDPR), we process data based on legitimate
              interest in providing our services, your consent where required, and contractual necessity
              where services are purchased.</p>
          </Clause>

          <Clause n="16" title="Your Rights">
            <p>You may:</p>
            <Bullets items={[
              'Access the data we hold about you',
              'Request correction of inaccurate data',
              'Request deletion of all your data',
              'Withdraw consent at any time by uninstalling the CULO app from Canva',
              'Disconnect Google or Dropbox integrations at any time',
              'Unsubscribe from communications',
            ]} />
            <p>To exercise any of these rights:{' '}
              <a href="mailto:support@prettycoolmarketing.com" className="text-primary underline">support@prettycoolmarketing.com</a>
            </p>
          </Clause>

          <Clause n="17" title="Children's Privacy">
            <p>Our services are not intended for children under the age of 13. We do not knowingly collect
              personal information from children.</p>
          </Clause>

          <Clause n="18" title="Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Updated versions will be published here
              and at prettycoolmarketing.com/privacypolicy with a revised effective date. Continued use of
              our services constitutes acceptance of updates. Material changes will be communicated via the
              CULO app where possible.</p>
          </Clause>

          <div className="pt-6 border-t border-border">
            <p className="font-body text-sm text-muted">
              Contact Pretty Cool Marketing — Australia ·{' '}
              <a href="mailto:support@prettycoolmarketing.com" className="text-primary underline">support@prettycoolmarketing.com</a>
              {' '}·{' '}
              <a href="https://prettycoolmarketing.com/culo" target="_blank" rel="noopener noreferrer" className="text-primary underline">prettycoolmarketing.com/culo</a>
            </p>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
