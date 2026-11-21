import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import type * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function Folder() {
  const lid = useRef<THREE.Group>(null)
  const base = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.1,
        onUpdate: self => {
          const p = self.progress
          if (lid.current) lid.current.rotation.x = -0.35 - p * 1.45
          if (base.current) base.current.position.y = -0.5 + p * 0.2
          if (group.current) {
            group.current.rotation.y = -0.25 + p * 0.45
            group.current.rotation.x = 0.15 - p * 0.1
          }
        },
      })
    })
    return () => ctx.revert()
  }, [])

  useFrame(state => {
    if (group.current) {
      group.current.position.y = -0.85 + Math.sin(state.clock.elapsedTime * 0.7) * 0.04
    }
  })

  return (
    <group ref={group} position={[0, -0.85, 0]} rotation={[0.15, -0.25, 0]}>
      {/* Deep Green Physical Document Folder Base */}
      <mesh ref={base} receiveShadow castShadow>
        <boxGeometry args={[3.6, 0.2, 2.55]} />
        <meshStandardMaterial color="#123C32" roughness={0.42} metalness={0.08} />
      </mesh>
      {/* Antique Gold Spine & Rim Trim */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[3.64, 0.025, 2.58]} />
        <meshStandardMaterial color="#D5B477" roughness={0.28} metalness={0.68} />
      </mesh>
      {/* Folder Brass Clasp Tab */}
      <mesh position={[0, 0.08, 1.29]}>
        <boxGeometry args={[0.7, 0.08, 0.06]} />
        <meshStandardMaterial color="#D5B477" roughness={0.25} metalness={0.75} />
      </mesh>
      {/* Hinged Folder Top Cover */}
      <group ref={lid} position={[0, 0.11, -1.26]} rotation={[-0.35, 0, 0]}>
        <mesh position={[0, 0, 1.26]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 0.11, 2.55]} />
          <meshStandardMaterial color="#1F5B49" roughness={0.45} metalness={0.08} />
        </mesh>
        {/* Gold Foil Crest Stamp on Cover */}
        <mesh position={[0, 0.065, 1.26]}>
          <boxGeometry args={[1.4, 0.015, 0.85]} />
          <meshStandardMaterial color="#D5B477" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

function PropertyRecordSheet({ index }: { index: number }) {
  const sheetGroup = useRef<THREE.Group>(null)
  const basePos = useMemo(
    () => ({
      x: ((index % 3) - 1) * 0.82,
      y: -0.35 + index * 0.12,
      z: -0.15 + (index % 2) * 0.2,
    }),
    [index]
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: self => {
          const p = self.progress
          const delay = index * 0.06
          const lp = Math.min(1, Math.max(0, (p - delay) / (1 - delay)))
          if (sheetGroup.current) {
            sheetGroup.current.position.y = basePos.y + 0.55 + lp * (1.45 + (index % 3) * 0.35)
            sheetGroup.current.position.z = basePos.z - lp * (1.2 + index * 0.22)
            sheetGroup.current.position.x = basePos.x + Math.sin(lp * Math.PI) * (index % 2 === 0 ? 0.55 : -0.55)
            sheetGroup.current.rotation.x = -Math.PI / 2.6 + lp * 0.85
            sheetGroup.current.rotation.y = (index - 3) * 0.08 + lp * 0.15
            sheetGroup.current.rotation.z = lp * (index % 2 === 0 ? 0.14 : -0.14)
          }
        },
      })
    })
    return () => ctx.revert()
  }, [index, basePos])

  useFrame(state => {
    if (sheetGroup.current) {
      const floatOffset = Math.sin(state.clock.elapsedTime * 1.1 + index * 0.9) * 0.002
      sheetGroup.current.position.y += floatOffset
    }
  })

  return (
    <group
      ref={sheetGroup}
      position={[basePos.x, basePos.y + 0.45 + index * 0.18, basePos.z - index * 0.12]}
      rotation={[-Math.PI / 3.2 + index * 0.06, (index - 3) * 0.07, (index % 2 === 0 ? 1 : -1) * 0.05]}
    >
      {/* Ivory Property Document Sheet */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.15, 1.48, 0.018]} />
        <meshStandardMaterial color="#F5F1E8" roughness={0.78} metalness={0.02} />
      </mesh>
      {/* Deep Green Title Banner on Document */}
      <mesh position={[0, 0.52, 0.012]}>
        <planeGeometry args={[1.82, 0.16]} />
        <meshStandardMaterial color="#123C32" />
      </mesh>
      {/* Antique Gold Verification Rule & Wax Seal */}
      <mesh position={[0, 0.39, 0.012]}>
        <planeGeometry args={[1.82, 0.035]} />
        <meshStandardMaterial color="#D5B477" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.72, -0.45, 0.014]}>
        <circleGeometry args={[0.13, 24]} />
        <meshStandardMaterial color="#D5B477" metalness={0.65} roughness={0.25} />
      </mesh>
      {/* Structured Editorial Lines Representing Property Record Entries */}
      <mesh position={[-0.25, 0.16, 0.012]}>
        <planeGeometry args={[1.32, 0.045]} />
        <meshStandardMaterial color="#252B29" transparent opacity={0.35} />
      </mesh>
      <mesh position={[-0.15, 0.01, 0.012]}>
        <planeGeometry args={[1.52, 0.038]} />
        <meshStandardMaterial color="#252B29" transparent opacity={0.22} />
      </mesh>
      <mesh position={[-0.2, -0.14, 0.012]}>
        <planeGeometry args={[1.42, 0.038]} />
        <meshStandardMaterial color="#252B29" transparent opacity={0.22} />
      </mesh>
      <mesh position={[-0.35, -0.29, 0.012]}>
        <planeGeometry args={[1.12, 0.038]} />
        <meshStandardMaterial color="#1F5B49" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function AmbientGoldAccents() {
  const ref = useRef<THREE.Group>(null)
  useFrame(state => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.06
  })
  return (
    <group ref={ref}>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[(i - 1.5) * 1.3, 0.4 + (i % 2) * 0.7, -1.6 - i * 0.35]} rotation={[0.15, 0, 0]}>
          <planeGeometry args={[0.025, 1.3]} />
          <meshStandardMaterial color="#D5B477" emissive="#D5B477" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  )
}

export default function DocumentScene() {
  const papers = useMemo(() => Array.from({ length: 6 }), [])
  return (
    <Canvas camera={{ position: [0, 2.35, 5.9], fov: 40 }} dpr={[1, 1.5]} shadows style={{ height: '100%', width: '100%' }}>
      <color attach="background" args={['#123C32']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 6]} intensity={1.35} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 3, 3]} intensity={0.75} color="#D5B477" />
      <spotLight position={[0, 8, 3]} intensity={0.6} angle={0.45} penumbra={0.6} color="#F5F1E8" />
      <Folder />
      {papers.map((_, i) => (
        <PropertyRecordSheet key={i} index={i} />
      ))}
      <AmbientGoldAccents />
      <ContactShadows position={[0, -1.1, 0]} opacity={0.55} scale={11} blur={2.4} far={4.5} />
    </Canvas>
  )
}
