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
