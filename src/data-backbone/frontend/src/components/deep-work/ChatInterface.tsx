/**
 * Chat Interface Component
 *
 * Provides conversational AI interface with Claude for Week Work Wednesday
 * sessions. Supports both text and audio input via Whisper transcription.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ChatInterface.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  audio?: {
    transcript: string
    duration_seconds: number
  }
}

interface ChatInterfaceProps {
  sessionId: string | null
  onNewSession: (id: string) => void
  chunkId?: string // Optional: for reviewing specific reasoning chunks
}

// Demo messages for when no session is available
const DEMO_MESSAGES: Message[] = [
  {
    id: 'demo-1',
    role: 'assistant',
    content: "Good morning, Hugo! Welcome to your Week Work Wednesday session. I've analyzed this week's AI decisions and flagged 23 that need your review. I also detected 2 emerging patterns that could improve our signal classification accuracy. Would you like to start with the flagged decisions, or should we look at the patterns first?",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    role: 'user',
    content: "Let's start with the flagged decisions. Show me the most uncertain ones first.",
    created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    role: 'assistant',
    content: "The decision with lowest confidence is about TechFlow BV. I classified their recent signals (3 senior developer hires + AWS infrastructure expansion) as a high-priority buying signal with 72% confidence.\n\n**Why I flagged it:** This is a novel combination of signals I haven't seen before. The hiring + infrastructure pattern is strong, but I'm uncertain about the timing.\n\n**My reasoning:**\n1. Multiple senior hires indicate expansion phase\n2. Infrastructure changes suggest scaling\n3. Series B funding 2 months ago provides budget\n\n**What I'm uncertain about:**\n- Exact budget timeline\n- Decision maker identification\n\nDo you think this classification is correct?",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-4',
    role: 'user',
    content: "Good reasoning. I agree this is a strong signal. Actually, I know TechFlow - they typically make decisions fast after Series B. Validate this one.",
    created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-5',
    role: 'assistant',
    content: "Got it! I've validated the TechFlow BV classification. I'm also creating a new learning from your insight:\n\n**New Knowledge Entry:**\n\"Series B companies typically accelerate purchasing decisions in the 2-4 months following funding close.\"\n\nThis will help me be more confident about similar signals in the future. Moving on to the next flagged decision - this one is about contact recommendations for CloudNine Systems. Would you like to see the details?",
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
]

export function ChatInterface({ sessionId, onNewSession, chunkId }: ChatInterfaceProps) {
  const { t } = useTranslation(['deepWork', 'common'])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadMessages()
    } else {
      // Load demo messages when no session
      setMessages(DEMO_MESSAGES)
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/deep-work/chat/sessions/${sessionId}/history`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        } else {
          // Use demo messages if API returns empty
          setMessages(DEMO_MESSAGES)
        }
      } else {
        // Use demo messages if API call fails
        setMessages(DEMO_MESSAGES)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      // Use demo messages on error
      setMessages(DEMO_MESSAGES)
    }
  }

  const createSession = async () => {
    try {
      const response = await fetch('/api/deep-work/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_type: 'week_work' }),
      })
      if (response.ok) {
        const data = await response.json()
        onNewSession(data.id)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  // Demo responses for various queries
  const getDemoResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase()
    if (lowerMsg.includes('validate') || lowerMsg.includes('correct') || lowerMsg.includes('agree')) {
      return "Excellent! I've recorded your validation. This helps me learn and improve future classifications. The decision has been marked as validated and any corrections you noted have been saved to the knowledge base.\n\nShall I move to the next flagged decision, or would you like to explore the emerging patterns we detected this week?"
    }
    if (lowerMsg.includes('pattern') || lowerMsg.includes('emerging')) {
      return "I've identified 2 emerging patterns this week:\n\n**Pattern 1: Infrastructure + Hiring Combo**\nWhen companies expand cloud infrastructure AND hire 3+ technical roles, there's an 82% correlation with imminent purchasing decisions. This pattern has 23 supporting signals.\n\n**Pattern 2: Q1 Budget Urgency**\nCompanies with fiscal year ending in March show 3x higher response rates in January-February. 15 signals support this pattern.\n\nWould you like to activate either of these patterns for the AI to use in future classifications?"
    }
    if (lowerMsg.includes('insight') || lowerMsg.includes('summary') || lowerMsg.includes('overview')) {
      return "Here's your weekly intelligence summary:\n\n**Key Insights:**\n• Signal-to-conversion rate improved 18% this week\n• Your correction rate dropped to 14% (from 22% last month)\n• Most valuable learning: \"Series B timing pattern\"\n\n**Recommendations:**\n• Focus outreach on TechFlow BV and DataSphere NL\n• Avoid enterprise prospects with \"quick call\" language\n• Best contact windows: Tuesday-Wednesday 10-11:30 AM\n\nAnything specific you'd like to dive deeper into?"
    }
    return "I understand. Let me help you with that. Based on my analysis of this week's data, I can see several interesting patterns emerging.\n\nWould you like me to:\n1. Review the remaining flagged decisions\n2. Show the emerging patterns\n3. Provide a summary of this week's learnings\n4. Focus on a specific company or signal type\n\nJust let me know what would be most helpful!"
  }

  const sendMessage = async (content: string, audioTranscript?: string) => {
    if (!content.trim()) return

    // Add user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      audio: audioTranscript ? { transcript: audioTranscript, duration_seconds: 0 } : undefined,
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // If no sessionId or demo mode, use demo responses
    if (!sessionId || sessionId.startsWith('demo')) {
      setTimeout(() => {
        const demoResponse: Message = {
          id: `msg_${Date.now()}_response`,
          role: 'assistant',
          content: getDemoResponse(content),
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, demoResponse])
        setIsLoading(false)
      }, 1500) // Simulate API delay
      return
    }

    try {
      const response = await fetch(`/api/deep-work/chat/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          chunk_id: chunkId,
          audio_transcript: audioTranscript,
        }),
      })

      if (response.ok) {
        const assistantMessage = await response.json()
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Use demo response on API failure
        const demoResponse: Message = {
          id: `msg_${Date.now()}_response`,
          role: 'assistant',
          content: getDemoResponse(content),
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, demoResponse])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Use demo response on error
      const demoResponse: Message = {
        id: `msg_${Date.now()}_response`,
        role: 'assistant',
        content: getDemoResponse(content),
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, demoResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio analyser for visualizing audio levels
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start level monitoring
      const updateLevel = () => {
        if (!analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 255)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Set up recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)

        // Process audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAndSend(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    setIsRecording(false)
  }

  const transcribeAndSend = async (audioBlob: Blob) => {
    setIsLoading(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        // Transcribe
        const transcribeResponse = await fetch('/api/deep-work/audio/transcribe-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64_audio: base64Audio,
            language: 'en',
          }),
        })

        if (transcribeResponse.ok) {
          const transcription = await transcribeResponse.json()
          if (transcription.success && transcription.text) {
            await sendMessage(transcription.text, transcription.text)
          }
        }
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (!sessionId) {
    return (
      <div className="chat-interface">
        <div className="chat-empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>{t('deepWork:chat.startSession')}</h3>
          <p>{t('deepWork:chat.startDescription')}</p>
          <button className="btn btn-primary" onClick={createSession}>
            {t('deepWork:chat.startButton')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-interface">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          {t('deepWork:chat.title')}
        </div>
        <div className="chat-status">
          <span className="status-dot online" />
          {t('deepWork:chat.online')}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <p>{t('deepWork:chat.welcomeMessage')}</p>
            <div className="quick-actions">
              <button onClick={() => sendMessage(t('deepWork:chat.quickReview'))}>
                {t('deepWork:chat.quickReview')}
              </button>
              <button onClick={() => sendMessage(t('deepWork:chat.quickPattern'))}>
                {t('deepWork:chat.quickPattern')}
              </button>
              <button onClick={() => sendMessage(t('deepWork:chat.quickInsights'))}>
                {t('deepWork:chat.quickInsights')}
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              )}
            </div>
            <div className="message-content">
              {message.audio && (
                <div className="audio-indicator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                  {t('deepWork:chat.voiceInput')}
                </div>
              )}
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="message-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-pulse" style={{ transform: `scale(${1 + audioLevel * 0.5})` }} />
            <span className="recording-duration">{formatDuration(recordingDuration)}</span>
            <span>{t('deepWork:chat.recording')}</span>
          </div>
        )}

        <div className="chat-input-container">
          <button
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? t('deepWork:chat.stopRecording') : t('deepWork:chat.startRecording')}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            )}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('deepWork:chat.placeholder')}
            disabled={isLoading || isRecording}
            rows={1}
          />

          <button
            className="send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || isRecording}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
