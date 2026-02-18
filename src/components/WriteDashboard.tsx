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
    const [moodRating, setMoodRating] = useState(5)
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
            setMoodRating(5)
            await fetchCapsules()
            setTimeout(() => setSuccess(false), 4000)
        } catch {
            // Show error subtly
        } finally {
            setSubmitting(false)
        }
    }

    const getStormLabel = (value: number) => {
        if (value <= 2) return 'Overwhelming'
        if (value <= 4) return 'Heavy'
        if (value <= 6) return 'Present but manageable'
        if (value <= 8) return 'Easing'
        return 'Passing'
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
                    <h1 className={styles.logo}>☁ Before the Storm</h1>
                    <p className={styles.headerSub}>
                        Name what you're going through. Not to fix it — to witness it.
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
                    🌧 Name the Storm
                </button>
                <button
                    onClick={() => setView('capsules')}
                    className={`${styles.tab} ${view === 'capsules' ? styles.tabActive : ''}`}
                >
                    ☁ Storms Named ({capsules.length})
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
                                <label htmlFor="capsule-title">What is this storm?</label>
                                <input
                                    id="capsule-title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="Fear of losing control, burnout, quiet grief..."
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>How heavy does it feel? ({moodRating}/10 — {getStormLabel(moodRating)})</label>
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
                                <label htmlFor="capsule-message">Describe what you're going through</label>
                                <textarea
                                    id="capsule-message"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    rows={8}
                                    placeholder="What does this storm feel like? What thoughts keep circling? What weight are you carrying right now?"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label htmlFor="capsule-reminder">Something you want to remember</label>
                                <input
                                    id="capsule-reminder"
                                    value={reminder}
                                    onChange={e => setReminder(e.target.value)}
                                    placeholder="e.g. This feeling is real, but it is not permanent."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={styles.submitBtn}
                            >
                                {submitting ? 'Saving...' : '☁ Name This Storm'}
                            </button>
                        </form>

                        {success && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.success}
                            >
                                Storm witnessed and saved. ☁
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
                            <p>No storms named yet. Start by writing what you're going through.</p>
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
                                    Storm intensity: {capsule.stable_mood_rating}/10
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
