'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import styles from './StormMode.module.css'

type StormModeProps = {
    moodRating: number
    onBackToGate: () => void
}

type Capsule = {
    id: string
    title: string
    message: string
    reminder: string
    stable_mood_rating: number
    created_at: string
}

type SupportMessage = {
    message: string
    sender_name: string
}

const fadeVariant = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.4 } },
}

export default function StormMode({ moodRating, onBackToGate }: StormModeProps) {
    const supabase = createClient()
    const [capsules, setCapsules] = useState<Capsule[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [supportMessage, setSupportMessage] = useState<SupportMessage | null>(null)
    const [showSupport, setShowSupport] = useState(false)
    const [showSurvived, setShowSurvived] = useState(false)
    const [totalCapsules, setTotalCapsules] = useState(0)

    useEffect(() => {
        async function fetchData() {
            const { data: allCapsules } = await supabase
                .from('emotional_capsules')
                .select('*')
                .order('created_at', { ascending: false })

            if (allCapsules) {
                setTotalCapsules(allCapsules.length)
                const shuffled = [...allCapsules].sort(() => Math.random() - 0.5)
                setCapsules(shuffled)
            }

            if (moodRating <= 4) {
                const { data: support } = await supabase
                    .from('support_messages')
                    .select('*')
                    .limit(10)

                if (support && support.length > 0) {
                    const randomMsg = support[Math.floor(Math.random() * support.length)]
                    setSupportMessage(randomMsg)
                }
            }

            setLoading(false)
        }
        fetchData()
    }, [])

    const currentCapsule = capsules[currentIndex]

    const handleNext = () => {
        setShowSupport(false)
        setShowSurvived(false)
        setCurrentIndex((prev) => (prev + 1) % capsules.length)
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 1 } }}
                    className={styles.loadingState}
                >
                    <div className={styles.loadingOrb} />
                    <p>Gathering your storms...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.ambientOrb} />

            {/* Poetic heading */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 1 } }}
                className={styles.headingArea}
            >
                <h1 className={styles.mainHeading}>⛈ Storms You Have Weathered</h1>
                <p className={styles.headingSub}>
                    These are storms you named — proof you faced them.
                </p>
            </motion.div>

            <div className={styles.contentArea}>
                {capsules.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 1.5 } }}
                        className={styles.emptyState}
                    >
                        <h2>No storms named yet.</h2>
                        <p>You haven't written anything down yet.<br />That's okay. The space is here when you need it.</p>
                        <button onClick={onBackToGate} className={styles.ghostBtn}>
                            Go back
                        </button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCapsule.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1, transition: { duration: 0.8 } }}
                            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
                            className={styles.capsuleCard}
                        >
                            <p className={styles.capsuleDate}>
                                {new Date(currentCapsule.created_at).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>

                            <h2 className={styles.capsuleTitle}>{currentCapsule.title}</h2>
                            <p className={styles.capsuleMessage}>{currentCapsule.message}</p>

                            {currentCapsule.reminder && (
                                <div className={styles.reminderBlock}>
                                    <p className={styles.reminderText}>
                                        💡 {currentCapsule.reminder}
                                    </p>
                                </div>
                            )}

                            {showSupport && supportMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1 }}
                                    className={styles.supportBlock}
                                >
                                    <p className={styles.supportLabel}>Message from {supportMessage.sender_name}</p>
                                    <p className={styles.supportText}>{supportMessage.message}</p>
                                </motion.div>
                            )}

                            <div className={styles.actions}>
                                <button
                                    onClick={() => setShowSurvived(true)}
                                    className={styles.survivedBtn}
                                >
                                    I weathered this
                                </button>

                                <button
                                    onClick={handleNext}
                                    className={styles.nextBtn}
                                >
                                    Read another storm
                                </button>

                                {supportMessage && !showSupport && (
                                    <button
                                        onClick={() => setShowSupport(true)}
                                        className={styles.nextBtn}
                                    >
                                        There's a message for you
                                    </button>
                                )}
                            </div>

                            {showSurvived && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={styles.survivedBlock}
                                >
                                    <p className={styles.survivedStat}>
                                        You've named <strong>{totalCapsules}</strong> storms.
                                    </p>
                                    <p className={styles.survivedNote}>
                                        And you're still here. That is the proof.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Subtle exit */}
            <div className={styles.bottomNav}>
                <button onClick={onBackToGate} className={styles.exitBtn}>
                    Back to gate
                </button>
            </div>
        </div>
    )
}
