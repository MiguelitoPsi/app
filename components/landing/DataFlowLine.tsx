"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface DataFlowLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

const PARTICLE_COUNT = 4;

export function DataFlowLine({
  start,
  end,
  color = "#a1c797",
}: DataFlowLineProps) {
  const particlesRef = useRef<THREE.Group>(null);

  const curve = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const controlOffset = s.distanceTo(e) * 0.3;
    const cp1 = new THREE.Vector3(
      s.x + (e.x - s.x) * 0.95,
      s.y + controlOffset * 0.2,
      s.z - 0.5,
    );
    const cp2 = new THREE.Vector3(
      s.x + (e.x - s.x) * 0.95,
      e.y + controlOffset * 0.2,
      e.z - 0.5,
    );
    return new THREE.CatmullRomCurve3([s, cp1, cp2, e]);
  }, [start, end]);

  const linePoints = useMemo(
    () =>
      curve
        .getPoints(48)
        .map((p) => [p.x, p.y, p.z] as [number, number, number]),
    [curve],
  );

  const offsets = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT),
    [],
  );

  useFrame(() => {
    if (!particlesRef.current) return;
    const time = Date.now() * 0.0004;
    particlesRef.current.children.forEach((child, i) => {
      const t = (((time + offsets[i]) % 1) + 1) % 1;
      const point = curve.getPointAt(t);
      child.position.copy(point);
      const pulse = 0.6 + Math.sin(time * 6 + i * 2) * 0.4;
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group>
      {/* Base line */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={4}
        transparent
        opacity={0.8}
      />

      {/* Glow line */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={6}
        transparent
        opacity={0.1}
      />

      {/* Flowing particles */}
      <group ref={particlesRef}>
        {offsets.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
