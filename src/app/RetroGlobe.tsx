// @ts-nocheck
'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'

export const RetroGlobe = () => {
  const [mounted, setMounted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lineWidth, setLineWidth] = useState(3)
  const [rotationSpeed, setRotationSpeed] = useState(1)
  const [wobbleSpeed, setWobbleSpeed] = useState(1)
  const [xRotationSpeed, setXRotationSpeed] = useState(0)
  const [zRotationSpeed, setZRotationSpeed] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [flashingButton, setFlashingButton] = useState<string | null>(null)
  const [userRotationX, setUserRotationX] = useState(0)
  const [userRotationY, setUserRotationY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [animationRotation, setAnimationRotation] = useState(0)
  
  // Check if all speeds are max and wobble is max for globe flashing effect
  const isGlobeFlashing = useMemo(() => {
    return wobbleSpeed === 5 && xRotationSpeed === 5 && rotationSpeed === 5 && zRotationSpeed === 5
  }, [wobbleSpeed, xRotationSpeed, rotationSpeed, zRotationSpeed])

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= 768)
  }, [])

  const R = useMemo(() => isMobile ? 100 : 120, [isMobile])

  // Control functions
  const flashButton = useCallback((buttonId: string) => {
    setFlashingButton(buttonId)
    setTimeout(() => setFlashingButton(null), 200)
  }, [])

  const incrementLineWidth = useCallback(() => {
    if (lineWidth >= 9) {
      flashButton('line-plus')
      return
    }
    setLineWidth(prev => Math.min(9, prev + 1))
  }, [lineWidth, flashButton])

  const decrementLineWidth = useCallback(() => {
    if (lineWidth <= 0) {
      flashButton('line-minus')
      return
    }
    setLineWidth(prev => Math.max(0, prev - 1))
  }, [lineWidth, flashButton])

  const setSpeedLevel = useCallback((axis: 'x' | 'y' | 'z', level: number) => {
    const clampedLevel = Math.max(0, Math.min(5, level))
    switch (axis) {
      case 'x':
        setXRotationSpeed(clampedLevel)
        break
      case 'y':
        setRotationSpeed(clampedLevel)
        break
      case 'z':
        setZRotationSpeed(clampedLevel)
        break
    }
  }, [])

  const incrementWobble = useCallback(() => {
    if (wobbleSpeed >= 5) {
      flashButton('wobble-plus')
      return
    }
    setWobbleSpeed(prev => Math.min(5, prev + 1))
  }, [wobbleSpeed, flashButton])

  const decrementWobble = useCallback(() => {
    if (wobbleSpeed <= 0) {
      flashButton('wobble-minus')
      return
    }
    setWobbleSpeed(prev => Math.max(0, prev - 1))
  }, [wobbleSpeed, flashButton])

  // Track animation rotation for manual control
  useEffect(() => {
    if (!mounted || isPaused || isDragging) return
    
    const interval = setInterval(() => {
      // Use stepping motion for speed level 0, normal rotation for levels 1-5
      const effectiveSpeed = rotationSpeed === 0 ? 0.1 : rotationSpeed
      setAnimationRotation(prev => (prev + (360 / (28 / effectiveSpeed)) / 60) % 360)
    }, 1000 / 60)
    
    return () => clearInterval(interval)
  }, [mounted, isPaused, isDragging, rotationSpeed])

  // Mouse and touch event handlers
  const handlePointerStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    setLastMousePos({ x: clientX, y: clientY })
  }, [])

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    
    const deltaX = clientX - lastMousePos.x
    const deltaY = clientY - lastMousePos.y
    
    const sensitivity = 0.5
    setUserRotationY(prev => prev + deltaX * sensitivity)
    setUserRotationX(prev => prev + deltaY * sensitivity)
    
    setLastMousePos({ x: clientX, y: clientY })
  }, [isDragging, lastMousePos])

  const handlePointerEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handlePointerStart(e.clientX, e.clientY)
  }, [handlePointerStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY)
  }, [handlePointerMove])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handlePointerStart(touch.clientX, touch.clientY)
  }, [handlePointerStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handlePointerMove(touch.clientX, touch.clientY)
  }, [handlePointerMove])

  // Generate latitude rings (horizontal circles)
  const latitudes = useMemo(() => {
    const rings = []
    for (let i = 0; i <= 8; i++) {
      const lat = -80 + (i * 20) // -80° to +80° in 20° steps
      const latRad = (lat * Math.PI) / 180
      const ringRadius = R * Math.cos(latRad)
      const yOffset = R * Math.sin(latRad)
      
      rings.push({
        lat,
        radius: ringRadius,
        yOffset,
        isEquator: lat === 0
      })
    }
    return rings
  }, [R])

  // Generate longitude meridians (vertical circles)
  const longitudes = useMemo(() => {
    const meridians = []
    for (let i = 0; i < 12; i++) {
      const lon = i * 30 // 0° to 330° in 30° steps
      meridians.push({
        lon,
        isPrimeMeridian: lon === 0
      })
    }
    return meridians
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  // Global mouse/touch event listeners for drag handling
  useEffect(() => {
    if (!mounted) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePointerMove(e.clientX, e.clientY)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handlePointerEnd()
      }
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault()
        const touch = e.touches[0]
        handlePointerMove(touch.clientX, touch.clientY)
      }
    }

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handlePointerEnd()
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd)
    document.addEventListener('touchcancel', handleGlobalTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
      document.removeEventListener('touchcancel', handleGlobalTouchEnd)
    }
  }, [mounted, isDragging, handlePointerMove, handlePointerEnd])

  if (!mounted) {
    return (
      <div className="retro-globe-container">
        <div className="globe-wrapper">
          <div className="globe-sphere">
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="retro-globe-container bg-bg-main">
      <div 
        className="globe-wrapper rounded-full"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div 
          className={`globe-sphere ${isPaused ? 'paused' : ''} ${isDragging ? 'dragging' : ''}`} 
          style={{ 
            animationDuration: rotationSpeed > 0 ? `${28 / rotationSpeed}s` : `${28 / 0.1}s`,
            transform: isDragging 
              ? `rotateX(${15 + userRotationX}deg) rotateY(${animationRotation + userRotationY}deg)` 
              : undefined
          }}
        >
          <div 
            className={`x-rotation-layer ${xRotationSpeed >= 0 ? 'active' : ''}`}
            style={{ 
              animationDuration: xRotationSpeed > 0 ? `${28 / xRotationSpeed}s` : `${28 / 0.1}s`
            }}
          >
            <div 
              className={`z-rotation-layer ${zRotationSpeed >= 0 ? 'active' : ''}`}
              style={{ 
                animationDuration: zRotationSpeed > 0 ? `${28 / zRotationSpeed}s` : `${28 / 0.1}s`
              }}
            >
              <div className="tilt-layer" style={{ animationDuration: `${12 / wobbleSpeed}s` }}>
                {/* True 3D Wireframe Grid */}
                <div className="wireframe-sphere">
              {/* Latitude rings */}
              {latitudes.map((lat, i) => (
                <div
                  key={`lat-${i}`}
                  className={`latitude-ring ${lat.isEquator ? 'equator' : ''} ${isGlobeFlashing ? 'globe-flashing-red' : ''}`}
                  style={{
                    width: `${R * 2}px`,
                    height: `${R * 2}px`,
                    transform: `translate3d(-50%, -50%, 0px) rotateX(${lat.lat}deg)`,
                    borderWidth: `${lat.isEquator ? lineWidth + 1 : lineWidth}px`,
                    animationDuration: `${28 / rotationSpeed}s`
                  }}
                />
              ))}
              
              {/* Longitude meridians */}
              {longitudes.map((lon, i) => (
                <div
                  key={`lon-${i}`}
                  className={`meridian-line ${lon.isPrimeMeridian ? 'prime-meridian' : ''} ${isGlobeFlashing ? 'globe-flashing-red' : ''}`}
                  style={{
                    transform: `rotateY(${lon.lon}deg)`,
                    borderWidth: `${lon.isPrimeMeridian ? lineWidth + 1 : lineWidth}px`,
                    animationDuration: `${28 / rotationSpeed}s`
                  }}
                />
              ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="globe-control-bar">
        <div className="control-bar-grid">
          <div className="boombox-controls play-pause">
            <button 
              className={`boombox-button ${!isPaused ? 'active' : 'inactive'}`}
              onClick={() => setIsPaused(false)}
            >
              ▶
            </button>
            <button 
              className={`boombox-button ${isPaused ? 'active' : 'inactive'}`}
              onClick={() => setIsPaused(true)}
            >
              ■
            </button>
          </div>
          <div className="boombox-controls labeled">
            <span className="control-label">LINE <span className="value-box"><span className={lineWidth > 0 ? 'glowing-digit' : ''}>{lineWidth}</span></span></span>
            <div className="control-buttons-row">
              <button 
                className={`boombox-button ${flashingButton === 'line-minus' ? 'flashing-red' : ''}`}
                onClick={decrementLineWidth}
              >
                -
              </button>
              <button 
                className={`boombox-button ${flashingButton === 'line-plus' ? 'flashing-red' : ''}`}
                onClick={incrementLineWidth}
              >
                +
              </button>
            </div>
          </div>
          <div className="boombox-controls equalizer-controls">
            <div className="vertical-speed-label">SPEED</div>
            <div className="equalizer-container">
              {['X', 'Y', 'Z'].map((axis, axisIndex) => {
                const currentSpeed = axis === 'X' ? xRotationSpeed : axis === 'Y' ? rotationSpeed : zRotationSpeed
                return (
                  <div key={axis} className="equalizer-row">
                    <div className="equalizer-levels">
                      {[0, 1, 2, 3, 5].map((level) => {
                        const isActive = level === currentSpeed
                        const isLitUp = level <= currentSpeed && currentSpeed > 0
                        const isMaxAndActive = level === 5 && isActive
                        const isActiveNotMax = isActive && level < 5
                        const shouldPulseRed = isMaxAndActive && wobbleSpeed === 5
                        return (
                          <button
                            key={level}
                            className={`equalizer-level ${isActiveNotMax ? 'active' : ''} ${shouldPulseRed ? 'active-red-pulsing' : isMaxAndActive ? 'active-red' : ''} ${isLitUp && !isActive ? 'lit-up' : ''}`}
                            onClick={() => setSpeedLevel(axis.toLowerCase() as 'x' | 'y' | 'z', level)}
                            data-level={level}
                          >
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="boombox-controls labeled">
            <span className="control-label">WOBBLE <span className="value-box"><span className={wobbleSpeed === 5 ? 'red-glowing-digit' : 'glowing-digit'}>{wobbleSpeed}</span></span></span>
            <div className="control-buttons-row">
              <button 
                className={`boombox-button ${flashingButton === 'wobble-minus' ? 'flashing-red' : ''}`}
                onClick={decrementWobble}
              >
                -
              </button>
              <button 
                className={`boombox-button ${flashingButton === 'wobble-plus' ? 'flashing-red' : ''}`}
                onClick={incrementWobble}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
