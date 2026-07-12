/**
 * 饮食日记数据层
 * storage: diet_hub_v1
 * 与 weight_hub 档案联动算 TDEE
 */
const storage = require('./storage')
const weightHub = require('./weight')
const foodDb = require('./food-db')

const STORE_KEY = 'diet_hub_v1'
const MAX_ENTRIES = 2000

const MEALS = [
  { id: 'breakfast', name: '早餐', icon: 'B' },
  { id: 'lunch', name: '午餐', icon: 'L' },
  { id: 'dinner', name: '晚餐', icon: 'D' },
  { id: 'snack', name: '加餐', icon: 'S' }
]

const ACTIVITY_LEVELS = [
  { id: '1.2', name: '久坐', desc: '几乎不运动' },
  { id: '1.375', name: '轻微', desc: '每周 1–3 次' },
  { id: '1.55', name: '中等', desc: '每周 3–5 次' },
  { id: '1.725', name: '较高', desc: '每周 6–7 次' },
  { id: '1.9', name: '非常高', desc: '重体力/职业运动' }
]

const MODES = [
  { id: 'lose', name: '减脂', delta: -400, macro: { p: 0.3, f: 0.3, c: 0.4 } },
  { id: 'keep', name: '维持', delta: 0, macro: { p: 0.2, f: 0.3, c: 0.5 } },
  { id: 'gain', name: '增肌', delta: 300, macro: { p: 0.25, f: 0.25, c: 0.5 } }
]

