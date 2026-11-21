import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

type CanvasWithCleanup = HTMLCanvasElement & { __cleanup?: () => void }
type ConsentState = 'idle' | 'pend_soc' | 'pend_own' | 'granted' | 'rejected' | 'revoked'

export default function Landing() {
  const cvRef = useRef<CanvasWithCleanup | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [consentState, setConsentState] = useState<ConsentState>('idle')
  const [reduced, setReduced] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onMq)
    return () => mq.removeEventListener('change', onMq)
  }, [])

  useEffect(() => {
    const cv = cvRef.current
    const hero = heroRef.current
    if (!cv || !hero) return

    let disposed = false
    let raf = 0
    let on = true

    const init = async () => {
      const gsapMod = await import('gsap')
      const stMod = await import('gsap/ScrollTrigger')
      const gsap = gsapMod.default || gsapMod.gsap || gsapMod
      const ScrollTrigger = stMod.ScrollTrigger || stMod.default
      gsap.registerPlugin(ScrollTrigger)

      if (disposed) return

      const ez = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
      const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
      const lp = (a: number, b: number, t: number) => a + (b - a) * t

      let R: THREE.WebGLRenderer | null = null
      let sc: THREE.Scene | null = null
      let cam: THREE.PerspectiveCamera | null = null
      let folder: THREE.Group | null = null
      let hinge: THREE.Group | null = null
      const pm: THREE.Mesh[] = []
      const targets: Array<[number, number, number, number, number, number]> = [
        [-3.9, 2.2, 0.4, -0.15, 0.45, 0.2],
        [-2.3, 3.4, -1.5, -0.3, 0.3, -0.12],
        [-1.2, 1.3, 2.6, -0.25, 0.2, 0.1],
        [0.2, 2.6, 0.9, -0.12, -0.05, -0.05],
        [1.5, 1.2, 2.4, -0.22, -0.25, 0.12],
        [2.6, 3.3, -1.2, -0.3, -0.35, 0.15],
        [4, 2, 0.5, -0.18, -0.5, -0.2],
      ]

      if (!reduced) {
        try {
          const mobile = window.innerWidth < 760
          R = new THREE.WebGLRenderer({
            canvas: cv,
            antialias: !mobile,
            alpha: false,
            powerPreference: 'high-performance',
          })
          R.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2))
          R.shadowMap.enabled = true
          R.shadowMap.type = THREE.PCFSoftShadowMap

          sc = new THREE.Scene()
          sc.background = new THREE.Color(0x123c32)
          sc.fog = new THREE.Fog(0x123c32, 10, 24)

          cam = new THREE.PerspectiveCamera(40, 1, 0.1, 60)

          sc.add(new THREE.HemisphereLight(0xf5f1e8, 0x123c32, 0.9))
          const dl = new THREE.DirectionalLight(0xfff0d0, 1.45)
          dl.position.set(-4, 9, 5)
          dl.castShadow = true
          dl.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048)
          Object.assign(dl.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 25 })
          sc.add(dl)
          const rim = new THREE.PointLight(0xd5b477, 1.2, 16)
          rim.position.set(3, 3, -3)
          sc.add(rim)

          const gnd = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60),
            new THREE.MeshStandardMaterial({ color: 0x174a3d, roughness: 0.85 })
          )
          gnd.rotation.x = -Math.PI / 2
          gnd.receiveShadow = true
          sc.add(gnd)

          const noiseTex = () => {
            const c = document.createElement('canvas')
            c.width = c.height = 256
            const x = c.getContext('2d')!
            x.fillStyle = '#1b5a47'
            x.fillRect(0, 0, 256, 256)
            for (let i = 0; i < 5000; i++) {
              x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`
              x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
            }
            const t = new THREE.CanvasTexture(c)
            t.wrapS = t.wrapT = THREE.RepeatWrapping
            return t
          }
          const leather = new THREE.MeshStandardMaterial({
            color: 0x2a6b57,
            map: noiseTex(),
            roughness: 0.58,
            metalness: 0.08,
          })
          const goldTrim = new THREE.MeshStandardMaterial({ color: 0xd5b477, roughness: 0.35, metalness: 0.7 })

          folder = new THREE.Group()
          sc.add(folder)
          const W = 2.6,
            D = 3.2,
            T = 0.08
          const back = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), leather)
          back.position.y = T / 2
          back.castShadow = back.receiveShadow = true
          folder.add(back)
          const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, D), leather)
          spine.position.set(-W / 2, 0.16, 0)
          spine.castShadow = true
          folder.add(spine)
          const tab = new THREE.Mesh(new THREE.BoxGeometry(0.95, T, 0.34), goldTrim)
          tab.position.set(0.5, T / 2, -D / 2 - 0.17)
          tab.castShadow = true
          folder.add(tab)
          const pocket = new THREE.Mesh(new THREE.BoxGeometry(W - 0.05, 0.25, 0.05), leather)
          pocket.position.set(0, 0.14, D / 2 - 0.03)
          pocket.castShadow = true
          folder.add(pocket)

          hinge = new THREE.Group()
          hinge.position.set(-W / 2, 0.32, 0)
          folder.add(hinge)
          const front = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), leather)
          front.position.set(W / 2, 0, 0)
          front.castShadow = front.receiveShadow = true
          hinge.add(front)
          ;(() => {
            const c = document.createElement('canvas')
            c.width = 512
            c.height = 640
            const x = c.getContext('2d')!
            x.clearRect(0, 0, 512, 640)
            x.strokeStyle = 'rgba(213,180,119,0.55)'
            x.lineWidth = 4
            x.strokeRect(36, 36, 440, 568)
            x.fillStyle = '#D5B477'
            x.textAlign = 'center'
            x.font = '800 42px Manrope, sans-serif'
            x.fillText('SURAKSHA SETU', 256, 290)
            x.fillRect(166, 330, 180, 3)
            x.font = '600 20px Manrope, sans-serif'
            x.fillText('PROPERTY RECORDS', 256, 376)
            x.font = '500 15px Inter, sans-serif'
            x.fillStyle = '#F5F1E8'
            x.fillText('VERIFIED LOCKER · CONSENT ENGINE', 256, 418)
            const t = new THREE.CanvasTexture(c)
            t.anisotropy = 4
            const m = new THREE.Mesh(
              new THREE.PlaneGeometry(W * 0.84, D * 0.84),
              new THREE.MeshStandardMaterial({
                map: t,
                transparent: true,
                opacity: 0.88,
                roughness: 0.35,
                metalness: 0.5,
                depthWrite: false,
              })
            )
            m.rotation.x = -Math.PI / 2
            m.position.set(W / 2, T / 2 + 0.004, 0)
            hinge.add(m)
          })()

          const docs: Array<[string, string]> = [
            ['PROPERTY OWNERSHIP', 'Deed of title record'],
            ['SALE AGREEMENT', 'Agreement for sale'],
            ['REGISTRATION RECORD', 'Sub-registrar entry'],
            ['INDEX II', 'Extract of property register'],
            ['PROPERTY TAX RECEIPT', 'Municipal tax paid'],
            ['SOCIETY SHARE CERTIFICATE', 'Co-operative housing society'],
            ['BANK LOAN STATEMENT', 'Home loan account'],
          ]
          const docTex = (t: string, s: string) => {
            const c = document.createElement('canvas')
            c.width = 420
            c.height = 594
            const x = c.getContext('2d')!
            x.fillStyle = '#F5F1E8'
            x.fillRect(0, 0, 420, 594)
            x.fillStyle = '#123C32'
            x.fillRect(0, 0, 420, 14)
            x.font = '800 23px Manrope, sans-serif'
            x.textAlign = 'left'
            x.fillText(t.length > 20 ? t.slice(0, 18) + '…' : t, 34, 70)
            x.font = '500 14px Inter, sans-serif'
            x.fillStyle = '#555'
            x.fillText(s, 34, 96)
            x.fillStyle = '#bbb5a4'
            for (let i = 0; i < 16; i++) {
              x.fillRect(34, 134 + i * 21, i % 5 === 4 ? 150 : 352, 5)
            }
            x.strokeStyle = '#D5B477'
            x.lineWidth = 3
            x.beginPath()
            x.arc(330, 510, 36, 0, 7)
            x.stroke()
            x.font = '800 11px Manrope, sans-serif'
            x.fillStyle = '#D5B477'
            x.textAlign = 'center'
            x.fillText('VERIFIED', 330, 514)
            const tx = new THREE.CanvasTexture(c)
            tx.anisotropy = 4
            return tx
          }
          docs.forEach(d => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.4, 0.018), [
              new THREE.MeshStandardMaterial({ color: 0xe9e3d2, roughness: 0.9 }),
              new THREE.MeshStandardMaterial({ color: 0xe9e3d2, roughness: 0.9 }),
              new THREE.MeshStandardMaterial({ color: 0xe9e3d2, roughness: 0.9 }),
              new THREE.MeshStandardMaterial({ color: 0xe9e3d2, roughness: 0.9 }),
              new THREE.MeshStandardMaterial({ map: docTex(d[0], d[1]), roughness: 0.85 }),
              new THREE.MeshStandardMaterial({ color: 0xefe9d9, roughness: 0.9 }),
            ])
            m.castShadow = true
            m.receiveShadow = true
            sc!.add(m)
            pm.push(m)
          })
        } catch (err) {
          console.warn('WebGL fallback activated:', err)
          setWebglFailed(true)
          R = null
        }
      }

      let tp = reduced ? 1 : 0,
        cur = tp
      if (!reduced) {
        ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: s => {
            tp = s.progress
          },
        })
      }

      const scrl = document.getElementById('bh-scrl')
      const badges = document.getElementById('bh-badges')

      const pose = (p: number, time: number) => {
        if (R && cam && hinge && folder) {
          const a = ez(cl(p / 0.3)),
            b = ez(cl((p - 0.7) / 0.3))
          const cp = [lp(0, 0, a), lp(lp(6.8, 4.4, a), 3.6, b), lp(lp(7.2, 4.6, a), 9.0, b)]
          cam.position.set(Math.sin(p * 1.4) * 1.2 + 0.6 * (1 - a), cp[1], cp[2])
          cam.lookAt(0, lp(0.15, 1.3, b), 0)
          hinge.rotation.z = 0.14 + ez(cl((p - 0.08) / 0.22)) * 0.95
          pm.forEach((m, i) => {
            const t = ez(cl((p - 0.16 - i * 0.05) / 0.36)),
              tg = targets[i]
            const bob = Math.sin(time * 0.8 + i * 1.7) * (0.02 + 0.07 * t)
            m.position.set(
              lp(0.12 * i - 0.35, tg[0], t),
              lp(0.14 + i * 0.014, tg[1], t) + Math.sin(t * Math.PI) * 1.1 + bob,
              lp(0, tg[2], t)
            )
            m.rotation.set(
              lp(-Math.PI / 2, tg[3], t),
              lp(0, tg[4], t) + Math.sin(t * Math.PI) * 0.8,
              lp(0.03 * (i - 3), tg[5], t) + Math.sin(time * 0.6 + i) * 0.02 * t
            )
          })
          folder.position.y = Math.sin(time * 0.9) * 0.04 * (1 - cl(p * 2))
          folder.rotation.y = -0.18 * (1 - cl(p * 1.8))
        }

        if (scrl) {
          scrl.style.opacity = String(0.85 * (1 - cl(p / 0.15)))
        }
        if (badges) {
          badges.style.opacity = String(1 - cl((p - 0.15) / 0.25))
        }
      }

      const rs = () => {
        if (!R || !cam || !cv.parentElement) return
        const w = cv.parentElement.clientWidth,
          h = cv.parentElement.clientHeight
        R.setSize(w, h, false)
        cam.aspect = w / h
        cam.fov = w < h ? 55 : 38
        cam.updateProjectionMatrix()
      }
      window.addEventListener('resize', rs)
      rs()

      const io = new IntersectionObserver(e => {
        on = e[0].isIntersecting
      })
      io.observe(hero)

      const clk = new THREE.Clock()
      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (!on) return
        cur += (tp - cur) * 0.08
        pose(cur, clk.getElapsedTime())
        if (R && sc && cam) R.render(sc, cam)
      }
      loop()

      // reveals
      if (!reduced) {
        document.querySelectorAll('.rv').forEach(el => {
          gsap.fromTo(
            el,
            { y: 32, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }
          )
        })
        const ln = document.getElementById('bh-ln')
        if (ln)
          gsap.to(ln, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.bh-tl', start: 'top 75%', end: 'bottom 70%', scrub: true },
          })
        const dot = document.getElementById('bh-dot')
        if (dot) {
          const path = [
            [490, 80],
            [180, 330],
            [800, 330],
            [490, 80],
          ]
          const o = { k: 0 }
          gsap.to(o, {
            k: 3,
            duration: 9,
            repeat: -1,
            ease: 'none',
            onUpdate() {
              const i = Math.floor(o.k) % 3,
                f = o.k % 1,
                A = path[i],
                B = path[i + 1]
              dot.setAttribute('cx', String(lp(A[0], B[0], f)))
              dot.setAttribute('cy', String(lp(A[1], B[1], f)))
            },
          })
        }
      }

      const cleanup = () => {
        disposed = true
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', rs)
        io.disconnect()
        ScrollTrigger.getAll().forEach(t => t.kill())
        if (R) R.dispose()
      }
      cv.__cleanup = cleanup
    }

    init()

    return () => {
      disposed = true
      if (cvRef.current && cvRef.current.__cleanup) cvRef.current.__cleanup()
    }
  }, [reduced])

  const DOCS = ['Sale agreement', 'Index II', 'Bank loan statement']
  const renderBank = () => {
    if (consentState === 'idle')
      return (
        <div>
          <p>Request: {DOCS.join(', ')}. Purpose: home-loan verification. Expiry: 7 days.</p>
          <button className="bh-btn p" onClick={() => setConsentState('pend_soc')}>
            Submit request
          </button>
        </div>
      )
    if (consentState === 'granted')
      return (
        <div>
          <span className="bh-pill">ACCESS GRANTED · 7 days</span>
          {DOCS.map(d => (
            <div key={d} className="bh-doc">
              {d}
              <span>view</span>
            </div>
          ))}
        </div>
      )
    if (consentState === 'rejected')
      return (
        <div>
          <span className="bh-pill">REJECTED</span>
          <p>No documents are accessible.</p>
          <button className="bh-btn" onClick={() => setConsentState('idle')}>
            Reset
          </button>
        </div>
      )
    if (consentState === 'revoked')
      return (
        <div>
          <span className="bh-pill">REVOKED / EXPIRED</span>
          <p>Access has ended. Documents are hidden.</p>
          <button className="bh-btn" onClick={() => setConsentState('idle')}>
            Reset
          </button>
        </div>
      )
    return (
      <div>
        <span className="bh-pill">{consentState === 'pend_soc' ? 'AWAITING SOCIETY' : 'AWAITING HOMEOWNER'}</span>
        <p>
          No documents are visible yet.{' '}
          {consentState === 'pend_own' ? 'Society approval alone never exposes documents.' : ''}
        </p>
      </div>
    )
  }
  const renderSoc = () => {
    if (consentState === 'pend_soc')
      return (
        <div>
          <p>Bank request received for 3 documents.</p>
          <button className="bh-btn p" onClick={() => setConsentState('pend_own')}>
            Approve
          </button>
          <button className="bh-btn" onClick={() => setConsentState('rejected')}>
            Reject
          </button>
        </div>
      )
    if (consentState === 'idle') return <p>No pending bank requests.</p>
    return <p>Request handled. Status: {consentState === 'pend_own' ? 'approved, awaiting homeowner' : consentState}.</p>
  }
  const renderOwn = () => {
    if (consentState === 'pend_own')
      return (
        <div>
          <p>Society approved. Do you consent to share these 3 documents for 7 days?</p>
          <button className="bh-btn p" onClick={() => setConsentState('granted')}>
            Consent
          </button>
          <button className="bh-btn" onClick={() => setConsentState('rejected')}>
            Reject
          </button>
        </div>
      )
    if (consentState === 'granted')
      return (
        <div>
          <p>You have an active grant.</p>
          <button className="bh-btn" onClick={() => setConsentState('revoked')}>
            Revoke access
          </button>
        </div>
      )
    if (consentState === 'idle') return <p>Nothing awaiting your consent.</p>
    return <p>No active grants.</p>
  }

  return (
    <div className="bh-root">
      <style>{`
        .bh-root{--dg:#123C32;--fg:#1F5B49;--iv:#F5F1E8;--au:#D5B477;--ch:#252B29;box-sizing:border-box}
        .bh-root *,.bh-root *::before,.bh-root *::after{box-sizing:border-box}
        .bh-root{font-family:Inter,system-ui,sans-serif;background:var(--iv);color:var(--ch);overflow-x:hidden}
        .bh-root h1,.bh-root h2,.bh-root h3,.bh-root .mn{font-family:Manrope,system-ui,sans-serif;letter-spacing:-.03em;margin:0}
        .bh-nav{position:fixed;top:0;left:0;right:0;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:18px 5vw;color:var(--iv);backdrop-filter:blur(10px);background:rgba(18,60,50,0.55);border-bottom:1px solid rgba(213,180,119,0.16)}
        .bh-nav b{font:800 15px Manrope;letter-spacing:.28em}
        .bh-nav a{color:inherit;text-decoration:none;font-size:13px;margin-left:24px;opacity:.85;transition:.2s}
        .bh-nav a:hover{color:var(--au);opacity:1}
        .bh-hero{height:320vh;position:relative;background:radial-gradient(circle at 65% 42%, #1d5747 0%, #123C32 68%)}
        .bh-stick{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden}
        .bh-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
        .bh-fallback-stage{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;perspective:1200px}
        .bh-fallback-folder{width:min(420px,78vw);height:min(300px,54vw);border-radius:16px;background:linear-gradient(145deg,#246854,#143f34);border:1px solid rgba(213,180,119,0.45);box-shadow:0 35px 80px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.15);position:relative;transform:rotateX(16deg) rotateY(-14deg);display:flex;flex-direction:column;justify-content:space-between;padding:28px}
        .bh-fallback-docs{position:absolute;right:-24px;top:-36px;display:flex;gap:12px}
        .bh-fallback-card{width:130px;height:175px;background:#F5F1E8;color:#123C32;border-top:6px solid #D5B477;border-radius:6px;padding:12px;box-shadow:0 16px 34px rgba(0,0,0,0.35);font:700 10px Manrope;letter-spacing:.08em}
        .bh-ov{position:absolute;left:5vw;right:5vw;bottom:8vh;color:var(--iv);pointer-events:none;z-index:5;display:flex;justify-content:space-between;align-items:flex-end;gap:32px;flex-wrap:wrap}
        .bh-ov>*{pointer-events:auto}
        .bh-hero-copy{max-width:640px;background:linear-gradient(180deg,rgba(18,60,50,0.15),rgba(18,60,50,0.72));backdrop-filter:blur(6px);padding:28px 32px;border-left:2px solid var(--au);border-radius:0 12px 12px 0}
        .bh-kick{font:700 12px Manrope;letter-spacing:.4em;color:var(--au);margin-bottom:14px;display:flex;align-items:center;gap:10px}
        .bh-kick::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--au);box-shadow:0 0 12px var(--au)}
        #bh-h1{font-weight:800;font-size:clamp(34px,5.4vw,76px);line-height:1.02;opacity:1;transform:none;margin:0;text-shadow:0 8px 28px rgba(0,0,0,0.35)}
        #bh-sub{max-width:520px;margin:18px 0 24px;font-size:clamp(14px,1.25vw,17px);line-height:1.6;opacity:1;color:#e4e0d4}
        #bh-ctas{opacity:1;display:flex;gap:14px;flex-wrap:wrap}
        .bh-badges{display:grid;grid-template-columns:repeat(3,minmax(130px,1fr));gap:12px;max-width:460px;transition:opacity .3s}
        .bh-badge-card{background:rgba(18,60,50,0.75);backdrop-filter:blur(8px);border:1px solid rgba(213,180,119,0.35);padding:14px 16px;border-radius:8px}
        .bh-badge-card b{display:block;font:800 20px Manrope;color:var(--au);margin-bottom:4px}
        .bh-badge-card span{font-size:11px;letter-spacing:.06em;color:#d9d6c9;line-height:1.35;display:block}
        .bh-btn{display:inline-block;padding:14px 26px;font:600 14px Manrope;text-decoration:none;border:1px solid var(--au);color:var(--iv);cursor:pointer;background:rgba(18,60,50,0.4);transition:.25s;border-radius:4px}
        .bh-btn.p{background:var(--au);color:var(--dg)}
        .bh-btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.3)}
        .bh-scrl{position:absolute;left:50%;top:84px;transform:translateX(-50%);font-size:11px;letter-spacing:.28em;color:var(--iv);opacity:.85;text-align:center;z-index:5;pointer-events:none}
        .bh-scrl i{display:block;width:1px;height:38px;margin:10px auto 0;background:var(--au);animation:dr 1.8s infinite}
        @keyframes dr{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
        .bh-section{padding:14vh 5vw;position:relative}
        .bh-lbl{font:600 12px Manrope;letter-spacing:.35em;color:var(--fg);margin-bottom:22px}
        .bh-prob h2{font-size:clamp(34px,6vw,84px);font-weight:800;max-width:900px;line-height:1}
        .bh-prob h2 em{font-style:normal;color:var(--fg);background:linear-gradient(transparent 62%,rgba(213,180,119,.55) 0)}
        .bh-pl{margin-top:9vh;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0;border-top:1px solid var(--ch)}
        .bh-pl div{padding:26px 24px 30px 0;border-bottom:1px solid rgba(37,43,41,.2);font-size:16px;line-height:1.55}
        .bh-pl span{display:block;font:300 44px Manrope;color:var(--au);margin-bottom:10px}
        .bh-sol{background:var(--fg);color:var(--iv);overflow:hidden}
        .bh-sol h2{font-size:clamp(30px,5vw,68px);font-weight:800;max-width:800px}
        .bh-net{position:relative;max-width:980px;height:420px;margin:7vh auto 0}
        .bh-net svg{position:absolute;inset:0;width:100%;height:100%}
        .bh-nd{position:absolute;transform:translate(-50%,-50%);text-align:center;width:200px}
        .bh-nd b{display:grid;place-items:center;width:84px;height:84px;margin:0 auto 12px;border:1px solid var(--au);background:var(--dg);font:800 26px Manrope;color:var(--au);border-radius:50%}
        .bh-nd small{display:block;opacity:.75;font-size:13px;line-height:1.45}
        .bh-nd h3{font-size:18px}
        .bh-how h2,.bh-priv h2{font-size:clamp(30px,5vw,64px);font-weight:800}
        .bh-tl{position:relative;margin:8vh 0 0 4px;padding-left:46px;max-width:760px}
        .bh-tl::before{content:"";position:absolute;left:0;top:0;bottom:0;width:1px;background:rgba(37,43,41,.2)}
        #bh-ln{position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--au);transform:scaleY(0);transform-origin:top}
        .bh-st{margin-bottom:64px;position:relative}
        .bh-st::before{content:attr(data-n);position:absolute;left:-70px;top:-4px;width:46px;height:46px;background:var(--iv);display:grid;place-items:center;font:800 18px Manrope;color:var(--fg)}
        .bh-st h3{font-size:24px;margin-bottom:8px}
        .bh-st p{margin:0;line-height:1.6;color:#4a524f}
        .bh-priv{background:var(--dg);color:var(--iv)}
        .bh-pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1px;background:rgba(213,180,119,.3);margin-top:8vh;border:1px solid rgba(213,180,119,.3)}
        .bh-pg div{background:var(--dg);padding:32px 26px;transition:.3s}
        .bh-pg div:hover{background:#17463a}
        .bh-pg h3{font-size:19px;color:var(--au);margin-bottom:10px}
        .bh-pg p{margin:0;font-size:15px;line-height:1.55;color:#cfd3c9}
        .bh-demo{background:var(--iv)}
        .bh-demo h2{font-size:clamp(28px,4.4vw,56px);font-weight:800;max-width:760px}
        .bh-tag{display:inline-block;margin:18px 0 0;padding:5px 10px;border:1px dashed var(--fg);font-size:12px;color:var(--fg)}
        .bh-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:5vh}
        .bh-col{background:#fff;border-top:3px solid var(--dg);padding:22px;min-height:210px;box-shadow:0 14px 34px rgba(18,60,50,.1)}
        .bh-col h3{font-size:14px;letter-spacing:.2em;color:var(--fg);margin-bottom:14px}
        .bh-col p{font-size:14px;line-height:1.5;margin:0 0 14px}
        .bh-col .bh-btn{color:var(--dg);border-color:var(--dg);background:transparent;padding:10px 16px;font-size:13px;margin:0 8px 8px 0}
        .bh-col .bh-btn.p{background:var(--dg);color:var(--iv)}
        .bh-doc{padding:9px 12px;margin-bottom:6px;background:var(--iv);font-size:13px;display:flex;justify-content:space-between}
        .bh-pill{display:inline-block;padding:3px 9px;font-size:12px;background:var(--au);color:var(--dg);margin-bottom:12px;font-weight:600}
        .bh-fin{background:radial-gradient(circle at 70% 30%,var(--fg),var(--dg) 65%);color:var(--iv);text-align:center;padding:20vh 5vw}
        .bh-fin h2{font-size:clamp(34px,6vw,84px);font-weight:800;max-width:900px;margin:0 auto 36px;line-height:1}
        .bh-fin h2 span{color:var(--au)}
        .bh-footer{background:var(--ch);color:#bfc4bd;padding:60px 5vw 40px;font-size:14px}
        .bh-footer .r{display:flex;flex-wrap:wrap;gap:28px;justify-content:space-between}
        .bh-footer b{font:800 16px Manrope;letter-spacing:.28em;color:var(--iv)}
        .bh-footer a{color:inherit;text-decoration:none;margin-right:20px;display:inline-block;margin-bottom:8px}
        .bh-footer a:hover{color:var(--au)}
        .bh-footer small{display:block;margin-top:34px;opacity:.6;line-height:1.5}
        .rv{opacity:1;transform:none}
        @media(max-width:860px){.bh-badges{display:none}.bh-hero-copy{padding:20px}}
        @media(max-width:700px){.bh-nav a{display:none}.bh-net{height:560px}.bh-nd{width:150px}.bh-st::before{left:-62px}}
        @media(prefers-reduced-motion:reduce){.bh-hero{height:100vh}.bh-scrl i{animation:none}}
      `}</style>

      <nav className="bh-nav">
        <b>SURAKSHA SETU</b>
        <div>
          <a href="#problem">The problem</a>
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#demo">Try the demo</a>
          <Link to="/login" style={{ marginLeft: 24 }}>
            Login
          </Link>
        </div>
      </nav>

      <div className="bh-hero" id="hero" ref={heroRef}>
        <div className="bh-stick">
          <canvas ref={cvRef} className="bh-cv" aria-label="3D deep-green property folder with documents flying out" />
          {(webglFailed || reduced) && (
            <div className="bh-fallback-stage" aria-hidden="true">
              <div className="bh-fallback-folder">
                <div style={{ color: '#D5B477', font: '800 28px Manrope', letterSpacing: '.18em' }}>SURAKSHA SETU</div>
                <div className="bh-fallback-docs">
                  <div className="bh-fallback-card" style={{ transform: 'rotate(-8deg)' }}>
                    INDEX II
                    <div style={{ marginTop: 12, height: 4, background: '#123C32' }} />
                  </div>
                  <div className="bh-fallback-card" style={{ transform: 'rotate(6deg) translateY(-10px)' }}>
                    SALE DEED
                    <div style={{ marginTop: 12, height: 4, background: '#123C32' }} />
                  </div>
                </div>
                <div style={{ color: '#F5F1E8', fontSize: 12, letterSpacing: '.22em', opacity: 0.85 }}>
                  PROPERTY RECORD LOCKER · CONSENT VERIFIED
                </div>
              </div>
            </div>
          )}
          <div className="bh-scrl" id="bh-scrl">
            SCROLL TO UNPACK RECORDS<i></i>
          </div>
          <div className="bh-ov">
            <div className="bh-hero-copy">
              <div className="bh-kick">SURAKSHA SETU · PROPERTY TRUST PROTOCOL</div>
              <h1 id="bh-h1">
                Your Property.
                <br />
                Your Documents.
                <br />
                Your Peace of Mind.
              </h1>
              <p id="bh-sub">
                One trusted space to organise property records, connect housing societies and securely share authorised
                information with financial institutions.
              </p>
              <div id="bh-ctas">
                <Link className="bh-btn p" to="/register">
                  Explore Suraksha Setu
                </Link>
                <a className="bh-btn" href="#demo">
                  Try Live Consent Demo
                </a>
                <Link className="bh-btn" to="/login">
                  Portal Login
                </Link>
              </div>
            </div>
            <div className="bh-badges" id="bh-badges">
              <div className="bh-badge-card">
                <b>7+</b>
                <span>Core property &amp; society record types</span>
              </div>
              <div className="bh-badge-card">
                <b>2-Step</b>
                <span>Society + Homeowner dual-approval gate</span>
              </div>
              <div className="bh-badge-card">
                <b>Time-Bound</b>
                <span>Auto-expiring &amp; revocable bank grants</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bh-section bh-prob" id="problem">
        <div className="bh-lbl rv">01 — THE PROBLEM</div>
        <h2 className="rv">
          Property records shouldn’t be <em>difficult to find.</em>
        </h2>
        <div className="bh-pl">
          <div className="rv">
            <span>i</span>Property documents are scattered across physical files and digital folders.
          </div>
          <div className="rv">
            <span>ii</span>Homeowners struggle to organise important records.
          </div>
          <div className="rv">
            <span>iii</span>Housing societies manage fragmented member information.
          </div>
          <div className="rv">
            <span>iv</span>Banks need authorised access to relevant documents.
          </div>
          <div className="rv">
            <span>v</span>Sharing documents without clear consent creates privacy concerns.
          </div>
        </div>
      </section>

      <section className="bh-section bh-sol">
        <div className="bh-lbl rv" style={{ color: 'var(--au)' }}>
          02 — THE SOLUTION
        </div>
        <h2 className="rv">One connection. Three stakeholders. Greater trust.</h2>
        <div className="bh-net">
          <svg viewBox="0 0 980 420" preserveAspectRatio="none">
            <g stroke="#D5B477" fill="none" strokeWidth="1.2" strokeDasharray="5 7">
              <path d="M490 80 L180 330" />
              <path d="M490 80 L800 330" />
              <path d="M180 330 L800 330" />
            </g>
            <circle id="bh-dot" r="5" fill="#D5B477" />
          </svg>
          <div className="bh-nd" style={{ left: '50%', top: '18%' }}>
            <b>S</b>
            <h3>Housing Societies</h3>
            <small>Register the community and approve who may ask.</small>
          </div>
          <div className="bh-nd" style={{ left: '18%', top: '80%' }}>
            <b>H</b>
            <h3>Homeowners</h3>
            <small>Organise records and give consent, document by document.</small>
          </div>
          <div className="bh-nd" style={{ left: '82%', top: '80%' }}>
            <b>B</b>
            <h3>Banks</h3>
            <small>Request specific documents for a stated purpose.</small>
          </div>
        </div>
      </section>

      <section className="bh-section bh-how" id="how">
        <div className="bh-lbl rv">03 — HOW IT WORKS</div>
        <h2 className="rv">Four steps. Every one on record.</h2>
        <div className="bh-tl">
          <div id="bh-ln"></div>
          <div className="bh-st" data-n="1">
            <h3>Society registers its community</h3>
            <p>Buildings, flats and office bearers are set up once, creating a trusted directory.</p>
          </div>
          <div className="bh-st" data-n="2">
            <h3>Homeowners organise their records</h3>
            <p>Property, loan and society documents are uploaded and categorised in one workspace.</p>
          </div>
          <div className="bh-st" data-n="3">
            <h3>Banks request specific documents</h3>
            <p>A request names the documents, the purpose and an expiry date.</p>
          </div>
          <div className="bh-st" data-n="4">
            <h3>Society authorisation and homeowner consent</h3>
            <p>Access opens only when both approve, and only for the time requested.</p>
          </div>
        </div>
      </section>

      <section className="bh-section bh-priv" id="privacy">
        <div className="bh-lbl rv" style={{ color: 'var(--au)' }}>
          04 — PRIVACY AND CONTROL
        </div>
        <h2 className="rv">Your documents. Your permission.</h2>
        <div className="bh-pg">
          <div className="rv">
            <h3>Specific requests</h3>
            <p>Banks ask for named documents, never blanket access.</p>
          </div>
          <div className="rv">
            <h3>Two approvals</h3>
            <p>Society approval and homeowner consent are separate steps.</p>
          </div>
          <div className="rv">
            <h3>Time-limited</h3>
            <p>Every grant carries an expiry and then closes.</p>
          </div>
          <div className="rv">
            <h3>Transparent history</h3>
            <p>Each request, approval and view is logged for everyone involved.</p>
          </div>
          <div className="rv">
            <h3>Future control</h3>
            <p>Homeowners can revoke access whenever they choose.</p>
          </div>
        </div>
      </section>

      <section className="bh-section bh-demo" id="demo">
        <div className="bh-lbl rv">05 — TRY THE CONSENT WORKFLOW</div>
        <h2 className="rv">Play all three roles in one click-through.</h2>
        <span className="bh-tag">DEMO ONLY — frontend simulation, not real security enforcement</span>
        <div className="bh-cols">
          <div className="bh-col">
            <h3>BANK</h3>
            {renderBank()}
          </div>
          <div className="bh-col">
            <h3>SOCIETY ADMIN</h3>
            {renderSoc()}
          </div>
          <div className="bh-col">
            <h3>HOMEOWNER</h3>
            {renderOwn()}
          </div>
        </div>
      </section>

      <section className="bh-fin">
        <h2 className="rv">
          Bring every property record <span>closer to trust.</span>
        </h2>
        <Link className="bh-btn p rv" to="/register">
          Explore the Platform
        </Link>
      </section>

      <footer className="bh-footer">
        <div className="r">
          <div>
            <b>SURAKSHA SETU</b>
          </div>
          <div>
            <a href="#hero">About</a>
            <a href="#how">How it works</a>
            <Link to="/society/dashboard">Society Portal</Link>
            <Link to="/homeowner/dashboard">Homeowner Portal</Link>
            <Link to="/bank/dashboard">Bank Portal</Link>
            <a href="#privacy">Privacy</a>
          </div>
        </div>
        <small>
          Suraksha Setu is an independent prototype. It is not affiliated with, or certified by, any government body.
          Uploaded documents do not establish legal title.
        </small>
      </footer>
    </div>
  )
}
