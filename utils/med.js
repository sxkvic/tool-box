/**
 * 健康记录 · 以人为中心
 * storage: med_hub_v1
 * 结构：persons[] · meds[](personId) · temps[](personId)
 * 间隔单位：小时；剩余多久 = 吃药时间 + 间隔 − 当前时间
 */
const storage = require('./storage')

const STORE_KEY = 'med_hub_v1'
const MAX_PERSONS = 50
const MAX_MEDS = 300
const MAX_TEMPS = 500

const GENDERS = [
  { id: 'male', label: '男' },
  { id: 'female', label: '女' }
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function uid(prefix) {
  return `${prefix || 'x'}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

function formatDate(d) {
  const x = d instanceof Date ? d : new Date(d)
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`
}

function formatTime(d) {
  const x = d instanceof Date ? d : new Date(d)
  return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`
}

function formatDateTime(d) {
  const x = d instanceof Date ? d : new Date(d)
  return `${formatDate(x)} ${formatTime(x)}`
}

function emptyState() {
  return { persons: [], meds: [], temps: [] }
}

function round1(n) {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 10) / 10
}

function parseAge(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > 150) return null
  return Math.round(n)
}

function parseIntervalHours(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0 || n > 24 * 365) return null
  return Math.round(n * 100) / 100
}

function parseTemp(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 30 || n > 45) return null
  return round1(n)
}

function normalizeGender(g) {
  if (g === 'male' || g === 'female') return g
  if (g === '男') return 'male'
  if (g === '女') return 'female'
  return ''
}

function genderLabel(g) {
  const id = normalizeGender(g)
  if (id === 'male') return '男'
  if (id === 'female') return '女'
  return '--'
}

function normalizePerson(p) {
  if (!p || typeof p !== 'object') return null
  const name = String(p.name || p.personName || '').trim().slice(0, 20)
  if (!name) return null
  const age = parseAge(p.age)
  const gender = normalizeGender(p.gender)
  return {
    id: p.id || uid('p'),
    name,
    age: age == null ? null : age,
    gender,
    createdAt: Number(p.createdAt) || Date.now()
  }
}

function normalizeAdvice(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 200)
  return s
}

function normalizeMed(m) {
  if (!m || typeof m !== 'object') return null
  const personId = String(m.personId || '').trim()
  const medicineName = String(m.medicineName || m.medicine || '').trim().slice(0, 40)
  if (!personId || !medicineName) return null
  const doseTime = Number(m.doseTime) || Number(m.ts) || Date.now()
  const intervalHours = parseIntervalHours(
    m.intervalHours != null ? m.intervalHours : m.interval
  )
  if (intervalHours == null) return null
  // 医嘱：饭后服用、每日三次等，可选
  const advice = normalizeAdvice(m.advice != null ? m.advice : m.doctorAdvice)
  return {
    id: m.id || uid('m'),
    personId,
    medicineName,
    advice,
    doseTime,
    intervalHours,
    createdAt: Number(m.createdAt) || doseTime,
    doseTimeText: formatDateTime(doseTime)
  }
}

function normalizeTemp(t) {
  if (!t || typeof t !== 'object') return null
  const value = parseTemp(t.value != null ? t.value : t.temp)
  if (value == null) return null
  const personId = String(t.personId || '').trim()
  if (!personId) return null
  const ts = Number(t.ts) || Date.now()
  return {
    id: t.id || uid('t'),
    personId,
    value,
    ts,
    timeText: formatDateTime(ts),
    date: formatDate(ts),
    medId: t.medId ? String(t.medId) : ''
  }
}

/**
 * 从旧版 records/temps（按姓名）迁移到 persons 模型
 */
function migrateLegacy(raw) {
  const persons = []
  const meds = []
  const temps = []
  const byName = Object.create(null)

  function ensurePerson(name, age, gender) {
    const n = String(name || '').trim().slice(0, 20)
    if (!n) return null
    if (byName[n]) {
      const p = byName[n]
      if (p.age == null && age != null) p.age = age
      if (!p.gender && gender) p.gender = gender
      return p
    }
    const p = normalizePerson({
      id: uid('p'),
      name: n,
      age,
      gender,
      createdAt: Date.now()
    })
    if (!p) return null
    byName[n] = p
    persons.push(p)
    return p
  }

  const oldRecords = Array.isArray(raw.records) ? raw.records : []
  oldRecords.forEach((r) => {
    if (!r || typeof r !== 'object') return
    const person = ensurePerson(r.personName || r.name, r.age, r.gender)
    if (!person) return
    const medicineName = String(r.medicineName || r.medicine || '').trim()
    const intervalHours = parseIntervalHours(
      r.intervalHours != null ? r.intervalHours : r.interval
    )
    if (medicineName && intervalHours != null) {
      const med = normalizeMed({
        id: r.id || uid('m'),
        personId: person.id,
        medicineName,
        advice: r.advice != null ? r.advice : r.doctorAdvice,
        doseTime: r.doseTime || r.ts,
        intervalHours,
        createdAt: r.createdAt
      })
      if (med) meds.push(med)
    }
    const nested = Array.isArray(r.temps) ? r.temps : []
    nested.forEach((t) => {
      const nt = normalizeTemp(
        Object.assign({}, t, { personId: person.id, value: t.value != null ? t.value : t.temp })
      )
      if (nt) temps.push(nt)
    })
  })

  const oldTemps = Array.isArray(raw.temps) ? raw.temps : []
  oldTemps.forEach((t) => {
    if (!t || typeof t !== 'object') return
    if (t.personId) {
      const nt = normalizeTemp(t)
      if (nt) temps.push(nt)
      return
    }
    const person = ensurePerson(t.personName, t.age, t.gender)
    if (!person) return
    const nt = normalizeTemp(Object.assign({}, t, { personId: person.id }))
    if (nt) temps.push(nt)
  })

  return { persons, meds, temps }
}

function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return emptyState()

  let persons
  let meds
  let temps

  const hasNew =
    Array.isArray(raw.persons) ||
    (Array.isArray(raw.meds) && raw.meds.some((m) => m && m.personId))

  if (hasNew && Array.isArray(raw.persons)) {
    persons = raw.persons.map(normalizePerson).filter(Boolean)
    meds = (Array.isArray(raw.meds) ? raw.meds : []).map(normalizeMed).filter(Boolean)
    temps = (Array.isArray(raw.temps) ? raw.temps : []).map(normalizeTemp).filter(Boolean)
  } else if (Array.isArray(raw.records) || (Array.isArray(raw.temps) && raw.temps.length)) {
    const migrated = migrateLegacy(raw)
    persons = migrated.persons
    meds = migrated.meds
    temps = migrated.temps
  } else {
    persons = []
    meds = []
    temps = []
  }

  // 丢掉指向不存在成员的数据
  const personIds = Object.create(null)
  persons.forEach((p) => {
    personIds[p.id] = true
  })
  meds = meds.filter((m) => personIds[m.personId])
  temps = temps.filter((t) => personIds[t.personId])

  // 去重
  const dedupe = (list) => {
    const seen = Object.create(null)
    return list.filter((x) => {
      if (seen[x.id]) return false
      seen[x.id] = true
      return true
    })
  }

  // 成员顺序即用户拖拽顺序，首位为默认；不再按创建时间重排
  persons = dedupe(persons).slice(0, MAX_PERSONS)
  meds = dedupe(meds)
    .sort((a, b) => b.doseTime - a.doseTime)
    .slice(0, MAX_MEDS)
  temps = dedupe(temps)
    .sort((a, b) => a.ts - b.ts)
    .slice(-MAX_TEMPS)

  return { persons, meds, temps }
}

function load() {
  return normalizeState(storage.get(STORE_KEY, null))
}

function save(state) {
  const next = normalizeState(state)
  storage.set(STORE_KEY, next)
  return next
}

function getPerson(state, personId) {
  const s = normalizeState(state)
  return s.persons.find((p) => p.id === personId) || null
}

function addPerson(state, payload) {
  const next = normalizeState(state)
  const person = normalizePerson({
    id: uid('p'),
    name: payload && (payload.name || payload.personName),
    age: payload && payload.age,
    gender: payload && payload.gender,
    createdAt: Date.now()
  })
  if (!person) return { ok: false, state: next, error: 'invalid' }
  // 同名合并更新资料
  const exist = next.persons.find((p) => p.name === person.name)
  if (exist) {
    exist.age = person.age != null ? person.age : exist.age
    exist.gender = person.gender || exist.gender
    return { ok: true, state: next, person: exist, merged: true }
  }
  // 新成员追加到末尾，不挤占首位默认
  next.persons = next.persons.concat([person]).slice(0, MAX_PERSONS)
  return { ok: true, state: next, person, merged: false }
}

/**
 * 拖动调整成员顺序；index 0 为默认首位
 */
function movePerson(state, fromIndex, toIndex) {
  const next = normalizeState(state)
  const list = next.persons.slice()
  const from = Number(fromIndex)
  const to = Number(toIndex)
  if (!Number.isInteger(from) || !Number.isInteger(to)) return next
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return next
  if (from === to) return next
  const item = list.splice(from, 1)[0]
  list.splice(to, 0, item)
  next.persons = list
  return next
}

function setPersonOrder(state, idList) {
  const next = normalizeState(state)
  const map = Object.create(null)
  next.persons.forEach((p) => {
    map[p.id] = p
  })
  const ordered = []
  ;(idList || []).forEach((id) => {
    if (map[id]) {
      ordered.push(map[id])
      delete map[id]
    }
  })
  // 未出现在 idList 的追加在后
  Object.keys(map).forEach((id) => ordered.push(map[id]))
  next.persons = ordered.slice(0, MAX_PERSONS)
  return next
}

function updatePerson(state, personId, patch) {
  const next = normalizeState(state)
  const idx = next.persons.findIndex((p) => p.id === personId)
  if (idx < 0) return { ok: false, state: next, error: 'not_found' }
  const cur = next.persons[idx]
  const person = normalizePerson({
    id: cur.id,
    name: patch && patch.name != null ? patch.name : cur.name,
    age: patch && Object.prototype.hasOwnProperty.call(patch, 'age') ? patch.age : cur.age,
    gender: patch && patch.gender != null ? patch.gender : cur.gender,
    createdAt: cur.createdAt
  })
  if (!person) return { ok: false, state: next, error: 'invalid' }
  next.persons[idx] = person
  return { ok: true, state: next, person }
}

function removePerson(state, personId) {
  const next = normalizeState(state)
  next.persons = next.persons.filter((p) => p.id !== personId)
  next.meds = next.meds.filter((m) => m.personId !== personId)
  next.temps = next.temps.filter((t) => t.personId !== personId)
  return next
}

/**
 * 添加用药（必须挂在成员下，不再填姓名）
 */
function addMed(state, payload) {
  const next = normalizeState(state)
  const personId = String((payload && payload.personId) || '').trim()
  if (!personId || !next.persons.some((p) => p.id === personId)) {
    return { ok: false, state: next, error: 'no_person' }
  }
  const med = normalizeMed({
    id: uid('m'),
    personId,
    medicineName: payload && payload.medicineName,
    advice: payload && (payload.advice != null ? payload.advice : payload.doctorAdvice),
    doseTime: payload && (payload.doseTime != null ? payload.doseTime : Date.now()),
    intervalHours: payload && (payload.intervalHours != null ? payload.intervalHours : payload.interval),
    createdAt: Date.now()
  })
  if (!med) return { ok: false, state: next, error: 'invalid' }
  next.meds = [med].concat(next.meds).slice(0, MAX_MEDS)
  return { ok: true, state: next, med }
}

function removeMed(state, medId) {
  const next = normalizeState(state)
  next.meds = next.meds.filter((m) => m.id !== medId)
  return next
}

/**
 * 记一次服药：把上次吃药时间改为 now，剩余时间按间隔重新起算
 * @returns {{ state, med, remain }}
 */
function markMedDose(state, medId, when) {
  const next = normalizeState(state)
  const ts = when != null ? Number(when) : Date.now()
  let updated = null
  next.meds = next.meds.map((m) => {
    if (m.id !== medId) return m
    updated = Object.assign({}, m, {
      doseTime: ts,
      doseTimeText: formatDateTime(ts)
    })
    return updated
  })
  if (!updated) {
    return { state: next, med: null, remain: null }
  }
  // 标记后重排：刚吃的排前面
  next.meds = next.meds
    .slice()
    .sort((a, b) => b.doseTime - a.doseTime || b.createdAt - a.createdAt)
  const remain = calcRemaining(updated.doseTime, updated.intervalHours, ts)
  return { state: next, med: updated, remain }
}

/**
 * 添加体温（必须挂在成员下）
 */
function addTemp(state, payload) {
  const next = normalizeState(state)
  const personId = String((payload && payload.personId) || '').trim()
  if (!personId || !next.persons.some((p) => p.id === personId)) {
    return { ok: false, state: next, error: 'no_person' }
  }
  const temp = normalizeTemp({
    id: uid('t'),
    personId,
    value: payload && (payload.value != null ? payload.value : payload.temp),
    ts: payload && payload.ts,
    medId: payload && payload.medId
  })
  if (!temp) return { ok: false, state: next, error: 'invalid_temp' }
  next.temps = next.temps.concat([temp]).sort((a, b) => a.ts - b.ts).slice(-MAX_TEMPS)
  return { ok: true, state: next, temp }
}

function removeTemp(state, tempId) {
  const next = normalizeState(state)
  next.temps = next.temps.filter((t) => t.id !== tempId)
  return next
}

function medsOfPerson(state, personId) {
  const s = normalizeState(state)
  return s.meds.filter((m) => m.personId === personId)
}

function tempsOfPerson(state, personId) {
  const s = normalizeState(state)
  return s.temps.filter((t) => t.personId === personId)
}

/**
 * 体温分级上色
 * < 37.5 正常绿 · 37.5–38.5 发热橙 · > 38.5 高热红
 */
function tempLevel(value) {
  const v = Number(value)
  if (!Number.isFinite(v)) {
    return { key: 'unknown', label: '--', color: '#8b95ad', className: 'temp-unknown' }
  }
  if (v < 37.5) {
    return { key: 'normal', label: '正常', color: '#3dff9a', className: 'temp-normal' }
  }
  if (v <= 38.5) {
    return { key: 'fever', label: '发热', color: '#ff9f43', className: 'temp-fever' }
  }
  return { key: 'high', label: '高热', color: '#ff5c7a', className: 'temp-high' }
}

/**
 * @param {Array} temps
 * @param {{ order?: 'asc'|'desc' }} [opts] 按时间排序，默认 asc
 */
function getTempSeries(temps, opts) {
  if (!Array.isArray(temps) || !temps.length) return []
  const order = opts && opts.order === 'desc' ? 'desc' : 'asc'
  const list = temps
    .map(normalizeTemp)
    .filter(Boolean)
    .sort((a, b) => (order === 'desc' ? b.ts - a.ts : a.ts - b.ts))
  return list.map((t) => {
    const level = tempLevel(t.value)
    const date = t.date || formatDate(t.ts)
    return {
      id: t.id,
      value: t.value,
      ts: t.ts,
      timeText: t.timeText,
      timeOnly: formatTime(t.ts),
      date,
      dateLabel: formatDateLabel(date),
      personId: t.personId,
      levelKey: level.key,
      levelLabel: level.label,
      levelColor: level.color,
      levelClass: level.className
    }
  })
}

/** 今天 / 昨天 / 年月日 */
function formatDateLabel(dateStr) {
  const s = String(dateStr || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s || '--'
  const today = formatDate(new Date())
  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const yesterday = formatDate(yest)
  if (s === today) return `今天 ${s}`
  if (s === yesterday) return `昨天 ${s}`
  const parts = s.split('-')
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

/**
 * 按年月日分组
 * @param {Array} series getTempSeries 结果（已排序）
 * @param {{ order?: 'asc'|'desc' }} [opts] 日期组顺序，默认与 series 一致
 * @returns {{ date, dateLabel, items, count }[]}
 */
function groupTempsByDate(series, opts) {
  if (!Array.isArray(series) || !series.length) return []
  const order = opts && opts.order === 'asc' ? 'asc' : opts && opts.order === 'desc' ? 'desc' : null
  const map = Object.create(null)
  const keys = []
  series.forEach((t) => {
    const date = t.date || formatDate(t.ts)
    if (!map[date]) {
      map[date] = {
        date,
        dateLabel: t.dateLabel || formatDateLabel(date),
        items: [],
        count: 0
      }
      keys.push(date)
    }
    map[date].items.push(t)
    map[date].count += 1
  })
  // keys 顺序：跟随 series 中首次出现；series 已按时序则日期也按时序
  if (order === 'asc') {
    keys.sort()
  } else if (order === 'desc') {
    keys.sort().reverse()
  }
  return keys.map((k) => map[k])
}

function calcRemaining(doseTime, intervalHours, now) {
  const dose = Number(doseTime)
  const hours = Number(intervalHours)
  const t = now != null ? Number(now) : Date.now()
  if (!Number.isFinite(dose) || !Number.isFinite(hours) || hours <= 0) {
    return {
      remainingMs: 0,
      nextDoseTime: 0,
      overdue: false,
      due: false,
      text: '--',
      shortText: '--'
    }
  }
  const nextDoseTime = dose + hours * 3600 * 1000
  const remainingMs = nextDoseTime - t
  if (remainingMs <= 0) {
    const overdueMs = -remainingMs
    const overdue = overdueMs > 60 * 1000
    return {
      remainingMs: 0,
      nextDoseTime,
      overdue,
      due: true,
      text: overdue ? `已逾期 ${formatDuration(overdueMs)}` : '已到时间',
      shortText: overdue ? `逾期 ${formatDuration(overdueMs)}` : '已到'
    }
  }
  return {
    remainingMs,
    nextDoseTime,
    overdue: false,
    due: false,
    text: `剩余 ${formatDuration(remainingMs)}`,
    shortText: formatDuration(remainingMs)
  }
}

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(Number(ms) / 1000))
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  if (days > 0) {
    if (hours > 0) return `${days}天${hours}小时`
    return `${days}天`
  }
  if (hours > 0) {
    if (mins > 0) return `${hours}小时${mins}分`
    return `${hours}小时`
  }
  if (mins > 0) return `${mins}分钟`
  return '不到1分钟'
}

function decoratePerson(person, state, now) {
  if (!person) return null
  const s = normalizeState(state)
  const meds = s.meds.filter((m) => m.personId === person.id)
  const temps = s.temps.filter((t) => t.personId === person.id)
  const dueCount = meds.filter((m) => calcRemaining(m.doseTime, m.intervalHours, now).due).length
  return Object.assign({}, person, {
    genderText: genderLabel(person.gender),
    ageText: person.age != null ? `${person.age}岁` : '--',
    medCount: meds.length,
    tempCount: temps.length,
    dueCount
  })
}

function decorateMed(med, now) {
  if (!med) return null
  const remain = calcRemaining(med.doseTime, med.intervalHours, now)
  const date = formatDate(med.doseTime)
  return Object.assign({}, med, {
    intervalText: `${med.intervalHours} 小时`,
    remainText: remain.text,
    remainShort: remain.shortText,
    remainDue: remain.due,
    remainOverdue: remain.overdue,
    nextDoseText: remain.nextDoseTime ? formatDateTime(remain.nextDoseTime) : '--',
    date,
    dateLabel: formatDateLabel(date),
    timeOnly: formatTime(med.doseTime)
  })
}

/**
 * 用药列表（按吃药时间排序）
 * @param {Array} meds
 * @param {number} [now]
 * @param {{ order?: 'asc'|'desc' }} [opts]
 */
function getMedSeries(meds, now, opts) {
  if (!Array.isArray(meds) || !meds.length) return []
  const order = opts && opts.order === 'asc' ? 'asc' : 'desc'
  const t = now != null ? now : Date.now()
  return meds
    .map((m) => decorateMed(m, t))
    .filter(Boolean)
    .sort((a, b) => (order === 'asc' ? a.doseTime - b.doseTime : b.doseTime - a.doseTime))
}

/**
 * 用药按年月日分组（与体温分组结构一致）
 */
function groupMedsByDate(series, opts) {
  return groupTempsByDate(series, opts)
}

function decorateTemp(t) {
  const nt = normalizeTemp(t)
  if (!nt) return null
  const level = tempLevel(nt.value)
  return Object.assign({}, nt, {
    levelKey: level.key,
    levelLabel: level.label,
    levelColor: level.color,
    levelClass: level.className
  })
}

function buildChartLayout(series, width, height, pad) {
  const w = width || 320
  const h = height || 160
  const p = pad || { t: 16, r: 12, b: 24, l: 12 }
  if (!series || series.length === 0) {
    return { points: [], min: 0, max: 0, w, h, p }
  }
  let min = series[0].value
  let max = series[0].value
  series.forEach((r) => {
    const v = Number(r.value)
    if (v < min) min = v
    if (v > max) max = v
  })
  if (max - min < 0.3) {
    min = round1(min - 0.3)
    max = round1(max + 0.3)
  } else {
    const margin = (max - min) * 0.15
    min = round1(min - margin)
    max = round1(max + margin)
  }
  const innerW = w - p.l - p.r
  const innerH = h - p.t - p.b
  const n = series.length
  const points = series.map((r, i) => {
    const x = p.l + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
    const ratio = (r.value - min) / (max - min || 1)
    const y = p.t + innerH * (1 - ratio)
    return {
      x,
      y,
      value: r.value,
      ts: r.ts,
      date: r.date,
      timeText: r.timeText,
      id: r.id
    }
  })
  return { points, min, max, w, h, p }
}

function drawTempChart(canvasId, componentOrPage, series, theme, size) {
  const width = (size && size.w) || 320
  const height = (size && size.h) || 160
  const layout = buildChartLayout(series, width, height)
  const ctx = wx.createCanvasContext(canvasId, componentOrPage)
  const isLight = theme === 'light'
  const line = isLight ? '#f97316' : '#ff9f43'
  const fillTop = isLight ? 'rgba(249,115,22,0.18)' : 'rgba(255,159,67,0.22)'
  const fillBottom = isLight ? 'rgba(249,115,22,0.01)' : 'rgba(255,159,67,0.01)'
  const grid = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)'
  const text = isLight ? '#94a3b8' : '#5a6478'
  const dotStroke = isLight ? '#ffffff' : '#05070c'

  ctx.clearRect(0, 0, width, height)

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
    ctx.fillText('暂无体温数据，先记一条吧', width / 2, height / 2)
    ctx.draw()
    return layout
  }

  const pts = layout.points

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

  ctx.setFillStyle(text)
  ctx.setFontSize(10)
  ctx.setTextAlign('left')
  ctx.fillText(`${layout.max.toFixed(1)}°`, 4, layout.p.t + 8)
  ctx.fillText(`${layout.min.toFixed(1)}°`, 4, height - layout.p.b + 4)

  ctx.draw()
  return layout
}

// —— 兼容旧测试/调用别名 ——
function createRecord(payload) {
  // 旧：createRecord 需姓名+药；新模型拆成 person + med，这里合成临时结构仅供测试兼容
  if (!payload) return null
  const person = normalizePerson({
    name: payload.personName || payload.name,
    age: payload.age,
    gender: payload.gender
  })
  if (!person) return null
  const med = normalizeMed({
    personId: person.id,
    medicineName: payload.medicineName,
    advice: payload.advice != null ? payload.advice : payload.doctorAdvice,
    doseTime: payload.doseTime,
    intervalHours: payload.intervalHours != null ? payload.intervalHours : payload.interval
  })
  if (!med) return null
  return Object.assign({}, med, {
    personName: person.name,
    age: person.age,
    gender: person.gender,
    temps: []
  })
}

function addRecord(state, payload) {
  let next = normalizeState(state)
  const personRes = addPerson(next, {
    name: payload && (payload.personName || payload.name),
    age: payload && payload.age,
    gender: payload && payload.gender
  })
  if (!personRes.ok) return { ok: false, state: next, error: 'invalid' }
  next = personRes.state
  const medRes = addMed(next, {
    personId: personRes.person.id,
    medicineName: payload && payload.medicineName,
    advice: payload && (payload.advice != null ? payload.advice : payload.doctorAdvice),
    doseTime: payload && payload.doseTime,
    intervalHours: payload && (payload.intervalHours != null ? payload.intervalHours : payload.interval)
  })
  if (!medRes.ok) return { ok: false, state: next, error: medRes.error }
  const record = Object.assign({}, medRes.med, {
    personName: personRes.person.name,
    age: personRes.person.age,
    gender: personRes.person.gender
  })
  return { ok: true, state: medRes.state, record, person: personRes.person, med: medRes.med }
}

function removeRecord(state, id) {
  return removeMed(state, id)
}

function getRecord(state, id) {
  const s = normalizeState(state)
  const med = s.meds.find((m) => m.id === id)
  if (!med) return null
  const person = s.persons.find((p) => p.id === med.personId)
  return Object.assign({}, med, {
    personName: person ? person.name : '',
    age: person ? person.age : null,
    gender: person ? person.gender : ''
  })
}

module.exports = {
  STORE_KEY,
  GENDERS,
  MAX_PERSONS,
  MAX_MEDS,
  MAX_TEMPS,
  emptyState,
  normalizeState,
  normalizePerson,
  normalizeMed,
  normalizeTemp,
  load,
  save,
  getPerson,
  addPerson,
  updatePerson,
  removePerson,
  movePerson,
  setPersonOrder,
  addMed,
  removeMed,
  markMedDose,
  addTemp,
  removeTemp,
  medsOfPerson,
  tempsOfPerson,
  getTempSeries,
  groupTempsByDate,
  groupMedsByDate,
  getMedSeries,
  formatDateLabel,
  tempLevel,
  calcRemaining,
  formatDuration,
  formatDate,
  formatTime,
  formatDateTime,
  buildChartLayout,
  drawTempChart,
  decoratePerson,
  decorateMed,
  decorateTemp,
  parseAge,
  parseIntervalHours,
  parseTemp,
  genderLabel,
  normalizeAdvice,
  round1,
  // legacy aliases
  createRecord,
  addRecord,
  removeRecord,
  getRecord
}
