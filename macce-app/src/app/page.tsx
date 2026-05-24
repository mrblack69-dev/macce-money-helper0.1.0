"use client"

import AskMacceContent from "@/components/AskMacceContent"
import MobileNav from "@/components/MobileNav"
import { usePlaidLink } from "react-plaid-link"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type SubscriptionItem = {
  id?: string
  merchant_name: string
  average_amount: number
  transaction_count: number
  category: string | null
  last_seen: string
  predicted_next_date: string
  confidence: number
}

type TransactionItem = {
  id: string
  name: string
  merchant_name: string | null
  amount: number
  date: string
  category: string | null
}

type BillItem = {
  id?: string
  merchant_name: string
  category: string | null
  average_amount: number
  last_seen: string
  predicted_next_date: string
  confidence: number
}

type TabKey =
  | "Dashboard"
  | "Transactions"
  | "Budget"
  | "Goals"
  | "AI Insights"
  | "Reports"
  | "Alerts"
  | "Ask MACCE"
  | "Settings"

const tabs: {
  key: TabKey
  label: string
}[] = [
  {
    key: "Dashboard",
    label: "Dashboard",
  },
  {
    key: "Transactions",
    label: "Transactions",
  },
  {
    key: "Budget",
    label: "Budget",
  },
  {
    key: "Goals",
    label: "Goals",
  },
  {
    key: "AI Insights",
    label: "AI Insights",
  },
  {
    key: "Reports",
    label: "Reports",
  },
  {
    key: "Alerts",
    label: "Alerts",
  },
  {
    key: "Ask MACCE",
    label: "Ask MACCE",
  },
  {
    key: "Settings",
    label: "Settings",
  },
]

function getTabDescription(
  activeTab: TabKey,
  firstName: string
) {
  if (activeTab === "Dashboard") {
    return firstName
      ? `Here’s your money, goals, and life overview, ${firstName}.`
      : "Here’s your money, goals, and life overview."
  }

  if (activeTab === "Ask MACCE") {
    return "Ask MACCE about your money, goals, productivity, or life."
  }

  if (activeTab === "AI Insights") {
    return "Review personalized insights generated from your financial activity."
  }

  return `Manage your ${activeTab.toLowerCase()} with MACCE.`
}

export default function Home() {
  const [subscriptions, setSubscriptions] =
  useState<SubscriptionItem[]>([])
  const [analytics, setAnalytics] =
  useState<any>(null)
  const [insights, setInsights] =
  useState<string[]>([])
  const [bills, setBills] =
  useState<BillItem[]>([])
  const [safeToSpend, setSafeToSpend] =
  useState<any>(null)
  const [alerts, setAlerts] =
  useState<any[]>([])
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [linkToken, setLinkToken] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)
  const [signupMode, setSignupMode] = useState(false)
  const [activeTab, setActiveTab] = useState("Dashboard")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [message, setMessage] = useState("")
const [loading, setLoading] = useState(false)
const [isListening, setIsListening] = useState(false)
const [isTranscribing, setIsTranscribing] =
  useState(false)

const [voiceEnabled, setVoiceEnabled] = useState(true)
const [theme, setTheme] = useState("Neon Dark")
const [personality, setPersonality] = useState("Companion")

const [firstName, setFirstName] = useState("")
const [lastName, setLastName] = useState("")
const [phone, setPhone] = useState("")
const [mainGoal, setMainGoal] = useState("")
const [incomeRange, setIncomeRange] = useState("")
const [profileSaved, setProfileSaved] = useState(false)

  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey — I’m MACCE. Ask me anything about money, goals, productivity, or life.",
    },
  ])

  const chatEndRef = 
    useRef<HTMLDivElement | null>(null)
    const chatBoxRef =
  useRef<HTMLDivElement | null>(null)

const voiceRunRef = useRef(0)

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null)

  const audioChunksRef =
    useRef<Blob[]>([])

  const audioQueue =
  useRef<string[]>([])

const audioPlayerRef =
  useRef<HTMLAudioElement | null>(null)

const isPlaying = useRef(false)

const audioContextRef =
  useRef<any>(null)
  

  useEffect(() => {
  const box = chatBoxRef.current

  if (!box) return

  box.scrollTo({
    top: box.scrollHeight,
    behavior: "smooth",
  })
}, [chat, loading])
  useEffect(() => {
  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    console.log("loaded profile:", data)
    console.log("profile load error:", error)

    if (error || !data) return

    setFirstName(data.first_name || "")
    setLastName(data.last_name || "")
    setPhone(data.phone || "")
    setMainGoal(data.main_goal || "")
    setIncomeRange(data.income_range || "")
  }

  if (loggedIn) {
    loadProfile()
    loadTransactions()
    loadAnalytics()
    loadInsights()
    loadBills()
    loadSafeToSpend()
    loadSubscriptions()
    loadAlerts()
  }
}, [loggedIn])
useEffect(() => {
  async function createLinkToken() {
    try {
      const res = await fetch(
        "/api/plaid/create-link-token",
        {
          method: "POST",
        }
      )

      const data = await res.json()

      setLinkToken(data.link_token)
    } catch (error) {
      console.error(error)
    }
  }

  if (loggedIn) {
    createLinkToken()
  }
}, [loggedIn])
const { open, ready } = usePlaidLink({
  token: linkToken || null,

  onSuccess: async (
  public_token: string,
  metadata: any
) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await fetch(
      "/api/plaid/exchange-public-token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          public_token,
          user_id: user.id,
          institution_name:
            metadata.institution
              ?.name,
        }),
      }
    )

await fetch("/api/plaid/sync-transactions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: user.id,
  }),
})

await fetch("/api/bills", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: user.id,
  }),
})
await fetch("/api/subscriptions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: user.id,
  }),
})
await loadTransactions()
await loadAnalytics()
await loadInsights()
await loadBills()
await loadSafeToSpend()
await loadSubscriptions()
await loadAlerts()

await fetch("/api/profile", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: user.id,
  }),
})

await fetch("/api/alerts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: user.id,
  }),
})

alert("Bank connected!")
  },
})

async function loadTransactions() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    console.log("transactions loaded:", data)

    setTransactions(data.transactions || [])
  } catch (error) {
    console.error(error)
  }
}

