import { forwardRef, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cl, ez, lp } from './heroMath'

/* ------------------------------------------------------------------ */
/* Dimensions and data                                                 */
/* ------------------------------------------------------------------ */

const W = 2.5 // folder width
const D = 3.1 // folder depth
const T = 0.07 // cover thickness
const HINGE_CLOSED_Y = 0.3 // height of the hinge line while the cover is shut
const SPINE_H = 0.3 // spine height while the cover is shut

const SHEETS: ReadonlyArray<readonly [title: string, subtitle: string]> = [
  ['PROPERTY OWNERSHIP', 'Deed of title record'],
  ['SALE AGREEMENT', 'Agreement for sale'],
  ['REGISTRATION RECORD', 'Sub-registrar entry'],
  ['INDEX II', 'Extract of property register'],
  ['PROPERTY TAX RECEIPT', 'Municipal tax paid'],
  ['SOCIETY SHARE CERTIFICATE', 'Co-operative housing society'],
  ['BANK LOAN STATEMENT', 'Home loan account'],
]

/** Final resting pose of each sheet: x, y, z, rotX, rotY, rotZ. */
const TARGETS: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [-3.9, 2.2, 0.4, -0.15, 0.45, 0.2],
  [-2.3, 3.4, -1.5, -0.3, 0.3, -0.12],
  [-1.2, 1.3, 2.6, -0.25, 0.2, 0.1],
  [0.2, 2.6, 0.9, -0.12, -0.05, -0.05],
  [1.5, 1.2, 2.4, -0.22, -0.25, 0.12],
  [2.6, 3.3, -1.2, -0.3, -0.35, 0.15],
  [4, 2, 0.5, -0.18, -0.5, -0.2],
]

/* ------------------------------------------------------------------ */
/* Canvas textures                                                     */
/* ------------------------------------------------------------------ */

type Draw = (ctx: CanvasRenderingContext2D) => void

function drawLeather(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#235c49'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }
}

function drawCoverLogo(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 512, 640)
  ctx.fillStyle = '#D5B477'
  ctx.textAlign = 'center'
  ctx.font = '800 54px Manrope, sans-serif'
  ctx.fillText('SURAKSHA', 256, 300)
  ctx.fillText('SETU', 256, 364)
  ctx.fillRect(176, 396, 160, 3)
  ctx.font = '500 20px Manrope, sans-serif'
  ctx.fillText('PROPERTY RECORDS', 256, 436)
}

function drawDocument(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
  ctx.fillStyle = '#F5F1E8'
  ctx.fillRect(0, 0, 420, 594)
  ctx.fillStyle = '#123C32'
  ctx.fillRect(0, 0, 420, 12)
  ctx.font = '800 24px Manrope, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(title.length > 20 ? title.slice(0, 18) + '\u2026' : title, 34, 70)
  ctx.font = '500 14px Inter, sans-serif'
  ctx.fillStyle = '#555'
  ctx.fillText(subtitle, 34, 96)
  ctx.fillStyle = '#bbb5a4'
  for (let i = 0; i < 16; i++) ctx.fillRect(34, 134 + i * 21, i % 5 === 4 ? 150 : 352, 5)
  ctx.strokeStyle = '#D5B477'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(330, 510, 36, 0, 7)
  ctx.stroke()
  ctx.font = '800 11px Manrope, sans-serif'
  ctx.fillStyle = '#D5B477'
  ctx.textAlign = 'center'
  ctx.fillText('SAMPLE', 330, 514)
}

/**
 * Draws onto an offscreen canvas and exposes it as a texture. Redraws once the web fonts are
 * ready so the text does not stay in the fallback font.
 */
