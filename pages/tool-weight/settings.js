const themeUtil = require('../../utils/theme')
try { themeUtil.ensureTheme() } catch (e) {}
const weightHub = require('../../utils/weight')
const dietHub = require('../../utils/diet')

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}


function formatDraftText(y, m, d) {
  return y + '年' + pad2(m) + '月' + pad2(d) + '日'
}

function dateChromeStyles(themeId) {
  if (themeId === 'light') {
    return {
      dateIndicatorStyle: 'height: 76rpx; background: rgba(37, 99, 235, 0.08); border-top: 1px solid rgba(37, 99, 235, 0.22); border-bottom: 1px solid rgba(37, 99, 235, 0.22);',
      dateMaskStyle: 'background-image: linear-gradient(180deg, rgba(248,250,252,0.96), rgba(248,250,252,0.55)), linear-gradient(0deg, rgba(248,250,252,0.96), rgba(248,250,252,0.55));'
    }
  }
  return {
    dateIndicatorStyle: 'height: 76rpx; background: rgba(92, 225, 255, 0.1); border-top: 1px solid rgba(92, 225, 255, 0.28); border-bottom: 1px solid rgba(92, 225, 255, 0.28);',
    dateMaskStyle: 'background-image: linear-gradient(180deg, rgba(12,18,30,0.96), rgba(12,18,30,0.45)), linear-gradient(0deg, rgba(12,18,30,0.96), rgba(12,18,30,0.45));'
  }
}

function buildDateMeta(selected) {
  const now = new Date()
  const startYear = now.getFullYear() - 1
  const endYear = now.getFullYear() + 10
  const years = []
  for (let y = startYear; y <= endYear; y++) years.push(y)

  const months = []
  for (let m = 1; m <= 12; m++) months.push(m)

  let y = now.getFullYear()
  let m = now.getMonth() + 1
  let d = now.getDate()
  if (selected && /^\d{4}-\d{2}-\d{2}$/.test(selected)) {
    const parts = selected.split('-').map((x) => parseInt(x, 10))
    if (parts[0] >= startYear && parts[0] <= endYear) {
      y = parts[0]
      m = parts[1]
      d = parts[2]
    }
  }
  const maxDay = daysInMonth(y, m)
  if (d > maxDay) d = maxDay
  const days = []
  for (let i = 1; i <= maxDay; i++) days.push(i)

  const yi = Math.max(0, years.indexOf(y))
  const mi = Math.max(0, m - 1)
  const di = Math.max(0, d - 1)
  return {
    dateYears: years,
    dateMonths: months,
    dateDays: days,
    datePickerValue: [yi, mi, di],
    _dateY: y,
    _dateM: m,
    _dateD: d
  }
}


