import { createContext, useContext } from 'react'
import { type AppStrings, getStrings } from '@shared/i18n'

/** Język wyznaczony w procesie głównym, przekazany przez preload (window.api). */
export const StringsContext = createContext<AppStrings>(getStrings('en'))

export function useStrings(): AppStrings {
  return useContext(StringsContext)
}
