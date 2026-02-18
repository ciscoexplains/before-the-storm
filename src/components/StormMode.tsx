'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import styles from './StormMode.module.css'

type Capsule = {
    id: string
    title: string
    message: string
    reminder: string
    stable_mood_rating: number
}

type SupportMessage = {
    id: string
    sender_name: string
    message: string
}

export default function StormMode({ user, moodRating, onBackToGate }: {
    user: any
    moodRating: number
    onBackToGate: () => void
}) {
    const supabase = createClient()
    const [capsule, setCapsule] = useState<Capsule | null>(null)
    const [supportMessage, setSupportMessage] = useState<SupportMessage | null>(null)
    const [loading, setLoading] = useState(true)
    const [totalCapsules, setTotalCapsules] = useState(0)
    const [showSurvived, setShowSurvived] = useState(false)
    const [showSupport, setShowSupport] = useState(false)

    const fetchRandomCapsule = useCallback(async () => {
        setLoading(true)
        setShowSurvived(false)
        setShowSupport(false)
        setSupportMessage(null)

        const { data: capsules } = await supabase
            .from('emotional_capsules')
            .select('*')

        if (capsules && capsules.length > 0) {
            setTotalCapsules(capsules.length)
            const random = capsules[Math.floor(Math.random() * capsules.length)]
            setCapsule(random)
        }

        // Support messages (randomized, only if mood < 4)
        if (moodRating < 4) {
            const { data: support } = await supabase
                .from('support_messages')
                .select('*')

            if (support && support.length > 0 && Math.random() > 0.4) {
                const randomSupport = support[Math.floor(Math.random() * support.length)]
                setSupportMessage(randomSupport)
            }
        }

        setLoading(false)
    }, [moodRating, supabase])

    useEffect(() => {
        fetchRandomCapsule()
    }, [fetchRandomCapsule])

    if (loading) {
        return (
            <div className={styles.container}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.loadingState}
                >
                    <div className={styles.loadingOrb} />
                    <p>Searching for light...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.ambientBg} />

            <AnimatePresence mode="wait">
                {!capsule ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 1.5 } }}
                        className={styles.emptyState}
                    >
                        <h2>It's dark right now.</h2>
                        <p>But you haven't left any messages yet.<br />Breathe. You're safe here.</p>
                        <button onClick={onBackToGate} className={styles.ghostBtn}>
                            Go back
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key={capsule.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className={styles.messageScreen}
                    >
                        {/* Title */}
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className={styles.capsuleTitle}
                        >
                            {capsule.title}
                        </motion.h2>

                        {/* Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1.2 }}
                            className={styles.capsuleMessage}
                        >
                            {capsule.message.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </motion.div>

                        {/* Reminder */}
                        {capsule.reminder && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 3, duration: 1 }}
                                className={styles.reminderBlock}
                            >
                                <span className={styles.reminderIcon}>✦</span>
                                <span>{capsule.reminder}</span>
                            </motion.div>
                        )}

                        {/* Support Message from Julian */}
                        {showSupport && supportMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1 }}
                                className={styles.supportBlock}
                            >
                                <p className={styles.supportLabel}>Message from {supportMessage.sender_name}</p>
                                <p className={styles.supportText}>{supportMessage.message}</p>
                            </motion.div>
                        )}

                        {/* I Survived This Once button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 4, duration: 1 }}
                            className={styles.actions}
                        >
                            <button
                                onClick={() => setShowSurvived(true)}
                                className={styles.survivedBtn}
                            >
                                I survived this once
                            </button>

                            <button
                                onClick={fetchRandomCapsule}
                                className={styles.nextBtn}
                            >
                                Read another message
                            </button>

                            {supportMessage && !showSupport && (
                                <button
                                    onClick={() => setShowSupport(true)}
                                    className={styles.nextBtn}
                                >
                                    There's a message for you
                                </button>
                            )}
                        </motion.div>

                        {/* Survived stats */}
                        {showSurvived && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className={styles.survivedBlock}
                            >
                                <p className={styles.survivedStat}>
                                    You've written <strong>{totalCapsules}</strong> messages to yourself.
                                </p>
                                <p className={styles.survivedNote}>
                                    You were strong enough to write them.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle exit */}
            <div className={styles.bottomNav}>
                <button onClick={onBackToGate} className={styles.exitBtn}>
                    Back to gate
                </button>
            </div>
        </div>
    )
}
