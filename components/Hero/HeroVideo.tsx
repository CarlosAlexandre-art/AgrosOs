// components/Hero/HeroVideo.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEOS = [
  { src: '/videos/hero-amanhecer', duration: 4 },
  { src: '/videos/hero-drone', duration: 4 },
  { src: '/videos/hero-colheita', duration: 4 },
]

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set first video source
    const current = VIDEOS[currentIndex]
    video.src = `${current.src}.mp4`

    const handleEnded = () => {
      const nextIndex = (currentIndex + 1) % VIDEOS.length
      setCurrentIndex(nextIndex)
    }

    // For demo, switch after duration + fade
    const switchVideo = () => {
      const nextIndex = (currentIndex + 1) % VIDEOS.length
      const nextVideo = VIDEOS[nextIndex]

      // Fade transition
      video.style.opacity = '0'
      timeoutRef.current = setTimeout(() => {
        video.src = `${nextVideo.src}.mp4`
        video.style.opacity = '1'
        video.play()
        setCurrentIndex(nextIndex)
      }, 500)
    }

    video.addEventListener('ended', handleEnded)

    // Also switch based on duration for safety
    const durationTimeout = setTimeout(switchVideo, (current.duration + 0.5) * 1000)

    return () => {
      video.removeEventListener('ended', handleEnded)
      clearTimeout(durationTimeout)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [currentIndex])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop={false}
      playsInline
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      style={{ opacity: 1 }}
    >
      Your browser does not support the video tag.
    </video>
  )
}
