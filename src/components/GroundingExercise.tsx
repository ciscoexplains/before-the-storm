'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './GroundingExercise.module.css'

type GroundingExerciseProps = {
    onComplete: () => void
    moodRating: number
}

const fadeVariant = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, transition: { duration: 0.6 } },
}

export default function GroundingExercise({ onComplete, moodRating }: GroundingExerciseProps) {
    const [phase, setPhase] = useState<'message' | 'breathe' | 'touch' | 'closing'>('message')
    const [breathCount, setBreathCount] = useState(0)
    const [isInhaling, setIsInhaling] = useState(true)
    const [failedMultiple, setFailedMultiple] = useState(false)

    useEffect(() => {
        const fails = parseInt(sessionStorage.getItem('gate_fails') || '0')
        if (fails > 1) {
            setFailedMultiple(true)
        }
        sessionStorage.setItem('gate_fails', String(fails + 1))
    }, [])

    useEffect(() => {
        if (phase !== 'breathe') return

        const interval = setInterval(() => {
            setIsInhaling(prev => !prev)
        }, 4000)

        const breathTimer = setInterval(() => {
            setBreathCount(prev => {
                if (prev >= 2) {
                    setTimeout(() => setPhase('touch'), 500)
                    return prev
                }
                return prev + 1
            })
        }, 8000)

        return () => {
            clearInterval(interval)
            clearInterval(breathTimer)
        }
    }, [phase])

    return (
        <div className={styles.container}>
            <div className={styles.ambientOrb} />

            <AnimatePresence mode="wait">
                {phase === 'message' && (
                    <motion.div key="message" {...fadeVariant} className={styles.step}>
                        <div className={styles.icon}>🌧</div>

                        {failedMultiple ? (
                            <>
                                <p className={styles.gentleText}>
                                    The rain is still falling, and that's okay.
                                </p>
                                <p className={styles.gentleTextSmall}>
                                    This space stays open for you —
                                    come back when you feel a little steadier.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className={styles.gentleText}>
                                    The storm is loud right now.<br />
                                    You don't have to do anything about it yet.
                                </p>
                                <p className={styles.gentleTextSmall}>
                                    Let's just breathe together for a moment.
                                </p>
                            </>
                        )}

                        <button onClick={() => setPhase('breathe')} className={styles.softBtn}>
                            Start breathing
                        </button>
                    </motion.div>
                )}

                {phase === 'breathe' && (
                    <motion.div key="breathe" {...fadeVariant} className={styles.step}>
                        <div className={styles.breatheArea}>
                            <motion.div
                                className={styles.breatheCircle}
                                animate={{
                                    scale: isInhaling ? 1.4 : 1,
                                    opacity: isInhaling ? 1 : 0.5,
                                }}
                                transition={{ duration: 4, ease: 'easeInOut' }}
                            />
                            <p className={styles.breatheLabel}>
                                {isInhaling ? 'Breathe in...' : 'Breathe out...'}
                            </p>
                        </div>
                        <p className={styles.breatheCount}>
                            Breath {Math.min(breathCount + 1, 3)} of 3
                        </p>
                    </motion.div>
                )}

                {phase === 'touch' && (
                    <motion.div key="touch" {...fadeVariant} className={styles.step}>
                        <div className={styles.icon}>⊹</div>
                        <p className={styles.gentleText}>
                            Touch something near you.
                        </p>
                        <p className={styles.gentleTextSmall}>
                            Feel its texture. Its temperature. Its weight.
                            <br />
                            You're still here. The storm hasn't taken you.
                        </p>
                        <button onClick={() => setPhase('closing')} className={styles.softBtn}>
                            I felt it
                        </button>
                    </motion.div>
                )}

                {phase === 'closing' && (
                    <motion.div key="closing" {...fadeVariant} className={styles.step}>
                        <p className={styles.closingText}>
                            Now — name what you're going through.
                            <br />
                            Not to solve it, just to see it clearly.
                        </p>

                        <button onClick={onComplete} className={styles.enterBtn}>
                            Begin writing
                        </button>

                        <p className={styles.closingNote}>
                            Your storm deserves to be witnessed.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
