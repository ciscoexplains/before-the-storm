'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchConstellationData, StarData } from '@/app/actions'
import styles from './ConstellationMap.module.css'

type StarType = 'storm' | 'grounding' | 'bottle'

type PositionedStar = StarData & {
    x: number
    y: number
    monthKey: string
    color: string
    glowColor: string
    radius: number
    twinkleDelay: number
}

type Line = { x1: number; y1: number; x2: number; y2: number }

type Centroid = { monthKey: string; label: string; x: number; y: number }

const TYPE_COLORS: Record<StarType, string> = {
    storm: '#a8c8ea',     // icy blue-silver — storm named
    grounding: '#d0a8f0', // soft violet — grounding done
    bottle: '#f5cc70',    // warm gold — bottle released
}

const TYPE_GLOW: Record<StarType, string> = {
    storm: 'rgba(168,200,234,0.6)',
    grounding: 'rgba(208,168,240,0.6)',
    bottle: 'rgba(245,204,112,0.6)',
}

const TYPE_LABELS: Record<StarType, string> = {
    storm: 'Storm Named',
    grounding: 'Grounding Done',
    bottle: 'Bottle Released',
}

function getMonthKey(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string) {
    const [year, month] = monthKey.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function positionStars(raw: StarData[]): PositionedStar[] {
    if (raw.length === 0) return []

    const sorted = [...raw].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const minTime = new Date(sorted[0].date).getTime()
    const maxTime = new Date(sorted[sorted.length - 1].date).getTime()
    const timeRange = Math.max(maxTime - minTime, 86400000) // at least 1 day

    return sorted.map((star, i) => {
        const t = (new Date(star.date).getTime() - minTime) / timeRange
        // x: spread from 8% to 92% of width
        const x = t * 84 + 8
        // y: high rating = high in sky (low y), low rating = lower (high y)
        // range: 8% (top) to 72% (near horizon)
        const y = ((11 - star.rating) / 10) * 64 + 8

        // Subtle jitter to avoid perfect overlap on same-day entries
        const jitterX = Math.sin(i * 7.317 + 1.3) * 2.5
        const jitterY = Math.cos(i * 4.189 + 0.7) * 2.5

        return {
            ...star,
            x: Math.max(5, Math.min(95, x + jitterX)),
            y: Math.max(6, Math.min(74, y + jitterY)),
            monthKey: getMonthKey(star.date),
            color: TYPE_COLORS[star.type as StarType],
            glowColor: TYPE_GLOW[star.type as StarType],
            radius: 1.2 + (star.rating / 10) * 3.2,
            twinkleDelay: i * 0.27,
        }
    })
}

function buildLines(stars: PositionedStar[]): Line[] {
    const byMonth: Record<string, PositionedStar[]> = {}
    stars.forEach(s => {
        if (!byMonth[s.monthKey]) byMonth[s.monthKey] = []
        byMonth[s.monthKey].push(s)
    })

    const lines: Line[] = []
    Object.values(byMonth).forEach(group => {
        if (group.length < 2) return
        const sorted = [...group].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        for (let i = 0; i < sorted.length - 1; i++) {
            lines.push({
                x1: sorted[i].x, y1: sorted[i].y,
                x2: sorted[i + 1].x, y2: sorted[i + 1].y,
            })
        }
    })
    return lines
}

function buildCentroids(stars: PositionedStar[]): Centroid[] {
    const byMonth: Record<string, PositionedStar[]> = {}
    stars.forEach(s => {
        if (!byMonth[s.monthKey]) byMonth[s.monthKey] = []
        byMonth[s.monthKey].push(s)
    })

    return Object.entries(byMonth).map(([monthKey, group]) => ({
        monthKey,
        label: getMonthLabel(monthKey),
        x: group.reduce((sum, s) => sum + s.x, 0) / group.length,
        y: Math.min(...group.map(s => s.y)) - 3.5,
    }))
}

function EmptySky() {
    return (
        <motion.div
            className={styles.empty}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
        >
            <motion.div
                className={styles.emptyStar}
                animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
                ✦
            </motion.div>
            <p className={styles.emptyTitle}>Your sky is still forming.</p>
            <p className={styles.emptyText}>
                Every storm you name, every breath you take in the grounding exercise,
                every bottle you send to sea — will be a star up here.
                <br /><br />
                Come back after your first session.
            </p>
        </motion.div>
    )
}

export default function ConstellationMap({ onBack }: { onBack: () => void }) {
    const [stars, setStars] = useState<PositionedStar[]>([])
    const [lines, setLines] = useState<Line[]>([])
    const [centroids, setCentroids] = useState<Centroid[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredStar, setHoveredStar] = useState<PositionedStar | null>(null)

    useEffect(() => {
        fetchConstellationData()
            .then(raw => {
                const positioned = positionStars(raw)
                setStars(positioned)
                setLines(buildLines(positioned))
                setCentroids(buildCentroids(positioned))
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const totalConstellations = new Set(stars.map(s => s.monthKey)).size

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
        >
            {/* Ambient background layers */}
            <div className={styles.nebula1} />
            <div className={styles.nebula2} />
            <div className={styles.horizon} />

            {/* Back button */}
            <button onClick={onBack} className={styles.backBtn}>
                〈 Back
            </button>

            {/* Header */}
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
            >
                <h1 className={styles.title}>✦ Your Constellations</h1>
                <p className={styles.subtitle}>
                    Every star is a moment you carried yourself through.
                </p>
            </motion.div>

            {/* Star Map */}
            <div className={styles.mapWrap}>
                {loading ? (
                    <div className={styles.loading}>
                        <motion.div
                            className={styles.loadingOrb}
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        />
                        <p className={styles.loadingText}>Reading the stars…</p>
                    </div>
                ) : stars.length === 0 ? (
                    <EmptySky />
                ) : (
                    <svg
                        className={styles.starMap}
                        viewBox="0 0 100 80"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            {/* Storm star glow */}
                            <filter id="glow-storm" x="-100%" y="-100%" width="300%" height="300%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            {/* Grounding star glow */}
                            <filter id="glow-grounding" x="-100%" y="-100%" width="300%" height="300%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            {/* Bottle star glow */}
                            <filter id="glow-bottle" x="-100%" y="-100%" width="300%" height="300%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            {/* Line glow */}
                            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
                            </filter>
                        </defs>

                        {/* Constellation lines */}
                        {lines.map((line, i) => (
                            <motion.line
                                key={`line-${i}`}
                                x1={line.x1} y1={line.y1}
                                x2={line.x2} y2={line.y2}
                                stroke="rgba(190, 170, 255, 0.2)"
                                strokeWidth="0.35"
                                strokeDasharray="1.2 1.0"
                                filter="url(#line-glow)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0 + i * 0.12, duration: 1.4 }}
                            />
                        ))}

                        {/* Month labels */}
                        {centroids.map((c, i) => (
                            <motion.text
                                key={`label-${c.monthKey}`}
                                x={c.x}
                                y={c.y}
                                textAnchor="middle"
                                fontSize="2.1"
                                fill="rgba(210, 195, 255, 0.28)"
                                fontFamily="Georgia, 'Times New Roman', serif"
                                fontStyle="italic"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.8 + i * 0.15, duration: 1 }}
                            >
                                {c.label}
                            </motion.text>
                        ))}

                        {/* Stars */}
                        {stars.map((star, i) => (
                            <motion.circle
                                key={star.id}
                                cx={star.x}
                                cy={star.y}
                                r={star.radius}
                                fill={star.color}
                                filter={`url(#glow-${star.type})`}
                                style={{ cursor: 'pointer' }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 0.75, 1],
                                    scale: 1,
                                }}
                                transition={{
                                    delay: 0.4 + i * 0.07,
                                    duration: 0.9,
                                    opacity: { duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: star.twinkleDelay + 1 }
                                }}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(null)}
                            />
                        ))}
                    </svg>
                )}

                {/* Hover tooltip */}
                <AnimatePresence>
                    {hoveredStar && (
                        <motion.div
                            className={styles.tooltip}
                            style={{
                                left: `${hoveredStar.x}%`,
                                top: `${hoveredStar.y}%`,
                            }}
                            initial={{ opacity: 0, y: 6, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span
                                className={styles.tooltipDot}
                                style={{ background: hoveredStar.color }}
                            />
                            <span className={styles.tooltipType}>
                                {TYPE_LABELS[hoveredStar.type as StarType]}
                            </span>
                            <span className={styles.tooltipRating}>
                                {hoveredStar.rating}/10
                            </span>
                            <span className={styles.tooltipDate}>
                                {new Date(hoveredStar.date).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                })}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Legend */}
            {!loading && stars.length > 0 && (
                <motion.div
                    className={styles.legend}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.9 }}
                >
                    <div className={styles.legendItems}>
                        {(['storm', 'grounding', 'bottle'] as StarType[]).map(type => (
                            <div key={type} className={styles.legendItem}>
                                <span
                                    className={styles.legendDot}
                                    style={{ background: TYPE_COLORS[type] }}
                                />
                                <span className={styles.legendLabel}>{TYPE_LABELS[type]}</span>
                            </div>
                        ))}
                    </div>
                    <p className={styles.legendStat}>
                        {stars.length} star{stars.length !== 1 ? 's' : ''}
                        {totalConstellations > 0 && ` · ${totalConstellations} constellation${totalConstellations !== 1 ? 's' : ''}`}
                    </p>
                </motion.div>
            )}
        </motion.div>
    )
}
