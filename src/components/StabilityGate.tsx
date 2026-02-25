'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { checkStabilityGate } from '@/app/actions'
import styles from './StabilityGate.module.css'

type StabilityGateProps = {
    onComplete: (isStable: boolean, score: number) => void
    onSail?: () => void
    onConstellation?: () => void
}

const fadeVariant = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.4 } },
}

export default function StabilityGate({ onComplete, onSail, onConstellation }: StabilityGateProps) {
    const [step, setStep] = useState<'intro' | 'question1' | 'question2' | 'scale' | 'checking'>('intro')
    const [rating, setRating] = useState(5)
    const [failCount, setFailCount] = useState(0)

    const handleScaleSubmit = async () => {
        setStep('checking')
        const result = await checkStabilityGate(rating)

        if (result.allowed) {
            onComplete(true, rating)
        } else {
            setFailCount(prev => prev + 1)
            onComplete(false, rating)
        }
    }

    const getMoodLabel = (value: number) => {
        if (value <= 2) return 'Deep in the storm'
        if (value <= 4) return 'Clouds are heavy'
        if (value <= 6) return 'Weathering it'
        if (value <= 8) return 'Clearing skies'
        return 'Calm after the storm'
    }

    const getMoodColor = (value: number) => {
        if (value <= 3) return 'rgba(200, 150, 120, 0.8)'
        if (value <= 5) return 'rgba(212, 165, 116, 0.8)'
        if (value <= 7) return 'rgba(180, 200, 160, 0.8)'
        return 'rgba(160, 200, 180, 0.8)'
    }

    return (
        <div className={styles.container}>
            <div className={styles.ambientOrb} />

            <AnimatePresence mode="wait">
                {step === 'intro' && (
                    <motion.div key="intro" {...fadeVariant} className={styles.step}>
                        <div className={styles.icon}>☁</div>
                        <h2 className={styles.heading}>Welcome back.</h2>
                        <p className={styles.subtext}>
                            Before you enter, let's check in with where you are right now.
                        </p>
                        <button onClick={() => setStep('question1')} className={styles.continueBtn}>
                            Begin
                        </button>
                        <div className={styles.extraBtnRow}>
                            {onSail && (
                                <button onClick={onSail} className={styles.sailBtn}>
                                    🌊 I Want to Sail
                                </button>
                            )}
                            {onConstellation && (
                                <button onClick={onConstellation} className={styles.constellationBtn}>
                                    ✦ See Your Constellations
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 'question1' && (
                    <motion.div key="q1" {...fadeVariant} className={styles.step}>
                        <p className={styles.stepIndicator}>1 / 3</p>
                        <h2 className={styles.heading}>
                            Do you feel ready to sit with the storms you've named?
                        </h2>
                        <div className={styles.choiceRow}>
                            <button onClick={() => setStep('question2')} className={styles.choiceBtn}>
                                Yes, I think so
                            </button>
                            <button onClick={() => onComplete(false, 8)} className={styles.choiceBtnSoft}>
                                No, I need to write first
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'question2' && (
                    <motion.div key="q2" {...fadeVariant} className={styles.step}>
                        <p className={styles.stepIndicator}>2 / 3</p>
                        <h2 className={styles.heading}>
                            Can you hold these words gently, without turning them against yourself?
                        </h2>
                        <div className={styles.choiceRow}>
                            <button onClick={() => setStep('scale')} className={styles.choiceBtn}>
                                Yes, I can
                            </button>
                            <button onClick={() => onComplete(false, 6)} className={styles.choiceBtnSoft}>
                                I'm not sure
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'scale' && (
                    <motion.div key="scale" {...fadeVariant} className={styles.step}>
                        <p className={styles.stepIndicator}>3 / 3</p>
                        <h2 className={styles.heading}>
                            Where are you in the storm right now?
                        </h2>
                        <p className={styles.subtext}>
                            1 = eye of the storm, 10 = skies are clearing
                        </p>

                        <div className={styles.scaleContainer}>
                            <div className={styles.scaleTrack}>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={rating}
                                    onChange={(e) => setRating(parseInt(e.target.value))}
                                    className={styles.slider}
                                    style={{
                                        background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${(rating - 1) * 11.1}%, var(--border) ${(rating - 1) * 11.1}%, var(--border) 100%)`
                                    }}
                                />
                            </div>
                            <div className={styles.ratingDisplay}>
                                <span
                                    className={styles.ratingNumber}
                                    style={{ color: getMoodColor(rating) }}
                                >
                                    {rating}
                                </span>
                                <span className={styles.ratingLabel}>{getMoodLabel(rating)}</span>
                            </div>
                            <div className={styles.scaleMarkers}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <span key={n} className={`${styles.marker} ${n === rating ? styles.markerActive : ''}`}>
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleScaleSubmit} className={styles.continueBtn}>
                            Continue
                        </button>
                    </motion.div>
                )}

                {step === 'checking' && (
                    <motion.div key="checking" {...fadeVariant} className={styles.step}>
                        <div className={styles.breatheCircle} />
                        <p className={styles.subtext}>Checking in...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
