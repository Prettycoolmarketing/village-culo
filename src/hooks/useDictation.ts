import { useRef, useState } from 'react'

// Shared, free, local dictation (Web Speech API) — used everywhere a box
// takes typed text: story/blog editors, imported-content description, the
// Brand Brief questions, and Q&A answer boxes. `interimResults: true` is
// the important bit — without it the browser only reports a chunk once
// you've paused, which reads as "nothing happening" while you're mid-
// sentence. This reports the live, still-changing guess on every event and
// only locks it in once the browser marks that segment final, so text
// grows on screen while you're actually talking, the way dictation should.

interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike
  length: number
  isFinal: boolean
}
interface SpeechRecognitionResultListLike {
  [index: number]: SpeechRecognitionResultLike
  length: number
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}
interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export function useDictation() {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // getBase() is read once, right when listening starts, so dictating into
  // a box that already has text appends to it rather than overwriting it.
  // onUpdate then fires live as you speak — base + everything said so far
  // (finalised chunks locked in, the current in-progress chunk still live).
  function toggle(getBase: () => string, onUpdate: (text: string) => void, onUnsupported?: () => void) {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      onUnsupported?.()
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const base = getBase()
    let finalTranscript = ''
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (e: SpeechRecognitionEventLike) => {
      let interimTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]!
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalTranscript += text
        else interimTranscript += text
      }
      onUpdate(`${base} ${finalTranscript} ${interimTranscript}`.replace(/\s+/g, ' ').trim())
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return { listening, toggle }
}
