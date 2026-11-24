import { useStore } from '@/state/store'
import { pick, tr, type Lang, type LS, type UIKey } from './i18n'

/** UI string in the active language. */
export const useT = () => {
  const lang = useStore((s) => s.lang)
  return (key: UIKey) => tr(key, lang)
}

/** Localized data string (room/exhibit fields) in the active language. */
export const useL = () => {
  const lang = useStore((s) => s.lang)
  return (v: LS | string | undefined) => pick(v, lang)
}

export const useLang = (): Lang => useStore((s) => s.lang)