async function loadAnalytics() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    console.log("analytics loaded:", data)

    setAnalytics(data)
  } catch (error) {
    console.error(error)
  }
}

async function loadInsights() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    console.log("insights loaded:", data)

    setInsights(data.insights || [])
  } catch (error) {
    console.error(error)
  }
}

async function loadBills() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    setBills(data.bills || [])
  } catch (error) {
    console.error(error)
  }
}

async function loadSubscriptions() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    setSubscriptions(data.subscriptions || [])
  } catch (error) {
    console.error(error)
  }
}

async function loadSafeToSpend() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/safe-to-spend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    setSafeToSpend(data)
  } catch (error) {
    console.error(error)
  }
}

async function loadAlerts() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
      }),
    })

    const data = await res.json()

    setAlerts(data.alerts || [])
  } catch (error) {
    console.error(error)
  }
}

async function saveProfile() {
  console.log("saveProfile running")

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("user:", user)
    console.log("userError:", userError)

    if (!user) {
      alert("No logged in user found")
      return
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        main_goal: mainGoal,
        income_range: incomeRange,
      })
      .select()

    console.log("profile save data:", data)
    console.log("profile save error:", error)

    if (error) {
      alert(error.message)
      return
    }

    setProfileSaved(true)

    setTimeout(() => {
      setProfileSaved(false)
    }, 2500)
  } catch (error) {
    console.error("Profile save failed:", error)
    alert("Profile save failed. Try again.")
  }
}

async function unlockMobileAudio() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as any).webkitAudioContext

    if (!AudioContextClass) return

    if (!audioContextRef.current) {
      audioContextRef.current =
        new AudioContextClass()
    }

    if (
      audioContextRef.current.state ===
      "suspended"
    ) {
      await audioContextRef.current.resume()
    }

    const buffer =
      audioContextRef.current.createBuffer(
        1,
        1,
        22050
      )

    const source =
      audioContextRef.current.createBufferSource()

    source.buffer = buffer

    source.connect(
      audioContextRef.current.destination
    )

    source.start(0)
  } catch (error) {
    console.error(
      "Audio unlock failed:",
      error
    )
  }
}

function stopVoice() {
  voiceRunRef.current += 1

  audioQueue.current.forEach((url) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url)
    }
  })

  audioQueue.current = []

  const player = audioPlayerRef.current

  if (player) {
    player.pause()

    if (player.src?.startsWith("blob:")) {
      URL.revokeObjectURL(player.src)
    }

    player.removeAttribute("src")
    player.load()
  }

  isPlaying.current = false
}

async function playAudioQueue() {
  if (!voiceEnabled) return

  if (
    isPlaying.current ||
    audioQueue.current.length === 0
  ) {
    return
  }

  const player = audioPlayerRef.current

  if (!player) {
    console.error("Audio player ref not ready")
    return
  }

  const audioUrl = audioQueue.current.shift()

  if (!audioUrl) return

  isPlaying.current = true

  player.pause()
  player.src = audioUrl
  player.load()

  player.onended = () => {
    if (audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl)
    }

    player.removeAttribute("src")
    player.load()

    isPlaying.current = false

    playAudioQueue()
  }

  player.onerror = (error) => {
    console.error("Audio playback error:", error)

    if (audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl)
    }

    player.removeAttribute("src")
    player.load()

    isPlaying.current = false

    playAudioQueue()
  }

  try {
    await player.play()
  } catch (error) {
    console.error("Audio play failed:", error)

    if (audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl)
    }

    player.removeAttribute("src")
    player.load()

    isPlaying.current = false

    playAudioQueue()
  }
}

async function generateVoice(
  text: string,
  runId?: number
) {
  if (!voiceEnabled) return
  if (!text.trim()) return

  if (
    runId !== undefined &&
    runId !== voiceRunRef.current
  ) {
    return
  }

  try {
    const voiceRes = await fetch("/api/voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (
      runId !== undefined &&
      runId !== voiceRunRef.current
    ) {
      return
    }

    if (!voiceRes.ok) {
      const errorText = await voiceRes.text()
      console.error("Voice API failed:", errorText)
      return
    }

    const audioBlob = await voiceRes.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    if (
      runId !== undefined &&
      runId !== voiceRunRef.current
    ) {
      URL.revokeObjectURL(audioUrl)
      return
    }

    audioQueue.current.push(audioUrl)
    playAudioQueue()
  } catch (error) {
    console.error("Voice generation failed:", error)
  }
}

function splitLongSpeechChunk(
  text: string,
  maxLength = 140
) {
  const words = text.split(" ")
  const chunks: string[] = []
  let current = ""

  for (const word of words) {
    if ((current + " " + word).length > maxLength) {
      if (current.trim()) {
        chunks.push(current.trim())
      }

      current = word
    } else {
      current += " " + word
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9$])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function getVoiceText(text: string) {
  const sentences = splitSentences(text)

  if (sentences.length <= 4) {
    return text
  }

  return [
    sentences[0],
    sentences[1],
    sentences[sentences.length - 1],
  ].join(" ")
}

async function speakReplyInChunks(text: string) {
  if (!voiceEnabled) return
  if (!text.trim()) return

  const runId = ++voiceRunRef.current

  const sentenceChunks = splitSentences(text)

  const chunks = sentenceChunks.flatMap((chunk) =>
    splitLongSpeechChunk(chunk)
  )

  for (const chunk of chunks) {
    if (runId !== voiceRunRef.current) return

    await generateVoice(chunk, runId)

    await new Promise((resolve) =>
      setTimeout(resolve, 80)
    )
  }
}

function cleanMacceResponse(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s([,.!?])/g, "$1")
    .trim()
}

