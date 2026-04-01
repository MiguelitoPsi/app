'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { AgentModel } from './AgentModel'
import { DataFlowLine } from './DataFlowLine'
import { ThoughtBubble } from './ThoughtBubble'

const AGENT_DATA = [
  {
    id: 'tarefas',
    label: 'Tarefas',
    modelPath: '/3d/tarefa.glb',
    thoughts: [
      'Criando tarefa de respiração...',
      'Organizando exercícios da semana...',
      'Monitorando progresso do paciente...',
      'Ajustando prioridades terapêuticas...',
      'Revisando metas semanais...',
    ],
    delay: 0,
  },
  {
    id: 'agenda',
    label: 'Agenda',
    modelPath: '/3d/agenda.glb',
    thoughts: [
      'Agendando sessão às 14h...',
      'Confirmando horário do paciente...',
      'Sincronizando calendário...',
      'Enviando lembrete de consulta...',
      'Reorganizando agenda da semana...',
    ],
    delay: 1200,
  },
  {
    id: 'transcricao',
    label: 'Transcrição',
    modelPath: '/3d/transcricao.glb',
    thoughts: [
      'Transcrevendo sessão de hoje...',
      'Identificando palavras-chave...',
      'Resumindo pontos principais...',
      'Analisando tom emocional...',
      'Gerando relatório da sessão...',
    ],
    delay: 2400,
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    modelPath: '/3d/financeiro.glb',
    thoughts: [
      'Processando pagamento recebido...',
      'Gerando relatório mensal...',
      'Calculando faturamento do mês...',
      'Emitindo nota fiscal eletrônica...',
      'Atualizando fluxo de caixa...',
    ],
    delay: 3600,
  },
]

/**
 * Camera: Z distance drives how large the scene appears.
 * Lower Z = scene fills more of the canvas.
 */
function CameraRig() {
  const { size, camera } = useThree()

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    const aspect = size.width / size.height

    // scene center Y ≈ (top_bubble_y + psych_y) / 2
    // mobile:  (1.2+1.2 + -2.1)/2 = 0.15
    // narrow:  (1.3+1.2 + -2.0)/2 = 0.25
    // tablet:  (1.4+1.2 + -2.0)/2 = 0.30
    // desktop: (1.5+1.25 + -2.1)/2 = 0.325

    if (aspect < 0.75) {
      camera.fov = 72
      camera.position.set(0, 0.15, 4.2)
      camera.lookAt(0, 0.15, 0)
    } else if (aspect < 1.0) {
      camera.fov = 65
      camera.position.set(0, 0.25, 4.6)
      camera.lookAt(0, 0.25, 0)
    } else if (aspect < 1.4) {
      camera.fov = 55
      camera.position.set(0, 0.3, 5.5)
      camera.lookAt(0, 0.3, 0)
    } else {
      camera.fov = 46
      camera.position.set(0, 0.325, 6.2)
      camera.lookAt(0, 0.325, 0)
    }
    camera.updateProjectionMatrix()
  }, [size.width, size.height, camera])

  return null
}

/** Scene content — positions and scales adapt to canvas aspect ratio */
function SceneContent() {
  const { size } = useThree()
  const aspect = size.width / size.height
  const isMobile = aspect < 0.75
  const isNarrow = aspect < 1.0
  const isTablet = aspect < 1.4

  const config = useMemo(() => {
    if (isMobile) {
      return {
        psychPos: [0, -1, 0] as [number, number, number],
        positions: [
          [-0.9, 1.2, 0], // Tarefas - top-left
          [-0.9, -0.3, 0], // Agenda - bottom-left
          [0.9, -0.3, 0], // Transcrição - bottom-right
          [0.9, 1.2, 0], // Financeiro - top-right
        ] as [number, number, number][],
        agentScale: 0.5,
        psychScale: 0.9,
        bubbleY: 0.8,
      }
    }
    if (isNarrow) {
      return {
        psychPos: [0, -2.0, 0] as [number, number, number],
        positions: [
          [-1.5, 1.3, 0],
          [-0.9, -0.3, 0],
          [0.9, -0.3, 0],
          [1.5, 1.3, 0],
        ] as [number, number, number][],
        agentScale: 0.95,
        psychScale: 1.15,
        bubbleY: 1.2,
      }
    }
    if (isTablet) {
      return {
        psychPos: [0, -2.0, 0] as [number, number, number],
        positions: [
          [-2.4, 1.4, 0],
          [-1.2, -0.2, 0],
          [1.2, -0.2, 0],
          [2.4, 1.4, 0],
        ] as [number, number, number][],
        agentScale: 1.0,
        psychScale: 1.2,
        bubbleY: 1.1,
      }
    }
    // Wide desktop
    return {
      psychPos: [0, -1, 0] as [number, number, number],
      positions: [
        [-3.4, 1.2, 0], // Tarefas - far top-left
        [-1.8, -0.1, 0], // Agenda - inner bottom-left
        [1.8, -0.1, 0], // Transcrição - inner bottom-right
        [3.4, 1.2, 0], // Financeiro - far top-right
      ] as [number, number, number][],
      agentScale: 0.7,
      psychScale: 1.3,
      bubbleY: 1.1,
    }
  }, [isMobile, isNarrow, isTablet])

  const agents = useMemo(
    () => AGENT_DATA.map((a, i) => ({ ...a, position: config.positions[i] })),
    [config.positions]
  )

  return (
    <>
      <AgentModel modelPath='/3d/miguel.glb' position={config.psychPos} scale={config.psychScale} />
      {agents.map((agent) => (
        <group key={agent.id}>
          <AgentModel
            modelPath={agent.modelPath}
            position={agent.position}
            scale={config.agentScale}
          />
          <DataFlowLine end={config.psychPos} start={agent.position} />
          <ThoughtBubble
            delay={agent.delay}
            label={agent.label}
            position={[agent.position[0], agent.position[1] + config.bubbleY, agent.position[2]]}
            thoughts={agent.thoughts}
          />
        </group>
      ))}
    </>
  )
}

export function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight intensity={1} position={[5, 5, 5]} />
      <directionalLight intensity={0.4} position={[-3, 3, 2]} />
      <CameraRig />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}