function useCanvasTexture(draw: Draw, width: number, height: number) {
  const invalidate = useThree(state => state.invalidate)
  const drawRef = useRef(draw)
  drawRef.current = draw

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) drawRef.current(ctx)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [width, height])

  useEffect(() => {
    let alive = true
    const fonts = document.fonts
    if (fonts) {
      Promise.all([fonts.load('800 24px Manrope'), fonts.load('500 14px Inter')])
        .then(() => {
          if (!alive) return
          const ctx = (texture.image as HTMLCanvasElement).getContext('2d')
          if (!ctx) return
          ctx.clearRect(0, 0, width, height)
          drawRef.current(ctx)
          texture.needsUpdate = true
          invalidate()
        })
        .catch(() => {
          /* keep the fallback-font texture */
        })
    }
    return () => {
      alive = false
      texture.dispose()
    }
  }, [texture, width, height, invalidate])

  return texture
}

/* ------------------------------------------------------------------ */
/* Scene parts                                                         */
/* ------------------------------------------------------------------ */

function Folder({
  hingeRef,
  spineRef,
}: {
  hingeRef: MutableRefObject<THREE.Group | null>
  spineRef: MutableRefObject<THREE.Mesh | null>
}) {
  const leatherMap = useCanvasTexture(drawLeather, 256, 256)
  const logoMap = useCanvasTexture(drawCoverLogo, 512, 640)

  const leather = useMemo(
    () => new THREE.MeshStandardMaterial({ map: leatherMap, roughness: 0.62, metalness: 0.05 }),
    [leatherMap],
  )
  useEffect(() => () => leather.dispose(), [leather])

  return (
    <group>
      {/* back cover */}
      <mesh position={[0, T / 2, 0]} material={leather} castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
      </mesh>
      {/* spine */}
      <mesh ref={spineRef} position={[-W / 2, SPINE_H / 2, 0]} material={leather} castShadow>
        <boxGeometry args={[0.05, SPINE_H, D]} />
      </mesh>
      {/* tab */}
      <mesh position={[0.5, T / 2, -D / 2 - 0.16]} material={leather} castShadow>
        <boxGeometry args={[0.9, T, 0.32]} />
      </mesh>
      {/* pocket lip */}
      <mesh position={[0, 0.14, D / 2 - 0.03]} material={leather} castShadow>
        <boxGeometry args={[W - 0.05, 0.25, 0.05]} />
      </mesh>
      {/* front cover, hinged on the left edge */}
      <group ref={hingeRef} position={[-W / 2, HINGE_CLOSED_Y, 0]}>
        <mesh position={[W / 2, 0, 0]} material={leather} castShadow receiveShadow>
          <boxGeometry args={[W, T, D]} />
        </mesh>
        <mesh position={[W / 2, T / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W * 0.8, D * 0.8]} />
          <meshStandardMaterial
            map={logoMap}
            transparent
            opacity={0.72}
            roughness={0.4}
            metalness={0.6}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}

const DocumentSheet = forwardRef<THREE.Mesh, { title: string; subtitle: string }>(function DocumentSheet(
  { title, subtitle },
  ref,
) {
  const map = useCanvasTexture(ctx => drawDocument(ctx, title, subtitle), 420, 594)

  return (
    <mesh ref={ref} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.75, 2.4, 0.018]} />
      {/* edges */}
      <meshStandardMaterial attach="material-0" color="#e9e3d2" roughness={0.9} />
      <meshStandardMaterial attach="material-1" color="#e9e3d2" roughness={0.9} />
      <meshStandardMaterial attach="material-2" color="#e9e3d2" roughness={0.9} />
      <meshStandardMaterial attach="material-3" color="#e9e3d2" roughness={0.9} />
      {/* printed face, then plain back */}
      <meshStandardMaterial attach="material-4" map={map} roughness={0.85} />
      <meshStandardMaterial attach="material-5" color="#efe9d9" roughness={0.9} />
    </mesh>
  )
})

type SceneProps = {
  /** Smoothed scroll progress of the hero, 0..1. Written by HeroSection, read every frame here. */
  progress: MutableRefObject<number>
  /** Freeze the idle bobbing (reduced motion). */
  frozen: boolean
  mobile: boolean
}

