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
import type { AvatarConfig, Mood } from '../types'

type AvatarProps = {
  mood: Mood
  size?: 'sm' | 'md' | 'lg'
  config?: AvatarConfig
}

export const Avatar: React.FC<AvatarProps> = ({ mood, size = 'lg', config }) => {
  // Default config if none provided
  const activeConfig = config || { accessory: 'none', shirtColor: 'bg-slate-800' }

  const getMoodConfig = (m: Mood) => {
    switch (m) {
      case 'happy':
        return {
          icon: Smile,
          color: 'text-yellow-100',
          bg: 'bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500',
          shadow: 'shadow-orange-500/50',
          animation: 'animate-float-fast',
          glow: 'bg-yellow-400',
        }
      case 'sad':
        return {
          icon: CloudRain,
          color: 'text-blue-100',
          bg: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-slate-600',
          shadow: 'shadow-blue-500/50',
          animation: 'animate-float',
          glow: 'bg-blue-400',
        }
      case 'anxious':
        return {
          icon: Zap,
          color: 'text-purple-100',
          bg: 'bg-gradient-to-br from-purple-400 via-fuchsia-500 to-violet-600',
          shadow: 'shadow-purple-500/50',
          animation: 'animate-shake',
          glow: 'bg-purple-400',
        }
      case 'angry':
        return {
          icon: Flame,
          color: 'text-red-100',
          bg: 'bg-gradient-to-br from-orange-500 via-red-500 to-rose-600',
          shadow: 'shadow-red-500/50',
          animation: 'animate-pulse',
          glow: 'bg-red-500',
        }
      case 'calm':
        return {
          icon: Smile,
          color: 'text-teal-100',
          bg: 'bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600',
          shadow: 'shadow-teal-500/50',
          animation: 'animate-float',
          glow: 'bg-teal-400',
        }
      default:
        return {
          icon: Meh,
          color: 'text-slate-100',
          bg: 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600',
          shadow: 'shadow-slate-500/50',
          animation: 'animate-float',
          glow: 'bg-slate-400',
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
            className='-mt-1 absolute text-slate-900 opacity-90 mix-blend-overlay'
            size={sizePx}
            strokeWidth={2.5}
          />
        )
      case 'crown':
        return (
          <Crown
            className='-top-3/4 absolute text-yellow-300 drop-shadow-lg'
            fill='currentColor'
            size={sizePx}
            strokeWidth={2.5}
          />
        )
      case 'headphones':
        return (
          <Headphones
            className='absolute text-slate-900 mix-blend-overlay'
            size={sizePx * 1.4}
            strokeWidth={2}
          />
        )
      case 'bow':
        return (
          <Ribbon
            className='-top-2/3 absolute right-0 rotate-12 text-pink-400 drop-shadow-md'
            fill='currentColor'
            size={sizePx * 0.8}
            strokeWidth={2.5}
          />
        )
      case 'star':
        return (
          <Star
            className='-top-1/2 -right-1/4 absolute animate-pulse text-yellow-300 drop-shadow-lg'
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
            <div className='-left-4 absolute top-0 h-32 w-32 animate-blob rounded-full bg-yellow-300 opacity-50 mix-blend-overlay blur-xl filter' />
            <div
              className='-right-4 absolute top-0 h-32 w-32 animate-blob rounded-full bg-orange-300 opacity-50 mix-blend-overlay blur-xl filter'
              style={{ animationDelay: '2s' }}
            />
            <Sparkles
              className='absolute top-[20%] left-[20%] animate-pulse text-white/80'
              size={sizePx * 0.4}
            />
            <Sun
              className='absolute top-[15%] right-[25%] animate-spin-slow text-yellow-200/80 opacity-80'
              size={sizePx * 0.3}
              style={{ animationDuration: '10s' }}
            />
          </div>
        )
      case 'sad':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            <Cloud
              className='-translate-x-1/2 absolute top-[10%] left-[50%] text-white/20'
              fill='currentColor'
              size={sizePx * 0.8}
            />
            <Droplets
              className='absolute top-[40%] left-[30%] animate-rain text-blue-200 opacity-80'
              size={sizePx * 0.25}
            />
            <Droplets
              className='absolute top-[30%] right-[30%] animate-rain text-blue-200 opacity-80'
              size={sizePx * 0.25}
              style={{ animationDelay: '0.5s' }}
            />
          </div>
        )
      case 'anxious':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            <div
              className='absolute inset-0 animate-ping rounded-full border-[6px] border-white/20'
              style={{ animationDuration: '1.5s' }}
            />
            <Zap
              className='absolute top-[25%] left-[20%] animate-pulse fill-current text-yellow-300'
              size={sizePx * 0.4}
            />
            <Zap
              className='absolute right-[20%] bottom-[30%] animate-pulse fill-current text-yellow-300'
              size={sizePx * 0.3}
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        )
      case 'angry':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            <div className='absolute bottom-0 left-0 h-1/2 w-full animate-pulse bg-gradient-to-t from-red-900/40 to-transparent' />
            <Flame
              className='absolute bottom-[15%] left-[20%] animate-float-fast fill-current text-orange-300 opacity-60'
              size={sizePx * 0.5}
            />
            <Flame
              className='absolute right-[25%] bottom-[20%] animate-float-fast fill-current text-yellow-300 opacity-60'
              size={sizePx * 0.4}
              style={{ animationDelay: '0.5s' }}
            />
          </div>
        )
      case 'calm':
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            <div
              className='-bottom-1/2 -left-1/2 absolute h-[200%] w-[200%] animate-spin-slow rounded-[40%] bg-gradient-to-t from-teal-300/20 to-transparent opacity-40'
              style={{ animationDuration: '15s' }}
            />
            <Wind
              className='absolute top-[25%] right-[20%] animate-float text-teal-200 opacity-60'
              size={sizePx * 0.5}
            />
            <Circle
              className='absolute bottom-[30%] left-[30%] animate-float fill-current text-teal-100 opacity-60'
              size={sizePx * 0.15}
              style={{ animationDelay: '1s' }}
            />
          </div>
        )
      default:
        return (
          <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-full'>
            <Circle
              className='absolute top-[30%] left-[20%] animate-float text-white/30'
              size={sizePx * 0.2}
            />
            <Circle
              className='absolute right-[20%] bottom-[30%] animate-float text-white/30'
              size={sizePx * 0.15}
              style={{ animationDelay: '1.5s' }}
            />
          </div>
        )
    }
  }

  return (
    <div className={`relative ${sizeClasses[size]} group perspective-1000 mx-auto`}>
      {/* Avatar Sphere Container */}
      <div
        className={`relative h-full w-full rounded-full ${configData.bg}shadow-[inset_0_-20px_60px_rgba(0,0,0,0.5),inset_0_10px_40px_rgba(255,255,255,0.4),0_20px_40px_rgba(0,0,0,0.4)] isolate flex items-center justify-center overflow-hidden transition-all duration-500 ${configData.shadow}group-hover:scale-105`}
      >
        {/* 1. Mood Specific Effects Layer */}
        <div className='absolute inset-0 z-0'>{renderMoodEffects()}</div>

        {/* 2. Top Shine (Glossy Effect) */}
        <div className='-translate-x-1/2 pointer-events-none absolute top-2 left-1/2 z-10 h-[40%] w-[90%] rounded-full bg-gradient-to-b from-white/90 to-transparent opacity-80 blur-[2px]' />

        {/* 3. Bottom Glow (Reflected Light) */}
        <div className='pointer-events-none absolute bottom-0 left-0 z-10 h-[40%] w-full rounded-b-full bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay' />

        {/* 4. Character/Icon Layer */}
        <div className='relative z-20 flex flex-col items-center justify-center pb-2'>
          <div
            className={`relative flex transform items-center justify-center transition-transform duration-500 ${configData.animation}`}
          >
            {/* Base Face Icon with 3D Drop Shadow */}
            <Icon
              className={`${configData.color} relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] filter`}
              size={iconSize[size]}
              strokeWidth={2.5}
            />

            {/* Accessory Layer */}
            <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center'>
              {renderAccessory()}
            </div>
          </div>
        </div>
      </div>

      {/* Ground Shadow/Pedestal */}
      <div
        className={`-bottom-6 -translate-x-1/2 absolute left-1/2 h-4 w-2/3 transform rounded-[100%] bg-black/30 blur-xl transition-all duration-500 group-hover:w-3/4 group-hover:bg-black/40 ${configData.animation === 'animate-float' ? 'animate-pulse' : ''}
      `}
      />
    </div>
  )
}
