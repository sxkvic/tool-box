const themeUtil = require('../../utils/theme')
try { themeUtil.ensureTheme() } catch (e) {}
const weightHub = require('../../utils/weight')

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
    list: [],
    count: 0,
    editOn: false,
    editId: '',
    weightFocus: false,
    keyboardHeight: 0,
    sheetMaxHeight: "85vh",
    formWeight: '',
    formBodyFat: '',
    formNote: ''
    }
  })(),

  onLoad() {
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
    this._state = state
    const list = (state.records || []).map((r) => ({
      id: r.id,
      date: r.date,
      time: r.time,
      weight: r.weight.toFixed(1),
      note: r.note || '',
      bf: r.bodyFat != null ? String(r.bodyFat) : '',
      bfText: r.bodyFat != null ? `${r.bodyFat}%` : ''
    }))
    this.setData({ list, count: list.length })
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

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const item = (this.data.list || []).find((x) => x.id === id)
    if (!item) return
    if (this._focusTimer) {
      clearTimeout(this._focusTimer)
      this._focusTimer = null
    }
    this.setData({
      editOn: true,
      editId: id,
      weightFocus: false,
      keyboardHeight: 0,
      sheetMaxHeight: this._sheetMaxHeight(0),
      formWeight: item.weight,
      formBodyFat: item.bf,
      formNote: item.note
    })
    this._focusTimer = setTimeout(() => {
      if (!this.data.editOn) return
      this.setData({ weightFocus: true })
    }, 280)
  },

  closeEdit() {
    if (this._focusTimer) {
      clearTimeout(this._focusTimer)
      this._focusTimer = null
    }
    this.setData({
      editOn: false,
      editId: '',
      weightFocus: false,
      keyboardHeight: 0,
      sheetMaxHeight: this._sheetMaxHeight(0)
    })
  },

  onWeightBlur() {
    this.setData({ weightFocus: false })
  },

  onKeyboardHeight(e) {
    if (!this.data.editOn) return
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

  onSaveEdit() {
    try {
      const state = weightHub.upsertRecord(this._state || weightHub.load(), {
        id: this.data.editId,
        weight: this.data.formWeight,
        bodyFat: this.data.formBodyFat,
        note: this.data.formNote
      })
      this._state = state
      if (this._focusTimer) {
        clearTimeout(this._focusTimer)
        this._focusTimer = null
      }
      this.setData({
        editOn: false,
        weightFocus: false,
        keyboardHeight: 0
      })
      wx.showToast({ title: '已更新', icon: 'success' })
      this.refresh()
    } catch (e) {
      wx.showToast({ title: '请输入合理体重', icon: 'none' })
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后不可恢复',
      confirmColor: '#e11d48',
      success: (res) => {
        if (!res.confirm) return
        const state = weightHub.removeRecord(this._state || weightHub.load(), id)
        this._state = state
        wx.showToast({ title: '已删除', icon: 'none' })
        this.refresh()
      }
    })
  }
})