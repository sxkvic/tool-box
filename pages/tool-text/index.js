const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText } = require('../../utils/util')

const STORE_KEY = 'text_state_v1'

function analyze(text) {
  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const lines = text === '' ? 0 : text.split(/\r\n|\n|\r/).length
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const words = (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).length
  const digits = (text.match(/\d/g) || []).length
  return [
    { label: '总字符', value: chars },
    { label: '不含空白', value: charsNoSpace },
    { label: '行数', value: lines },
    { label: '中文字', value: cn },
    { label: '英文词', value: words },
    { label: '数字', value: digits }
  ]
}

Page({
  data: {
    theme: 'mc',
    text: '',
    show: false,
    stats: []
  },

  onLoad() {
    recents.pushRecent('text')
    const s = storage.get(STORE_KEY, null)
    if (s && typeof s === 'object' && s.text != null) {
      this.setData({ text: String(s.text) })
    }
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
  },

  onShow() {
    this.syncTheme()
  },

  onShareAppMessage() {
    const stats = this.data.stats || []
    const total = stats.find((x) => x.label === '总字符')
    return {
      title: total ? `文本统计：${total.value} 字符` : '文本统计 - 随身工具箱',
      path: '/pages/tool-text/index'
    }
  },

  onShareTimeline() {
    return { title: '文本统计 · 随身工具箱' }
  },

  persist() {
    // 限制体积，避免超大剪贴板内容撑爆 storage
    const text = String(this.data.text || '')
    storage.set(STORE_KEY, { text: text.slice(0, 20000) })
  },

  onInput(e) {
    this.setData({ text: e.detail.value })
    this.persist()
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  onClear() {
    this.setData({ text: '', show: false, stats: [] })
    this.persist()
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        this.setData({ text: res.data || '' })
        this.persist()
        wx.showToast({ title: '已粘贴', icon: 'success' })
      }
    })
  },

  onStat() {
    if (!quota.consumeQuota('text')) {
      wx.showModal({
        title: '今日次数已用完',
        content: '观看激励视频可获得额外次数',
        confirmText: '去观看',
        success: async (res) => {
          if (res.confirm) {
            const ok = await ads.showRewardedVideo()
            if (ok) {
              quota.addRewardBonus()
              this.refreshQuota()
            }
          }
        }
      })
      return
    }
    this.refreshQuota()
    const stats = analyze(this.data.text || '')
    this.setData({ show: true, stats })
    ads.showInterstitial()
  },

  trimAll() {
    const text = String(this.data.text || '').trim()
    this.setData({ text })
    this.persist()
    if (this.data.show) this.setData({ stats: analyze(text) })
  },

  removeSpaces() {
    const text = String(this.data.text || '').replace(/\s+/g, '')
    this.setData({ text })
    this.persist()
    if (this.data.show) this.setData({ stats: analyze(text) })
  },

  removeEmptyLines() {
    const text = String(this.data.text || '')
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim().length)
      .join('\n')
    this.setData({ text })
    this.persist()
    if (this.data.show) this.setData({ stats: analyze(text) })
  },

  copyTextBtn() {
    copyText(this.data.text)
  }
})