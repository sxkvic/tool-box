/**
 * 体重管理数据层 · 纯本地
 * storage: weight_hub_v1
 */
const storage = require('./storage')

const STORE_KEY = 'weight_hub_v1'
const MAX_RECORDS = 800

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDate(d) {
  const x = d instanceof Date ? d : new Date(d)
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`
}

function formatTime(d) {
  const x = d instanceof Date ? d : new Date(d)
  return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`
}

function todayStr() {
  return formatDate(new Date())
}

function uid() {
  return `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

function emptyState() {
  return {
    profile: { gender: '', age: '', heightCm: '' },
    goal: { targetKg: '', deadline: '', startKg: '', startDate: '' },
    records: [],
    prefs: { unit: 'kg', chartRange: '30' }
  }
}

function normalizeState(raw) {
  const base = emptyState()
  if (!raw || typeof raw !== 'object') return base
  const profile = Object.assign({}, base.profile, raw.profile || {})
  const goal = Object.assign({}, base.goal, raw.goal || {})
  const prefs = Object.assign({}, base.prefs, raw.prefs || {})
  let records = Array.isArray(raw.records) ? raw.records : []
  records = records
    .map((r) => ({
      id: r.id || uid(),
      date: r.date || formatDate(r.ts || Date.now()),
      time: r.time || formatTime(r.ts || Date.now()),
      ts: Number(r.ts) || Date.now(),
      weight: round1(Number(r.weight)),
      bodyFat: r.bodyFat == null || r.bodyFat === '' ? null : round1(Number(r.bodyFat)),
      note: r.note ? String(r.note).slice(0, 40) : ''
    }))
    .filter((r) => r.weight >= 20 && r.weight <= 400)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_RECORDS)
  return { profile, goal, records, prefs }
}

function load() {
  return normalizeState(storage.get(STORE_KEY, null))
}

function save(state) {
  const next = normalizeState(state)
  storage.set(STORE_KEY, next)
  return next
}

function round1(n) {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 10) / 10
}

function parseWeight(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (n < 20 || n > 400) return null
  return round1(n)
}

function parseHeight(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 80 || n > 250) return null
  return Math.round(n * 10) / 10
}

function calcBmi(weightKg, heightCm) {
  const w = Number(weightKg)
  const h = Number(heightCm)
  if (!w || !h) return null
  const m = h / 100
  if (m <= 0) return null
  return Math.round((w / (m * m)) * 10) / 10
}

function bmiLevel(bmi) {
  if (bmi == null) {
    return { key: '', text: '--', color: '#8b95ad', hint: '完善身高与体重后可评估' }
  }
  if (bmi < 18.5) {
    return {
      key: 'under',
      text: '偏瘦',
      color: '#6ea8ff',
      hint: '可适当增加优质蛋白与力量训练，关注营养均衡。'
    }
  }
  if (bmi < 24) {
    return {
      key: 'normal',
      text: '正常',
      color: '#4ade80',
      hint: '体重处于健康区间，保持规律作息与运动即可。'
    }
  }
  if (bmi < 28) {
    return {
      key: 'over',
      text: '偏胖',
      color: '#fbbf24',
      hint: '建议控制总热量，增加有氧与力量训练，循序渐进。'
    }
  }
  return {
    key: 'obese',
    text: '肥胖',
    color: '#f87171',
    hint: '建议综合调整饮食与运动，必要时咨询专业人士。'
  }
}

function idealRange(heightCm) {
  const h = Number(heightCm)
  if (!h) return null
  const m2 = (h / 100) * (h / 100)
  return {
    min: round1(18.5 * m2),
    max: round1(24 * m2)
  }
}

/** Deurenberg 估算体脂，sex 男=1 女=0 */
function estimateBodyFat(bmi, age, gender) {
  if (bmi == null || !age) return null
  const sex = gender === 'male' ? 1 : gender === 'female' ? 0 : null
  if (sex == null) return null
  const bf = 1.2 * bmi + 0.23 * Number(age) - 10.8 * sex - 5.4
  if (!Number.isFinite(bf)) return null
  return Math.max(3, Math.min(60, Math.round(bf * 10) / 10))
}

function latestRecord(records) {
  if (!records || !records.length) return null
  return records[0]
}

function previousRecord(records) {
  if (!records || records.length < 2) return null
  return records[1]
}

function recordsInRange(records, days) {
  if (!records || !records.length) return []
  if (days === 'all' || days == null) return records.slice().sort((a, b) => a.ts - b.ts)
  const n = Number(days)
  if (!n || n <= 0) return records.slice().sort((a, b) => a.ts - b.ts)
  const from = Date.now() - n * 24 * 3600 * 1000
  return records.filter((r) => r.ts >= from).sort((a, b) => a.ts - b.ts)
}

function deltaOf(a, b) {
  if (a == null || b == null) return null
  return round1(a - b)
}

function formatDelta(d) {
  if (d == null || !Number.isFinite(d)) return { text: '--', tone: 'mute', signed: '' }
  if (Math.abs(d) < 0.05) return { text: '0.0', tone: 'flat', signed: '0.0' }
  const sign = d > 0 ? '+' : ''
  const tone = d > 0 ? 'up' : 'down'
  return { text: `${sign}${d.toFixed(1)}`, tone, signed: `${sign}${d.toFixed(1)}` }
}

function goalProgress(goal, currentKg) {
  const target = Number(goal && goal.targetKg)
  const start = Number(goal && goal.startKg)
  const cur = Number(currentKg)
  if (!target || !cur) {
    return { percent: 0, remain: null, done: false, direction: '' }
  }
  const remain = round1(cur - target)
  if (!start) {
    return {
      percent: 0,
      remain,
      done: Math.abs(remain) < 0.05,
      direction: remain > 0 ? 'loss' : remain < 0 ? 'gain' : 'hold'
    }
  }
  const total = start - target
  if (Math.abs(total) < 0.05) {
    const done = Math.abs(remain) < 0.05
    return { percent: done ? 100 : 0, remain, done, direction: 'hold' }
  }
  // 减重：start > target；增重：start < target
  const direction = total > 0 ? 'loss' : 'gain'
  let percent
  if (direction === 'loss') {
    percent = ((start - cur) / (start - target)) * 100
  } else {
    percent = ((cur - start) / (target - start)) * 100
  }
  percent = Math.max(0, Math.min(100, Math.round(percent)))
  const done = direction === 'loss' ? cur <= target : cur >= target
  return { percent: done ? 100 : percent, remain, done, direction }
}

function daysBetween(a, b) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null
  const ms = d2.setHours(0, 0, 0, 0) - d1.setHours(0, 0, 0, 0)
  return Math.round(ms / (24 * 3600 * 1000))
}

function goalAdvice(goal, currentKg) {
  const target = Number(goal && goal.targetKg)
  const cur = Number(currentKg)
  if (!target || !cur) return null
  const remain = round1(cur - target)
  const deadline = goal.deadline
  let daysLeft = null
  if (deadline) {
    daysLeft = daysBetween(todayStr(), deadline)
  }
  let weekly = null
  if (daysLeft != null && daysLeft > 0) {
    weekly = round1(remain / (daysLeft / 7))
  }
  return { remain, daysLeft, weekly }
}

function statsBundle(state, rangeDays) {
  const records = state.records || []
  const latest = latestRecord(records)
  const prev = previousRecord(records)
  const series = recordsInRange(records, rangeDays)
  const firstInSeries = series.length ? series[0] : null
  const lastInSeries = series.length ? series[series.length - 1] : null

  let high = null
  let low = null
  series.forEach((r) => {
    if (high == null || r.weight > high) high = r.weight
    if (low == null || r.weight < low) low = r.weight
  })

  const last7 = recordsInRange(records, 7)
  const last30 = recordsInRange(records, 30)
  const d7 =
    last7.length >= 2 ? deltaOf(last7[last7.length - 1].weight, last7[0].weight) : null
  const d30 =
    last30.length >= 2 ? deltaOf(last30[last30.length - 1].weight, last30[0].weight) : null
  const dPrev = latest && prev ? deltaOf(latest.weight, prev.weight) : null
  const dRange =
    firstInSeries && lastInSeries ? deltaOf(lastInSeries.weight, firstInSeries.weight) : null
  const firstAll = records.length ? records[records.length - 1] : null
  const dTotal = latest && firstAll ? deltaOf(latest.weight, firstAll.weight) : null

  const height = state.profile.heightCm
  const bmi = latest ? calcBmi(latest.weight, height) : null
  const level = bmiLevel(bmi)
  const ideal = idealRange(height)
  let bodyFat = latest && latest.bodyFat != null ? latest.bodyFat : null
  let bodyFatSource = bodyFat != null ? 'manual' : ''
  if (bodyFat == null) {
    const est = estimateBodyFat(bmi, state.profile.age, state.profile.gender)
    if (est != null) {
      bodyFat = est
      bodyFatSource = 'est'
    }
  }

  const progress = goalProgress(state.goal, latest && latest.weight)
  const advice = goalAdvice(state.goal, latest && latest.weight)

  return {
    latest,
    prev,
    series,
    high,
    low,
    dPrev,
    d7,
    d30,
    dRange,
    dTotal,
    bmi,
    level,
    ideal,
    bodyFat,
    bodyFatSource,
    progress,
    advice,
    count: records.length
  }
}

function upsertRecord(state, payload) {
  const weight = parseWeight(payload.weight)
  if (weight == null) throw new Error('INVALID_WEIGHT')
  const now = payload.ts ? new Date(payload.ts) : new Date()
  const date = payload.date || formatDate(now)
  const time = payload.time || formatTime(now)
  const ts = payload.ts || now.getTime()
  let bodyFat = null
  if (payload.bodyFat !== '' && payload.bodyFat != null) {
    const bf = Number(payload.bodyFat)
    if (Number.isFinite(bf) && bf >= 3 && bf <= 60) bodyFat = round1(bf)
  }
  const note = payload.note ? String(payload.note).slice(0, 40) : ''

  const records = (state.records || []).slice()
  if (payload.id) {
    const idx = records.findIndex((r) => r.id === payload.id)
    if (idx >= 0) {
      records[idx] = Object.assign({}, records[idx], {
        weight,
        bodyFat,
        note,
        date,
        time,
        ts: records[idx].ts
      })
    }
  } else {
    records.unshift({
      id: uid(),
      date,
      time,
      ts,
      weight,
      bodyFat,
      note
    })
  }
  state.records = records
  return save(state)
}

function removeRecord(state, id) {
  state.records = (state.records || []).filter((r) => r.id !== id)
  return save(state)
}

function updateProfile(state, profile) {
  state.profile = Object.assign({}, state.profile, profile || {})
  if (state.profile.heightCm !== '' && state.profile.heightCm != null) {
    const h = parseHeight(state.profile.heightCm)
    state.profile.heightCm = h == null ? '' : h
  }
  if (state.profile.age !== '' && state.profile.age != null) {
    const a = Number(state.profile.age)
    state.profile.age = Number.isFinite(a) && a >= 5 && a <= 120 ? Math.round(a) : ''
  }
  return save(state)
}

function updateGoal(state, goalPatch) {
  const g = Object.assign({}, state.goal, goalPatch || {})
  if (g.targetKg !== '' && g.targetKg != null) {
    const t = parseWeight(g.targetKg)
    g.targetKg = t == null ? '' : t
  }
  // 若首次设置目标且无 start，用当前体重
  if (goalPatch && goalPatch.resetStart && g.targetKg) {
    const latest = latestRecord(state.records)
    if (latest) {
      g.startKg = latest.weight
      g.startDate = todayStr()
    } else if (!g.startKg) {
      g.startKg = ''
      g.startDate = todayStr()
    }
  } else if (g.targetKg && (g.startKg === '' || g.startKg == null)) {
    const latest = latestRecord(state.records)
    if (latest) {
      g.startKg = latest.weight
      g.startDate = g.startDate || todayStr()
    }
  }
  state.goal = g
  return save(state)
}

function updatePrefs(state, prefs) {
  state.prefs = Object.assign({}, state.prefs, prefs || {})
  return save(state)
}

/**
 * Canvas 折线图绘制数据
 * @returns {{ points: Array<{x,y,weight,date}>, min, max, w, h }}
 */
function buildChartLayout(series, width, height, pad) {
  const w = width || 320
  const h = height || 160
  const p = pad || { t: 16, r: 12, b: 24, l: 12 }
  if (!series || series.length === 0) {
    return { points: [], min: 0, max: 0, w, h, p }
  }
  let min = series[0].weight
  let max = series[0].weight
  series.forEach((r) => {
    if (r.weight < min) min = r.weight
    if (r.weight > max) max = r.weight
  })
  if (max - min < 1) {
    min = round1(min - 0.5)
    max = round1(max + 0.5)
  } else {
    const margin = (max - min) * 0.12
    min = round1(min - margin)
    max = round1(max + margin)
  }
  const innerW = w - p.l - p.r
  const innerH = h - p.t - p.b
  const n = series.length
  const points = series.map((r, i) => {
    const x = p.l + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
    const ratio = (r.weight - min) / (max - min || 1)
    const y = p.t + innerH * (1 - ratio)
    return {
      x,
      y,
      weight: r.weight,
      date: r.date,
      id: r.id
    }
  })
  return { points, min, max, w, h, p }
}

function drawChart(canvasId, componentOrPage, series, theme, size) {
  const width = (size && size.w) || 320
  const height = (size && size.h) || 160
  const layout = buildChartLayout(series, width, height)
  const ctx = wx.createCanvasContext(canvasId, componentOrPage)
  const isLight = theme === 'light'
  const line = isLight ? '#2563eb' : '#5ce1ff'
  const fillTop = isLight ? 'rgba(37,99,235,0.18)' : 'rgba(92,225,255,0.22)'
  const fillBottom = isLight ? 'rgba(37,99,235,0.01)' : 'rgba(92,225,255,0.01)'
  const grid = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)'
  const text = isLight ? '#94a3b8' : '#5a6478'
  const dotStroke = isLight ? '#ffffff' : '#05070c'

  // 背景透明
  ctx.clearRect(0, 0, width, height)

  // 网格 3 条
  for (let i = 0; i < 3; i++) {
    const y = layout.p.t + ((height - layout.p.t - layout.p.b) * i) / 2
    ctx.beginPath()
    ctx.setStrokeStyle(grid)
    ctx.setLineWidth(1)
    ctx.moveTo(layout.p.l, y)
    ctx.lineTo(width - layout.p.r, y)
    ctx.stroke()
  }

  if (!layout.points.length) {
    ctx.setFillStyle(text)
    ctx.setFontSize(12)
    ctx.setTextAlign('center')
    ctx.fillText('暂无数据，先记一条体重吧', width / 2, height / 2)
    ctx.draw()
    return layout
  }

  const pts = layout.points

  // 填充
  if (pts.length >= 1) {
    const grad = ctx.createLinearGradient(0, layout.p.t, 0, height - layout.p.b)
    grad.addColorStop(0, fillTop)
    grad.addColorStop(1, fillBottom)
    ctx.beginPath()
    ctx.moveTo(pts[0].x, height - layout.p.b)
    pts.forEach((pt) => ctx.lineTo(pt.x, pt.y))
    ctx.lineTo(pts[pts.length - 1].x, height - layout.p.b)
    ctx.closePath()
    ctx.setFillStyle(grad)
    ctx.fill()
  }

  // 折线
  ctx.beginPath()
  ctx.setStrokeStyle(line)
  ctx.setLineWidth(2.5)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  pts.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y)
    else ctx.lineTo(pt.x, pt.y)
  })
  ctx.stroke()

  // 点：最多画 24 个，避免过密
  const step = pts.length > 24 ? Math.ceil(pts.length / 24) : 1
  pts.forEach((pt, i) => {
    if (i % step !== 0 && i !== pts.length - 1) return
    ctx.beginPath()
    ctx.setFillStyle(line)
    ctx.arc(pt.x, pt.y, i === pts.length - 1 ? 4 : 2.5, 0, Math.PI * 2)
    ctx.fill()
    if (i === pts.length - 1) {
      ctx.beginPath()
      ctx.setStrokeStyle(dotStroke)
      ctx.setLineWidth(2)
      ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2)
      ctx.stroke()
    }
  })

  // min max 标签
  ctx.setFillStyle(text)
  ctx.setFontSize(10)
  ctx.setTextAlign('left')
  ctx.fillText(`${layout.max.toFixed(1)}`, 4, layout.p.t + 8)
  ctx.fillText(`${layout.min.toFixed(1)}`, 4, height - layout.p.b + 4)

  ctx.draw()
  return layout
}

module.exports = {
  STORE_KEY,
  load,
  save,
  emptyState,
  todayStr,
  formatDate,
  formatTime,
  parseWeight,
  parseHeight,
  calcBmi,
  bmiLevel,
  idealRange,
  estimateBodyFat,
  latestRecord,
  statsBundle,
  upsertRecord,
  removeRecord,
  updateProfile,
  updateGoal,
  updatePrefs,
  formatDelta,
  goalProgress,
  buildChartLayout,
  drawChart,
  round1
}