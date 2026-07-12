/**
 * 最近使用 / 收藏（纯本地）
 */
const storage = require('./storage')

const RECENT_KEY = 'tool_recents_v1'
const FAV_KEY = 'tool_favorites_v1'
const MAX_RECENT = 8

function getRecents() {
  const list = storage.get(RECENT_KEY, [])
  return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []
}

function getFavorites() {
  const list = storage.get(FAV_KEY, [])
  return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []
}

function pushRecent(id) {
  if (!id) return getRecents()
  const next = [id].concat(getRecents().filter((x) => x !== id)).slice(0, MAX_RECENT)
  storage.set(RECENT_KEY, next)
  return next
}

function isFavorite(id) {
  return getFavorites().indexOf(id) >= 0
}

function toggleFavorite(id) {
  if (!id) return { list: getFavorites(), on: false }
  let list = getFavorites()
  const on = list.indexOf(id) < 0
  if (on) list = [id].concat(list.filter((x) => x !== id))
  else list = list.filter((x) => x !== id)
  storage.set(FAV_KEY, list)
  return { list, on }
}

function setFavorites(ids) {
  const list = (ids || []).filter((x) => typeof x === 'string')
  storage.set(FAV_KEY, list)
  return list
}

module.exports = {
  getRecents,
  getFavorites,
  pushRecent,
  isFavorite,
  toggleFavorite,
  setFavorites
}