async function sendMessage(voiceText?: string) {
  const currentMessage =
    (voiceText || message).trim()

  if (!currentMessage || loading) return

  stopVoice()
  await unlockMobileAudio()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    alert("Please log in first.")
    return
  }

  setMessage("")
  setLoading(true)

  setChat((prev) => [
    ...prev,
    {
      role: "user",
      content: currentMessage,
    },
    {
      role: "assistant",
      content: "",
    },
  ])

  await supabase.from("chats").insert({
    user_id: user.id,
    role: "user",
    content: currentMessage,
  })

  try {
    const financialResponse = await fetch(
      "/api/financial-chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          message: currentMessage,
          personality,
          profile: {
            firstName,
            lastName,
            mainGoal,
            incomeRange,
          },
        }),
      }
    )

    if (!financialResponse.ok) {
      throw new Error("Chat request failed")
    }

    const data = await financialResponse.json()

    const rawReply =
      data.reply ||
      "I’m here, but I didn’t get a clean response that time."

    const aiReply = cleanMacceResponse(rawReply)

    const voiceTextFinal = getVoiceText(aiReply)

    // ✅ Show full text immediately
    setChat((prev) => {
      const updated = [...prev]

      updated[updated.length - 1] = {
        role: "assistant",
        content: aiReply,
      }

      return updated
    })

    // ✅ Speak once, in proper order
    speakReplyInChunks(voiceTextFinal)

    const { error: insertError } =
      await supabase.from("chats").insert({
        user_id: user.id,
        role: "assistant",
        content: aiReply,
      })

    if (insertError) {
      console.error(
        "DB insert failed:",
        insertError
      )
    }
  } catch (error) {
    console.error(error)

    setChat((prev) => {
      const updated = [...prev]

      updated[updated.length - 1] = {
        role: "assistant",
        content:
          "Something glitched. Try me again in a second.",
      }

      return updated
    })
  }

  setLoading(false)
}

async function transcribeAndSendAudio(audioBlob: Blob) {
  const formData = new FormData()

  const fileType =
    audioBlob.type || "audio/webm"

  let extension = "webm"

  if (fileType.includes("mp4")) {
    extension = "mp4"
  }

  if (fileType.includes("ogg")) {
    extension = "ogg"
  }

  if (fileType.includes("wav")) {
    extension = "wav"
  }

  const audioFile = new File(
    [audioBlob],
    `macce-voice.${extension}`,
    {
      type: fileType,
    }
  )

  formData.append("audio", audioFile)

  const response = await fetch(
    "/api/transcribe",
    {
      method: "POST",
      body: formData,
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Audio transcription failed"
    )
  }

  const transcript =
    data.text?.trim() || ""

  if (!transcript) {
    alert("I didn’t catch that. Try again.")
    return
  }

  setMessage(transcript)

  await sendMessage(transcript)
}

async function startVoiceAsk() {
  setActiveTab("askMACCE")

  await unlockMobileAudio()

  if (!navigator.mediaDevices) {
    alert(
      "Microphone access is not supported in this browser."
    )
    return
  }

  if (isListening) {
    mediaRecorderRef.current?.stop()
    return
  }

  try {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

    audioChunksRef.current = []

    let mimeType = ""

    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {
      mimeType = "audio/webm;codecs=opus"
    } else if (
      MediaRecorder.isTypeSupported("audio/mp4")
    ) {
      mimeType = "audio/mp4"
    }

    const recorder = mimeType
      ? new MediaRecorder(stream, {
          mimeType,
        })
      : new MediaRecorder(stream)

    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    recorder.onstop = async () => {
      setIsListening(false)
      setIsTranscribing(true)

      stream.getTracks().forEach((track) => {
        track.stop()
      })

      const audioBlob = new Blob(
        audioChunksRef.current,
        {
          type:
            recorder.mimeType ||
            "audio/webm",
        }
      )

      try {
        await transcribeAndSendAudio(audioBlob)
      } catch (error) {
        console.error(error)

        alert(
          "MACCE couldn’t process that audio. Try again."
        )
      } finally {
        setIsTranscribing(false)
      }
    }

    recorder.start()
    setIsListening(true)
  } catch (error) {
    console.error(error)

    setIsListening(false)

    alert(
      "Microphone access failed. Check your browser permissions."
    )
  }
}

