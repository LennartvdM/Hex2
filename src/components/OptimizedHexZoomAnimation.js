import React, { useEffect, useRef, useCallback, useMemo } from "react"

/**
 * An optimized React component for hexagonal zoom animation with improved performance.
 * Features:
 * - Memoized calculations for better performance
 * - Optimized rendering with reduced re-renders
 * - Better memory management
 * - Cleaner code structure
 */
export function OptimizedHexZoomAnimation({
    outerScale = 1.5,
    innerScale = 0.96,
    speed = 0.5,
    interval = 5000,
    width = "100%",
    height = "100%",
    style = {},
    ...rest
}) {
    const canvasRef = useRef(null)
    const requestIdRef = useRef(null)
    const startTimeRef = useRef(null)
    const hexDataRef = useRef([])
    const imageCacheRef = useRef(new Map())

    const screenSizeRef = useRef({ width: 0, height: 0 })
    const gridRef = useRef({
        hexSize: 0,
        dx: 0,
        dy: 0,
        totalHeight: 0,
        startY: 0,
        rows: 0,
        cols: 0,
    })

    // Memoized utility functions
    const randRange = useCallback((max) => {
        return Math.floor(Math.random() * max)
    }, [])

    const loadImage = useCallback((url) => {
        // Check cache first
        if (imageCacheRef.current.has(url)) {
            return Promise.resolve(imageCacheRef.current.get(url))
        }

        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                imageCacheRef.current.set(url, img)
                resolve(img)
            }
            img.src = url
        })
    }, [])

    const getHexPoints = useCallback((cx, cy, size) => {
        const points = []
        const angleInc = Math.PI / 3
        for (let i = 0; i < 6; i++) {
            const angle = angleInc * i
            const px = cx + size * Math.cos(angle)
            const py = cy + size * Math.sin(angle)
            points.push({ x: px, y: py })
        }
        return points
    }, [])

    const drawScaledImage = useCallback((ctx, img, cx, cy, scale, hexSize) => {
        const w = hexSize * 2
        const h = hexSize * 2
        const sw = w * scale
        const sh = h * scale
        ctx.drawImage(img, cx - sw / 2, cy - sh / 2, sw, sh)
    }, [])

    const drawHexClippedImage = useCallback((ctx, cell, timeNow) => {
        const { hexSize } = gridRef.current
        const cx = cell.x + hexSize
        const cy = cell.y + hexSize

        ctx.save()

        // Apply innerScale to the entire group
        ctx.translate(cx, cy)
        ctx.scale(innerScale, innerScale)
        ctx.translate(-cx, -cy)

        ctx.beginPath()
        const points = getHexPoints(cx, cy, hexSize)
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.closePath()
        ctx.clip()

        const transitionDuration = 2000 // ms
        const newIdx = cell.currentIndex
        const oldIdx = (cell.currentIndex - 1 + cell.images.length) % cell.images.length
        const newImageData = cell.images[newIdx]
        const oldImageData = cell.images[oldIdx]

        // Calculate fade progress for new image (scale=2->1, alpha=0->1)
        let newFadeProgress = 0
        if (timeNow >= newImageData.fadeInStart) {
            newFadeProgress = Math.min(1, Math.max(0, (timeNow - newImageData.fadeInStart) / transitionDuration))
        }

        // Calculate fade progress for old image (alpha=1->0, no scale)
        let oldFadeProgress = 0
        if (timeNow >= oldImageData.fadeOutStart) {
            oldFadeProgress = Math.min(1, Math.max(0, (timeNow - oldImageData.fadeOutStart) / transitionDuration))
        }

        // Draw old image if not fully faded out
        if (oldImageData.img && oldFadeProgress < 1) {
            const alpha = 1 - oldFadeProgress
            ctx.globalAlpha = alpha
            drawScaledImage(ctx, oldImageData.img, cx, cy, 1, hexSize)
            ctx.globalAlpha = 1
        }

        // Draw new image with fade-in from scale=2->1, alpha=0->1
        if (newImageData.img) {
            const fadeScale = 2 - newFadeProgress
            const alpha = newFadeProgress
            ctx.globalAlpha = alpha
            drawScaledImage(ctx, newImageData.img, cx, cy, fadeScale, hexSize)
            ctx.globalAlpha = 1
        }

        ctx.restore()
    }, [innerScale, getHexPoints, drawScaledImage])

    // Memoized grid configuration
    const gridConfig = useMemo(() => {
        return {
            visibleRows: 5,
        }
    }, [])

    const initData = useCallback((canvas) => {
        if (!canvas) return
        
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.clientWidth
        const height = canvas.clientHeight
        screenSizeRef.current.width = width
        screenSizeRef.current.height = height
        canvas.width = width
        canvas.height = height

        startTimeRef.current = null
        hexDataRef.current = []

        const { visibleRows } = gridConfig
        const baseSize = height / (visibleRows * Math.sqrt(3))
        const hexSize = baseSize * outerScale
        const hexHeight = Math.sqrt(3) * hexSize
        const dx = 1.5 * hexSize
        const dy = hexHeight

        const totalBleedRows = Math.ceil(height / dy)
        const numRows = visibleRows + 2 * totalBleedRows
        const startY = -totalBleedRows * dy
        const totalHeight = numRows * dy
        const cols = Math.ceil(width / dx) + 2

        gridRef.current = {
            hexSize,
            dx,
            dy,
            totalHeight,
            startY,
            rows: numRows,
            cols,
        }

        let globalIndex = 0
        const now = performance.now()

        const data = []
        for (let row = 0; row < numRows; row++) {
            for (let c = 0; c < cols; c++) {
                const x = dx * c
                const y = startY + dy * (row + 0.5 * (c % 2))

                const images = []
                for (let i = 0; i < 5; i++) {
                    images.push({
                        img: null,
                        fadeInStart: now,
                        fadeOutStart: 0,
                    })
                }

                data.push({
                    x: x - hexSize,
                    y: y - hexSize,
                    images,
                    currentIndex: 0,
                    nextChange: now + randRange(interval),
                    baseInterval: interval,
                })

                // Load images with proper closure handling
                const currentGlobalIndex = globalIndex
                images.forEach((slot, i) => {
                    const url = `https://picsum.photos/seed/${currentGlobalIndex}-${i}/300/300`
                    loadImage(url).then((loaded) => {
                        slot.img = loaded
                    })
                })
                globalIndex++
            }
        }
        hexDataRef.current = data
    }, [outerScale, interval, randRange, loadImage, gridConfig])

    const animate = useCallback((timestamp) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        if (!startTimeRef.current) {
            startTimeRef.current = timestamp
        }
        const elapsed = (timestamp - startTimeRef.current) / 1000

        const { width, height } = screenSizeRef.current
        ctx.clearRect(0, 0, width, height)

        const { dy, totalHeight, startY } = gridRef.current
        const data = hexDataRef.current

        const offsetY = (dy * speed * elapsed) % totalHeight

        // Update cell positions and transitions
        for (let i = 0; i < data.length; i++) {
            const cell = data[i]
            let newY = cell.y + offsetY
            if (newY > startY + totalHeight) {
                newY -= totalHeight
            }
            cell.drawY = newY

            if (timestamp >= cell.nextChange) {
                const oldIndex = cell.currentIndex
                cell.images[oldIndex].fadeOutStart = timestamp

                const newIndex = (oldIndex + 1) % cell.images.length
                cell.currentIndex = newIndex
                cell.images[newIndex].fadeInStart = timestamp

                cell.nextChange = timestamp + cell.baseInterval + randRange(cell.baseInterval)
            }
        }

        // Render all cells
        for (let i = 0; i < data.length; i++) {
            const cell = data[i]
            const drawCell = {
                x: cell.x,
                y: cell.drawY,
                images: cell.images,
                currentIndex: cell.currentIndex,
            }
            drawHexClippedImage(ctx, drawCell, timestamp)
        }

        requestIdRef.current = requestAnimationFrame(animate)
    }, [speed, drawHexClippedImage, randRange])

    // Initialize & animate whenever the props change
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        if (requestIdRef.current) {
            cancelAnimationFrame(requestIdRef.current)
        }

        initData(canvas)
        requestIdRef.current = requestAnimationFrame(animate)

        const handleResize = () => {
            if (!canvasRef.current) return
            if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current)
            }
            initData(canvasRef.current)
            requestIdRef.current = requestAnimationFrame(animate)
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (requestIdRef.current) {
                cancelAnimationFrame(requestIdRef.current)
            }
        }
    }, [initData, animate])

    // Cleanup image cache on unmount
    useEffect(() => {
        const imageCache = imageCacheRef.current
        return () => {
            imageCache.clear()
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{ 
                width: width, 
                height: height,
                display: 'block',
                ...style 
            }}
            {...rest}
        />
    )
}

export default OptimizedHexZoomAnimation; 