const themeUtil = require('../../utils/theme')
const storage = require('../../utils/storage')
const medHub = require('../../utils/med')

const TEMP_SORT_KEY = 'med_temp_sort_v1'

function readTempSort() {
  const v = storage.get(TEMP_SORT_KEY, 'desc')
  return v === 'asc' ? 'asc' : 'desc'
}

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
      tempSort: 'desc',
      tempCount: 0,
      dayGroups: [],
      empty: true
    }
  })(),

  onLoad(query) {
    const personId = (query && query.personId) || ''
    const tempSort = (query && query.sort === 'asc') || (query && query.sort === 'desc')
      ? query.sort
      : readTempSort()
    this.setData({ personId, tempSort })
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
        tempCount: 0,
        empty: true
      })
      return
    }
    const tempSort = this.data.tempSort === 'asc' ? 'asc' : 'desc'
    const series = medHub.getTempSeries(medHub.tempsOfPerson(state, personId), {
      order: tempSort
    })
    const dayGroups = medHub.groupTempsByDate(series, { order: tempSort })
    this.setData({
      personName: person.name,
      dayGroups,
      tempCount: series.length,
      empty: !series.length,
      tempSort
    })
  },

  onSetTempSort(e) {
    const order = e.currentTarget.dataset.order === 'asc' ? 'asc' : 'desc'
    if (order === this.data.tempSort) return
    storage.set(TEMP_SORT_KEY, order)
    this.setData({ tempSort: order }, () => this.refresh())
  },

  onDeleteTemp(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const self = this
    wx.showModal({
      title: '删除体温',
      content: '确定删除这条体温记录？',
      success(res) {
        if (!res.confirm) return
        medHub.save(medHub.removeTemp(medHub.load(), id))
        wx.showToast({ title: '已删除', icon: 'none' })
        self.refresh()
      }
    })
  },

  onShareAppMessage() {
    const name = this.data.personName || '成员'
    return {
      title: `体温明细 · ${name}`,
      path: `/pages/tool-med/temps?personId=${this.data.personId || ''}`
    }
  }
})