if (!loggedIn) {
  return (
    <main
      className={`min-h-screen ${getThemeBackground(
        theme
      )} text-white flex items-center justify-center p-6 overflow-hidden`}
    >
      <div className="absolute w-[700px] h-[700px] bg-cyan-400/10 blur-[130px] rounded-full" />

      <div className="relative w-full max-w-md bg-white/5 border border-cyan-400/20 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.08)] transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        <div className="flex flex-col items-center mb-8">
          <motion.img
            src="/macce.png"
            alt="MACCE"
            className="w-48 mb-6 drop-shadow-[0_0_35px_rgba(34,211,238,0.45)]"
            animate={{
              y: [0, -14, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <h1 className="text-5xl font-bold text-cyan-300">
            MACCE
          </h1>

          <p className="text-gray-400 mt-3 text-center">
            Your AI companion for money, goals, and life
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email or username"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
          />

          <button
            onClick={async () => {
              if (
                !email.trim() ||
                !password.trim()
              ) {
                alert("Enter email and password")
                return
              }

              if (signupMode) {
                const { data, error } =
                  await supabase.auth.signUp({
                    email,
                    password,
                  })

                console.log(data)
                console.log(error)

                if (error) {
                  alert(error.message)
                  return
                }

                alert(
                  "Account created. Now login."
                )
                setSignupMode(false)
              } else {
                const { data, error } =
                  await supabase.auth.signInWithPassword({
                    email,
                    password,
                  })

                console.log(data)
                console.log(error)

                if (error) {
                  alert(error.message)
                  return
                }

                if (!data.session) {
                  alert("No session created")
                  return
                }

                setLoggedIn(true)
              }
            }}
            className="w-full min-h-[44px] bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl px-5 py-3 font-semibold hover:scale-[1.02] transition"
          >
            {signupMode
              ? "Create Account"
              : "Login"}
          </button>

          <button
            onClick={() =>
              setSignupMode(!signupMode)
            }
            className="min-h-[44px] text-sm text-gray-400 w-full text-center hover:text-cyan-300 transition"
          >
            {signupMode
              ? "Already have an account? Login"
              : "Need an account? Create one"}
          </button>
        </div>
      </div>
    </main>
  )
}

return (
  <main
    className={`min-h-screen ${getThemeBackground(
      theme
    )} text-white flex flex-col lg:flex-row overflow-hidden`}
  >
    <aside className="hidden lg:flex lg:w-72 bg-[#07111f]/90 border-r border-cyan-400/10 p-6 flex-col justify-between">
      <div>
        <h1 className="text-4xl font-bold text-cyan-300 mb-2">
          MACCE
        </h1>

        <p className="text-gray-400 mb-10">
          Your AI companion for money, goals, and life
        </p>

        <nav className="space-y-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full min-h-[44px] text-left rounded-2xl p-4 transition ${
                activeTab === tab
                  ? "bg-cyan-400/15 border border-cyan-300/30 text-cyan-200"
                  : "bg-white/5 hover:bg-white/10 text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-3 mt-6">
        <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-5 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
          <p className="text-cyan-300 font-semibold">
            MACCE is online
          </p>

          <p className="text-gray-400 text-sm mt-2">
            Always here. Always learning.
          </p>
        </div>

        <button
          onClick={() => {
            stopVoice()
            setLoggedIn(false)
          }}
          className="w-full min-h-[44px] bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition text-left"
        >
          Logout
        </button>
      </div>
    </aside>

    <section className="flex-1 p-4 lg:p-8 pb-24 relative overflow-y-auto">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-400/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
        <div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-3">
            {activeTab}
          </h2>

          <p className="text-gray-400 text-lg">
            {activeTab === "Dashboard"
              ? firstName
                ? `Here’s your money, goals, and life overview, ${firstName}.`
                : "Here’s your money, goals, and life overview."
              : `Manage your ${activeTab.toLowerCase()} with MACCE.`}
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          {activeTab === "Dashboard" && (
            <DashboardContent
              analytics={analytics}
              transactions={transactions}
              insights={insights}
              bills={bills}
              safeToSpend={safeToSpend}
              subscriptions={subscriptions}
              alerts={alerts}
            />
          )}

          {activeTab === "Transactions" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <Card
                  title="Net Cash Flow"
                  value={`$${Number(
                    analytics?.net || 0
                  ).toFixed(2)}`}
                  note="Live from linked transactions"
                  good={(analytics?.net || 0) >= 0}
                  bad={(analytics?.net || 0) < 0}
                />

                <Card
                  title="Income"
                  value={`$${Number(
                    analytics?.income || 0
                  ).toFixed(2)}`}
                  note="Synced from Plaid"
                  good
                />

                <Card
                  title="Expenses"
                  value={`$${Number(
                    analytics?.expenses || 0
                  ).toFixed(2)}`}
                  note="Synced from Plaid"
                  bad
                />

                <Card
                  title="Savings Rate"
                  value={`${Number(
                    analytics?.savingsRate || 0
                  ).toFixed(0)}%`}
                  note="Income minus expenses"
                  good={
                    (analytics?.savingsRate || 0) >= 20
                  }
                  bad={
                    (analytics?.savingsRate || 0) < 0
                  }
                />
              </div>

              <div className="bg-white/5 border border-pink-400/20 rounded-3xl p-6 mt-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
                <h3 className="text-2xl font-semibold mb-5">
                  Subscriptions
                </h3>

                <div className="space-y-3">
                  {subscriptions.length > 0 ? (
                    [...subscriptions]
                      .sort(
                        (a, b) =>
                          b.average_amount -
                          a.average_amount
                      )
                      .slice(0, 5)
                      .map((subscription, index) => (
                        <div
                          key={index}
                          className="bg-pink-400/10 border border-pink-400/20 rounded-2xl p-4 flex justify-between items-center"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {
                                subscription.merchant_name
                              }
                            </p>

                            <p className="text-sm text-white/60">
                              ~ every 30 days
                            </p>
                          </div>

                          <p className="text-pink-300 font-semibold">
                            $
                            {Number(
                              subscription.average_amount
                            ).toFixed(2)}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-4 text-white/60">
                      No subscriptions detected yet
                    </div>
                  )}
                </div>
              </div>

              <TransactionsContent
                transactions={transactions}
              />
            </>
          )}

          {activeTab === "Budget" && (
            <BudgetContent />
          )}

          {activeTab === "Goals" && (
            <GoalsContent />
          )}

          {activeTab === "AI Insights" && (
            <InsightsContent />
          )}

          {activeTab === "Reports" && (
            <ReportsContent />
          )}

          {activeTab === "Alerts" && (
            <div className="space-y-6">
              <div className="space-y-3">
                {alerts.length > 0 &&
                  alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="bg-yellow-400 text-black rounded-2xl p-4 shadow-lg"
                    >
                      <p className="font-semibold">
                        {alert.title}
                      </p>

                      <p className="text-sm text-black/80 mt-1">
                        {alert.message}
                      </p>
                    </div>
                  ))}
              </div>

              <UpcomingBills />
              <SpendingBreakdownCard
                analytics={analytics}
              />
            </div>
          )}

          {activeTab === "askMACCE" && (
            <AskMacceContent
              chat={chat}
              loading={loading}
              message={message}
              setMessage={setMessage}
              sendMessage={sendMessage}
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
              stopVoice={stopVoice}
              chatEndRef={chatEndRef}
              chatBoxRef={chatBoxRef}
            />
          )}

          {activeTab === "Profile" && (
            <SettingsContent
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              phone={phone}
              setPhone={setPhone}
              mainGoal={mainGoal}
              setMainGoal={setMainGoal}
              incomeRange={incomeRange}
              setIncomeRange={setIncomeRange}
              saveProfile={saveProfile}
              profileSaved={profileSaved}
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
              stopVoice={stopVoice}
              theme={theme}
              setTheme={setTheme}
              personality={personality}
              setPersonality={setPersonality}
              openPlaid={() => open()}
plaidReady={ready}
            />
          )}
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="relative min-h-[360px] lg:min-h-[520px] flex items-center justify-center">
            <motion.div
              className="absolute w-[260px] h-[260px] lg:w-[420px] lg:h-[420px] bg-cyan-400/20 blur-[80px] rounded-full"
              animate={{
                opacity: [0.25, 0.45, 0.25],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="absolute bottom-6 w-52 lg:w-72 h-10 rounded-full border border-cyan-300/40 bg-cyan-400/10 blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.45, 0.75, 0.45],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.img
              src="/macce.png"
              alt="MACCE"
              className="relative w-[260px] sm:w-[320px] lg:w-[430px] drop-shadow-[0_0_45px_rgba(34,211,238,0.45)]"
              animate={{
                y: [0, -28, 0],
                scale: [1, 1.025, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>
    </section>

    <div className="fixed bottom-28 right-5 z-50 flex flex-col items-center md:hidden">
      <button
        onClick={async () => {
          await unlockMobileAudio()
          await startVoiceAsk()
        }}
        className="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_35px_rgba(34,211,238,0.45)] flex items-center justify-center hover:scale-110 transition"
      >
        <span className="text-2xl">
          {isTranscribing
            ? "⏳"
            : isListening
              ? "🎙️"
              : "✨"}
        </span>
      </button>

      {isListening && (
        <p className="mt-2 text-xs text-cyan-300">
          Tap to stop
        </p>
      )}
    </div>

    <audio
      ref={audioPlayerRef}
      preload="auto"
      style={{ display: "none" }}
    />

    <MobileNav
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  </main>
)
}

function getThemeBackground(theme: string) {
  if (theme === "Ocean") return "bg-[#031b26]"
  if (theme === "Midnight") return "bg-[#020617]"
  if (theme === "Purple") return "bg-[#12051f]"
  return "bg-[#050b16]"
}

function formatCategory(value?: string | null) {
  if (!value) return "Other"

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c: string) =>
      c.toUpperCase()
    )
}

function DashboardContent({
  analytics,
  transactions,
  insights,
  safeToSpend,
  alerts,
}: {
  analytics: any
  transactions: TransactionItem[]
  insights: string[]
  bills?: BillItem[]
  safeToSpend: any
  subscriptions?: SubscriptionItem[]
  alerts: any[]
}) {
  const safeAmount =
    Number(safeToSpend?.safeToSpend || 0)

  return (
    <>
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-300/20 rounded-3xl p-6 mt-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        <h3 className="text-2xl font-semibold mb-3">
          Safe to Spend
        </h3>

        <p className="text-4xl lg:text-5xl font-bold text-cyan-300 mb-3">
          ${safeAmount.toFixed(2)}
        </p>

        <p className="text-white/60">
          After income, spending, and predicted upcoming bills.
        </p>
      </div>

      <div className="space-y-3 mt-6">
        {alerts.length > 0 &&
          alerts.slice(0, 3).map((alert, index) => (
            <div
              key={index}
              className="bg-yellow-400 text-black rounded-2xl p-4 shadow-lg"
            >
              <p className="font-semibold text-black">
                {alert.title}
              </p>

              <p className="text-sm text-black/80 mt-1">
                {alert.message}
              </p>
            </div>
          ))}
      </div>

      <div className="bg-white/5 border border-cyan-400/20 rounded-3xl p-6 mt-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        <h3 className="text-2xl font-semibold mb-5">
          MACCE Insights
        </h3>

        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div
                key={index}
                className="bg-cyan-400/10 border border-cyan-400/20 rounded-2xl p-4"
              >
                <p className="text-cyan-100">
                  {insight}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 text-white/60">
              No insights yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mt-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        <h3 className="text-2xl font-semibold mb-4">
          Spending Categories
        </h3>

        <div className="space-y-3">
          {analytics?.categories &&
            Object.entries(analytics.categories)
              .sort(
                (a: any, b: any) =>
                  Number(b[1]) - Number(a[1])
              )
              .slice(0, 5)
              .map(([key, value]: any) => (
                <div
                  key={key}
                  className="flex justify-between items-center bg-white/5 rounded-2xl p-4 min-w-0"
                >
                  <p className="font-medium truncate">
                    {formatCategory(key)}
                  </p>

                  <p className="text-red-400 font-semibold">
                    ${Number(value || 0).toFixed(2)}
                  </p>
                </div>
              ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowCard analytics={analytics} />
        <SpendingBreakdownCard analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsMiniCard />
        <TransactionsMiniCard
          transactions={transactions}
        />
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-cyan-300/20 rounded-3xl p-5 text-cyan-200 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        ✨ Small steps today, big freedom tomorrow.
      </div>
    </>
  )
}

function TransactionsContent({
  transactions,
}: {
  transactions: TransactionItem[]
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-2xl font-semibold mb-6">
        Transactions
      </h3>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-gray-400">
            No transactions yet.
          </p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white/5 rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {tx.merchant_name || tx.name}
                </p>

                <p className="text-sm text-gray-400">
                  {tx.amount < 0
                    ? "Income"
                    : formatCategory(tx.category)}
                </p>
              </div>

              <p
                className={`font-semibold ${
                  tx.amount > 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {tx.amount > 0 ? "-" : "+"}$
                {Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function BudgetContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      import { useEffect, useState } from "react"

type BudgetCategory = {
  id: string
  title: string
  spent: number
  limit: number
  isCustom: boolean
  enabled: boolean
}

const STORAGE_KEY = "budget-categories"

const starterCategories: BudgetCategory[] = [
  {
    id: "food",
    title: "Food",
    spent: 480,
    limit: 650,
    isCustom: false,
    enabled: true,
  },
  {
    id: "gas",
    title: "Gas",
    spent: 220,
    limit: 350,
    isCustom: false,
    enabled: true,
  },
  {
    id: "kids",
    title: "Kids",
    spent: 390,
    limit: 500,
    isCustom: false,
    enabled: true,
  },
  {
    id: "tools-home",
    title: "Tools/Home",
    spent: 210,
    limit: 300,
    isCustom: false,
    enabled: true,
  },
]

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`
}

function getBudgetWidth(spent: number, limit: number) {
  if (limit <= 0) return "0%"

  const percentage = Math.round((spent / limit) * 100)

  return `${Math.min(percentage, 100)}%`
}

function BudgetCard({
  title,
  spent,
  limit,
  width,
}: {
  title: string
  spent: string
  limit: string
  width: string
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">
          {spent} / {limit}
        </p>
      </div>

      <div className="h-3 w-full rounded-full bg-gray-200">
        <div
          className="h-3 rounded-full bg-black"
          style={{ width }}
        />
      </div>
    </div>
  )
}

export default function BudgetContent() {
  const [categories, setCategories] =
    useState<BudgetCategory[]>(starterCategories)

  const [newTitle, setNewTitle] = useState("")
  const [newLimit, setNewLimit] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      setCategories(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  }, [categories])

  const visibleCategories = categories.filter(
    category => category.enabled
  )

  function toggleCategory(id: string) {
    setCategories(prev =>
      prev.map(category =>
        category.id === id
          ? {
              ...category,
              enabled: !category.enabled,
            }
          : category
      )
    )
  }

  function updateCategoryLimit(id: string, value: string) {
    const newLimit = Number(value)

    setCategories(prev =>
      prev.map(category =>
        category.id === id
          ? {
              ...category,
              limit: Number.isFinite(newLimit) ? newLimit : 0,
            }
          : category
      )
    )
  }

  function updateCategoryTitle(id: string, value: string) {
    setCategories(prev =>
      prev.map(category => {
        if (category.id !== id) return category

        if (!category.isCustom) return category

        return {
          ...category,
          title: value,
        }
      })
    )
  }

  function addCustomCategory() {
    const cleanTitle = newTitle.trim()
    const limit = Number(newLimit)

    if (!cleanTitle || !Number.isFinite(limit)) return

    const customCategory: BudgetCategory = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      spent: 0,
      limit,
      isCustom: true,
      enabled: true,
    }

    setCategories(prev => [...prev, customCategory])

    setNewTitle("")
    setNewLimit("")
  }

  function deleteCustomCategory(id: string) {
    setCategories(prev =>
      prev.filter(category => category.id !== id)
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          Budget Categories
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map(category => (
            <div
              key={category.id}
              className="rounded-lg border p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={category.enabled}
                    onChange={() => toggleCategory(category.id)}
                  />

                  <span>
                    {category.isCustom
                      ? "Custom Category"
                      : category.title}
                  </span>
                </label>

                {category.isCustom && (
                  <button
                    onClick={() =>
                      deleteCustomCategory(category.id)
                    }
                    className="text-sm text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              {category.isCustom && (
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Title
                  </label>

                  <input
                    value={category.title}
                    onChange={event =>
                      updateCategoryTitle(
                        category.id,
                        event.target.value
                      )
                    }
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Monthly Limit
                </label>

                <input
                  type="number"
                  value={category.limit}
                  onChange={event =>
                    updateCategoryLimit(
                      category.id,
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          Add Custom Category
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px_auto]">
          <input
            placeholder="Category title"
            value={newTitle}
            onChange={event => setNewTitle(event.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <input
            type="number"
            placeholder="Limit"
            value={newLimit}
            onChange={event => setNewLimit(event.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <button
            onClick={addCustomCategory}
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Add
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Active Budgets
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {visibleCategories.map(category => (
            <BudgetCard
              key={category.id}
              title={category.title}
              spent={formatCurrency(category.spent)}
              limit={formatCurrency(category.limit)}
              width={getBudgetWidth(
                category.spent,
                category.limit
              )}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
  )
}

function GoalsContent() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-2xl font-semibold mb-6">
        Goals
      </h3>

      "use client"

import { useEffect, useState } from "react"

type GoalItem = {
  id: string
  title: string
  currentAmount: number
  targetAmount: number
  isCustom: boolean
  enabled: boolean
}

const STORAGE_KEY = "user-goals"

const starterGoals: GoalItem[] = [
  {
    id: "emergency-fund",
    title: "Emergency Fund",
    currentAmount: 3250,
    targetAmount: 10000,
    isCustom: false,
    enabled: true,
  },
  {
    id: "vacation-fund",
    title: "Vacation Fund",
    currentAmount: 1850,
    targetAmount: 5000,
    isCustom: false,
    enabled: true,
  },
  {
    id: "debt-payoff",
    title: "Debt Payoff",
    currentAmount: 4200,
    targetAmount: 17000,
    isCustom: false,
    enabled: true,
  },
  {
    id: "business-fund",
    title: "Business Fund",
    currentAmount: 600,
    targetAmount: 5000,
    isCustom: false,
    enabled: true,
  },
]

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`
}

function getGoalProgress(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) return 0

  return Math.round((currentAmount / targetAmount) * 100)
}

function getGoalWidth(currentAmount: number, targetAmount: number) {
  const progress = getGoalProgress(currentAmount, targetAmount)

  return `${Math.min(progress, 100)}%`
}

function Goal({
  title,
  amount,
  progress,
  width,
}: {
  title: string
  amount: string
  progress: string
  width: string
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-white/60">{amount}</p>
        </div>

        <span className="text-sm text-cyan-300">
          {progress}
        </span>
      </div>

      <div className="h-3 w-full rounded-full bg-white/10">
        <div
          className="h-3 rounded-full bg-cyan-300"
          style={{ width }}
        />
      </div>
    </div>
  )
}

export default function GoalsContent() {
  const [goals, setGoals] = useState<GoalItem[]>(starterGoals)

  const [newTitle, setNewTitle] = useState("")
  const [newCurrentAmount, setNewCurrentAmount] = useState("")
  const [newTargetAmount, setNewTargetAmount] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      setGoals(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  }, [goals])

  const visibleGoals = goals.filter(goal => goal.enabled)

  function toggleGoal(id: string) {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? {
              ...goal,
              enabled: !goal.enabled,
            }
          : goal
      )
    )
  }

  function updateGoalTitle(id: string, value: string) {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id !== id) return goal

        if (!goal.isCustom) return goal

        return {
          ...goal,
          title: value,
        }
      })
    )
  }

  function updateCurrentAmount(id: string, value: string) {
    const currentAmount = Number(value)

    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? {
              ...goal,
              currentAmount: Number.isFinite(currentAmount)
                ? currentAmount
                : 0,
            }
          : goal
      )
    )
  }

  function updateTargetAmount(id: string, value: string) {
    const targetAmount = Number(value)

    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? {
              ...goal,
              targetAmount: Number.isFinite(targetAmount)
                ? targetAmount
                : 0,
            }
          : goal
      )
    )
  }

  function addCustomGoal() {
    const cleanTitle = newTitle.trim()
    const currentAmount = Number(newCurrentAmount)
    const targetAmount = Number(newTargetAmount)

    if (!cleanTitle) return
    if (!Number.isFinite(currentAmount)) return
    if (!Number.isFinite(targetAmount)) return

    const customGoal: GoalItem = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      currentAmount,
      targetAmount,
      isCustom: true,
      enabled: true,
    }

    setGoals(prev => [...prev, customGoal])

    setNewTitle("")
    setNewCurrentAmount("")
    setNewTargetAmount("")
  }

  function deleteCustomGoal(id: string) {
    setGoals(prev => prev.filter(goal => goal.id !== id))
  }

  return (
    <div className="space-y-8">
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        <h3 className="text-2xl font-semibold mb-6">
          Customize Goals
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {goals.map(goal => (
            <div
              key={goal.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={goal.enabled}
                    onChange={() => toggleGoal(goal.id)}
                  />

                  <span>
                    {goal.isCustom ? "Custom Goal" : goal.title}
                  </span>
                </label>

                {goal.isCustom && (
                  <button
                    onClick={() => deleteCustomGoal(goal.id)}
                    className="text-sm text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {goal.isCustom && (
                  <div>
                    <label className="mb-1 block text-sm text-white/70">
                      Goal Title
                    </label>

                    <input
                      value={goal.title}
                      onChange={event =>
                        updateGoalTitle(
                          goal.id,
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Current Amount
                  </label>

                  <input
                    type="number"
                    value={goal.currentAmount}
                    onChange={event =>
                      updateCurrentAmount(
                        goal.id,
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Target Amount
                  </label>

                  <input
                    type="number"
                    value={goal.targetAmount}
                    onChange={event =>
                      updateTargetAmount(
                        goal.id,
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-2xl font-semibold mb-6">
          Add Custom Goal
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px_160px_auto]">
          <input
            placeholder="Goal title"
            value={newTitle}
            onChange={event => setNewTitle(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          />

          <input
            type="number"
            placeholder="Current"
            value={newCurrentAmount}
            onChange={event =>
              setNewCurrentAmount(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          />

          <input
            type="number"
            placeholder="Target"
            value={newTargetAmount}
            onChange={event =>
              setNewTargetAmount(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          />

          <button
            onClick={addCustomGoal}
            className="rounded-xl bg-cyan-300 px-4 py-2 font-medium text-black"
          >
            Add
          </button>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
        <h3 className="text-2xl font-semibold mb-6">
          Goals
        </h3>

        {visibleGoals.map(goal => {
          const progress = getGoalProgress(
            goal.currentAmount,
            goal.targetAmount
          )

          return (
            <Goal
              key={goal.id}
              title={goal.title}
              amount={`${formatCurrency(
                goal.currentAmount
              )} / ${formatCurrency(goal.targetAmount)}`}
              progress={`${progress}%`}
              width={getGoalWidth(
                goal.currentAmount,
                goal.targetAmount
              )}
            />
          )
        })}
      </section>
    </div>
  )
}

function InsightsContent() {
  return (
    <div className="space-y-6">
      <InsightCard
        title="Eating Out"
        text="Food spending is one of your easiest wins. Cutting two meals out per week could free up real money fast."
      />

      <InsightCard
        title="Irregular Spending"
        text="Home project purchases should probably get their own sinking fund so they stop surprising your budget."
      />

      <InsightCard
        title="Cash Flow"
        text="Your income looks strong, but the goal is making your money predictable instead of reactive."
      />
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReportCard title="Monthly Spending Report" />
      <ReportCard title="Savings Opportunity Report" />
      <ReportCard title="Debt Payoff Report" />
      <ReportCard title="Income Forecast Report" />
    </div>
  )
}

function SettingsContent({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  mainGoal,
  setMainGoal,
  incomeRange,
  setIncomeRange,
  saveProfile,
  profileSaved,
  voiceEnabled,
  setVoiceEnabled,
  stopVoice,
  theme,
  setTheme,
  personality,
  setPersonality,
  openPlaid,
  plaidReady,
}: {
  firstName: string
  setFirstName: (value: string) => void
  lastName: string
  setLastName: (value: string) => void
  phone: string
  setPhone: (value: string) => void
  mainGoal: string
  setMainGoal: (value: string) => void
  incomeRange: string
  setIncomeRange: (value: string) => void
  saveProfile: () => Promise<void>
  profileSaved: boolean
  voiceEnabled: boolean
  setVoiceEnabled: (value: boolean) => void
  stopVoice: () => void
  theme: string
  setTheme: (value: string) => void
  personality: string
  setPersonality: (value: string) => void
  openPlaid: () => void
  plaidReady: boolean
}) {
  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6">
        <button
          onClick={() => openPlaid()}
          disabled={!plaidReady}
          className="w-full min-h-[44px] flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-4 hover:bg-white/10 transition disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">☰</span>

            <div className="text-left">
              <p className="font-semibold">
                Financial Connections
              </p>

              <p className="text-sm text-white/60">
                Manage linked banks
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
          <h3 className="text-2xl font-semibold mb-6">
            Settings
          </h3>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 py-4">
              <div>
                <p className="font-semibold">
                  MACCE Voice
                </p>

                <p className="text-gray-400 text-sm">
                  Turn AI voice playback on or off.
                </p>
              </div>

              <button
                onClick={() => {
                  stopVoice()
                  setVoiceEnabled(!voiceEnabled)
                }}
                className={`min-h-[44px] rounded-2xl px-5 py-3 ${
                  voiceEnabled
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                {voiceEnabled ? "On" : "Off"}
              </button>
            </div>

            <div className="border-b border-white/10 py-4">
              <p className="font-semibold mb-3">
                Personality
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  "Companion",
                  "Coach",
                  "Chill",
                  "Analyst",
                ].map((mode) => (
                  <button
                    key={mode}
                    onClick={() =>
                      setPersonality(mode)
                    }
                    className={`min-h-[44px] rounded-2xl p-3 transition ${
                      personality === mode
                        ? "bg-cyan-500/20 border border-cyan-300/30 text-cyan-200"
                        : "bg-white/5 text-gray-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-4">
              <p className="font-semibold mb-3">
                Theme
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  "Neon Dark",
                  "Ocean",
                  "Midnight",
                  "Purple",
                ].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={`min-h-[44px] rounded-2xl p-3 transition ${
                      theme === mode
                        ? "bg-cyan-500/20 border border-cyan-300/30 text-cyan-200"
                        : "bg-white/5 text-gray-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <p className="text-gray-400 text-sm mt-4">
                Current theme: {theme}
              </p>
            </div>

            <div className="space-y-4 pt-6">
              <h4 className="text-xl font-semibold">
                Profile
              </h4>

              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
              />

              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
              />

              <input
                type="text"
                placeholder="Main Financial Goal"
                value={mainGoal}
                onChange={(e) =>
                  setMainGoal(e.target.value)
                }
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
              />

              <input
                type="text"
                placeholder="Income Range"
                value={incomeRange}
                onChange={(e) =>
                  setIncomeRange(e.target.value)
                }
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none text-white"
              />

              <button
                type="button"
                onClick={() => {
                  console.log(
                    "Save Profile clicked"
                  )
                  saveProfile()
                }}
                className="w-full min-h-[44px] bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl px-5 py-3 font-semibold hover:scale-[1.02] transition"
              >
                Save Profile
              </button>

              {profileSaved && (
                <p className="text-green-400 text-sm">
                  Profile saved.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CashFlowCard({
  analytics,
}: {
  analytics: any
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-2xl font-semibold mb-5">
        Cash Flow Overview
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span>Income</span>

            <span>
              $
              {analytics?.income?.toFixed(2) ||
                "0.00"}
            </span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full w-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Expenses</span>

            <span>
              $
              {analytics?.expenses?.toFixed(2) ||
                "0.00"}
            </span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full"
              style={{
                width: `${
                  analytics?.income
                    ? Math.min(
                        (analytics.expenses /
                          analytics.income) *
                          100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SpendingBreakdownCard({
  analytics,
}: {
  analytics: any
}) {
  const categories = analytics?.categories
    ? Object.entries(analytics.categories)
        .sort(
          (a: any, b: any) =>
            Number(b[1]) - Number(a[1])
        )
        .slice(0, 5)
    : []

  const total =
    categories.reduce(
      (sum: number, entry: any) =>
        sum + Number(entry[1] || 0),
      0
    ) || 1

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-2xl font-semibold mb-5">
        Spending Breakdown
      </h3>

      <div className="space-y-4">
        {categories.map((entry: any, index) => {
          const percent =
            (Number(entry[1] || 0) / total) * 100

          return (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span>
                  {formatCategory(entry[0])}
                </span>

                <span>
                  ${Number(entry[1] || 0).toFixed(2)}
                </span>
              </div>

              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{
                    width: `${percent}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GoalsMiniCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-2xl font-semibold mb-5">
        Financial Goals
      </h3>

      <div className="bg-white/5 rounded-2xl p-5 text-white/70">
        <p className="text-lg font-medium mb-2">
          No goals set yet
        </p>

        <p className="text-sm">
          Soon you’ll be able to create:
        </p>

        <ul className="mt-3 space-y-2 text-sm">
          <li>• Savings goals</li>
          <li>• Debt payoff plans</li>
          <li>• Emergency fund targets</li>
          <li>• AI-powered budgeting plans</li>
        </ul>
      </div>
    </div>
  )
}

function TransactionsMiniCard({
  transactions,
}: {
  transactions: TransactionItem[]
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-2xl font-semibold mb-5">
        Recent Transactions
      </h3>

      <div className="space-y-3">
        {transactions.slice(0, 5).map((tx) => (
          <div
            key={tx.id}
            className="flex justify-between items-center bg-white/5 rounded-2xl p-4 min-w-0"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">
                {tx.merchant_name || tx.name}
              </p>

              <p className="text-sm text-white/50">
                {tx.amount < 0
                  ? "Income"
                  : formatCategory(tx.category)}
              </p>
            </div>

            <p
              className={`font-semibold ${
                tx.amount > 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {tx.amount > 0 ? "-" : "+"}$
              {Math.abs(tx.amount).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function UpcomingBills() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-xl font-semibold mb-4">
        Upcoming Bills
      </h3>

      <Bill
        name="Rent"
        date="Jun 1"
        amount="$1,200.00"
      />
      <Bill
        name="Car Insurance"
        date="Jun 5"
        amount="$120.00"
      />
      <Bill
        name="Phone Bill"
        date="Jun 8"
        amount="$65.00"
      />
    </div>
  )
}

function Card({
  title,
  value,
  note,
  good,
  bad,
}: {
  title: string
  value: string
  note: string
  good?: boolean
  bad?: boolean
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <p className="text-gray-400 mb-3">
        {title}
      </p>

      <h3 className="text-3xl font-bold mb-3">
        {value}
      </h3>

      <p
        className={
          good
            ? "text-green-400"
            : bad
              ? "text-orange-400"
              : "text-gray-400"
        }
      >
        {note}
      </p>
    </div>
  )
}

function Goal({
  title,
  amount,
  progress,
  width,
}: {
  title: string
  amount: string
  progress: string
  width: string
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <div>
          <p>{title}</p>

          <p className="text-gray-400 text-sm">
            {amount}
          </p>
        </div>

        <p>{progress}</p>
      </div>

      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
          style={{ width }}
        />
      </div>
    </div>
  )
}

function Bill({
  name,
  date,
  amount,
}: {
  name: string
  date: string
  amount: string
}) {
  return (
    <div className="flex justify-between py-3 border-b border-white/10">
      <div>
        <p>{name}</p>

        <p className="text-gray-400 text-sm">
          {date}
        </p>
      </div>

      <p>{amount}</p>
    </div>
  )
}

function BudgetCard({
  title,
  spent,
  limit,
  width,
}: {
  title: string
  spent: string
  limit: string
  width: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {title}
          </h3>

          <p className="text-gray-400 text-sm">
            {spent} used of {limit}
          </p>
        </div>
      </div>

      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
          style={{ width }}
        />
      </div>
    </div>
  )
}

function InsightCard({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="bg-white/5 border border-cyan-300/20 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-xl font-semibold text-cyan-300 mb-3">
        {title}
      </h3>

      <p className="text-gray-300 leading-relaxed">
        {text}
      </p>
    </div>
  )
}

function ReportCard({
  title,
}: {
  title: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-300/30">
      <h3 className="text-xl font-semibold mb-3">
        {title}
      </h3>

      <p className="text-gray-400 mb-5">
        Generate a clean MACCE report for this area.
      </p>

      <button className="min-h-[44px] bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl px-5 py-3 font-semibold">
        Generate Report
      </button>
    </div>
  )
}

