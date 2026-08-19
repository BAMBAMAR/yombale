import { common } from './common.ts'
import { auth } from './auth.ts'
import { account } from './account.ts'
import { shop } from './shop.ts'
import { caisse } from './caisse.ts'
import { errors } from './errors.ts'

export const fr = {
  common,
  auth,
  account,
  shop,
  caisse,
  errors,
}

export default fr
export type LocaleTranslations = typeof fr
