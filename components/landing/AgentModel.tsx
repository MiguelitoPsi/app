'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'

interface AgentModelProps {
  modelPath: string
  position: [number, number, number]
  scale?: number
}

export function AgentModel({ modelPath, position, scale = 1 }: AgentModelProps) {
  const { scene } = useGLTF(modelPath)
  const groupRef = useRef<THREE.Group>(null)
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((_, _delta) => {
    if (groupRef.current) {
      const maxAngle = (10 * Math.PI) / 180 // 10 degrees
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.001 + timeOffset.current) * maxAngle
    }
  })

  return (
    <group position={position} ref={groupRef} scale={scale}>
      <primitive object={scene.clone()} />
    </group>
  )
}

// Preload all models
useGLTF.preload('/3d/miguel.glb')
useGLTF.preload('/3d/tarefa.glb')
useGLTF.preload('/3d/agenda.glb')
useGLTF.preload('/3d/transcricao.glb')
useGLTF.preload('/3d/financeiro.glb')
