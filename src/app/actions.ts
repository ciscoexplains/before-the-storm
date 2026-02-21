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
