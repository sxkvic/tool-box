const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')

const STORE_KEY = 'countdown_list_v1'

function pad(n) {
  return String(n).padStart(2, '0')
}

function parseDate(str) {
  if (!str) return null
  // yyyy-mm-dd
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function diffDays(target, now) {
  const t = startOfDay(target).getTime()
  const n = startOfDay(now).getTime()
  return Math.round((t - n) / 86400000)
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function decorateItem(item, now) {
  const date = parseDate(item.date)
  if (!date) {
    return Object.assign({}, item, {
      days: 0,
      status: 'invalid',
      statusText: '日期无效',
      badge: '--'
    })
  }
  const days = diffDays(date, now)
  let status = 'future'
  let statusText = '还有'
  let badge = `${days}`
  if (days === 0) {
    status = 'today'
    statusText = '就是今天'
    badge = '今'
  } else if (days < 0) {
    status = 'past'
    statusText = '已过'
    badge = `${Math.abs(days)}`
  }
  return Object.assign({}, item, {
    days: Math.abs(days),
    status,
    statusText,
    badge,
    dateText: item.date
  })
}

function sortItems(list) {
  return list.slice().sort((a, b) => {
    // today first, then future asc, then past desc
    const rank = { today: 0, future: 1, past: 2, invalid: 3 }
    const ra = rank[a.status] != null ? rank[a.status] : 9
    const rb = rank[b.status] != null ? rank[b.status] : 9
    if (ra !== rb) return ra - rb
    if (a.status === 'past') return b.days - a.days
    return a.days - b.days
  })
}

function uid() {
  return `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`
}

Page({
  data: {
    theme: 'mc',
    title: '',
    date: '',
    items: [],
    empty: true
  },

  onLoad() {
    recents.pushRecent('countdown')
    // default date: tomorrow
    const t = new Date()
    t.setDate(t.getDate() + 1)
    this.setData({ date: formatDate(t) })
    this.reload()
  },

  onShow() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
    this.reload()
  },

  onShareAppMessage() {
    const first = (this.data.items || [])[0]
    return {
      title: first ? `${first.title} · ${first.statusText}${first.status === 'today' ? '' : first.days + '天'}` : '纪念日倒计时 - 随身工具箱',
      path: '/pages/tool-countdown/index'
    }
  },

  onShareTimeline() {
    return { title: '纪念日倒计时 · 随身工具箱' }
  },

  reload() {
    const now = new Date()
    const raw = storage.get(STORE_KEY, [])
    const list = Array.isArray(raw) ? raw : []
    const items = sortItems(list.map((x) => decorateItem(x, now)))
    this.setData({ items, empty: !items.length })
  },

  saveRaw(list) {
    storage.set(STORE_KEY, list)
    this.reload()
  },

  onTitle(e) {
    this.setData({ title: e.detail.value })
  },

  onDate(e) {
    this.setData({ date: e.detail.value })
  },

  onAdd() {
    const title = (this.data.title || '').trim()
    const date = this.data.date
    if (!title) {
      wx.showToast({ title: '请填写名称', icon: 'none' })
      return
    }
    if (!parseDate(date)) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }
    const raw = storage.get(STORE_KEY, [])
    const list = Array.isArray(raw) ? raw.slice() : []
    if (list.length >= 30) {
      wx.showToast({ title: '最多 30 条', icon: 'none' })
      return
    }
    list.unshift({ id: uid(), title, date, createdAt: Date.now() })
    this.setData({ title: '' })
    this.saveRaw(list)
    wx.showToast({ title: '已添加', icon: 'success' })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除纪念日',
      content: '确定删除这条记录？',
      success: (res) => {
        if (!res.confirm) return
        const raw = storage.get(STORE_KEY, [])
        const list = (Array.isArray(raw) ? raw : []).filter((x) => x.id !== id)
        this.saveRaw(list)
      }
    })
  }
})