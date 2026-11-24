import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { RoomId } from '@/data/types'
import { detectQuality, type Quality } from '@/lib/quality'
import { detectLang, LANGS, type Lang } from '@/lib/i18n'
import { roomEntryU } from '@/lib/rail'
import { roomById } from '@/data/rooms'

export type Phase = 'loading' | 'gate' | 'live'
export type NavMode = 'rail' | 'walk'

interface AppState {
  phase: Phase
  mode: NavMode
  quality: Quality
  /** Museum-wide language, chosen at the entrance kiosk. */
  lang: Lang
  sound: boolean
  roomId: RoomId
  inspectId: string | null
  /** 0 = midnight … 0.5 = noon … 1 = midnight. The "4D" time dial. */
  timeOfDay: number
  /** Guided-rail progress (0..1). `railTarget` is what input moves; `railU` eases toward it. */
  railTarget: number
  railU: number
  /** Spawn request for free-walk mode (world xz). Consumed by FreeWalk. */
  walkSpawn: [number, number, number] | null
  pointerLocked: boolean
  hudHidden: boolean
  /** True until the first-frame shader warm-up finishes (everything visible for one compile pass). */
  warmup: boolean
  /** Bug-report modal (Shift+X): freezes game input while open. */
  reportOpen: boolean
  /** In-world feedback form focused: same freeze, so WASD doesn't walk while typing. */
  formOpen: boolean

  setPhase: (p: Phase) => void
  enter: (withSound: boolean) => void
  setMode: (m: NavMode) => void
  toggleMode: () => void
  setQuality: (q: Quality) => void
  setLang: (l: Lang) => void
  setSound: (s: boolean) => void
  setRoom: (id: RoomId) => void
  inspect: (id: string | null) => void
  setTimeOfDay: (t: number) => void
  nudgeRail: (delta: number) => void
  setRailTarget: (u: number) => void
  setRailU: (u: number) => void
  teleport: (id: RoomId) => void
  setPointerLocked: (v: boolean) => void
  setHudHidden: (v: boolean) => void
  setWarmup: (v: boolean) => void
  setReportOpen: (v: boolean) => void
  setFormOpen: (v: boolean) => void
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'loading',
    mode: 'rail',
    quality: detectQuality(),
    lang: ((): Lang => {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null
      return (LANGS as readonly string[]).includes(saved ?? '') ? (saved as Lang) : detectLang()
    })(),
    sound: false,
    roomId: 'entrance',
    inspectId: null,
    timeOfDay: 0.62,
    railTarget: 0,
    railU: 0,
    walkSpawn: null,
    pointerLocked: false,
    hudHidden: false,
    warmup: true,
    reportOpen: false,
    formOpen: false,

    setPhase: (phase) => set({ phase }),
    enter: (withSound) => set({ phase: 'live', sound: withSound }),
    setMode: (mode) => {
      if (mode === 'walk') {
        // spawn free-walk at the current room centre
        const r = roomById[get().roomId]
        set({ mode, walkSpawn: [r.center[0], r.floorY + 1.0, r.center[1]], inspectId: null })
      } else {
        const u = roomEntryU[get().roomId] ?? 0
        set({ mode, railTarget: u, railU: u, inspectId: null })
      }
    },
    toggleMode: () => get().setMode(get().mode === 'rail' ? 'walk' : 'rail'),
    setQuality: (quality) => set({ quality }),
    setLang: (lang) => {
      try { localStorage.setItem('lang', lang) } catch { /* private mode */ }
      document.documentElement.lang = lang === 'kr' ? 'uz' : lang
      set({ lang })
    },
    setSound: (sound) => set({ sound }),
    setRoom: (roomId) => { if (get().roomId !== roomId) set({ roomId }) },
    inspect: (inspectId) => set({ inspectId }),
    setTimeOfDay: (t) => set({ timeOfDay: clamp01(t) }),
    nudgeRail: (delta) => set({ railTarget: clamp01(get().railTarget + delta) }),
    setRailTarget: (u) => set({ railTarget: clamp01(u) }),
    setRailU: (u) => set({ railU: u }),
    teleport: (id) => {
      const u = roomEntryU[id]
      if (get().mode === 'rail' && u !== undefined) set({ railTarget: u, roomId: id, inspectId: null })
      else {
        const r = roomById[id]
        set({ walkSpawn: [r.center[0], r.floorY + 1.0, r.center[1]], roomId: id, inspectId: null })
      }
    },
    setPointerLocked: (pointerLocked) => set({ pointerLocked }),
    setHudHidden: (hudHidden) => set({ hudHidden }),
    setWarmup: (warmup) => set({ warmup }),
    setReportOpen: (reportOpen) => set({ reportOpen }),
    setFormOpen: (formOpen) => set({ formOpen }),
  })),
)

// dev-only: expose for visual test tooling
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __store: typeof useStore }).__store = useStore
}
