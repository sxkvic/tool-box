/**
 * Node unit tests for utils/med.js (person-centric model)
 * Run: node tests/med.test.js
 */
const assert = require('assert')
const path = require('path')

const mem = Object.create(null)
global.wx = {
  getStorageSync(key) {
    if (!(key in mem)) return ''
    return mem[key]
  },
  setStorageSync(key, value) {
    mem[key] = value
  },
  removeStorageSync(key) {
    delete mem[key]
  }
}

const med = require(path.join(__dirname, '..', 'utils', 'med'))

let passed = 0
function ok(cond, msg) {
  assert.ok(cond, msg)
  passed += 1
  console.log('  PASS:', msg)
}

function section(title) {
  console.log('\n==', title, '==')
}

function clearStore() {
  Object.keys(mem).forEach((k) => delete mem[k])
}

section('(a) person + med under person; no re-enter name for med')
clearStore()
{
  let state = med.emptyState()
  const pRes = med.addPerson(state, { name: '小明', age: 28, gender: 'male' })
  ok(pRes.ok, 'addPerson succeeds')
  state = pRes.state
  const personId = pRes.person.id

  const doseTime = Date.UTC(2026, 6, 20, 8, 0, 0)
  const mRes = med.addMed(state, {
    personId,
    medicineName: '布洛芬',
    advice: '饭后服用，多喝水',
    doseTime,
    intervalHours: 8
  })
  ok(mRes.ok, 'addMed under person')
  ok(mRes.med.personId === personId, 'med linked to personId')
  ok(mRes.med.medicineName === '布洛芬', 'medicineName preserved')
  ok(mRes.med.advice === '饭后服用，多喝水', 'advice preserved')
  // med payload must not require personName
  ok(!('personName' in mRes.med) || mRes.med.personName === undefined, 'med has no personName field')

  // 间隔可不填
  const noInt = med.addMed(mRes.state, {
    personId,
    medicineName: '维生素',
    doseTime: Date.now(),
    intervalHours: null
  })
  ok(noInt.ok, 'addMed without interval')
  ok(noInt.med.intervalHours == null, 'interval null ok')

  med.save(noInt.state)
  const loaded = med.load()
  ok(loaded.persons.length === 1, 'one person')
  ok(loaded.persons[0].name === '小明', 'person name')
  ok(loaded.persons[0].age === 28, 'person age')
  ok(loaded.meds.length === 2, 'two meds')
  const withAdvice = loaded.meds.find((m) => m.medicineName === '布洛芬')
  ok(withAdvice && withAdvice.personId === personId, 'loaded med personId')
  ok(withAdvice.advice === '饭后服用，多喝水', 'advice load/save')
  ok(loaded.meds.some((m) => m.medicineName === '维生素' && m.intervalHours == null), 'optional interval load')
  ok(med.normalizeAdvice('  a  ') === 'a', 'advice trim')
}

section('(b) remaining time')
{
  const intervalHours = 6
  const now = Date.UTC(2026, 6, 20, 12, 0, 0)
  const doseRecent = now - 2 * 3600 * 1000
  const remainFuture = med.calcRemaining(doseRecent, intervalHours, now)
  ok(remainFuture.remainingMs === 4 * 3600 * 1000, 'exactly 4 hours left')
  ok(/剩余/.test(remainFuture.text), 'future text contains 剩余')

  const doseDue = now - intervalHours * 3600 * 1000
  const remainDue = med.calcRemaining(doseDue, intervalHours, now)
  ok(remainDue.remainingMs === 0 && remainDue.due, 'due')

  const doseOld = now - (intervalHours + 3) * 3600 * 1000
  const remainOver = med.calcRemaining(doseOld, intervalHours, now)
  ok(remainOver.overdue && /逾期/.test(remainOver.text), 'overdue')
}

