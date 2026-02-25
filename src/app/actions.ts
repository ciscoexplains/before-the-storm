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

export async function analyzeConsciousness(text: string): Promise<string> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const systemPrompt = `You are a legendary therapist, warm and deeply empathetic, specializing in emotional support for people with Borderline Personality Disorder (BPD).

The user has just completed an intimate "stream of consciousness" session, releasing their raw, unfiltered thoughts into the void.

Your absolute priority is to provide a Comprehensive, Long-form, and Soulful Analysis of the raw text provided. Do not rush. Be verbose and descriptive. You MUST follow this exact structure:

1. UNDERSTANDING THE VOID (Long Paragraph):
   Dive deep into the overall energy and atmosphere of their writing. Use at least 3 direct quotes from their text. Discuss the tone, the pace, and the weight of what they released. Acknowledge their bravery in letting these words surface.

2. TRACING THE PATTERNS (Long Paragraph):
   Meticulously trace the emotional threads and recurring themes. Identify specific words or imagery that appear. Use at least 3-4 more direct quotes or referenced phrases. Explain the psychological significance of these particular choices in the context of their current emotional landscape.

3. GENTLE REFRAMING (Long Paragraph):
   Offer a profound yet soft shift in perspective. This shouldn't be a quick fix, but a meaningful reflection. Connect this reframe directly to the specific vulnerabilities they expressed.

4. AFFIRMATION (Final Sentence): 
   A powerful, grounded, and specific sentence of validation that echoes back something truly unique from their text.

STRICT RULES:
- NEVER give a short or generic response. Each analysis should feel like a long, thoughtful letter written only for them.
- YOU MUST CITE THEIR WORDS EXTENSIVELY. The depth of your analysis is measured by how well you weave their own vocabulary into your insights.
- No clinical jargon, no bullet points, no lists, no dry summaries.
- Length: Aim for a minimum of 400-500 words of warm, poetic prose.
- Tone: warm, poetic, intimate, and deeply present.
- Language: English.
- Use second person ("you").`

    console.log(`[analyzeConsciousness] Starting analysis with ${text.length} chars...`)
    const startTime = Date.now()

    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{
                role: "user",
                parts: [{
                    text: `${systemPrompt}\n\n---\n\nHERE IS THE USER'S RAW TEXT TO ANALYZE:\n\n"${text}"`
                }]
            }],
            config: {
                temperature: 0.65,
                maxOutputTokens: 2048,
            }
        })

        const duration = Date.now() - startTime
        console.log(`[analyzeConsciousness] Analysis completed in ${duration}ms`)

        const analysis = response.text
        if (!analysis) {
            console.error('[analyzeConsciousness] Empty response from Gemini')
            throw new Error('No analysis returned from Gemini')
        }
        return analysis
    } catch (err: any) {
        const duration = Date.now() - startTime
        console.error(`[analyzeConsciousness] Failed after ${duration}ms:`, err)
        throw new Error(`Gemini SDK error: ${err.message || err}`)
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