Page({
  data: (function () {
    const chrome = themeUtil.getChrome(readTheme())
    return {
    theme: chrome.theme,
    chromeBg: chrome.chromeBg,
    navBg: chrome.navBg,
    navFront: chrome.navFront,
    bgTextStyle: chrome.bgTextStyle,
    gender: '',
    age: '',
    heightCm: '',
    targetKg: '',
    deadline: '',
    startKg: '',
    startDate: '',
    genders: [
      { id: 'male', label: '男' },
      { id: 'female', label: '女' }
    ],
    modes: dietHub.MODES,
    activities: dietHub.ACTIVITY_LEVELS,
    mode: 'lose',
    activity: '1.55',
    customKcal: '',
    dietHint: '',
    saving: false,
    datePickerOn: false,
    dateYears: [],
    dateMonths: [],
    dateDays: [],
    datePickerValue: [0, 0, 0],
    dateDraftText: '',
    dateIndicatorStyle: '',
    dateMaskStyle: ''
    }
  })(),

  onLoad() {
    this.syncTheme()
    this.hydrate()
  },

  onShow() {
    this.syncTheme()
    this.hydrate()
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

  hydrate() {
    const s = weightHub.load()
    this._state = s
    const diet = dietHub.load()
    this._diet = diet
    const prefs = diet.prefs || {}
    const targets = dietHub.resolveTargets(diet, s)
    const hint = targets.hasProfile
      ? ('估算 BMR ' + (targets.bmr || '--') + ' · TDEE ' + (targets.tdee || '--') + ' · 当前目标 ' + targets.targetKcal + ' kcal')
      : '完善身高体重年龄性别后，可自动估算热量目标'
    this.setData({
      gender: s.profile.gender || '',
      age: s.profile.age !== '' && s.profile.age != null ? String(s.profile.age) : '',
      heightCm: s.profile.heightCm !== '' && s.profile.heightCm != null ? String(s.profile.heightCm) : '',
      targetKg: s.goal.targetKg !== '' && s.goal.targetKg != null ? String(s.goal.targetKg) : '',
      deadline: s.goal.deadline || '',
      startKg: s.goal.startKg !== '' && s.goal.startKg != null ? String(s.goal.startKg) : '',
      startDate: s.goal.startDate || '',
      mode: prefs.mode || 'lose',
      activity: String(prefs.activity || '1.55'),
      customKcal: prefs.customKcal !== '' && prefs.customKcal != null ? String(prefs.customKcal) : '',
      dietHint: hint
    })
  },

  onGender(e) {
    this.setData({ gender: e.currentTarget.dataset.id })
  },
  onAge(e) {
    this.setData({ age: e.detail.value })
  },
  onHeight(e) {
    this.setData({ heightCm: e.detail.value })
  },
  onTarget(e) {
    this.setData({ targetKg: e.detail.value })
  },
  openDeadlinePicker() {
    const meta = buildDateMeta(this.data.deadline)
    const chrome = dateChromeStyles(this.data.theme)
    this._dateDraft = {
      y: meta._dateY,
      m: meta._dateM,
      d: meta._dateD
    }
    this.setData({
      datePickerOn: true,
      dateYears: meta.dateYears,
      dateMonths: meta.dateMonths,
      dateDays: meta.dateDays,
      datePickerValue: meta.datePickerValue,
      dateDraftText: formatDraftText(meta._dateY, meta._dateM, meta._dateD),
      dateIndicatorStyle: chrome.dateIndicatorStyle,
      dateMaskStyle: chrome.dateMaskStyle
    })
  },

  closeDeadlinePicker() {
    this.setData({ datePickerOn: false })
  },

  preventMove() {},

  onDatePickerChange(e) {
    const val = (e && e.detail && e.detail.value) || [0, 0, 0]
    const years = this.data.dateYears || []
    const months = this.data.dateMonths || []
    let y = years[val[0]] || (new Date()).getFullYear()
    let m = months[val[1]] || 1
    const maxDay = daysInMonth(y, m)
    let d = Math.min((val[2] || 0) + 1, maxDay)
    const days = []
    for (let i = 1; i <= maxDay; i++) days.push(i)
    // 若天数变化导致索引越界，回写
    const di = Math.max(0, d - 1)
    this._dateDraft = { y, m, d }
    const next = {
      dateDays: days,
      datePickerValue: [val[0], val[1], di],
      dateDraftText: formatDraftText(y, m, d)
    }
    // 天数变化时同步 days，避免 2 月等越界
    if ((this.data.dateDays || []).length !== days.length) {
      this.setData(next)
    } else {
      this.setData({
        datePickerValue: next.datePickerValue,
        dateDraftText: next.dateDraftText
      })
    }
  },

  clearDeadlineDraft() {
    this._dateDraft = null
    this.setData({
      deadline: '',
      datePickerOn: false
    })
  },

  confirmDeadline() {
    const draft = this._dateDraft
    if (!draft) {
      this.setData({ datePickerOn: false })
      return
    }
    const deadline = draft.y + '-' + pad2(draft.m) + '-' + pad2(draft.d)
    this.setData({
      deadline,
      datePickerOn: false
    })
  },



  onMode(e) {
    this.setData({ mode: e.currentTarget.dataset.id })
  },
  onActivity(e) {
    this.setData({ activity: e.currentTarget.dataset.id })
  },
  onCustomKcal(e) {
    this.setData({ customKcal: e.detail.value })
  },


  onSaveAll() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      // 1) profile
      const state = weightHub.updateProfile(this._state || weightHub.load(), {
        gender: this.data.gender,
        age: this.data.age,
        heightCm: this.data.heightCm
      })
      this._state = state

      // 2) goal：有目标体重才写入；空值不强制清空（清空走「清除」）
      const target = (this.data.targetKg || '').trim()
      if (target) {
        const next = weightHub.updateGoal(this._state, {
          targetKg: target,
          deadline: this.data.deadline || '',
          resetStart: true
        })
        this._state = next
        this.setData({
          startKg: next.goal.startKg !== '' && next.goal.startKg != null ? String(next.goal.startKg) : '',
          startDate: next.goal.startDate || ''
        })
      }

      // 3) diet
      const diet = dietHub.updatePrefs(this._diet || dietHub.load(), {
        mode: this.data.mode,
        activity: this.data.activity,
        customKcal: this.data.customKcal
      })
      this._diet = diet
      const targets = dietHub.resolveTargets(diet, this._state || weightHub.load())
      const hint = targets.hasProfile
        ? ('估算 BMR ' + (targets.bmr || '--') + ' · TDEE ' + (targets.tdee || '--') + ' · 当前目标 ' + targets.targetKcal + ' kcal')
        : '完善身高体重年龄性别后，可自动估算热量目标'
      this.setData({
        customKcal: diet.prefs.customKcal !== '' && diet.prefs.customKcal != null ? String(diet.prefs.customKcal) : '',
        dietHint: hint,
        saving: false,
    datePickerOn: false,
    dateYears: [],
    dateMonths: [],
    dateDays: [],
    datePickerValue: [0, 0, 0],
    dateDraftText: '',
    dateIndicatorStyle: '',
    dateMaskStyle: ''
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      this.setData({ saving: false,
    datePickerOn: false,
    dateYears: [],
    dateMonths: [],
    dateDays: [],
    datePickerValue: [0, 0, 0],
    dateDraftText: '',
    dateIndicatorStyle: '',
    dateMaskStyle: '' })
      wx.showToast({ title: '请检查输入', icon: 'none' })
    }
  },

  onClearGoal() {
    wx.showModal({
      title: '清除目标？',
      content: '不会删除体重记录',
      success: (res) => {
        if (!res.confirm) return
        const state = weightHub.updateGoal(this._state || weightHub.load(), {
          targetKg: '',
          deadline: '',
          startKg: '',
          startDate: ''
        })
        // force empty goal fields
        state.goal = { targetKg: '', deadline: '', startKg: '', startDate: '' }
        weightHub.save(state)
        this._state = state
        this.setData({ targetKg: '', deadline: '', startKg: '', startDate: '' })
        wx.showToast({ title: '已清除', icon: 'none' })
      }
    })
  }
})