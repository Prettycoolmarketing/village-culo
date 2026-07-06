import type { FAQ } from '../../types'

// Shared founder-facing FAQ editor — used on Founder profiles and, per the
// Business workspace consolidation, under each Service. FAQs read as help
// content for whoever's editing them, and feed both public rendering and
// FAQPage structured data, so they're never a disconnected "SEO task."

const inputClass = 'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function FAQEditor({ faqs, onChange }: { faqs: FAQ[]; onChange: (faqs: FAQ[]) => void }) {
  function add() {
    onChange([...faqs, { id: `faq-${Date.now()}`, question: '', answer: '', topicIds: [], expertiseIds: [], relatedStoryIds: [], relatedIdeaIds: [] }])
  }
  function update(i: number, patch: Partial<FAQ>) {
    onChange(faqs.map((f, idx) => idx === i ? { ...f, ...patch } : f))
  }
  function remove(i: number) {
    onChange(faqs.filter((_, idx) => idx !== i))
  }
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => (
        <div key={faq.id} className="border border-[#E8E4DD] rounded-xl p-3 flex flex-col gap-2 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Question {i + 1}</span>
            <button onClick={() => remove(i)} className="text-xs text-[#9CA3AF] hover:text-red-500">Remove</button>
          </div>
          <input type="text" value={faq.question} onChange={e => update(i, { question: e.target.value })}
            placeholder="A question people ask" className={inputClass} />
          <textarea value={faq.answer} onChange={e => update(i, { answer: e.target.value })} rows={2}
            placeholder="Your answer" className={inputClass + ' resize-none'} />
        </div>
      ))}
      <button onClick={add} className="text-xs font-semibold text-[#C86A43] hover:underline text-left">
        + Add a question
      </button>
    </div>
  )
}
