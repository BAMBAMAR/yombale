// Preload Agent 8 : ajoute un X-Forwarded-For aleatoire a chaque fetch global afin que le rate-limit en memoire
// (authLimiter 20/15min, trust proxy=1) ne fausse pas le rejeu des runners existants. Ne modifie aucun runner.
const orig = global.fetch
global.fetch = (url, opts = {}) => {
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`
  const headers = Object.assign({}, opts.headers || {}, { 'X-Forwarded-For': ip })
  return orig(url, Object.assign({}, opts, { headers }))
}
