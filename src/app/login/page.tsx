'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './login.module.css'

const fadeVariant = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.4 } },
}

export default function LoginPage() {
    const [step, setStep] = useState<'question' | 'password' | 'rejected'>('question')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.set('email', 'poet@beforethestorm.com')

        try {
            const { login } = await import('./actions')
            await login(formData)
        } catch {
            setError('Could not authenticate. Try again.')
            setSubmitting(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.ambientOrb1} />
            <div className={styles.ambientOrb2} />

            <div className={styles.content}>
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>✦</div>
                    <h1 className={styles.title}>Before the Storm</h1>
                    <p className={styles.subtitle}>For Ananda</p>
                </div>

                <div className={styles.card}>
                    <AnimatePresence mode="wait">
                        {step === 'question' && (
                            <motion.div key="question" {...fadeVariant}>
                                <p className={styles.cardIntro}>
                                    This space is only built when you are strong,<br />
                                    so it can protect you when you are not.
                                </p>

                                <h2 className={styles.gateQuestion}>Are you my wife?</h2>

                                <div className={styles.choiceRow}>
                                    <button
                                        onClick={() => setStep('password')}
                                        className="btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        Yes, I am
                                    </button>
                                    <button
                                        onClick={() => setStep('rejected')}
                                        className="btn-secondary"
                                        style={{ flex: 1 }}
                                    >
                                        No
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'password' && (
                            <motion.div key="password" {...fadeVariant}>
                                <p className={styles.cardIntro}>
                                    Welcome home. ♡
                                </p>

                                <form onSubmit={handleLogin} className={styles.form}>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="password">Password</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary"
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                    >
                                        {submitting ? 'Entering...' : 'Enter Sanctuary'}
                                    </button>

                                    {error && (
                                        <p className={styles.error}>{error}</p>
                                    )}
                                </form>

                                <button
                                    onClick={() => setStep('question')}
                                    className={styles.backLink}
                                >
                                    ← Go back
                                </button>
                            </motion.div>
                        )}

                        {step === 'rejected' && (
                            <motion.div key="rejected" {...fadeVariant}>
                                <p className={styles.rejectedText}>
                                    I'm sorry, this is only for my wife.
                                </p>
                                <p className={styles.rejectedSub}>
                                    This sanctuary was built for one person only. ♡
                                </p>
                                <button
                                    onClick={() => setStep('question')}
                                    className={styles.backLink}
                                >
                                    ← Go back
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className={styles.footer}>
                    A safe harbor for your future self.
                </p>
            </div>
        </div>
    )
}