function Scene({ progress, frozen, mobile }: SceneProps) {
  const hinge = useRef<THREE.Group | null>(null)
  const spine = useRef<THREE.Mesh | null>(null)
  const sheets = useRef<Array<THREE.Mesh | null>>([])
  const size = useThree(state => state.size)

  // Portrait screens get a wider field of view so the whole scene fits.
  const camera = useThree(state => state.camera)
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = size.width < size.height ? 58 : 40
    cam.updateProjectionMatrix()
  }, [camera, size])

  useFrame(({ clock, camera: cam }) => {
    const p = progress.current
    const time = frozen ? 0 : clock.elapsedTime

    // cover swings open a full 180 degrees, ending flat beside the back cover
    const open = ez(cl((p - 0.18) / 0.2))

    // camera: approach, then pull back. It drifts left as the cover opens, to keep the open book centred.
    const a = ez(cl(p / 0.3))
    const b = ez(cl((p - 0.7) / 0.3))
    cam.position.set(Math.sin(p * 1.4) * 1.2 - open * (W / 2), lp(lp(8, 4.6, a), 3.6, b), lp(lp(8, 4.6, a), 9.2, b))
    cam.lookAt(-open * (W / 2), lp(0, 1.3, b), 0)

    if (hinge.current) {
      hinge.current.rotation.z = open * Math.PI
      // Lower the hinge line to table level so the open cover lies flat instead of hovering.
      hinge.current.position.y = lp(HINGE_CLOSED_Y, T / 2, open)
    }
    if (spine.current) {
      // Flatten the spine as the book opens so it does not stick up between the two covers.
      const s = lp(1, 0.25, open)
      spine.current.scale.y = s
      spine.current.position.y = (SPINE_H / 2) * s
    }

    // documents fly out
    sheets.current.forEach((mesh, i) => {
      if (!mesh) return
      const t = ez(cl((p - 0.3 - i * 0.05) / 0.32))
      const g = TARGETS[i]
      const bob = t >= 0.99 ? Math.sin(time * 0.8 + i * 1.7) * 0.09 : 0
      mesh.position.set(
        lp(0, g[0], t),
        lp(0.12 + i * 0.012, g[1], t) + Math.sin(t * Math.PI) * 1.1 + bob,
        lp(0, g[2], t),
      )
      mesh.rotation.set(
        lp(-Math.PI / 2, g[3], t),
        lp(0, g[4], t) + Math.sin(t * Math.PI) * 0.8,
        lp(0, g[5], t) + Math.sin(time * 0.6 + i) * 0.02 * t,
      )
    })
  })

  const shadowSize = mobile ? 1024 : 2048

  return (
    <>
      <color attach="background" args={['#123C32']} />
      <fog attach="fog" args={['#123C32', 10, 24]} />

      {/* Intensities are the original (legacy) values times PI, to match three's physical lights. */}
      <hemisphereLight args={['#F5F1E8', '#123C32', 2.4]} />
      <directionalLight
        position={[-4, 9, 5]}
        color="#fff0d0"
        intensity={3.9}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <pointLight position={[3, 2, -3]} color="#D5B477" intensity={2.8} distance={14} decay={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#174a3d" roughness={0.85} />
      </mesh>

      <Folder hingeRef={hinge} spineRef={spine} />
      {SHEETS.map(([title, subtitle], i) => (
        <DocumentSheet
          key={title}
          title={title}
          subtitle={subtitle}
          ref={el => {
            sheets.current[i] = el
          }}
        />
      ))}
    </>
  )
}

type HeroSceneProps = {
  progress: MutableRefObject<number>
  /** Render loop runs only while the hero is on screen. */
  active: boolean
  /** Reduced motion: render a static frame and skip idle motion. */
  reducedMotion: boolean
}

export default function HeroScene({ progress, active, reducedMotion }: HeroSceneProps) {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 760
  const frameloop = reducedMotion ? 'demand' : active ? 'always' : 'never'

  return (
    <Canvas
      frameloop={frameloop}
      shadows
      dpr={[1, mobile ? 1.5 : 2]}
      gl={{ antialias: !mobile }}
      camera={{ fov: 40, near: 0.1, far: 60, position: [0, 8, 8] }}
    >
      <Scene progress={progress} frozen={reducedMotion} mobile={mobile} />
    </Canvas>
  )
}
