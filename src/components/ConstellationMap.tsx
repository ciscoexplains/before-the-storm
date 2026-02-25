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
        y: Math.min(...group.map(s => s.y)) - 5, // Increased spacing
    }))
}

function BackgroundStars() {
    const [stars, setStars] = useState<{ id: number; x: number; y: number; s: number; o: number }[]>([])

    useEffect(() => {
        const newStars = Array.from({ length: 120 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            s: 0.5 + Math.random() * 1.5,
            o: 0.1 + Math.random() * 0.4,
        }))
        setStars(newStars)
    }, [])

    return (
        <div className={styles.bgStars}>
            {stars.map(s => (
                <div
                    key={s.id}
                    className={styles.bgStar}
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: `${s.s}px`,
                        height: `${s.s}px`,
                        opacity: s.o,
                    }}
                />
            ))}
        </div>
    )
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
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            >
                ✦
            </motion.div>
            <p className={styles.emptyTitle}>your sky is still forming.</p>
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
    const [selectedStar, setSelectedStar] = useState<PositionedStar | null>(null)

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

    const handleStarClick = (e: React.MouseEvent, star: PositionedStar) => {
        e.stopPropagation()
        setSelectedStar(prev => (prev?.id === star.id ? null : star))
    }

    const totalConstellations = new Set(stars.map(s => s.monthKey)).size

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            onClick={() => setSelectedStar(null)}
        >
            <BackgroundStars />
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 1.4, ease: 'easeOut' }}
            >
                <h1 className={styles.title}>✦ your constellations</h1>
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
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        />
                        <p className={styles.loadingText}>reading the stars…</p>
                    </div>
                ) : stars.length === 0 ? (
                    <EmptySky />
                ) : (
                    <svg
                        className={styles.starMap}
                        viewBox="0 0 100 80"
                        preserveAspectRatio="xMidYMid meet"
                        onClick={() => setSelectedStar(null)}
                    >
                        <defs>
                            {/* Layered glows for more organic light */}
                            <filter id="glow-storm" x="-150%" y="-150%" width="400%" height="400%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur1" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur2" />
                                <feMerge>
                                    <feMergeNode in="blur2" />
                                    <feMergeNode in="blur1" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="glow-grounding" x="-150%" y="-150%" width="400%" height="400%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur1" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="blur2" />
                                <feMerge>
                                    <feMergeNode in="blur2" />
                                    <feMergeNode in="blur1" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="glow-bottle" x="-150%" y="-150%" width="400%" height="400%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur1" />
                                <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blur2" />
                                <feMerge>
                                    <feMergeNode in="blur2" />
                                    <feMergeNode in="blur1" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            {/* Line glow */}
                            <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
                            </filter>
                        </defs>

                        {/* Constellation lines */}
                        {lines.map((line, i) => (
                            <motion.line
                                key={`line-${i}`}
                                x1={line.x1} y1={line.y1}
                                x2={line.x2} y2={line.y2}
                                stroke="rgba(200, 190, 255, 0.15)"
                                strokeWidth="0.25"
                                strokeDasharray="1 1.5"
                                filter="url(#line-glow)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 + i * 0.1, duration: 2 }}
                            />
                        ))}

                        {/* Month labels */}
                        {centroids.map((c, i) => (
                            <motion.text
                                key={`label-${c.monthKey}`}
                                x={c.x}
                                y={c.y}
                                textAnchor="middle"
                                fontSize="1.8"
                                fill="rgba(215, 210, 255, 0.22)"
                                fontFamily="Georgia, serif"
                                fontStyle="italic"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 + i * 0.2, duration: 1.5 }}
                            >
                                {c.label}
                            </motion.text>
                        ))}

                        {/* Stars */}
                        {stars.map((star, i) => (
                            <g key={star.id}>
                                <motion.circle
                                    cx={star.x}
                                    cy={star.y}
                                    r={star.radius * 0.8}
                                    fill={star.color}
                                    filter={`url(#glow-${star.type})`}
                                    style={{
                                        cursor: 'pointer',
                                        outline: selectedStar?.id === star.id ? '1px solid rgba(255,255,255,0.4)' : 'none',
                                        outlineOffset: '4px'
                                    }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0.7, 1],
                                        scale: selectedStar?.id === star.id ? 1.4 : 1,
                                    }}
                                    transition={{
                                        delay: 0.5 + i * 0.05,
                                        duration: 1.2,
                                        opacity: { duration: 4, repeat: Infinity, repeatType: 'reverse', delay: star.twinkleDelay + 2 },
                                        scale: { duration: 0.3 }
                                    }}
                                    onClick={(e) => handleStarClick(e, star)}
                                />

                                {/* Selected Star Details */}
                                <AnimatePresence>
                                    {selectedStar?.id === star.id && (
                                        <foreignObject
                                            x={star.x - 20}
                                            y={star.y - 30}
                                            width="40"
                                            height="30"
                                            style={{ overflow: 'visible', pointerEvents: 'none' }}
                                        >
                                            <motion.div
                                                className={styles.tooltip}
                                                style={{ pointerEvents: 'auto' }}
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className={styles.tooltipHeader}>
                                                    <span
                                                        className={styles.tooltipDot}
                                                        style={{ background: selectedStar.color, boxShadow: `0 0 10px ${selectedStar.color}` }}
                                                    />
                                                    <span className={styles.tooltipType}>
                                                        {TYPE_LABELS[selectedStar.type as StarType]}
                                                    </span>
                                                </div>
                                                <span className={styles.tooltipRating}>
                                                    {selectedStar.rating}/10
                                                </span>
                                                <span className={styles.tooltipDate}>
                                                    {new Date(selectedStar.date).toLocaleDateString('en-US', {
                                                        month: 'long', day: 'numeric'
                                                    })}
                                                </span>
                                            </motion.div>
                                        </foreignObject>
                                    )}
                                </AnimatePresence>
                            </g>
                        ))}
                    </svg>
                )}
            </div>

            {/* Legend */}
            {!loading && stars.length > 0 && (
                <motion.div
                    className={styles.legend}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.5, duration: 1.2, ease: 'easeOut' }}
                >
                    <div className={styles.legendItems}>
                        {(['storm', 'grounding', 'bottle'] as StarType[]).map(type => (
                            <div key={type} className={styles.legendItem}>
                                <span
                                    className={styles.legendDot}
                                    style={{ background: TYPE_COLORS[type], color: TYPE_COLORS[type] }}
                                />
                                <span className={styles.legendLabel}>{TYPE_LABELS[type].toLowerCase()}</span>
                            </div>
                        ))}
                    </div>
                    <p className={styles.legendStat}>
                        {stars.length} star{stars.length !== 1 ? 's' : ''} in the sky
                        {totalConstellations > 0 && ` · ${totalConstellations} constellation${totalConstellations !== 1 ? 's' : ''}`}
                    </p>
                </motion.div>
            )}
        </motion.div>
    )
}