function uid() {
  return `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

function emptyState() {
  return {
    entries: [],
    recentFoodIds: [],
    customFoods: [],
    prefs: {
      mode: 'lose',
      activity: '1.55',
      customKcal: ''
    }
  }
}

function normalize(raw) {
  const base = emptyState()
  if (!raw || typeof raw !== 'object') return base
  const prefs = Object.assign({}, base.prefs, raw.prefs || {})
  let entries = Array.isArray(raw.entries) ? raw.entries : []
  entries = entries
    .map((e) => ({
      id: e.id || uid(),
      date: e.date,
      meal: e.meal || 'snack',
      foodId: e.foodId || '',
      name: e.name || '食物',
      grams: Number(e.grams) || 0,
      kcal: Number(e.kcal) || 0,
      protein: Number(e.protein) || 0,
      fat: Number(e.fat) || 0,
      carb: Number(e.carb) || 0,
      ts: Number(e.ts) || Date.now()
    }))
    .filter((e) => e.date && e.grams > 0)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_ENTRIES)
  return {
    entries,
    recentFoodIds: Array.isArray(raw.recentFoodIds) ? raw.recentFoodIds.slice(0, 20) : [],
    customFoods: Array.isArray(raw.customFoods) ? raw.customFoods : [],
    prefs
  }
}

function load() {
  return normalize(storage.get(STORE_KEY, null))
}

function save(state) {
  const next = normalize(state)
  storage.set(STORE_KEY, next)
  return next
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function calcBmr(profile, weightKg) {
  const w = Number(weightKg)
  const h = Number(profile && profile.heightCm)
  const a = Number(profile && profile.age)
  const g = profile && profile.gender
  if (!w || !h || !a || (g !== 'male' && g !== 'female')) return null
  // Mifflin-St Jeor
  const base = 10 * w + 6.25 * h - 5 * a
  return Math.round(g === 'male' ? base + 5 : base - 161)
}

function calcTdee(bmr, activity) {
  if (!bmr) return null
  const f = Number(activity) || 1.55
  return Math.round(bmr * f)
}

function resolveTargets(dietState, weightState) {
  const prefs = (dietState && dietState.prefs) || emptyState().prefs
  const profile = (weightState && weightState.profile) || {}
  const latest = weightHub.latestRecord(weightState && weightState.records)
  const weightKg = latest ? latest.weight : null
  const bmr = calcBmr(profile, weightKg)
  const tdee = calcTdee(bmr, prefs.activity)
  const mode = MODES.find((m) => m.id === prefs.mode) || MODES[0]

  let targetKcal = null
  if (prefs.customKcal !== '' && prefs.customKcal != null && Number(prefs.customKcal) > 0) {
    targetKcal = Math.round(Number(prefs.customKcal))
  } else if (tdee) {
    targetKcal = Math.max(1200, tdee + mode.delta)
  } else {
    // 无档案时的保守默认
    targetKcal = mode.id === 'gain' ? 2500 : mode.id === 'keep' ? 2000 : 1600
  }

  const macro = mode.macro
  const proteinG = round1((targetKcal * macro.p) / 4)
  const fatG = round1((targetKcal * macro.f) / 9)
  const carbG = round1((targetKcal * macro.c) / 4)

  return {
    bmr,
    tdee,
    targetKcal,
    proteinG,
    fatG,
    carbG,
    mode: mode.id,
    modeName: mode.name,
    activity: prefs.activity,
    weightKg,
    hasProfile: !!(profile.gender && profile.age && profile.heightCm && weightKg)
  }
}

function dayEntries(state, date) {
  const d = date || weightHub.todayStr()
  return (state.entries || []).filter((e) => e.date === d)
}

function sumMacros(list) {
  const acc = { kcal: 0, protein: 0, fat: 0, carb: 0, count: 0 }
  ;(list || []).forEach((e) => {
    acc.kcal += Number(e.kcal) || 0
    acc.protein += Number(e.protein) || 0
    acc.fat += Number(e.fat) || 0
    acc.carb += Number(e.carb) || 0
    acc.count += 1
  })
  acc.kcal = Math.round(acc.kcal)
  acc.protein = round1(acc.protein)
  acc.fat = round1(acc.fat)
  acc.carb = round1(acc.carb)
  return acc
}

function mealGroups(state, date) {
  const list = dayEntries(state, date)
  return MEALS.map((m) => {
    const items = list.filter((e) => e.meal === m.id)
    return Object.assign({}, m, {
      items,
      sum: sumMacros(items)
    })
  })
}

function daySummary(dietState, weightState, date) {
  const d = date || weightHub.todayStr()
  const entries = dayEntries(dietState, d)
  const intake = sumMacros(entries)
  const targets = resolveTargets(dietState, weightState)
  const remainKcal = targets.targetKcal - intake.kcal
  const pct = (n, t) => (t > 0 ? Math.min(100, Math.round((n / t) * 100)) : 0)
  return {
    date: d,
    intake,
    targets,
    remainKcal,
    remainText: remainKcal >= 0 ? `还可吃 ${remainKcal}` : `已超 ${Math.abs(remainKcal)}`,
    remainTone: remainKcal >= 0 ? 'ok' : 'over',
    pctKcal: pct(intake.kcal, targets.targetKcal),
    pctP: pct(intake.protein, targets.proteinG),
    pctF: pct(intake.fat, targets.fatG),
    pctC: pct(intake.carb, targets.carbG),
    meals: mealGroups(dietState, d)
  }
}

function pushRecent(state, foodId) {
  if (!foodId) return state
  state.recentFoodIds = [foodId].concat((state.recentFoodIds || []).filter((x) => x !== foodId)).slice(0, 20)
  return state
}

function addEntry(state, payload) {
  let food = null
  if (payload.foodId) food = foodDb.getFoodById(payload.foodId)
  // custom inline
  if (!food && payload.custom) food = payload.custom

  const grams = Number(payload.grams)
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) throw new Error('INVALID_GRAMS')

  let nut
  if (food && food.kcal != null) {
    nut = foodDb.scaleNutrition(food, grams)
  } else if (payload.kcal != null) {
    nut = {
      grams,
      kcal: Math.round(Number(payload.kcal) || 0),
      protein: round1(Number(payload.protein) || 0),
      fat: round1(Number(payload.fat) || 0),
      carb: round1(Number(payload.carb) || 0)
    }
  } else {
    throw new Error('NO_FOOD')
  }

  const entry = {
    id: uid(),
    date: payload.date || weightHub.todayStr(),
    meal: payload.meal || 'snack',
    foodId: (food && food.id) || payload.foodId || '',
    name: (food && food.name) || payload.name || '食物',
    grams: nut.grams,
    kcal: nut.kcal,
    protein: nut.protein,
    fat: nut.fat,
    carb: nut.carb,
    ts: Date.now()
  }
  state.entries = [entry].concat(state.entries || [])
  if (entry.foodId) pushRecent(state, entry.foodId)
  return save(state)
}

function removeEntry(state, id) {
  state.entries = (state.entries || []).filter((e) => e.id !== id)
  return save(state)
}

function updatePrefs(state, patch) {
  state.prefs = Object.assign({}, state.prefs, patch || {})
  if (state.prefs.customKcal !== '' && state.prefs.customKcal != null) {
    const n = Number(state.prefs.customKcal)
    state.prefs.customKcal = Number.isFinite(n) && n > 0 ? Math.round(n) : ''
  }
  return save(state)
}

function recentFoods(state) {
  return (state.recentFoodIds || [])
    .map((id) => foodDb.getFoodById(id))
    .filter(Boolean)
}

module.exports = {
  STORE_KEY,
  MEALS,
  ACTIVITY_LEVELS,
  MODES,
  load,
  save,
  emptyState,
  resolveTargets,
  dayEntries,
  daySummary,
  mealGroups,
  sumMacros,
  addEntry,
  removeEntry,
  updatePrefs,
  recentFoods,
  calcBmr,
  calcTdee
}