import { login } from './actions'
import styles from './login.module.css'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const params = await searchParams

    return (
        <div className={styles.container}>
            {/* Ambient background orbs */}
            <div className={styles.ambientOrb1} />
            <div className={styles.ambientOrb2} />

            <div className={styles.content}>
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>✦</div>
                    <h1 className={styles.title}>Before the Storm</h1>
                    <p className={styles.subtitle}>For Ananda</p>
                </div>

                <div className={styles.card}>
                    <p className={styles.cardIntro}>
                        This space is only built when you are strong,<br />
                        so it can protect you when you are not.
                    </p>

                    <form className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="your@email.com"
                                autoComplete="email"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <button formAction={login} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                            Enter Sanctuary
                        </button>

                        {params?.error && (
                            <p className={styles.error}>{params.error}</p>
                        )}
                        {params?.message && (
                            <p className={styles.message}>{params.message}</p>
                        )}
                    </form>
                </div>

                <p className={styles.footer}>
                    A safe harbor for your future self.
                </p>
            </div>
        </div>
    )
}
