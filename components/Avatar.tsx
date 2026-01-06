'use client'

import {
  Circle,
  Cloud,
  CloudRain,
  Crown,
  Droplets,
  Flame,
  Glasses,
  Headphones,
  Heart,
  Meh,
  Ribbon,
  Smile,
  Sparkles,
  Star,
  Sun,
  Wind,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import type { AvatarConfig, Mood } from '../types'

type AvatarProps = {
  mood: Mood
  size?: 'sm' | 'md' | 'lg'
  config?: AvatarConfig
  interactive?: boolean
}

export const Avatar: React.FC<AvatarProps> = ({
  mood,
  size = 'lg',
  config,
  interactive = true,
}) => {
  // Default config if none provided
  const activeConfig = config || { accessory: 'none', shirtColor: 'bg-slate-800' }
  const [isTapped, setIsTapped] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [eyesBlink, setEyesBlink] = useState(false)

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setEyesBlink(true)
        setTimeout(() => setEyesBlink(false), 150)
      },
      3000 + Math.random() * 2000
    )

    return () => clearInterval(blinkInterval)
  }, [])

  // Handle tap/click animation
  const handleInteraction = () => {
    if (!interactive) return
    setIsTapped(true)
    setTimeout(() => setIsTapped(false), 300)

    // Create floating particles
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 1000)
  }

  const getMoodConfig = (m: Mood) => {
    switch (m) {
      case 'happy':
        return {
          icon: Smile,
          color: 'text-yellow-100',
          bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500',
          innerGlow: 'shadow-[inset_0_0_60px_rgba(251,191,36,0.4)]',
          shadow: 'shadow-[0_20px_60px_rgba(251,146,60,0.5)]',
          animation: 'animate-avatar-bounce',
          glow: 'bg-yellow-400',
          ringColor: 'ring-yellow-400/30',
          particleColor: 'text-yellow-300',
        }
      case 'sad':
        return {
          icon: CloudRain,
          color: 'text-blue-100',
          bg: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-slate-600',
          innerGlow: 'shadow-[inset_0_0_60px_rgba(99,102,241,0.3)]',
          shadow: 'shadow-[0_20px_60px_rgba(99,102,241,0.4)]',
          animation: 'animate-avatar-sway',
          glow: 'bg-blue-400',
          ringColor: 'ring-blue-400/30',
          particleColor: 'text-blue-300',
        }
      case 'anxious':
        return {
          icon: Zap,
          color: 'text-purple-100',
          bg: 'bg-gradient-to-br from-sky-400 via-cyan-500 to-cyan-500',
          innerGlow: 'shadow-[inset_0_0_60px_rgba(168,85,247,0.4)]',
          shadow: 'shadow-[0_20px_60px_rgba(168,85,247,0.5)]',
          animation: 'animate-avatar-jitter',
          glow: 'bg-purple-400',
          ringColor: 'ring-purple-400/30',
          particleColor: 'text-purple-300',
        }
      case 'angry':
        return {
          icon: Flame,
          color: 'text-red-100',
          bg: 'bg-gradient-to-br from-orange-500 via-red-500 to-rose-600',
          innerGlow: 'shadow-[inset_0_0_60px_rgba(239,68,68,0.4)]',
          shadow: 'shadow-[0_20px_60px_rgba(239,68,68,0.5)]',
          animation: 'animate-avatar-shake',
          glow: 'bg-red-500',
          ringColor: 'ring-red-400/30',
          particleColor: 'text-orange-300',
        }
      case 'calm':
        return {
          icon: Smile,
          color: 'text-teal-100',
          bg: 'bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600',
          innerGlow: 'shadow-[inset_0_0_60px_rgba(20,184,166,0.3)]',
          shadow: 'shadow-[0_20px_60px_rgba(20,184,166,0.4)]',
          animation: 'animate-avatar-breathe',
          glow: 'bg-teal-400',
          ringColor: 'ring-teal-400/30',
          particleColor: 'text-teal-300',
        }
      default:
        return {
          icon: Meh,
          color: 'text-slate-100',
          bg: 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600',
          innerGlow: 'shadow-[inset_0_0_60px_rgba(100,116,139,0.3)]',
          shadow: 'shadow-[0_20px_60px_rgba(100,116,139,0.4)]',
          animation: 'animate-avatar-float',
          glow: 'bg-slate-400',
          ringColor: 'ring-slate-400/30',
          particleColor: 'text-slate-300',
        }
    }
  }

  const configData = getMoodConfig(mood)
  const Icon = configData.icon

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-64 h-64',
  }

  const iconSize = {
    sm: 28,
    md: 56,
    lg: 110,
  }

  const renderAccessory = () => {
    const sizePx = iconSize[size]
    // Adjust accessory size/position relative to the base icon
    switch (activeConfig.accessory) {
      case 'glasses':
        return (
          <Glasses
            className='-mt-1 absolute text-slate-900/80 transition-transform duration-300 group-hover:scale-105'
            size={sizePx}
            strokeWidth={2.5}
          />
        )
      case 'crown':
        return (
          <Crown
            className='-top-3/4 absolute text-yellow-300 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)] transition-all duration-500 animate-crown-float'
            fill='currentColor'
            size={sizePx}
            strokeWidth={2.5}
          />
        )
      case 'headphones':
        return (
          <Headphones
            className='absolute text-slate-800/90 transition-transform duration-300 group-hover:scale-105'
            size={sizePx * 1.4}
            strokeWidth={2}
          />
        )
      case 'bow':
        return (
          <Ribbon
            className='-top-2/3 absolute right-0 rotate-12 text-pink-400 drop-shadow-[0_4px_12px_rgba(244,114,182,0.5)] transition-all duration-500 animate-bow-wiggle'
            fill='currentColor'
            size={sizePx * 0.8}
            strokeWidth={2.5}
          />
        )
      case 'star':
        return (
          <Star
            className='-top-1/2 -right-1/4 absolute text-yellow-300 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)] animate-star-twinkle'
            fill='currentColor'
            size={sizePx * 0.6}
            strokeWidth={2.5}
          />
        )
      default:
        return null
    }
  }

  const renderMoodEffects = () => {
    const sizePx = iconSize[size]
    // Use distinct background animations based on mood
    switch (mood) {
      case 'happy':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            {/* Animated gradient orbs */}
            <div className='-left-8 -top-8 absolute h-40 w-40 animate-orb-float rounded-full bg-gradient-radial from-yellow-300/60 to-transparent blur-2xl' />
            <div
              className='-right-8 -bottom-8 absolute h-40 w-40 animate-orb-float rounded-full bg-gradient-radial from-orange-300/60 to-transparent blur-2xl'
              style={{ animationDelay: '1.5s', animationDirection: 'reverse' }}
            />

            {/* Floating sparkles */}
            <Sparkles
              className='absolute top-[15%] left-[15%] animate-sparkle-float text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
              size={sizePx * 0.35}
            />
            <Sparkles
              className='absolute right-[20%] bottom-[25%] animate-sparkle-float text-yellow-200 drop-shadow-[0_0_8px_rgba(254,249,195,0.8)]'
              size={sizePx * 0.25}
              style={{ animationDelay: '0.5s' }}
            />

            {/* Rotating sun rays */}
            <Sun
              className='absolute top-[12%] right-[18%] animate-sun-rotate text-yellow-200/70'
              size={sizePx * 0.35}
            />

            {/* Love hearts floating up */}
            <Heart
              className='absolute bottom-[30%] left-[25%] animate-heart-float fill-current text-pink-300/60'
              size={sizePx * 0.2}
              style={{ animationDelay: '0.8s' }}
            />
          </div>
        )
      case 'sad':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            {/* Moody cloud layer */}
            <Cloud
              className='-translate-x-1/2 absolute top-[5%] left-[50%] animate-cloud-drift text-white/25'
              fill='currentColor'
              size={sizePx * 0.9}
            />
            <Cloud
              className='absolute top-[15%] left-[10%] animate-cloud-drift text-white/15'
              fill='currentColor'
              size={sizePx * 0.5}
              style={{ animationDelay: '2s', animationDirection: 'reverse' }}
            />

            {/* Falling rain drops */}
            <Droplets
              className='absolute top-[35%] left-[25%] animate-rain-fall text-blue-200/80 drop-shadow-[0_2px_4px_rgba(147,197,253,0.5)]'
              size={sizePx * 0.2}
            />
            <Droplets
              className='absolute top-[30%] left-[50%] animate-rain-fall text-blue-200/80 drop-shadow-[0_2px_4px_rgba(147,197,253,0.5)]'
              size={sizePx * 0.25}
              style={{ animationDelay: '0.3s' }}
            />
            <Droplets
              className='absolute top-[40%] right-[25%] animate-rain-fall text-blue-200/80 drop-shadow-[0_2px_4px_rgba(147,197,253,0.5)]'
              size={sizePx * 0.18}
              style={{ animationDelay: '0.7s' }}
            />
          </div>
        )
      case 'anxious':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            {/* Pulsing anxiety ring */}
            <div className='absolute inset-2 animate-anxiety-pulse rounded-full border-[3px] border-purple-300/40' />
            <div
              className='absolute inset-4 animate-anxiety-pulse rounded-full border-[2px] border-fuchsia-300/30'
              style={{ animationDelay: '0.3s' }}
            />

            {/* Electric zaps */}
            <Zap
              className='absolute top-[20%] left-[15%] animate-zap-flash fill-current text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]'
              size={sizePx * 0.35}
            />
            <Zap
              className='absolute top-[30%] right-[18%] animate-zap-flash fill-current text-yellow-200 drop-shadow-[0_0_12px_rgba(254,240,138,0.8)]'
              size={sizePx * 0.28}
              style={{ animationDelay: '0.2s' }}
            />
            <Zap
              className='absolute bottom-[25%] left-[25%] animate-zap-flash fill-current text-purple-200 drop-shadow-[0_0_12px_rgba(221,214,254,0.8)]'
              size={sizePx * 0.22}
              style={{ animationDelay: '0.5s' }}
            />

            {/* Nervous sparkles */}
            <Sparkles
              className='absolute right-[25%] bottom-[35%] animate-sparkle-nervous text-white/60'
              size={sizePx * 0.18}
            />
          </div>
        )
      case 'angry':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            {/* Fire gradient from bottom */}
            <div className='absolute bottom-0 left-0 h-2/3 w-full animate-fire-glow bg-gradient-to-t from-red-600/50 via-orange-500/30 to-transparent' />

            {/* Rising flames */}
            <Flame
              className='absolute bottom-[10%] left-[18%] animate-flame-rise fill-current text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]'
              size={sizePx * 0.45}
            />
            <Flame
              className='absolute bottom-[15%] left-[45%] animate-flame-rise fill-current text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]'
              size={sizePx * 0.5}
              style={{ animationDelay: '0.2s' }}
            />
            <Flame
              className='absolute right-[20%] bottom-[12%] animate-flame-rise fill-current text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.8)]'
              size={sizePx * 0.4}
              style={{ animationDelay: '0.4s' }}
            />

            {/* Smoke wisps */}
            <div className='absolute top-[15%] left-[30%] h-8 w-8 animate-smoke-rise rounded-full bg-slate-400/20 blur-md' />
            <div
              className='absolute top-[20%] right-[35%] h-6 w-6 animate-smoke-rise rounded-full bg-slate-400/15 blur-md'
              style={{ animationDelay: '0.6s' }}
            />
          </div>
        )
      case 'calm':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            {/* Zen rotating gradient */}
            <div className='-bottom-1/2 -left-1/2 absolute h-[200%] w-[200%] animate-zen-rotate rounded-[40%] bg-gradient-conic from-teal-300/15 via-emerald-200/10 to-teal-300/15' />

            {/* Floating zen circles */}
            <Circle
              className='absolute top-[25%] left-[22%] animate-zen-float fill-current text-teal-200/50'
              size={sizePx * 0.12}
            />
            <Circle
              className='absolute top-[35%] right-[25%] animate-zen-float fill-current text-emerald-200/40'
              size={sizePx * 0.15}
              style={{ animationDelay: '1s' }}
            />
            <Circle
              className='absolute bottom-[30%] left-[35%] animate-zen-float fill-current text-cyan-200/45'
              size={sizePx * 0.1}
              style={{ animationDelay: '2s' }}
            />

            {/* Gentle wind */}
            <Wind
              className='absolute top-[20%] right-[15%] animate-wind-blow text-teal-200/60'
              size={sizePx * 0.4}
            />

            {/* Meditation glow */}
            <div className='absolute inset-8 animate-meditation-glow rounded-full bg-gradient-radial from-white/10 to-transparent' />
          </div>
        )
      default:
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            {/* Subtle floating circles */}
            <Circle
              className='absolute top-[28%] left-[18%] animate-zen-float fill-current text-white/20'
              size={sizePx * 0.15}
            />
            <Circle
              className='absolute top-[40%] right-[22%] animate-zen-float fill-current text-white/15'
              size={sizePx * 0.12}
              style={{ animationDelay: '1s' }}
            />
            <Circle
              className='absolute bottom-[32%] left-[40%] animate-zen-float fill-current text-white/18'
              size={sizePx * 0.1}
              style={{ animationDelay: '2s' }}
            />
          </div>
        )
    }
  }

  return (
    <div className={`relative ${sizeClasses[size]} group perspective-1000 mx-auto`}>
      {/* Continuous ambient glow - always animating */}
      <div
        className={`absolute inset-[-8px] animate-pulse-glow rounded-full bg-gradient-to-r ${
          mood === 'happy'
            ? 'from-yellow-400/40 via-orange-400/30 to-yellow-400/40'
            : mood === 'sad'
              ? 'from-blue-400/40 via-indigo-400/30 to-blue-400/40'
              : mood === 'anxious'
                ? 'from-purple-400/40 via-cyan-400/30 to-purple-400/40'
                : mood === 'angry'
                  ? 'from-red-400/40 via-orange-400/30 to-red-400/40'
                  : mood === 'calm'
                    ? 'from-teal-400/40 via-emerald-400/30 to-teal-400/40'
                    : 'from-slate-400/40 via-slate-300/30 to-slate-400/40'
        } blur-xl`}
      />

      {/* Rotating ring animation */}
      <div className='absolute inset-[-4px] animate-spin-slow rounded-full opacity-60'>
        <div
          className={`h-full w-full rounded-full bg-gradient-conic ${
            mood === 'happy'
              ? 'from-yellow-500/0 via-yellow-400/50 to-yellow-500/0'
              : mood === 'sad'
                ? 'from-blue-500/0 via-blue-400/50 to-blue-500/0'
                : mood === 'anxious'
                  ? 'from-cyan-500/0 via-purple-400/50 to-cyan-500/0'
                  : mood === 'angry'
                    ? 'from-red-500/0 via-red-400/50 to-red-500/0'
                    : mood === 'calm'
                      ? 'from-teal-500/0 via-teal-400/50 to-teal-500/0'
                      : 'from-slate-500/0 via-slate-400/50 to-slate-500/0'
          }`}
        />
      </div>

      {/* Outer glow ring */}
      <div
        className={`absolute inset-0 rounded-full ${configData.ringColor} ring-4 ring-inset opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      {/* Floating particles on interaction */}
      {particles.map((particle) => (
        <div
          className={`absolute z-50 animate-particle-float ${configData.particleColor}`}
          key={particle.id}
          style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
        >
          <Sparkles size={12} />
        </div>
      ))}

      {/* Avatar Sphere Container */}
      <button
        aria-label={`Avatar com humor ${mood}`}
        className={`relative h-full w-full rounded-full ${configData.bg} ${configData.innerGlow} ${configData.shadow} isolate flex cursor-pointer items-center justify-center overflow-hidden transition-all duration-500 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 group-hover:scale-105 ${isTapped ? 'scale-95' : ''}`}
        onClick={handleInteraction}
        onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
        type='button'
      >
        {/* 1. Mood Specific Effects Layer */}
        <div className='absolute inset-0 z-0'>{renderMoodEffects()}</div>

        {/* 2. Animated Background Gradient - continuous rotation */}
        <div className='absolute inset-0 z-[1] animate-gradient-rotate rounded-full bg-gradient-to-br from-white/25 via-transparent to-black/20 opacity-70' />

        {/* 3. Top Shine (Glossy Effect) - Enhanced with animation */}
        <div className='-translate-x-1/2 pointer-events-none absolute top-[5%] left-1/2 z-10 h-[35%] w-[85%] animate-shine-pulse rounded-full bg-gradient-to-b from-white/80 via-white/40 to-transparent blur-[1px]' />

        {/* 4. Secondary shine highlight */}
        <div className='pointer-events-none absolute top-[8%] left-[15%] z-10 h-[15%] w-[20%] rotate-[-20deg] rounded-full bg-white/50 blur-sm' />

        {/* 5. Bottom Glow (Reflected Light) - Enhanced */}
        <div className='pointer-events-none absolute bottom-0 left-0 z-10 h-[45%] w-full rounded-b-full bg-gradient-to-t from-white/25 via-white/10 to-transparent mix-blend-overlay' />

        {/* 6. Character/Icon Layer - always animating */}
        <div className='relative z-20 flex flex-col items-center justify-center pb-2'>
          <div
            className={`relative flex transform items-center justify-center transition-all duration-500 ${configData.animation} ${eyesBlink ? 'scale-y-90' : ''}`}
          >
            {/* Base Face Icon with enhanced 3D effect */}
            <Icon
              className={`${configData.color} relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition-transform duration-200`}
              size={iconSize[size]}
              strokeWidth={2.5}
            />

            {/* Accessory Layer */}
            <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center'>
              {renderAccessory()}
            </div>
          </div>
        </div>

        {/* Inner edge shadow for depth */}
        <div className='pointer-events-none absolute inset-0 z-30 rounded-full shadow-[inset_0_-15px_30px_rgba(0,0,0,0.3),inset_0_5px_15px_rgba(255,255,255,0.2)]' />
      </button>

      {/* Ground Shadow/Pedestal - Enhanced with continuous animation */}
      <div className='-bottom-8 -translate-x-1/2 absolute left-1/2 h-5 w-[60%] transform animate-shadow-breathe rounded-[100%] bg-black/25 blur-xl transition-all duration-500 group-hover:w-[70%] group-hover:bg-black/35' />

      {/* Secondary ambient shadow */}
      <div className='-bottom-4 -translate-x-1/2 absolute left-1/2 h-3 w-[40%] transform rounded-[100%] bg-black/15 blur-md transition-all duration-500 group-hover:w-[50%]' />
    </div>
  )
}
