import Link from 'next/link'
import styles from './LandingPage.module.css'

export default function LandingPage() {
    return (
        <div className={styles.container}>
            <div className={styles.ambientOrb1} />
            <div className={styles.ambientOrb2} />
            <div className={styles.ambientOrb3} />

            <main className={styles.content}>
                <div className={styles.icon}>☁</div>

                <h1 className={styles.title}>
                    Before the Storm
                </h1>
                <p className={styles.titleSub}>For Ananda</p>

                <blockquote className={styles.quote}>
                    "Name the storm while it is still yours to name —
                    <br />
                    before it becomes the silence you carry alone."
                </blockquote>

                <p className={styles.description}>
                    A quiet space to sit with what you're going through.
                    Write what the storm feels like — not to fix it, but to witness it.
                </p>

                <Link href="/login" className={styles.enterButton}>
                    Enter Sanctuary
                </Link>

                <div className={styles.divider}>
                    <span />
                </div>

                <p className={styles.philosophy}>
                    Present-moment witness · Emotional grounding · Storm as lived truth
                </p>
            </main>
        </div>
    )
}
