import React, { useEffect, useRef } from "react"

/**
 * A custom React component that replicates the Hexagonal Zoom Animation logic.
 * - outerScale: scales the overall hex size
 * - innerScale: shrinks (or expands) the entire hex + image
 * - speed: scroll speed in rows per second
 * - interval: base time (ms) before changing images in each hex
 *
 * This uses HTML Canvas to draw hexagons and images, performing fade/zoom transitions.
 * The outgoing image fades only (no zoom), and the incoming image zooms from scale=2→1.
 *
 * Usage:
 * 1) Import this component into your React project.
 * 2) Use it in your JSX with the desired props.
 * 3) Adjust props via the component props (outerScale, innerScale, speed, interval).
 */
export function FramerHexZoomAnimation({
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

    function randRange(max) {
        return Math.floor(Math.random() * max)
    }

    function loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => resolve(img)
            img.src = url
        })
    }

    function getHexPoints(cx, cy, size) {
        const points = []
        const angleInc = Math.PI / 3
        for (let i = 0; i < 6; i++) {
            const angle = angleInc * i
            const px = cx + size * Math.cos(angle)
            const py = cy + size * Math.sin(angle)
            points.push({ x: px, y: py })
        }
        return points
    }

    function drawHexClippedImage(ctx, cell, timeNow) {
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
        const oldIdx =
            (cell.currentIndex - 1 + cell.images.length) % cell.images.length
        const newImageData = cell.images[newIdx]
        const oldImageData = cell.images[oldIdx]

        // new image fade in: scale=2->1, alpha=0->1
        let newFadeProgress = 0
        if (timeNow >= newImageData.fadeInStart) {
            newFadeProgress =
                (timeNow - newImageData.fadeInStart) / transitionDuration
            if (newFadeProgress < 0) newFadeProgress = 0
            if (newFadeProgress > 1) newFadeProgress = 1
        }

        // old image fade out: alpha=1->0, no scale
        let oldFadeProgress = 0
        if (timeNow >= oldImageData.fadeOutStart) {
            oldFadeProgress =
                (timeNow - oldImageData.fadeOutStart) / transitionDuration
            if (oldFadeProgress < 0) oldFadeProgress = 0
            if (oldFadeProgress > 1) oldFadeProgress = 1
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
            const fadeScale = 2 - newFadeProgress * (2 - 1)
            const alpha = newFadeProgress
            ctx.globalAlpha = alpha
            drawScaledImage(ctx, newImageData.img, cx, cy, fadeScale, hexSize)
            ctx.globalAlpha = 1
        }

        ctx.restore()
    }

    function drawScaledImage(ctx, img, cx, cy, scale, hexSize) {
        const w = hexSize * 2
        const h = hexSize * 2
        const sw = w * scale
        const sh = h * scale
        ctx.drawImage(img, cx - sw / 2, cy - sh / 2, sw, sh)
    }

    function initData(canvas) {
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

        const visibleRows = 5
        const baseSize = height / (visibleRows * Math.sqrt(3))
        const hexSize = baseSize * outerScale
        const hexHeight = Math.sqrt(3) * hexSize
        const dx = 1.5 * hexSize
        const dy = hexHeight
        const scrollSpeed = dy * speed

        const bleedRows = Math.ceil(height / dy)
        const numRows = visibleRows + 2 * bleedRows
        const startY = -bleedRows * dy
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

                images.forEach((slot, i) => {
                    const url = `https://picsum.photos/seed/${globalIndex}-${i}/300/300`
                    loadImage(url).then((loaded) => {
                        slot.img = loaded
                    })
                })
                globalIndex++
            }
        }
        hexDataRef.current = data
    }

    function animate(timestamp) {
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

        const { dx, dy, totalHeight, startY } = gridRef.current
        const data = hexDataRef.current

        const offsetY = (dy * speed * elapsed) % totalHeight

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

                cell.nextChange =
                    timestamp + cell.baseInterval + randRange(cell.baseInterval)
            }
        }

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
    }

    // Initialize & animate whenever the props change
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        if (requestIdRef.current) {
            cancelAnimationFrame(requestIdRef.current)
        }

        initData(canvas)
        requestIdRef.current = requestAnimationFrame(animate)

        function handleResize() {
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
    }, [outerScale, innerScale, speed, interval])

    // Canvas is sized to fill the container
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

export default FramerHexZoomAnimation; 