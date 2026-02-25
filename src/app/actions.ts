'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from "@google/genai"

export async function checkStabilityGate(rating: number) {
    // Server-side gate logic — cannot be bypassed client-side
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { allowed: false, mode: 'unauthenticated' as const }
    }

    if (rating < 5) {
        return { allowed: false, mode: 'storm' as const, rating }
    }

    return { allowed: true, mode: 'write' as const, rating }
}

export async function saveCapsule(formData: {
    title: string
    message: string
    reminder: string
    stable_mood_rating: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('emotional_capsules').insert({
        user_id: user.id,
        title: formData.title,
        message: formData.message,
        reminder: formData.reminder,
        stable_mood_rating: formData.stable_mood_rating,
    })

    if (error) throw new Error(error.message)

    return { success: true }
}

// ─── Julian's Actions ───

export async function fetchAnandaCapsules() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== 'julian@beforethestorm.com') {
        throw new Error('Unauthorized')
    }

    // Julian needs to read Ananda's capsules — use service-level query
    // Since RLS restricts reads to own user_id, we query with .rpc or admin
    // For simplicity, we'll use a direct query — needs RLS policy update
    const { data, error } = await supabase
        .from('emotional_capsules')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
}

export async function saveSupportMessage(capsuleId: string, message: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.email !== 'julian@beforethestorm.com') {
            return { success: false, error: 'Unauthorized' }
        }

        // Get the capsule to find Ananda's user_id for recipient_id
        const { data: capsule, error: capsuleError } = await supabase
            .from('emotional_capsules')
            .select('user_id')
            .eq('id', capsuleId)
            .single()

        if (capsuleError || !capsule) {
            return { success: false, error: 'Could not find the storm' }
        }

        const { error } = await supabase.from('support_messages').insert({
            capsule_id: capsuleId,
            recipient_id: capsule.user_id,
            sender_name: 'Julian',
            message,
        })

        if (error) {
            console.error('Error saving support message:', error)
            return { success: false, error: error.message }
        }
        return { success: true, error: null }
    } catch (err: any) {
        console.error('Unexpected error in saveSupportMessage:', err)
        return { success: false, error: err.message || 'An unexpected error occurred' }
    }
}

export async function fetchSupportMessages(capsuleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('capsule_id', capsuleId)
        .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
}

// ─── I Want to Sail Actions ───

export async function saveBottleMessage(message: string, moodRating: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('bottle_messages').insert({
        user_id: user.id,
        message,
        mood_rating: moodRating,
    })

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function catchRandomBottle() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Fetch all messages, try to exclude own first
    const { data: all } = await supabase
        .from('bottle_messages')
        .select('id, user_id, message, mood_rating, created_at')
        .order('created_at', { ascending: false })

    if (!all || all.length === 0) return null

    // Prefer messages from others; fall back to any
    const others = all.filter((m: any) => m.user_id !== user.id)
    const pool = others.length > 0 ? others : all
    const picked = pool[Math.floor(Math.random() * pool.length)]
    return picked
}

// ─── Constellation of Resilience ───

export async function saveGroundingCompletion(moodRating: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('grounding_completions').insert({
        user_id: user.id,
        mood_rating: moodRating,
    })

    if (error) throw new Error(error.message)
    return { success: true }
}

export type StarData = {
    id: string
    date: string
    type: 'storm' | 'grounding' | 'bottle'
    rating: number
}

