'use client'

import { useEffect, useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { createClient } from '@/utils/supabase/client'
import styles from './EmotionalTimeline.module.css'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
)

export default function EmotionalTimeline({ user }: { user: any }) {
    const supabase = createClient()
    const [chartData, setChartData] = useState<any>(null)
    const [stats, setStats] = useState<{
        totalMessages: number
        averageMood: number
    } | null>(null)

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase
                .from('emotional_capsules')
                .select('stable_mood_rating, created_at')
                .order('created_at', { ascending: true })

            if (data && data.length > 0) {
                const labels = data.map(d =>
                    new Date(d.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                    })
                )
                const ratings = data.map(d => d.stable_mood_rating)

                setStats({
                    totalMessages: data.length,
                    averageMood: Math.round(
                        (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
                    ) / 10,
                })

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Storm Intensity',
                            data: ratings,
                            borderColor: 'rgba(212, 165, 116, 0.8)',
                            backgroundColor: 'rgba(212, 165, 116, 0.08)',
                            pointBackgroundColor: 'rgba(212, 165, 116, 0.9)',
                            pointBorderColor: 'transparent',
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            tension: 0.4,
                            fill: true,
                        },
                    ],
                })
            }
        }
        fetchData()
    }, [])

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                borderColor: 'rgba(212, 165, 116, 0.3)',
                borderWidth: 1,
                padding: 12,
                titleColor: '#F5F0EB',
                bodyColor: '#9CA3AF',
                cornerRadius: 8,
            },
        },
        scales: {
            y: {
                min: 0,
                max: 10,
                ticks: {
                    color: 'rgba(156, 163, 175, 0.5)',
                    font: { size: 11 },
                    stepSize: 2,
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.04)',
                },
                border: { display: false },
            },
            x: {
                ticks: {
                    color: 'rgba(156, 163, 175, 0.5)',
                    font: { size: 11 },
                    maxRotation: 0,
                },
                grid: { display: false },
                border: { display: false },
            },
        },
    }

    if (!chartData) {
        return (
            <div className={styles.container}>
                <p className={styles.emptyText}>
                    No storms recorded yet. Start naming what you're going through.
                </p>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>⛈ Weather Patterns</h3>
                <p className={styles.subtitle}>A view of the storms you've moved through, not a score.</p>
            </div>

            {stats && (
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.totalMessages}</span>
                        <span className={styles.statLabel}>Storms named</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.averageMood}</span>
                        <span className={styles.statLabel}>Average intensity</span>
                    </div>
                </div>
            )}

            <div className={styles.chartWrapper}>
                <Line options={options} data={chartData} />
            </div>
        </div>
    )
}
