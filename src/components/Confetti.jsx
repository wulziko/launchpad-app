import { useEffect, useRef } from 'react'

/**
 * Mini confetti burst for celebrations
 * Renders at the specified position relative to parent
 */
export function MiniConfetti({ active, x = '50%', y = '50%', particleCount = 30 }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
    
    // Calculate start position
    const startX = typeof x === 'string' && x.includes('%') 
      ? (parseFloat(x) / 100) * canvas.width 
      : parseFloat(x)
    const startY = typeof y === 'string' && y.includes('%')
      ? (parseFloat(y) / 100) * canvas.height
      : parseFloat(y)

    // Create particles
    const particles = Array.from({ length: particleCount }, () => ({
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 10 - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      gravity: 0.25,
      friction: 0.99,
      opacity: 1
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let activeParticles = 0
      particles.forEach(p => {
        if (p.opacity <= 0) return
        activeParticles++
        
        p.vy += p.gravity
        p.vx *= p.friction
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.opacity -= 0.015

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      })

      if (activeParticles > 0) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, x, y, particleCount])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

/**
 * Full screen confetti explosion
 */
export function FullConfetti({ active, duration = 3000, onComplete }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6']
    
    // Create particles
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.15,
      friction: 0.99,
      opacity: 1,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.1 + Math.random() * 0.1
    }))

    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let activeParticles = 0
      particles.forEach(p => {
        if (p.opacity <= 0 || p.y > canvas.height + 50) return
        activeParticles++
        
        p.wobble += p.wobbleSpeed
        p.vy += p.gravity
        p.vx *= p.friction
        p.x += p.vx + Math.sin(p.wobble) * 2
        p.y += p.vy
        p.rotation += p.rotationSpeed
        
        if (elapsed > duration * 0.7) {
          p.opacity -= 0.02
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        
        // Random shapes
        const shape = Math.floor(p.wobble) % 3
        if (shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        } else if (shape === 1) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -p.size / 2)
          ctx.lineTo(p.size / 2, p.size / 2)
          ctx.lineTo(-p.size / 2, p.size / 2)
          ctx.closePath()
          ctx.fill()
        }
        
        ctx.restore()
      })

      if (activeParticles > 0 && elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        onComplete?.()
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, duration, onComplete])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  )
}

export default MiniConfetti
