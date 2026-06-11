import { app } from 'electron'
import { type AppStrings, type Language, getStrings, resolveLanguage } from '../shared/i18n'

/**
 * Język ustalamy raz na podstawie preferowanych języków systemu operacyjnego
 * (polski OS → polski, pozostałe → angielski). Wywoływane po app.ready.
 */
let cached: Language | null = null

export function getLanguage(): Language {
  if (!cached) cached = resolveLanguage(app.getPreferredSystemLanguages())
  return cached
}

export function mainStrings(): AppStrings {
  return getStrings(getLanguage())
}