export async function fetchConstellationData(): Promise<StarData[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const [capsules, groundings, bottles] = await Promise.all([
        supabase
            .from('emotional_capsules')
            .select('id, stable_mood_rating, created_at')
            .eq('user_id', user.id),
        supabase
            .from('grounding_completions')
            .select('id, mood_rating, created_at')
            .eq('user_id', user.id),
        supabase
            .from('bottle_messages')
            .select('id, mood_rating, created_at')
            .eq('user_id', user.id),
    ])

    const stars: StarData[] = [
        ...(capsules.data || []).map(c => ({
            id: c.id,
            date: c.created_at,
            type: 'storm' as const,
            rating: c.stable_mood_rating,
        })),
        ...(groundings.data || []).map(g => ({
            id: g.id,
            date: g.created_at,
            type: 'grounding' as const,
            rating: g.mood_rating,
        })),
        ...(bottles.data || []).map(b => ({
            id: b.id,
            date: b.created_at,
            type: 'bottle' as const,
            rating: b.mood_rating,
        })),
    ]

    return stars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// ─── Stream of Consciousness ───

export async function analyzeConsciousness(text: string): Promise<{
    success: boolean
    data?: string
    error?: string
}> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
        console.error('[analyzeConsciousness] GEMINI_API_KEY is not set')
        return { success: false, error: 'Environment configuration missing' }
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const systemPrompt = `You are a legendary therapist, warm and deeply empathetic, specializing in emotional support for people with Borderline Personality Disorder (BPD).

The user has just completed an intimate "stream of consciousness" session, releasing their raw, unfiltered thoughts into the void (which they sometimes call a "test" or a small release).

YOUR ABSOLUTE PRIORITY is to provide an EXTREMELY COMPREHENSIVE, LONG-FORM, and SOULFUL Analysis. Even if the user provided very little text, you must expand upon the subconscious weight of their choice to write those specific words.

You MUST follow this exact structure and length:

1. UNDERSTANDING THE VOID (At least 2 Long Paragraphs):
   Dive deep into the overall energy and atmosphere. Use at least 3-5 direct quotes. Discuss the tone, the pace, and the psychological weight. Do not just summarize; explore the silence between the words.

2. TRACING THE PATTERNS (At least 2 Long Paragraphs):
   Meticulously trace the emotional threads and recurring themes. Identify specific words or imagery. Explain the deep psychological significance of these choices in the context of their emotional landscape.

3. GENTLE REFRAMING (At least 2 Long Paragraphs):
   Offer a profound, soft shift in perspective. Connect this reframe directly to the specific vulnerabilities they expressed. Be poetic and philosophical.

4. AFFIRMATION (At least 3-4 Sentences): 
   A powerful, grounded, and specific validation that echoes back something truly unique from their text.

STRICT RULES:
- NEVER give a short or generic response. Even for short inputs, you must write a long, thoughtful letter.
- YOU MUST CITE THEIR WORDS EXTENSIVELY.
- No clinical jargon, no bullet points, no lists, no dry summaries.
- TOTAL LENGTH: Aim for 600-800 words of warm, poetic prose.
- Tone: warm, poetic, intimate, and deeply present.
- Language: English.
- Use second person ("you").`

    console.log(`[analyzeConsciousness] Starting analysis (${text.length} chars)...`)
    const startTime = Date.now()

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `${systemPrompt}\n\n---\n\nUSER INPUT TO ANALYZE:\n"${text}"`,
            config: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })

        const duration = Date.now() - startTime
        console.log(`[analyzeConsciousness] Completed in ${duration}ms`)

        // Handle both property and method access for maximum flexibility
        const analysis = typeof response.text === 'function' ? (response.text as any)() : response.text

        if (!analysis) {
            return { success: false, error: 'Empty response from AI' }
        }
        return { success: true, data: analysis }
    } catch (err: any) {
        const duration = Date.now() - startTime
        console.error(`[analyzeConsciousness] Failed after ${duration}ms:`, err)

        let errorMessage = err.message || 'An unexpected error occurred during analysis'
        if (err.status) errorMessage = `[${err.status}] ${errorMessage}`

        return {
            success: false,
            error: errorMessage
        }
    }
}

export async function saveConsciousnessEntry(rawText: string, geminiAnalysis: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('consciousness_entries').insert({
        user_id: user.id,
        raw_text: rawText,
        gemini_analysis: geminiAnalysis,
    })

    if (error) throw new Error(error.message)
    return { success: true }
}