section('(c) temp hangs on person; series sorted')
clearStore()
{
  let state = med.emptyState()
  const p = med.addPerson(state, { name: '小红', age: 6, gender: 'female' })
  state = p.state
  const personId = p.person.id
  const t1 = Date.UTC(2026, 6, 20, 9, 0, 0)
  const t2 = Date.UTC(2026, 6, 20, 11, 0, 0)
  const t3 = Date.UTC(2026, 6, 20, 10, 0, 0)
  state = med.addTemp(state, { personId, value: 38.5, ts: t2 }).state
  state = med.addTemp(state, { personId, value: 37.2, ts: t1 }).state
  state = med.addTemp(state, { personId, value: 37.8, ts: t3 }).state
  med.save(state)

  const series = med.getTempSeries(med.tempsOfPerson(med.load(), personId))
  ok(series.length === 3, 'three temps for person')
  ok(series[0].ts === t1 && series[0].value === 37.2, 'sorted first')
  ok(series[1].ts === t3, 'sorted middle')
  ok(series[2].ts === t2, 'sorted last')

  // temp without person fails
  const bad = med.addTemp(med.load(), { value: 36.5, ts: Date.now() })
  ok(!bad.ok && bad.error === 'no_person', 'temp requires personId')
}

section('(d) delete person removes meds+temps; delete med keeps person')
{
  const before = med.load()
  ok(before.persons.length === 1, 'has person')
  const personId = before.persons[0].id
  // add med then delete med only
  let state = med.addMed(before, {
    personId,
    medicineName: '药A',
    doseTime: Date.now(),
    intervalHours: 6
  }).state
  const medId = state.meds[0].id
  const tempCount = state.temps.length
  state = med.removeMed(state, medId)
  ok(!state.meds.some((m) => m.id === medId), 'med deleted')
  ok(state.persons.some((p) => p.id === personId), 'person kept')
  ok(state.temps.length === tempCount, 'temps kept after med delete')

  state = med.removePerson(state, personId)
  med.save(state)
  const after = med.load()
  ok(after.persons.length === 0, 'person gone')
  ok(after.meds.length === 0 && after.temps.length === 0, 'cascade delete')
}

section('(e) chart layout + temp level colors + sort')
{
  const series = [
    { id: 'a', value: 36.5, ts: 1000, date: '2026-07-20' },
    { id: 'b', value: 38.2, ts: 2000, date: '2026-07-20' },
    { id: 'c', value: 37.1, ts: 3000, date: '2026-07-20' }
  ]
  const layout = med.buildChartLayout(series, 320, 160)
  ok(layout.points.length === 3, '3 points')
  ok(layout.min < 36.5 && layout.max > 38.2, 'padded min/max')
  ok(layout.points[0].x < layout.points[2].x, 'x increases')

  ok(med.tempLevel(36.8).key === 'normal', '36.8 green/normal')
  ok(med.tempLevel(37.5).key === 'fever', '37.5 orange/fever')
  ok(med.tempLevel(38.5).key === 'fever', '38.5 orange/fever')
  ok(med.tempLevel(38.6).key === 'high', '38.6 red/high')

  clearStore()
  let st = med.emptyState()
  const pr = med.addPerson(st, { name: '测序', age: 1, gender: 'male' })
  st = pr.state
  const pid = pr.person.id
  st = med.addTemp(st, { personId: pid, value: 36.5, ts: 1000 }).state
  st = med.addTemp(st, { personId: pid, value: 38.0, ts: 3000 }).state
  st = med.addTemp(st, { personId: pid, value: 39.0, ts: 2000 }).state
  const asc = med.getTempSeries(med.tempsOfPerson(st, pid), { order: 'asc' })
  const desc = med.getTempSeries(med.tempsOfPerson(st, pid), { order: 'desc' })
  ok(asc[0].ts === 1000 && asc[2].ts === 3000, 'asc by time')
  ok(desc[0].ts === 3000 && desc[2].ts === 1000, 'desc by time')
  ok(asc[0].levelClass === 'temp-normal', 'series carries level class')
  ok(asc[1].levelKey === 'high' || asc[2].levelKey === 'high', 'has high fever level')

  // 跨日分组
  st = med.addTemp(st, {
    personId: pid,
    value: 36.6,
    ts: Date.UTC(2026, 6, 19, 10, 0, 0)
  }).state
  const multi = med.getTempSeries(med.tempsOfPerson(st, pid), { order: 'desc' })
  const groups = med.groupTempsByDate(multi, { order: 'desc' })
  ok(groups.length >= 2, 'group by date has multiple days')
  ok(groups.every((g) => g.date && g.items.length), 'each group has date+items')
  const preview = multi.slice(0, 5)
  ok(preview.length <= 5, 'preview limit 5')

  // 用药按天分组 + 预览 3 条
  clearStore()
  let ms = med.emptyState()
  const mp = med.addPerson(ms, { name: '用药预览', age: 20, gender: 'male' })
  ms = mp.state
  const mid = mp.person.id
  ms = med.addMed(ms, {
    personId: mid,
    medicineName: '药1',
    doseTime: Date.UTC(2026, 6, 20, 8, 0, 0),
    intervalHours: 8
  }).state
  ms = med.addMed(ms, {
    personId: mid,
    medicineName: '药2',
    doseTime: Date.UTC(2026, 6, 20, 12, 0, 0),
    intervalHours: 6
  }).state
  ms = med.addMed(ms, {
    personId: mid,
    medicineName: '药3',
    doseTime: Date.UTC(2026, 6, 19, 9, 0, 0),
    intervalHours: 12
  }).state
  ms = med.addMed(ms, {
    personId: mid,
    medicineName: '药4',
    doseTime: Date.UTC(2026, 6, 18, 9, 0, 0),
    intervalHours: 8
  }).state
  const medSeries = med.getMedSeries(med.medsOfPerson(ms, mid), Date.now(), { order: 'desc' })
  ok(medSeries.length === 4, 'four meds')
  const medPreview = medSeries.slice(0, 3)
  const medGroups = med.groupMedsByDate(medPreview, { order: 'desc' })
  ok(medPreview.length === 3, 'med preview 3')
  ok(medGroups.length >= 1 && medGroups.every((g) => g.date), 'med grouped by day')
}

