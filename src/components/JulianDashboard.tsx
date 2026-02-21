'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchAnandaCapsules, saveSupportMessage, fetchSupportMessages } from '@/app/actions'
import { logout } from '@/app/login/actions'
import styles from './JulianDashboard.module.css'

type Capsule = {
    id: string
    title: string
    message: string
    reminder: string
    stable_mood_rating: number
    created_at: string
}

type SupportMsg = {
    id: string
    message: string
    sender_name: string
    created_at: string
}

export default function JulianDashboard() {
    const [capsules, setCapsules] = useState<Capsule[]>([])
    const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null)
    const [supportMessages, setSupportMessages] = useState<SupportMsg[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCapsules()
    }, [])

    const loadCapsules = async () => {
        try {
            const data = await fetchAnandaCapsules()
            setCapsules(data)
        } catch {
            // Handle error silently
        } finally {
            setLoading(false)
        }
    }

    const handleSelectCapsule = async (capsule: Capsule) => {
        setSelectedCapsule(capsule)
        setSuccess(false)
        setNewMessage('')
        try {
            const messages = await fetchSupportMessages(capsule.id)
            setSupportMessages(messages)
        } catch {
            setSupportMessages([])
        }
    }

    const [error, setError] = useState('')

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCapsule || !newMessage.trim()) return

        setSending(true)
        setError('')
        try {
            const result = await saveSupportMessage(selectedCapsule.id, newMessage.trim())
            if (!result.success) {
                setError(result.error || 'Failed to send message. Please try again.')
                return
            }
            setSuccess(true)
            setNewMessage('')
            // Refresh messages
            const messages = await fetchSupportMessages(selectedCapsule.id)
            setSupportMessages(messages)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            console.error('Failed to send message:', err)
            setError(err.message || 'Failed to send message. Please try again.')
        } finally {
            setSending(false)
        }
    }

    const getIntensityLabel = (value: number) => {
        if (value <= 2) return 'Overwhelming'
        if (value <= 4) return 'Heavy'
        if (value <= 6) return 'Manageable'
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
                    <h1 className={styles.logo}>☁ Julian's View</h1>
                    <p className={styles.headerSub}>
                        See her storms. Leave a light for her to find.
                    </p>
                </div>
                <div className={styles.headerRight}>
                    <form action={logout}>
                        <button type="submit" className={styles.navBtn}>
                            Log out
                        </button>
                    </form>
                </div>
            </header>

            <div className={styles.layout}>
                {/* Storms List — Left Panel */}
                <div className={styles.stormsList}>
                    <h2 className={styles.panelTitle}>⛈ Ananda's Storms</h2>

                    {loading ? (
                        <p className={styles.loadingText}>Loading...</p>
                    ) : capsules.length === 0 ? (
                        <p className={styles.emptyText}>
                            No storms written yet.
                        </p>
                    ) : (
                        <div className={styles.capsuleList}>
                            {capsules.map((capsule) => (
                                <button
                                    key={capsule.id}
                                    onClick={() => handleSelectCapsule(capsule)}
                                    className={`${styles.capsuleItem} ${selectedCapsule?.id === capsule.id ? styles.capsuleItemActive : ''}`}
                                >
                                    <span className={styles.capsuleItemTitle}>{capsule.title}</span>
                                    <span className={styles.capsuleItemMeta}>
                                        {new Date(capsule.created_at).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                        {' · '}
                                        {getIntensityLabel(capsule.stable_mood_rating)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail + Support — Right Panel */}
                <div className={styles.detailPanel}>
                    <AnimatePresence mode="wait">
                        {!selectedCapsule ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={styles.detailEmpty}
                            >
                                <p>Select a storm to read and leave a message.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedCapsule.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                                className={styles.detailContent}
                            >
                                {/* Storm detail */}
                                <div className={styles.stormDetail}>
                                    <p className={styles.stormDate}>
                                        {new Date(selectedCapsule.created_at).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                        {' · '}
                                        Intensity: {selectedCapsule.stable_mood_rating}/10
                                    </p>
                                    <h2 className={styles.stormTitle}>{selectedCapsule.title}</h2>
                                    <p className={styles.stormMessage}>{selectedCapsule.message}</p>

                                    {selectedCapsule.reminder && (
                                        <div className={styles.stormReminder}>
                                            💡 {selectedCapsule.reminder}
                                        </div>
                                    )}
                                </div>

                                {/* Existing support messages */}
                                {supportMessages.length > 0 && (
                                    <div className={styles.existingMessages}>
                                        <h3 className={styles.messagesTitle}>Your messages to her</h3>
                                        {supportMessages.map((msg) => (
                                            <div key={msg.id} className={styles.supportMsg}>
                                                <p className={styles.supportMsgText}>{msg.message}</p>
                                                <span className={styles.supportMsgDate}>
                                                    {new Date(msg.created_at).toLocaleDateString('en-US', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Write support message */}
                                <div className={styles.writeSupport}>
                                    <h3 className={styles.writeSupportTitle}>
                                        Leave a message for this storm
                                    </h3>
                                    <p className={styles.writeSupportSub}>
                                        She'll see this when she reads this storm again.
                                    </p>

                                    <form onSubmit={handleSendMessage} className={styles.supportForm}>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="What does she need to hear about this storm?"
                                            rows={4}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className={styles.sendBtn}
                                        >
                                            {sending ? 'Sending...' : '♡ Send Message'}
                                        </button>
                                    </form>

                                    {success && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={styles.successText}
                                        >
                                            Message saved. She'll find it when she needs it. ♡
                                        </motion.p>
                                    )}
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}
