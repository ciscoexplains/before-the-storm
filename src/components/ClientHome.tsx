'use client'

import { useState } from 'react'
import StabilityGate from './StabilityGate'
import WriteDashboard from './WriteDashboard'
import StormMode from './StormMode'
import GroundingExercise from './GroundingExercise'
import styles from './ClientHome.module.css'

type AppMode = 'gate' | 'write' | 'storm' | 'grounding'

export default function ClientHome({ user }: { user: any }) {
    const [mode, setMode] = useState<AppMode>('gate')
    const [moodRating, setMoodRating] = useState(5)

    const handleGateComplete = (isStable: boolean, score: number) => {
        setMoodRating(score)
        if (isStable) {
            // "Yes" path — ready to read past storms
            setMode('storm')
        } else {
            // "No" path — ground first, then write
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

    return (
        <div className={styles.appContainer}>
            {mode === 'gate' && (
                <StabilityGate onComplete={handleGateComplete} />
            )}
            {mode === 'grounding' && (
                <GroundingExercise
                    onComplete={handleGroundingComplete}
                    moodRating={moodRating}
                />
            )}
            {mode === 'write' && (
                <WriteDashboard user={user} onBackToGate={handleBackToGate} />
            )}
            {mode === 'storm' && (
                <StormMode moodRating={moodRating} onBackToGate={handleBackToGate} />
            )}
        </div>
    )
}

