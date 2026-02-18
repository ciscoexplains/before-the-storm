import Link from 'next/link'
import styles from './LandingPage.module.css'

export default function LandingPage() {
    return (
        <div className={styles.container}>
            <div className={styles.ambientOrb1} />
            <div className={styles.ambientOrb2} />
            <div className={styles.ambientOrb3} />

            <main className={styles.content}>
                <div className={styles.icon}>✦</div>

                <h1 className={styles.title}>
                    Before the Storm
                </h1>
                <p className={styles.titleSub}>For Ananda</p>

                <blockquote className={styles.quote}>
                    "This space is only built when you are strong,
                    <br />
                    so it can protect you when you are not."
                </blockquote>

                <p className={styles.description}>
                    An emotional time capsule. Write to your future self when the skies are clear —
                    so when the storm comes, the voice that holds you is your own.
                </p>

                <Link href="/login" className={styles.enterButton}>
                    Enter Sanctuary
                </Link>

                <div className={styles.divider}>
                    <span />
                </div>

                <p className={styles.philosophy}>
                    Self-written secure base · Internal attachment anchor · Time-delayed self-validation
                </p>
            </main>
        </div>
    )
}