section('(f) optional age null; legacy addRecord still works')
clearStore()
{
  ok(med.parseAge(null) === null, 'parseAge null')
  ok(med.parseAge('') === null, 'parseAge empty')
  const res = med.addRecord(med.emptyState(), {
    medicineName: '维生素C',
    personName: '未填年龄',
    age: null,
    gender: 'female',
    doseTime: Date.now(),
    intervalHours: 12
  })
  ok(res.ok, 'legacy addRecord ok')
  ok(res.person && res.person.age === null, 'person age null')
  ok(res.med && res.med.personId === res.person.id, 'med under person')
  med.save(res.state)
  const loaded = med.load()
  ok(loaded.persons[0].age === null, 'load age null')
}

section('(h) person drag order · first is default')
clearStore()
{
  let st = med.emptyState()
  st = med.addPerson(st, { name: '甲', age: 1, gender: 'male' }).state
  st = med.addPerson(st, { name: '乙', age: 2, gender: 'female' }).state
  st = med.addPerson(st, { name: '丙', age: 3, gender: 'male' }).state
  ok(st.persons.map((p) => p.name).join(',') === '甲,乙,丙', 'append order preserved')
  st = med.movePerson(st, 2, 0)
  ok(st.persons[0].name === '丙', 'move last to first')
  ok(st.persons.map((p) => p.name).join(',') === '丙,甲,乙', 'order after move')
  med.save(st)
  const loaded = med.load()
  ok(loaded.persons[0].name === '丙', 'order survives save/load')
}

section('(g) migrate old flat records/temps by name')
clearStore()
{
  // 写入旧结构
  mem[med.STORE_KEY] = {
    records: [
      {
        id: 'old1',
        medicineName: '阿莫西林',
        personName: '爸爸',
        age: 40,
        gender: 'male',
        doseTime: 1000,
        intervalHours: 8,
        temps: [{ id: 'ot1', value: 37.0, ts: 900 }]
      }
    ],
    temps: [{ id: 'ot2', value: 36.8, ts: 1100, personName: '爸爸' }]
  }
  const loaded = med.load()
  ok(loaded.persons.length === 1 && loaded.persons[0].name === '爸爸', 'migrated person')
  ok(loaded.meds.length === 1 && loaded.meds[0].medicineName === '阿莫西林', 'migrated med')
  ok(loaded.temps.length === 2, 'migrated temps from nest + top')
  ok(loaded.temps.every((t) => t.personId === loaded.persons[0].id), 'temps bound to person')
}

console.log('\n----------------------------------------')
console.log('All assertions passed:', passed)
console.log('OK')
process.exit(0)
