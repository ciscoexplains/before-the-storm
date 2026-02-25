'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeConsciousness, saveConsciousnessEntry } from '@/app/actions'
import styles from './StreamOfConsciousness.module.css'

type Phase = 'writing' | 'analyzing' | 'result'

type TrackedWord = {
    id: number
    text: string
    opacity: number
    timerId: ReturnType<typeof setTimeout>
}

const WORD_FADE_MS = 3000

export default function StreamOfConsciousness({ onBack }: { onBack: () => void }) {
    const [phase, setPhase] = useState<Phase>('writing')
    const [visibleWords, setVisibleWords] = useState<TrackedWord[]>([])
    const [inputValue, setInputValue] = useState('')
    const [wordCount, setWordCount] = useState(0)
    const [analysis, setAnalysis] = useState('')
    const [savedText, setSavedText] = useState('')
    const [saveError, setSaveError] = useState('')

    // Store the full accumulated text invisibly
    const fullTextRef = useRef<string[]>([])
    const wordIdCounter = useRef(0)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        // Focus textarea on mount
        textAreaRef.current?.focus()
        return () => {
            // Cleanup all pending timers on unmount
            // (timers are cleared per-word when they fire or on "It's Enough")
        }
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Detect space or enter = word boundary
        if (e.key === ' ' || e.key === 'Enter') {
            const word = inputValue.trim()
            if (!word) return

            e.preventDefault()

            const id = wordIdCounter.current++
            fullTextRef.current.push(word)
            setWordCount(prev => prev + 1)
            setInputValue('')

            // Add word to visible list
            const timer = setTimeout(() => {
                setVisibleWords(prev => prev.filter(w => w.id !== id))
            }, WORD_FADE_MS)

            setVisibleWords(prev => [
                ...prev,
                { id, text: word, opacity: 1, timerId: timer }
            ])
        }
    }, [inputValue])

    const handleEnough = useCallback(async () => {
        // Also commit any partial word in the input
        const lastWord = inputValue.trim()
        if (lastWord) {
            fullTextRef.current.push(lastWord)
        }

        // Clear all pending timers
        setVisibleWords(prev => {
            prev.forEach(w => clearTimeout(w.timerId))
            return []
        })

        const fullText = fullTextRef.current.join(' ')
        if (!fullText) {
            onBack()
            return
        }

        setSavedText(fullText)
        setPhase('analyzing')
        setInputValue('')

        try {
            const result = await analyzeConsciousness(fullText)
            setAnalysis(result)
            setPhase('result')

            // Save to DB (fire and forget, don't block the UI)
            saveConsciousnessEntry(fullText, result).catch(err => {
                console.error('Failed to save consciousness entry:', err)
                setSaveError('Could not save this session, but your analysis is ready.')
            })
        } catch (err) {
            console.error('Gemini analysis failed:', err)
            setAnalysis('Something went wrong while reading your words. But you did something brave by writing them.')
            setPhase('result')
        }
    }, [inputValue, onBack])

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
        >
            {/* Ambient background */}
            <div className={styles.ambient1} />
            <div className={styles.ambient2} />

            {/* Back button */}
            <button onClick={onBack} className={styles.backBtn}>
                〈 Back
            </button>

            <AnimatePresence mode="wait">

                {/* ── WRITING PHASE ── */}
                {phase === 'writing' && (
                    <motion.div
                        key="writing"
                        className={styles.writingWrap}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    >
                        <motion.div
                            className={styles.header}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1.2 }}
                        >
                            <p className={styles.instruction}>
                                just write. your words will disappear.<br />
                                <span className={styles.instructionSub}>nothing is judged. nothing is saved until you&apos;re done.</span>
                            </p>
                        </motion.div>

                        {/* Disappearing words display */}
                        <div className={styles.wordsStage}>
                            <AnimatePresence>
                                {visibleWords.map(w => (
                                    <motion.span
                                        key={w.id}
                                        className={styles.fadingWord}
                                        initial={{ opacity: 0.9 }}
                                        animate={{ opacity: 0.9 }}
                                        exit={{ opacity: 0, filter: 'blur(4px)', y: -8 }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    >
                                        {w.text}
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                            {visibleWords.length === 0 && wordCount === 0 && (
                                <motion.span
                                    className={styles.placeholder}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2, duration: 1 }}
                                >
                                    start typing…
                                </motion.span>
                            )}
                        </div>

                        {/* Hidden textarea — captures keypresses */}
                        <textarea
                            ref={textAreaRef}
                            className={styles.hiddenTextarea}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                            rows={1}
                            placeholder="type here…"
                        />

                        {/* Word counter hint */}
                        {wordCount > 0 && (
                            <motion.p
                                className={styles.wordCounter}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {wordCount} word{wordCount !== 1 ? 's' : ''} released
                            </motion.p>
                        )}

                        {/* It's Enough button */}
                        {wordCount >= 3 && (
                            <motion.button
                                className={styles.enoughBtn}
                                onClick={handleEnough}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                it&apos;s enough.
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* ── ANALYZING PHASE ── */}
                {phase === 'analyzing' && (
                    <motion.div
                        key="analyzing"
                        className={styles.analyzingWrap}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.div
                            className={styles.listeningOrb}
                            animate={{
                                scale: [1, 1.15, 1],
                                opacity: [0.3, 0.7, 0.3]
                            }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        />
                        <p className={styles.listeningText}>
                            listening to your words…
                        </p>
                        <p className={styles.listeningSubtext}>
                            this may take a moment
                        </p>
                    </motion.div>
                )}

                {/* ── RESULT PHASE ── */}
                {phase === 'result' && (
                    <motion.div
                        key="result"
                        className={styles.resultWrap}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    >
                        {/* Raw text reveal */}
                        <motion.div
                            className={styles.rawTextCard}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 1.5 }}
                        >
                            <p className={styles.rawTextLabel}>what you wrote</p>
                            <p className={styles.rawText}>{savedText}</p>
                        </motion.div>

                        {/* Divider */}
                        <motion.div
                            className={styles.divider}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                        />

                        {/* Gemini Analysis */}
                        <motion.div
                            className={styles.analysisCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 1.5 }}
                        >
                            <p className={styles.analysisLabel}>✦ what I heard</p>
                            <div className={styles.analysisText}>
                                {analysis.split('\n').filter(Boolean).map((para, i) => (
                                    <motion.p
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.4 + i * 0.3, duration: 1 }}
                                    >
                                        {para}
                                    </motion.p>
                                ))}
                            </div>
                        </motion.div>

                        {saveError && (
                            <p className={styles.saveError}>{saveError}</p>
                        )}

                        <motion.button
                            className={styles.doneBtn}
                            onClick={onBack}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5, duration: 1 }}
                        >
                            return to your sky
                        </motion.button>
                    </motion.div>
                )}

            </AnimatePresence>
        </motion.div>
    )
}
