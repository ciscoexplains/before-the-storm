'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StabilityGate from './StabilityGate'
import WriteDashboard from './WriteDashboard'
import StormMode from './StormMode'
import GroundingExercise from './GroundingExercise'
import SailMode from './SailMode'
import ConstellationMap from './ConstellationMap'
import StreamOfConsciousness from './StreamOfConsciousness'
import styles from './ClientHome.module.css'

type AppMode = 'gate' | 'write' | 'storm' | 'grounding' | 'sail' | 'constellation' | 'stream'

export default function ClientHome({ user }: { user: any }) {
    const [mode, setMode] = useState<AppMode>('gate')
    const [moodRating, setMoodRating] = useState(5)

    const handleGateComplete = (isStable: boolean, score: number) => {
        setMoodRating(score)
        if (isStable) {
            setMode('storm')
        } else {
            setMode('grounding')
        }
    }

    const handleGroundingComplete = () => {
        setMode('write')
    }

    const handleBackToGate = () => {
        setMode('gate')
        setMoodRating(5)
    }

    const handleSailMode = () => {
        setMode('sail')
    }

    const handleConstellationMode = () => {
        setMode('constellation')
    }

    const handleStreamMode = () => {
        setMode('stream')
    }

    return (
        <div className={styles.appContainer}>
            <AnimatePresence mode="wait">
                {mode === 'gate' && (
                    <motion.div
                        key="gate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ width: '100%' }}
                    >
                        <StabilityGate
                            onComplete={handleGateComplete}
                            onSail={handleSailMode}
                            onConstellation={handleConstellationMode}
                            onStream={handleStreamMode}
                        />
                    </motion.div>
                )}
                {mode === 'grounding' && (
                    <motion.div
                        key="grounding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ width: '100%' }}
                    >
                        <GroundingExercise
                            onComplete={handleGroundingComplete}
                            moodRating={moodRating}
                        />
                    </motion.div>
                )}
                {mode === 'write' && (
                    <motion.div
                        key="write"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ width: '100%' }}
                    >
                        <WriteDashboard user={user} onBackToGate={handleBackToGate} />
                    </motion.div>
                )}
                {mode === 'storm' && (
                    <motion.div
                        key="storm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ width: '100%' }}
                    >
                        <StormMode moodRating={moodRating} onBackToGate={handleBackToGate} />
                    </motion.div>
                )}
                {mode === 'sail' && (
                    <motion.div
                        key="sail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        style={{ width: '100%' }}
                    >
                        <SailMode onBack={handleBackToGate} />
                    </motion.div>
                )}
                {mode === 'constellation' && (
                    <motion.div
                        key="constellation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        style={{ width: '100%' }}
                    >
                        <ConstellationMap onBack={handleBackToGate} />
                    </motion.div>
                )}
                {mode === 'stream' && (
                    <motion.div
                        key="stream"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        style={{ width: '100%' }}
                    >
                        <StreamOfConsciousness onBack={handleBackToGate} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

