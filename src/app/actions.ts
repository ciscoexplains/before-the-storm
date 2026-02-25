'use server'

import { createClient } from '@/utils/supabase/server'

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
