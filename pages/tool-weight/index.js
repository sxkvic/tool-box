const recents = require('../../utils/recents')
const themeUtil = require('../../utils/theme')
const weightHub = require('../../utils/weight')
const dietHub = require('../../utils/diet')

const NOTE_CHIPS = ['晨起空腹', '运动后', '餐后', '睡前', '体检']
const RANGES = [
  { id: '7', label: '7天' },
  { id: '30', label: '30天' },
  { id: '90', label: '90天' },
  { id: 'all', label: '全部' }
]

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

// 页面脚本一加载就同步导航栏/窗口底色，抢在首帧前尽量贴合主题
try {
  themeUtil.ensureTheme()
} catch (e) {}

Page({
  data: (function () {
    const chrome = themeUtil.getChrome(readTheme())
    return {
    theme: chrome.theme,
    chromeBg: chrome.chromeBg,
    navBg: chrome.navBg,
    navFront: chrome.navFront,
    bgTextStyle: chrome.bgTextStyle,
    hasProfileHeight: false,
    hasRecords: false,
    currentWeight: '--',
    currentUnit: 'kg',
    deltaPrev: { text: '--', tone: 'mute' },
    delta7: { text: '--', tone: 'mute' },
    delta30: { text: '--', tone: 'mute' },
    deltaTotal: { text: '--', tone: 'mute' },
    bmi: '--',
    levelText: '--',
    levelColor: '#8b95ad',
    levelHint: '',
    idealText: '--',
    bodyFatText: '--',
    bodyFatTag: '',
    highText: '--',
    lowText: '--',
    count: 0,
    goalOn: false,
    goalTarget: '--',
    goalRemain: '--',
    goalPercent: 0,
    goalDeadline: '',
    goalWeekly: '',
    goalDone: false,
    ranges: RANGES,
    chartRange: '30',
    recentList: [],
    sheetOn: false,
    weightFocus: false,
    keyboardHeight: 0,
    sheetMaxHeight: "85vh",
    formWeight: '',
    formBodyFat: '',
    formNote: '',
    noteChips: NOTE_CHIPS,
    chartW: 320,
    chartH: 180,
    readyTip: '',
    dietIntake: 0,
    dietTarget: 0,
    dietRemainText: '还可吃 --',
    dietRemainTone: 'ok',
    dietPct: 0,
    dietMacroLine: 'P0 · F0 · C0',
    dietCount: 0
    }
  })(),

  onLoad() {
    recents.pushRecent('weight')
    this.syncTheme()
    this.refresh()
  },

  onShow() {
    this.syncTheme()
    this.refresh()
  },

  onUnload() {
    if (this._focusTimer) {
      clearTimeout(this._focusTimer)
      this._focusTimer = null
    }
  },

  onReady() {
    try { themeUtil.ensureTheme() } catch (e) {}
    this._chartReady = true
    this.draw()
  },

  onShareAppMessage() {
    const w = this.data.currentWeight
    return {
      title: w !== '--' ? `体重 ${w} kg · 本地管理` : '体重管理 - 随身工具箱',
      path: '/pages/tool-weight/index'
    }
  },

  onShareTimeline() {
    return { title: '体重管理 · 本地隐私记录 · 随身工具箱' }
  },

  syncTheme() {
    const chrome = themeUtil.getChrome(themeUtil.ensureTheme())
    if (
      chrome.theme !== this.data.theme ||
      chrome.chromeBg !== this.data.chromeBg ||
      chrome.navBg !== this.data.navBg ||
      chrome.navFront !== this.data.navFront ||
      chrome.bgTextStyle !== this.data.bgTextStyle
    ) {
      this.setData(chrome)
    }
  },

  refresh() {
    const state = weightHub.load()
    const range = state.prefs.chartRange || '30'
    const stats = weightHub.statsBundle(state, range)
    const latest = stats.latest
    const dPrev = weightHub.formatDelta(stats.dPrev)
    const d7 = weightHub.formatDelta(stats.d7)
    const d30 = weightHub.formatDelta(stats.d30)
    const dTotal = weightHub.formatDelta(stats.dTotal)

    const goalOn = !!(state.goal && state.goal.targetKg)
    let goalRemain = '--'
    let goalWeekly = ''
    if (goalOn && stats.advice) {
      const r = stats.advice.remain
      if (r != null) {
        if (Math.abs(r) < 0.05) goalRemain = '已达成'
        else goalRemain = r > 0 ? `还需减 ${Math.abs(r).toFixed(1)} kg` : `还需增 ${Math.abs(r).toFixed(1)} kg`
      }
      if (stats.advice.weekly != null && stats.advice.daysLeft != null && stats.advice.daysLeft > 0) {
        goalWeekly = `建议每周 ${stats.advice.weekly > 0 ? '减' : '增'} ${Math.abs(stats.advice.weekly).toFixed(1)} kg · 剩 ${stats.advice.daysLeft} 天`
      } else if (state.goal.deadline) {
        goalWeekly = `目标日 ${state.goal.deadline}`
      }
    }

    let idealText = '--'
    if (stats.ideal) idealText = `${stats.ideal.min} – ${stats.ideal.max} kg`

    let bodyFatText = '--'
    let bodyFatTag = ''
    if (stats.bodyFat != null) {
      bodyFatText = `${stats.bodyFat}%`
      bodyFatTag = stats.bodyFatSource === 'est' ? '估算' : '实测'
    }

    const recentList = (state.records || []).slice(0, 5).map((r) => {
      return {
        id: r.id,
        date: r.date,
        time: r.time,
        weight: r.weight.toFixed(1),
        note: r.note || '',
        bf: r.bodyFat != null ? `${r.bodyFat}%` : ''
      }
    })

    // diet summary for today
    const dietState = dietHub.load()
    const dietSummary = dietHub.daySummary(dietState, state)
    const dietIntake = dietSummary.intake.kcal
    const dietTarget = dietSummary.targets.targetKcal
    const dietRemainText = dietSummary.remainText
    const dietRemainTone = dietSummary.remainTone
    const dietPct = dietSummary.pctKcal
    const dietMacroLine = 'P' + dietSummary.intake.protein + ' · F' + dietSummary.intake.fat + ' · C' + dietSummary.intake.carb
    const dietCount = dietSummary.intake.count

    this._state = state
    this._stats = stats

    this.setData({
      hasProfileHeight: !!state.profile.heightCm,
      hasRecords: stats.count > 0,
      currentWeight: latest ? latest.weight.toFixed(1) : '--',
      deltaPrev: dPrev,
      delta7: d7,
      delta30: d30,
      deltaTotal: dTotal,
      bmi: stats.bmi != null ? String(stats.bmi) : '--',
      levelText: stats.level.text,
      levelColor: stats.level.color,
      levelHint: stats.level.hint,
      idealText,
      bodyFatText,
      bodyFatTag,
      highText: stats.high != null ? stats.high.toFixed(1) : '--',
      lowText: stats.low != null ? stats.low.toFixed(1) : '--',
      count: stats.count,
      goalOn,
      goalTarget: goalOn ? Number(state.goal.targetKg).toFixed(1) : '--',
      goalRemain,
      goalPercent: stats.progress.percent || 0,
      goalDeadline: state.goal.deadline || '',
      goalWeekly,
      goalDone: !!stats.progress.done,
      chartRange: range,
      recentList,
      dietIntake,
      dietTarget,
      dietRemainText,
      dietRemainTone,
      dietPct,
      dietMacroLine,
      dietCount,
      readyTip: !state.profile.heightCm
        ? '先完善身高，评估更准确'
        : stats.count === 0
          ? '记下第一条体重，开启趋势'
          : ''
    })

    if (this._chartReady) {
      setTimeout(() => this.draw(), 30)
    }
  },

  draw() {
    try {
      const sys = wx.getSystemInfoSync()
      const w = Math.floor((sys.windowWidth || 375) - 48)
      const h = Math.floor(w * 0.48)
      this.setData({ chartW: w, chartH: h })
      const series = (this._stats && this._stats.series) || []
      weightHub.drawChart('weightChart', this, series, this.data.theme, { w, h })
    } catch (e) {
      console.warn('[weight] draw', e)
    }
  },

  onRange(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.chartRange) return
    const state = weightHub.updatePrefs(this._state || weightHub.load(), { chartRange: id })
    this._state = state
    this.refresh()
  },

  
  _sheetMaxHeight(keyboardHeight) {
    const h = Number(keyboardHeight) || 0
    try {
      const sys = wx.getSystemInfoSync() || {}
      const winH = sys.windowHeight || 0
      if (winH > 0) {
        const maxPx = Math.max(280, Math.floor(winH * 0.85 - h))
        return maxPx + 'px'
      }
    } catch (e) {}
    return h > 0 ? ('calc(85vh - ' + h + 'px)') : '85vh'
  },

  openSheet() {
    const latest = this._stats && this._stats.latest
    if (this._focusTimer) {
      clearTimeout(this._focusTimer)
      this._focusTimer = null
    }
    this.setData({
      sheetOn: true,
      weightFocus: false,
      keyboardHeight: 0,
      sheetMaxHeight: this._sheetMaxHeight(0),
      formWeight: latest ? String(latest.weight) : '',
      formBodyFat: '',
      formNote: ''
    })
    // 等 sheet 动画结束再聚焦，避免系统顶页与弹层动画打架
    this._focusTimer = setTimeout(() => {
      if (!this.data.sheetOn) return
      this.setData({ weightFocus: true })
    }, 280)
  },

  closeSheet() {
    if (this._focusTimer) {
      clearTimeout(this._focusTimer)
      this._focusTimer = null
    }
    this.setData({
      sheetOn: false,
      weightFocus: false,
      keyboardHeight: 0,
      sheetMaxHeight: this._sheetMaxHeight(0)
    })
  },

  onWeightBlur() {
    this.setData({ weightFocus: false })
  },

  onKeyboardHeight(e) {
    if (!this.data.sheetOn) return
    const h = (e && e.detail && e.detail.height) || 0
    if (h === this.data.keyboardHeight) return
    this.setData({
      keyboardHeight: h,
      sheetMaxHeight: this._sheetMaxHeight(h)
    })
  },

  noop() {},

  preventMove() {
    // 拦截遮罩层滑动，配合 page-meta overflow:hidden 锁底层滚动
  },

  onFormWeight(e) {
    this.setData({ formWeight: e.detail.value })
  },
  onFormFat(e) {
    this.setData({ formBodyFat: e.detail.value })
  },
  onFormNote(e) {
    this.setData({ formNote: e.detail.value })
  },
  onChip(e) {
    const v = e.currentTarget.dataset.v
    this.setData({ formNote: v })
  },

  onSaveRecord() {
    try {
      const state = weightHub.upsertRecord(this._state || weightHub.load(), {
        weight: this.data.formWeight,
        bodyFat: this.data.formBodyFat,
        note: this.data.formNote
      })
      this._state = state
      if (this._focusTimer) {
        clearTimeout(this._focusTimer)
        this._focusTimer = null
      }
      this.setData({ sheetOn: false, weightFocus: false, keyboardHeight: 0 })
      wx.showToast({ title: '已记录', icon: 'success' })
      this.refresh()
    } catch (e) {
      wx.showToast({ title: '请输入合理体重', icon: 'none' })
    }
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/tool-weight/settings' })
  },

  goRecords() {
    wx.navigateTo({ url: '/pages/tool-weight/records' })
  },

  goDiet() {
    wx.navigateTo({ url: '/pages/tool-weight/diet' })
  },

  goFoodAdd() {
    wx.navigateTo({ url: '/pages/tool-weight/food-add?meal=lunch' })
  }
})