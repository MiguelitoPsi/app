import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './views/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'subtle-shimmer': 'shimmer 5s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        shake: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both infinite',
        blob: 'blob 7s infinite',
        rain: 'rain 1.5s linear infinite',
        // Avatar animations
        'avatar-bounce': 'avatarBounce 2s ease-in-out infinite',
        'avatar-sway': 'avatarSway 4s ease-in-out infinite',
        'avatar-jitter': 'avatarJitter 0.3s ease-in-out infinite',
        'avatar-shake': 'avatarShake 0.5s ease-in-out infinite',
        'avatar-breathe': 'avatarBreathe 4s ease-in-out infinite',
        'avatar-float': 'avatarFloat 5s ease-in-out infinite',
        // Continuous ambient animations
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spinSlow 8s linear infinite',
        'gradient-rotate': 'gradientRotate 6s linear infinite',
        'shine-pulse': 'shinePulse 4s ease-in-out infinite',
        'shadow-breathe': 'shadowBreathe 4s ease-in-out infinite',
        // Effect animations
        'sparkle-float': 'sparkleFloat 3s ease-in-out infinite',
        'sun-rotate': 'sunRotate 12s linear infinite',
        'heart-float': 'heartFloat 4s ease-in-out infinite',
        'cloud-drift': 'cloudDrift 8s ease-in-out infinite',
        'rain-fall': 'rainFall 1.5s linear infinite',
        'anxiety-pulse': 'anxietyPulse 1.2s ease-in-out infinite',
        'zap-flash': 'zapFlash 0.8s ease-in-out infinite',
        'sparkle-nervous': 'sparkleNervous 0.5s ease-in-out infinite',
        'flame-rise': 'flameRise 1.5s ease-in-out infinite',
        'fire-glow': 'fireGlow 2s ease-in-out infinite',
        'smoke-rise': 'smokeRise 3s ease-out infinite',
        'zen-rotate': 'zenRotate 20s linear infinite',
        'zen-float': 'zenFloat 6s ease-in-out infinite',
        'wind-blow': 'windBlow 4s ease-in-out infinite',
        'meditation-glow': 'meditationGlow 4s ease-in-out infinite',
        'orb-float': 'orbFloat 6s ease-in-out infinite',
        'particle-float': 'particleFloat 1s ease-out forwards',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'shadow-pulse': 'shadowPulse 4s ease-in-out infinite',
        'crown-float': 'crownFloat 3s ease-in-out infinite',
        'bow-wiggle': 'bowWiggle 2s ease-in-out infinite',
        'star-twinkle': 'starTwinkle 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '100%': { transform: 'translateX(250%) skewX(-12deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        rain: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
        // Avatar keyframes
        avatarBounce: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '25%': { transform: 'translateY(-8px) scale(1.02)' },
          '50%': { transform: 'translateY(0) scale(1)' },
          '75%': { transform: 'translateY(-4px) scale(1.01)' },
        },
        avatarSway: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(-5px) rotate(-2deg)' },
          '75%': { transform: 'translateX(5px) rotate(2deg)' },
        },
        avatarJitter: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-2px, 1px)' },
          '50%': { transform: 'translate(2px, -1px)' },
          '75%': { transform: 'translate(-1px, -2px)' },
        },
        avatarShake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-3deg)' },
          '40%': { transform: 'rotate(3deg)' },
          '60%': { transform: 'rotate(-2deg)' },
          '80%': { transform: 'rotate(2deg)' },
        },
        avatarBreathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        avatarFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        // Effect keyframes
        sparkleFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.8' },
          '50%': { transform: 'translateY(-15px) scale(1.2)', opacity: '1' },
        },
        sunRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        heartFloat: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.6' },
          '50%': { transform: 'translateY(-20px) scale(1.1)', opacity: '0.9' },
          '100%': { transform: 'translateY(-40px) scale(0.8)', opacity: '0' },
        },
        cloudDrift: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        rainFall: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '20%': { opacity: '0.8' },
          '100%': { transform: 'translateY(30px)', opacity: '0' },
        },
        anxietyPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
        zapFlash: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        sparkleNervous: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(-10deg) scale(1.1)' },
          '75%': { transform: 'rotate(10deg) scale(0.9)' },
        },
        flameRise: {
          '0%, 100%': { transform: 'translateY(0) scaleY(1)', opacity: '0.7' },
          '50%': { transform: 'translateY(-8px) scaleY(1.1)', opacity: '1' },
        },
        fireGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.7' },
        },
        smokeRise: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.2' },
          '100%': { transform: 'translateY(-40px) scale(2)', opacity: '0' },
        },
        zenRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        zenFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.4' },
          '50%': { transform: 'translateY(-8px) scale(1.1)', opacity: '0.6' },
        },
        windBlow: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)', opacity: '0.5' },
          '50%': { transform: 'translateX(5px) rotate(5deg)', opacity: '0.7' },
        },
        meditationGlow: {
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(1.1)' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(15px, -10px) scale(1.1)' },
          '66%': { transform: 'translate(-10px, 5px) scale(0.95)' },
        },
        particleFloat: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-50px) scale(0)', opacity: '0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shadowPulse: {
          '0%, 100%': { transform: 'translateX(-50%) scaleX(1)', opacity: '0.25' },
          '50%': { transform: 'translateX(-50%) scaleX(1.1)', opacity: '0.35' },
        },
        crownFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-5px) rotate(2deg)' },
        },
        bowWiggle: {
          '0%, 100%': { transform: 'rotate(12deg)' },
          '50%': { transform: 'rotate(18deg)' },
        },
        starTwinkle: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2) rotate(15deg)', opacity: '1' },
        },
        // Continuous ambient keyframes
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        gradientRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shinePulse: {
          '0%, 100%': { opacity: '0.8', transform: 'translateX(-50%) scaleX(1)' },
          '50%': { opacity: '1', transform: 'translateX(-50%) scaleX(1.02)' },
        },
        shadowBreathe: {
          '0%, 100%': { transform: 'translateX(-50%) scaleX(1) scaleY(1)', opacity: '0.25' },
          '50%': { transform: 'translateX(-50%) scaleX(1.15) scaleY(0.9)', opacity: '0.35' },
        },
      },
    },
  },
  plugins: [],
}

export default config
