'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { saveCapsule } from '@/app/actions'
import { logout } from '@/app/login/actions'
import EmotionalTimeline from './EmotionalTimeline'
import styles from './WriteDashboard.module.css'

type Capsule = {
    id: string
    title: string
    message: string
    reminder: string
    stable_mood_rating: number
    created_at: string
}

export default function WriteDashboard({ user, onBackToGate }: { user: any; onBackToGate: () => void }) {
    const supabase = createClient()
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [reminder, setReminder] = useState('')
    const [moodRating, setMoodRating] = useState(7)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [capsules, setCapsules] = useState<Capsule[]>([])
    const [showTimeline, setShowTimeline] = useState(false)
    const [view, setView] = useState<'write' | 'capsules'>('write')

    useEffect(() => {
        fetchCapsules()
    }, [])

    const fetchCapsules = async () => {
        const { data } = await supabase
            .from('emotional_capsules')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setCapsules(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            await saveCapsule({
                title,
                message,
                reminder,
                stable_mood_rating: moodRating,
            })

            setSuccess(true)
            setTitle('')
            setMessage('')
            setReminder('')
            setMoodRating(7)
            await fetchCapsules()
            setTimeout(() => setSuccess(false), 4000)
        } catch {
            // Show error subtly
        } finally {
            setSubmitting(false)
        }
    }

    const getMoodLabel = (value: number) => {
        if (value <= 3) return 'Still fragile'
        if (value <= 5) return 'Trying'
        if (value <= 7) return 'Strong enough'
        if (value <= 9) return 'Strong'
        return 'Unshakeable'
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className={styles.container}
        >
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.logo}>Before the Storm</h1>
                    <p className={styles.headerSub}>
                        You're strong right now. Leave a light for later.
                    </p>
                </div>
                <div className={styles.headerRight}>
                    <button onClick={onBackToGate} className={styles.navBtn}>
                        ← Stability Gate
                    </button>
                    <form action={logout}>
                        <button type="submit" className={styles.navBtn}>
                            Log out
                        </button>
                    </form>
                </div>
            </header>

            {/* Tab Switcher */}
            <div className={styles.tabs}>
                <button
                    onClick={() => setView('write')}
                    className={`${styles.tab} ${view === 'write' ? styles.tabActive : ''}`}
                >
                    ✍ Write Capsule
                </button>
                <button
                    onClick={() => setView('capsules')}
                    className={`${styles.tab} ${view === 'capsules' ? styles.tabActive : ''}`}
                >
                    📦 Your Capsules ({capsules.length})
                </button>
                <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className={`${styles.tab} ${showTimeline ? styles.tabActive : ''}`}
                >
                    📊 Timeline
                </button>
            </div>

            {/* Write View */}
            {view === 'write' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.writeArea}
                >
                    <div className={styles.card}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.fieldGroup}>
                                <label htmlFor="capsule-title">Title</label>
                                <input
                                    id="capsule-title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="For the night when you forget who you are..."
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>How you feel now ({moodRating}/10 — {getMoodLabel(moodRating)})</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={moodRating}
                                    onChange={e => setMoodRating(parseInt(e.target.value))}
                                    className={styles.moodSlider}
                                    style={{
                                        background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${(moodRating - 1) * 11.1}%, var(--border) ${(moodRating - 1) * 11.1}%, var(--border) 100%)`
                                    }}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label htmlFor="capsule-message">A message to your future self</label>
                                <textarea
                                    id="capsule-message"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    rows={8}
                                    placeholder="What do you need to hear when the storm comes?"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label htmlFor="capsule-reminder">Personal reminder</label>
                                <input
                                    id="capsule-reminder"
                                    value={reminder}
                                    onChange={e => setReminder(e.target.value)}
                                    placeholder="e.g. You already survived 2023."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={styles.submitBtn}
                            >
                                {submitting ? 'Saving...' : '✦ Seal Capsule'}
                            </button>
                        </form>

                        {success && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.success}
                            >
                                Message saved safely. ✦
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Capsules List */}
            {view === 'capsules' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.capsulesList}
                >
                    {capsules.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No capsules yet. Start writing your first message.</p>
                        </div>
                    ) : (
                        capsules.map((capsule, index) => (
                            <motion.div
                                key={capsule.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                className={styles.capsuleCard}
                            >
                                <div className={styles.capsuleHeader}>
                                    <h3 className={styles.capsuleTitle}>{capsule.title}</h3>
                                    <span className={styles.capsuleDate}>
                                        {new Date(capsule.created_at).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <p className={styles.capsuleMessage}>
                                    {capsule.message.length > 200
                                        ? capsule.message.slice(0, 200) + '...'
                                        : capsule.message}
                                </p>
                                {capsule.reminder && (
                                    <p className={styles.capsuleReminder}>
                                        💡 {capsule.reminder}
                                    </p>
                                )}
                                <div className={styles.capsuleMood}>
                                    Mood when written: {capsule.stable_mood_rating}/10
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}

            {/* Timeline */}
            {showTimeline && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <EmotionalTimeline user={user} />
                </motion.div>
            )}
        </motion.div>
    )
}
