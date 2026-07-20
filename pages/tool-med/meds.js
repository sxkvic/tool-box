const themeUtil = require('../../utils/theme')
const medHub = require('../../utils/med')

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

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
      personId: '',
      personName: '',
      medSort: 'desc',
      medCount: 0,
      dayGroups: [],
      empty: true
    }
  })(),

  onLoad(query) {
    const personId = (query && query.personId) || ''
    const medSort = query && query.sort === 'asc' ? 'asc' : 'desc'
    this.setData({ personId, medSort })
    this.syncTheme()
    this.refresh()
  },

  onShow() {
    this.syncTheme()
    this.refresh()
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    const chrome = themeUtil.getChrome(id)
    if (id !== this.data.theme) {
      this.setData({
        theme: chrome.theme,
        chromeBg: chrome.chromeBg,
        navBg: chrome.navBg,
        navFront: chrome.navFront,
        bgTextStyle: chrome.bgTextStyle
      })
    } else {
      themeUtil.applyChrome(id)
    }
  },

  refresh() {
    const state = medHub.load()
    const personId = this.data.personId
    const person = personId ? medHub.getPerson(state, personId) : null
    if (!person) {
      this.setData({
        personName: '',
        dayGroups: [],
        medCount: 0,
        empty: true
      })
      return
    }
    const medSort = this.data.medSort === 'asc' ? 'asc' : 'desc'
    const now = Date.now()
    const series = medHub.getMedSeries(medHub.medsOfPerson(state, personId), now, {
      order: medSort
    })
    const dayGroups = medHub.groupMedsByDate(series, { order: medSort })
    this.setData({
      personName: person.name,
      dayGroups,
      medCount: series.length,
      empty: !series.length,
      medSort
    })
  },

  onSetMedSort(e) {
    const order = e.currentTarget.dataset.order === 'asc' ? 'asc' : 'desc'
    if (order === this.data.medSort) return
    this.setData({ medSort: order }, () => this.refresh())
  },

  onDeleteMed(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const self = this
    wx.showModal({
      title: '删除用药',
      content: '确定删除这条用药记录？',
      success(res) {
        if (!res.confirm) return
        medHub.save(medHub.removeMed(medHub.load(), id))
        wx.showToast({ title: '已删除', icon: 'none' })
        self.refresh()
      }
    })
  },

  onShareAppMessage() {
    const name = this.data.personName || '成员'
    return {
      title: `用药明细 · ${name}`,
      path: `/pages/tool-med/meds?personId=${this.data.personId || ''}`
    }
  }
})
