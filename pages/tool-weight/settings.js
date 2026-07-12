const themeUtil = require('../../utils/theme')
const weightHub = require('../../utils/weight')
const dietHub = require('../../utils/diet')

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

Page({
  data: {
    theme: readTheme(),
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
    dietHint: ''
  },

  onLoad() {
    this.syncTheme()
    this.hydrate()
  },

  onShow() {
    this.syncTheme()
    this.hydrate()
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
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
  onDeadline(e) {
    this.setData({ deadline: e.detail.value })
  },

  onSaveProfile() {
    try {
      const state = weightHub.updateProfile(this._state || weightHub.load(), {
        gender: this.data.gender,
        age: this.data.age,
        heightCm: this.data.heightCm
      })
      this._state = state
      wx.showToast({ title: '档案已保存', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '请检查输入', icon: 'none' })
    }
  },

  onSaveGoal() {
    const target = this.data.targetKg
    if (!target) {
      wx.showToast({ title: '请填写目标体重', icon: 'none' })
      return
    }
    const state = weightHub.updateGoal(this._state || weightHub.load(), {
      targetKg: target,
      deadline: this.data.deadline || '',
      resetStart: true
    })
    this._state = state
    this.setData({
      startKg: state.goal.startKg !== '' ? String(state.goal.startKg) : '',
      startDate: state.goal.startDate || ''
    })
    wx.showToast({ title: '目标已更新', icon: 'success' })
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
  onSaveDiet() {
    try {
      const state = dietHub.updatePrefs(this._diet || dietHub.load(), {
        mode: this.data.mode,
        activity: this.data.activity,
        customKcal: this.data.customKcal
      })
      this._diet = state
      const targets = dietHub.resolveTargets(state, this._state || weightHub.load())
      const hint = targets.hasProfile
        ? ('估算 BMR ' + (targets.bmr || '--') + ' · TDEE ' + (targets.tdee || '--') + ' · 当前目标 ' + targets.targetKcal + ' kcal')
        : '完善身高体重年龄性别后，可自动估算热量目标'
      this.setData({
        customKcal: state.prefs.customKcal !== '' && state.prefs.customKcal != null ? String(state.prefs.customKcal) : '',
        dietHint: hint
      })
      wx.showToast({ title: '饮食目标已保存', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
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