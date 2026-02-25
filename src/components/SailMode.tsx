'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveBottleMessage, catchRandomBottle } from '@/app/actions'
import styles from './SailMode.module.css'

type SailTab = 'write' | 'catch'
type WriteStep = 'form' | 'folding' | 'bottling' | 'throwing' | 'done'
type CatchStep = 'bobbing' | 'catching' | 'opening' | 'reading'

export default function SailMode({ onBack }: { onBack: () => void }) {
    const [tab, setTab] = useState<SailTab>('write')

    // Write state
    const [writeMessage, setWriteMessage] = useState('')
    const [moodRating, setMoodRating] = useState(8)
    const [writeStep, setWriteStep] = useState<WriteStep>('form')
    const [writeError, setWriteError] = useState('')

    // Catch state
    const [catchStep, setCatchStep] = useState<CatchStep>('bobbing')
    const [caughtMessage, setCaughtMessage] = useState<{ message: string, mood?: number } | null>(null)
    const [catchError, setCatchError] = useState('')

    // ── Write a Bottle ──
    const handleWriteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!writeMessage.trim()) return
        setWriteError('')
        setWriteStep('folding')

        await new Promise(r => setTimeout(r, 900))
        setWriteStep('bottling')

        await new Promise(r => setTimeout(r, 1000))
        setWriteStep('throwing')

        try {
            await saveBottleMessage(writeMessage.trim(), moodRating)
        } catch {
            setWriteError('Could not save your message. Please try again 🌊')
            setWriteStep('form')
            return
        }

        await new Promise(r => setTimeout(r, 1200))
        setWriteStep('done')
    }

    const resetWrite = () => {
        setWriteMessage('')
        setMoodRating(8)
        setWriteStep('form')
        setWriteError('')
    }

    // ── Catch a Bottle ──
    const handleCatch = async () => {
        if (catchStep !== 'bobbing') return
        setCatchError('')
        setCatchStep('catching')

        try {
            const result = await catchRandomBottle()
            if (!result) {
                setCatchError('No messages in the ocean yet 🌊 Write one first!')
                setCatchStep('bobbing')
                return
            }
            await new Promise(r => setTimeout(r, 1000))
            setCatchStep('opening')
            await new Promise(r => setTimeout(r, 800))
            setCaughtMessage({ message: result.message, mood: (result as any).mood_rating })
            setCatchStep('reading')
        } catch {
            setCatchError('Could not catch the bottle. Try again!')
            setCatchStep('bobbing')
        }
    }

    const throwBack = () => {
        setCaughtMessage(null)
        setCatchStep('bobbing')
        setCatchError('')
    }

    return (
        <motion.div
            className={styles.sailContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
        >
            {/* Sunset sky layers */}
            <div className={styles.sky} />
            <div className={styles.sunGlow} />
            <div className={styles.sun} />

            {/* Horizon glow */}
            <div className={styles.horizon} />

            {/* Ocean */}
            <div className={styles.ocean}>
                <div className={styles.wave1} />
                <div className={styles.wave2} />
                <div className={styles.wave3} />
            </div>

            {/* Back Button */}
            <button onClick={onBack} className={styles.backBtn}>
                〈 Back
            </button>

            {/* Card */}
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
            >
                <div className={styles.cardHeader}>
                    <h1 className={styles.title}>⛵ I Want to Sail</h1>
                    <p className={styles.subtitle}>You're doing well today. Let your happiness set sail.</p>
                </div>
                <div className={styles.divider} />

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'write' ? styles.tabActive : ''}`}
                        onClick={() => { setTab('write'); resetWrite() }}
                    >
                        🪶 Write a Bottle
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'catch' ? styles.tabActive : ''}`}
                        onClick={() => { setTab('catch'); throwBack() }}
                    >
                        🪝 Catch a Bottle
                    </button>
                </div>

                {/* ── WRITE A BOTTLE ── */}
                {tab === 'write' && (
                    <AnimatePresence mode="wait">
                        {writeStep === 'form' && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                className={styles.tabContent}
                            >
                                <p className={styles.hint}>Write something that lights your heart today 🌅</p>
                                <form onSubmit={handleWriteSubmit} className={styles.form}>
                                    <textarea
                                        className={styles.textarea}
                                        value={writeMessage}
                                        onChange={e => setWriteMessage(e.target.value)}
                                        rows={5}
                                        placeholder="Today I'm happy because..."
                                        required
                                    />

                                    {/* Mood Rating Slider */}
                                    <div className={styles.moodSection}>
                                        <p className={styles.moodLabel}>How bright is your happiness now? ({moodRating}/10)</p>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={moodRating}
                                            onChange={(e) => setMoodRating(parseInt(e.target.value))}
                                            className={styles.rangeInput}
                                        />
                                        <div className={styles.moodIndicators}>
                                            <span>🌤️ Gentle</span>
                                            <span>Radiant 🌟</span>
                                        </div>
                                    </div>

                                    {writeError && <p className={styles.error}>{writeError}</p>}
                                    <button type="submit" className={styles.submitBtn}>
                                        Seal in the Bottle ⛵
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {(writeStep === 'folding' || writeStep === 'bottling' || writeStep === 'throwing') && (
                            <motion.div
                                key="animating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.animationStage}
                            >
                                {/* Letter */}
                                <AnimatePresence>
                                    {writeStep === 'folding' && (
                                        <motion.div
                                            key="letter"
                                            className={styles.letter}
                                            initial={{ scale: 1, opacity: 1, y: 0 }}
                                            animate={{ scale: 0.4, opacity: 0.8, y: 40, rotate: -10 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.8 }}
                                        >
                                            <div className={styles.letterInner}>
                                                <div className={styles.letterLine} />
                                                <div className={styles.letterLine} />
                                                <div className={styles.letterLine} style={{ width: '60%' }} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Bottle */}
                                {(writeStep === 'bottling' || writeStep === 'throwing') && (
                                    <motion.div
                                        key="bottle"
                                        className={styles.bottleWrap}
                                        initial={{ scale: 0.7, opacity: 0, y: 20 }}
                                        animate={
                                            writeStep === 'throwing'
                                                ? {
                                                    scale: [1, 1.05, 0.1],
                                                    opacity: [1, 1, 0],
                                                    y: [0, -20, -200],
                                                    x: [0, 30, 250],
                                                    rotate: [0, 15, 40],
                                                }
                                                : { scale: 1, opacity: 1, y: 0 }
                                        }
                                        transition={
                                            writeStep === 'throwing'
                                                ? { duration: 1.1, ease: 'easeIn' }
                                                : { duration: 0.6 }
                                        }
                                    >
                                        <div className={styles.bottleSvgWrap}>
                                            <BottleSVG />
                                        </div>
                                        {writeStep === 'bottling' && (
                                            <p className={styles.animLabel}>Sealing your message... 📩</p>
                                        )}
                                        {writeStep === 'throwing' && (
                                            <p className={styles.animLabel}>Casting into the ocean... 🌬️</p>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {writeStep === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={styles.successArea}
                            >
                                <motion.div
                                    className={styles.successEmoji}
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                >
                                    ⛵️
                                </motion.div>
                                <h3 className={styles.successTitle}>Your message is sailing away!</h3>
                                <p className={styles.successText}>
                                    The happiness you wrote is now drifting across the ocean,
                                    waiting for someone to catch it 🌌
                                </p>
                                <button onClick={resetWrite} className={styles.resetBtn}>
                                    Write another 🪶
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* ── CATCH A BOTTLE ── */}
                {tab === 'catch' && (
                    <AnimatePresence mode="wait">
                        {(catchStep === 'bobbing' || catchStep === 'catching') && (
                            <motion.div
                                key="ocean-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.catchArea}
                            >
                                <p className={styles.hint}>A bottle is drifting nearby... shall you reach for it? 🌙</p>

                                <div className={styles.oceanMini}>
                                    {/* Floating bottle */}
                                    <motion.div
                                        className={styles.floatingBottle}
                                        animate={
                                            catchStep === 'catching'
                                                ? { y: [0, -60], x: [0, -80], scale: [1, 1.4], opacity: [1, 1] }
                                                : { y: [0, -12, 0], rotate: [-8, 8, -8] }
                                        }
                                        transition={
                                            catchStep === 'catching'
                                                ? { duration: 0.9, ease: 'easeOut' }
                                                : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                                        }
                                    >
                                        <BottleSVG />
                                    </motion.div>
                                </div>

                                {catchError && <p className={styles.error}>{catchError}</p>}

                                <button
                                    onClick={handleCatch}
                                    className={styles.catchBtn}
                                    disabled={catchStep === 'catching'}
                                >
                                    {catchStep === 'catching' ? 'Reaching...' : 'Catch the Bottle 🪩'}
                                </button>
                            </motion.div>
                        )}

                        {catchStep === 'opening' && (
                            <motion.div
                                key="opening"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.openingArea}
                            >
                                <motion.div
                                    className={styles.bottlePop}
                                    animate={{ rotate: [0, -15, 10, 0], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                >
                                    <BottleSVG />
                                </motion.div>
                                <motion.p
                                    className={styles.openingLabel}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                >
                                    Opening the cork... 🌿
                                </motion.p>
                            </motion.div>
                        )}

                        {catchStep === 'reading' && caughtMessage && (
                            <motion.div
                                key="reading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className={styles.readingArea}
                            >
                                <motion.div
                                    className={styles.letterCard}
                                    initial={{ scaleY: 0.2, opacity: 0 }}
                                    animate={{ scaleY: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
                                >
                                    <div className={styles.letterCardHeader}>
                                        <span className={styles.letterWax}>🌹</span>
                                        <span className={styles.letterFrom}>
                                            A message from a bottle that sailed to you...
                                            {caughtMessage.mood && (
                                                <span className={styles.moodTag}>
                                                    {' · '} Happiness Level: {caughtMessage.mood}/10
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <p className={styles.caughtMessage}>{caughtMessage.message}</p>
                                </motion.div>
                                <button onClick={throwBack} className={styles.throwBackBtn}>
                                    Release it back to the sea 🌊
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        </motion.div>
    )
}

// Inline SVG bottle — warm ocean glass with amber letter
function BottleSVG() {
    return (
        <svg
            viewBox="0 0 64 120"
            width="56"
            height="108"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Cork */}
            <rect x="22" y="2" width="20" height="11" rx="3.5" fill="#b8915a" />
            <rect x="23" y="3" width="18" height="4" rx="2" fill="rgba(220,175,110,0.5)" />

            {/* Neck */}
            <rect x="24" y="13" width="16" height="16" rx="5"
                fill="rgba(80, 170, 195, 0.55)"
                stroke="rgba(160,230,245,0.25)" strokeWidth="1" />

            {/* Bottle body */}
            <path
                d="M15 29 Q6 38 6 54 L6 98 Q6 113 32 113 Q58 113 58 98 L58 54 Q58 38 49 29 Z"
                fill="rgba(70, 165, 200, 0.52)"
                stroke="rgba(160, 230, 248, 0.2)"
                strokeWidth="1.2"
            />

            {/* Inner volume (depth) */}
            <path
                d="M18 33 Q10 42 10 56 L10 98 Q10 110 32 110 Q54 110 54 98 L54 56 Q54 42 46 33 Z"
                fill="rgba(60, 155, 195, 0.18)"
            />

            {/* Shine highlight */}
            <path
                d="M18 40 Q13 54 13 66"
                stroke="rgba(220, 245, 255, 0.45)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
            />

            {/* Warm letter hint */}
            <rect x="23" y="60" width="18" height="24" rx="2.5"
                fill="rgba(253, 235, 170, 0.55)"
                stroke="rgba(220, 190, 100, 0.2)" strokeWidth="0.8" />
            {/* Letter lines */}
            <line x1="26" y1="65" x2="37" y2="65" stroke="rgba(120, 85, 30, 0.3)" strokeWidth="1" />
            <line x1="26" y1="69" x2="37" y2="69" stroke="rgba(120, 85, 30, 0.3)" strokeWidth="1" />
            <line x1="26" y1="73" x2="33" y2="73" stroke="rgba(120, 85, 30, 0.2)" strokeWidth="1" />
        </svg>
    )
}
