const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')

const PRESETS = [
  { key: 'classic', name: '经典', work: 25, rest: 5 },
  { key: 'deep', name: '深度', work: 50, rest: 10 },
  { key: 'quick', name: '短时', work: 15, rest: 3 }
]

const STATE_KEY = 'pomodoro_state_v1'

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatSec(sec) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${pad(m)}:${pad(r)}`
}

Page({
  data: {
    theme: 'mc',
    presets: PRESETS,
    preset: 'classic',
    phase: 'work',
    workMin: 25,
    restMin: 5,
    remainSec: 25 * 60,
    totalSec: 25 * 60,
    running: false,
    timeText: '25:00',
    phaseText: '专注',
    progress: 0,
    doneRounds: 0
  },

  _timer: null,
  _endAt: 0,

  onLoad() {
    recents.pushRecent('pomodoro')
    this.restoreState()
  },

  onShow() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
    this.syncFromEndAt()
    if (this.data.running) this.startTicker()
  },

  onHide() {
    this.persistState()
  },

  onUnload() {
    this.clearTimer()
    this.setKeepScreen(false)
    this.persistState()
  },

  onShareAppMessage() {
    return { title: '番茄钟 - 随身工具箱', path: '/pages/tool-pomodoro/index' }
  },

  onShareTimeline() {
    return { title: '番茄钟 · 随身工具箱' }
  },

  setKeepScreen(on) {
    try {
      wx.setKeepScreenOn({ keepScreenOn: !!on })
    } catch (e) {}
  },

  clearTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  persistState() {
    storage.set(STATE_KEY, {
      preset: this.data.preset,
      phase: this.data.phase,
      workMin: this.data.workMin,
      restMin: this.data.restMin,
      remainSec: this.data.remainSec,
      totalSec: this.data.totalSec,
      running: this.data.running,
      endAt: this._endAt || 0,
      doneRounds: this.data.doneRounds
    })
  },

  restoreState() {
    const s = storage.get(STATE_KEY, null)
    if (!s || typeof s !== 'object') return
    this._endAt = Number(s.endAt) || 0
    this.setData({
      preset: s.preset || 'classic',
      phase: s.phase || 'work',
      workMin: Number(s.workMin) || 25,
      restMin: Number(s.restMin) || 5,
      remainSec: Number(s.remainSec) || 25 * 60,
      totalSec: Number(s.totalSec) || 25 * 60,
      running: !!s.running,
      doneRounds: Number(s.doneRounds) || 0,
      phaseText: (s.phase || 'work') === 'rest' ? '休息' : '专注'
    })
    this.syncFromEndAt(true)
  },

  applySeconds(remainSec, totalSec, extra = {}) {
    const progress = totalSec > 0 ? Math.min(100, ((totalSec - remainSec) / totalSec) * 100) : 0
    this.setData({
      remainSec,
      totalSec,
      timeText: formatSec(remainSec),
      progress: Math.round(progress),
      ...extra
    })
    this.persistState()
  },

  /** 用 endAt 校正剩余时间，避免后台节流导致漂移 */
  syncFromEndAt(fromRestore) {
    if (!this.data.running || !this._endAt) {
      this.applySeconds(this.data.remainSec, this.data.totalSec)
      return
    }
    const remain = Math.ceil((this._endAt - Date.now()) / 1000)
    if (remain <= 0) {
      this.clearTimer()
      this.setKeepScreen(false)
      this._endAt = 0
      this.setData({ running: false })
      this.applySeconds(0, this.data.totalSec)
      // 从后台回来时若已结束，再触发完成
      if (!fromRestore) this.onPhaseComplete()
      else this.onPhaseComplete()
      return
    }
    this.applySeconds(remain, this.data.totalSec)
  },

  startTicker() {
    this.clearTimer()
    this.setKeepScreen(true)
    this._timer = setInterval(() => {
      this.syncFromEndAt()
    }, 250)
  },

  onPreset(e) {
    if (this.data.running) {
      wx.showToast({ title: '请先暂停或重置', icon: 'none' })
      return
    }
    const key = e.currentTarget.dataset.key
    const p = PRESETS.find((x) => x.key === key) || PRESETS[0]
    const total = p.work * 60
    this._endAt = 0
    this.applySeconds(total, total, {
      preset: p.key,
      phase: 'work',
      workMin: p.work,
      restMin: p.rest,
      phaseText: '专注',
      running: false
    })
  },

  onStart() {
    if (this.data.running) return
    let remain = this.data.remainSec
    if (remain <= 0) {
      const isWork = this.data.phase === 'work'
      remain = (isWork ? this.data.workMin : this.data.restMin) * 60
      this.setData({
        remainSec: remain,
        totalSec: remain,
        phaseText: isWork ? '专注' : '休息'
      })
    }
    this._endAt = Date.now() + remain * 1000
    this.setData({ running: true })
    this.startTicker()
    this.persistState()
  },

  onPause() {
    this.syncFromEndAt()
    this.clearTimer()
    this.setKeepScreen(false)
    this._endAt = 0
    this.setData({ running: false })
    this.persistState()
  },

  onReset() {
    this.clearTimer()
    this.setKeepScreen(false)
    this._endAt = 0
    const total = this.data.workMin * 60
    this.applySeconds(total, total, {
      phase: 'work',
      phaseText: '专注',
      running: false
    })
  },

  onPhaseComplete() {
    const isWork = this.data.phase === 'work'
    try {
      wx.vibrateShort({ type: 'medium' })
    } catch (e) {}

    if (isWork) {
      const doneRounds = this.data.doneRounds + 1
      const restTotal = this.data.restMin * 60
      this._endAt = 0
      this.applySeconds(restTotal, restTotal, {
        phase: 'rest',
        phaseText: '休息',
        doneRounds,
        running: false
      })
      wx.showModal({
        title: '专注完成',
        content: `已完成第 ${doneRounds} 个番茄，开始 ${this.data.restMin} 分钟休息？`,
        confirmText: '开始休息',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) this.onStart()
        }
      })
    } else {
      const workTotal = this.data.workMin * 60
      this._endAt = 0
      this.applySeconds(workTotal, workTotal, {
        phase: 'work',
        phaseText: '专注',
        running: false
      })
      wx.showModal({
        title: '休息结束',
        content: '准备开始下一轮专注？',
        confirmText: '开始专注',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) this.onStart()
        }
      })
    }
  },

  skipPhase() {
    if (this.data.running) {
      wx.showToast({ title: '请先暂停', icon: 'none' })
      return
    }
    this.onPhaseComplete()
  }
})