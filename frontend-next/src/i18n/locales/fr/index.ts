import { common } from './common'
import { auth } from './auth'
import { account } from './account'
import { shop } from './shop'
import { caisse } from './caisse'
import { errors } from './errors'

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
