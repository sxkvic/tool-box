const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')

const STORE_KEY = 'todo_list_v1'

function uid() {
  return `t_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`
}

Page({
  data: {
    theme: 'mc',
    text: '',
    filter: 'all',
    filters: [
      { key: 'all', name: '全部' },
      { key: 'active', name: '未完成' },
      { key: 'done', name: '已完成' }
    ],
    items: [],
    viewItems: [],
    leftCount: 0,
    empty: true
  },

  onLoad() {
    recents.pushRecent('todo')
    this.reload()
  },

  onShow() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
    this.reload()
  },

  onShareAppMessage() {
    const left = this.data.leftCount
    return {
      title: left != null ? `简易待办 · 剩余 ${left} 项` : '简易待办 - 随身工具箱',
      path: '/pages/tool-todo/index'
    }
  },

  onShareTimeline() {
    return { title: '简易待办 · 随身工具箱' }
  },

  readList() {
    const raw = storage.get(STORE_KEY, [])
    return Array.isArray(raw) ? raw : []
  },

  writeList(list) {
    storage.set(STORE_KEY, list)
    this.applyList(list)
  },

  applyList(list) {
    const filter = this.data.filter
    let viewItems = list
    if (filter === 'active') viewItems = list.filter((x) => !x.done)
    if (filter === 'done') viewItems = list.filter((x) => x.done)
    const leftCount = list.filter((x) => !x.done).length
    this.setData({
      items: list,
      viewItems,
      leftCount,
      empty: !list.length
    })
  },

  reload() {
    this.applyList(this.readList())
  },

  onText(e) {
    this.setData({ text: e.detail.value })
  },

  onFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.key })
    this.applyList(this.data.items)
  },

  onAdd() {
    const text = (this.data.text || '').trim()
    if (!text) {
      wx.showToast({ title: '请输入待办内容', icon: 'none' })
      return
    }
    const list = this.readList()
    if (list.length >= 100) {
      wx.showToast({ title: '最多 100 条', icon: 'none' })
      return
    }
    list.unshift({
      id: uid(),
      text,
      done: false,
      createdAt: Date.now()
    })
    this.setData({ text: '' })
    this.writeList(list)
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    const list = this.readList().map((x) => {
      if (x.id !== id) return x
      return Object.assign({}, x, { done: !x.done })
    })
    this.writeList(list)
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const list = this.readList().filter((x) => x.id !== id)
    this.writeList(list)
  },

  onClearDone() {
    const list = this.readList().filter((x) => !x.done)
    this.writeList(list)
    wx.showToast({ title: '已清理完成项', icon: 'none' })
  }
})