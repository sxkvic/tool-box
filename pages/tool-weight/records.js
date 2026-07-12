const themeUtil = require('../../utils/theme')
const weightHub = require('../../utils/weight')

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
    list: [],
    count: 0,
    editOn: false,
    editId: '',
    formWeight: '',
    formBodyFat: '',
    formNote: ''
  },

  onLoad() {
    this.syncTheme()
    this.refresh()
  },

  onShow() {
    this.syncTheme()
    this.refresh()
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
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

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const item = (this.data.list || []).find((x) => x.id === id)
    if (!item) return
    this.setData({
      editOn: true,
      editId: id,
      formWeight: item.weight,
      formBodyFat: item.bf,
      formNote: item.note
    })
  },

  closeEdit() {
    this.setData({ editOn: false, editId: '' })
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
      this.setData({ editOn: false })
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