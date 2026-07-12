const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')

const STORE_KEY = 'random_state_v1'

Page({
  data: {
    theme: 'mc',
    mode: 'list',
    listText: '',
    minNum: '1',
    maxNum: '100',
    result: ''
  },

  onLoad() {
    recents.pushRecent('random')
    const s = storage.get(STORE_KEY, null)
    if (s && typeof s === 'object') {
      this.setData({
        mode: s.mode || 'list',
        listText: s.listText != null ? String(s.listText) : '',
        minNum: s.minNum != null ? String(s.minNum) : '1',
        maxNum: s.maxNum != null ? String(s.maxNum) : '100'
      })
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
    const r = this.data.result
    return {
      title: r ? `抽中了：${r}` : '随机抽取 - 随身工具箱',
      path: '/pages/tool-random/index'
    }
  },

  onShareTimeline() {
    const r = this.data.result
    return { title: r ? `抽中了：${r} · 随身工具箱` : '随机抽取 · 随身工具箱' }
  },

  persist() {
    storage.set(STORE_KEY, {
      mode: this.data.mode,
      listText: this.data.listText,
      minNum: this.data.minNum,
      maxNum: this.data.maxNum
    })
  },

  onMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, result: '' })
    this.persist()
  },
  onList(e) {
    this.setData({ listText: e.detail.value })
    this.persist()
  },
  onMin(e) {
    this.setData({ minNum: e.detail.value })
    this.persist()
  },
  onMax(e) {
    this.setData({ maxNum: e.detail.value })
    this.persist()
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  prepareResult() {
    const { mode } = this.data
    if (mode === 'list') {
      const items = (this.data.listText || '')
        .split(/\r\n|\n|\r/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (items.length < 2) {
        wx.showToast({ title: '至少填写 2 个选项', icon: 'none' })
        return null
      }
      return items[Math.floor(Math.random() * items.length)]
    }
    if (mode === 'number') {
      let min = Number(this.data.minNum)
      let max = Number(this.data.maxNum)
      if (Number.isNaN(min) || Number.isNaN(max)) {
        wx.showToast({ title: '请输入有效数字', icon: 'none' })
        return null
      }
      if (min > max) {
        const t = min
        min = max
        max = t
      }
      min = Math.ceil(min)
      max = Math.floor(max)
      return String(Math.floor(Math.random() * (max - min + 1)) + min)
    }
    return String(Math.floor(Math.random() * 6) + 1)
  },

  onDraw() {
    const result = this.prepareResult()
    if (result == null) return

    if (!quota.consumeQuota('random')) {
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
    this.setData({ result })
    ads.showInterstitial()
  }
})