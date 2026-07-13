const themeUtil = require('../../utils/theme')
try { themeUtil.ensureTheme() } catch (e) {}
const weightHub = require('../../utils/weight')
const dietHub = require('../../utils/diet')
const foodVisual = require('../../utils/food-visual')

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
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
    date: '',
    dateLabel: '今天',
    targetKcal: 0,
    intakeKcal: 0,
    remainText: '',
    remainTone: 'ok',
    pctKcal: 0,
    protein: '0',
    fat: '0',
    carb: '0',
    proteinT: '0',
    fatT: '0',
    carbT: '0',
    pctP: 0,
    pctF: 0,
    pctC: 0,
    modeName: '',
    tdeeText: '--',
    bmrText: '--',
    hasProfile: false,
    meals: [],
    tip: ''
    }
  })(),

  onLoad(query) {
    const date = (query && query.date) || weightHub.todayStr()
    this.setData({ date })
    this.syncTheme()
    this.refresh()
  },

  onShow() {
    this.syncTheme()
    this.refresh()
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
    const weightState = weightHub.load()
    const dietState = dietHub.load()
    const summary = dietHub.daySummary(dietState, weightState, this.data.date)
    const t = summary.targets
    const today = weightHub.todayStr()
    const dateLabel =
      this.data.date === today
        ? '今天'
        : this.data.date === this.shiftDate(today, -1)
          ? '昨天'
          : this.data.date

    const meals = summary.meals.map((m) =>
      Object.assign({}, m, {
        sumKcal: m.sum.kcal,
        empty: !m.items.length,
        items: m.items.map((it) => {
          const v = foodVisual.getVisual(it.foodId || it)
          return {
            id: it.id,
            name: it.name,
            grams: it.grams,
            kcal: it.kcal,
            line: it.grams + 'g · P' + it.protein + ' F' + it.fat + ' C' + it.carb,
            emoji: v.emoji,
            bg: v.bg
          }
        })
      })
    )

    this._dietState = dietState
    this.setData({
      dateLabel,
      targetKcal: t.targetKcal,
      intakeKcal: summary.intake.kcal,
      remainText: summary.remainText,
      remainTone: summary.remainTone,
      pctKcal: summary.pctKcal,
      protein: String(summary.intake.protein),
      fat: String(summary.intake.fat),
      carb: String(summary.intake.carb),
      proteinT: String(t.proteinG),
      fatT: String(t.fatG),
      carbT: String(t.carbG),
      pctP: summary.pctP,
      pctF: summary.pctF,
      pctC: summary.pctC,
      modeName: t.modeName,
      tdeeText: t.tdee != null ? String(t.tdee) : '--',
      bmrText: t.bmr != null ? String(t.bmr) : '--',
      hasProfile: t.hasProfile,
      meals,
      tip: t.hasProfile
        ? `目标模式：${t.modeName} · 基于档案估算`
        : '完善身高体重年龄性别后，热量目标更准'
    })
  },

  shiftDate(dateStr, delta) {
    const d = new Date(dateStr.replace(/-/g, '/') + ' 12:00:00')
    d.setDate(d.getDate() + delta)
    return weightHub.formatDate(d)
  },

  onPrevDay() {
    const date = this.shiftDate(this.data.date, -1)
    this.setData({ date })
    this.refresh()
  },

  onNextDay() {
    const today = weightHub.todayStr()
    if (this.data.date >= today) return
    const date = this.shiftDate(this.data.date, 1)
    this.setData({ date })
    this.refresh()
  },

  onPickDate(e) {
    this.setData({ date: e.detail.value })
    this.refresh()
  },

  goAdd(e) {
    const meal = (e.currentTarget.dataset.meal) || 'snack'
    wx.navigateTo({
      url: `/pages/tool-weight/food-add?meal=${meal}&date=${this.data.date}`
    })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除这条饮食？',
      confirmColor: '#e11d48',
      success: (res) => {
        if (!res.confirm) return
        dietHub.removeEntry(this._dietState || dietHub.load(), id)
        wx.showToast({ title: '已删除', icon: 'none' })
        this.refresh()
      }
    })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/tool-weight/settings' })
  }
})