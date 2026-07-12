const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText } = require('../../utils/util')

const STORE_KEY = 'radix_state_v1'

Page({
  data: {
    theme: 'mc',
    value: '',
    fromRadix: 10,
    radixList: [2, 8, 10, 16],
    show: false,
    results: []
  },

  onLoad() {
    recents.pushRecent('radix')
    const s = storage.get(STORE_KEY, null)
    if (s && typeof s === 'object') {
      const fromRadix = [2, 8, 10, 16].indexOf(Number(s.fromRadix)) >= 0 ? Number(s.fromRadix) : 10
      this.setData({
        value: s.value != null ? String(s.value) : '',
        fromRadix
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
    const dec = (this.data.results || []).find((x) => x.label === '十进制')
    return {
      title: dec ? `进制转换：${dec.value}` : '进制转换 - 随身工具箱',
      path: '/pages/tool-radix/index'
    }
  },

  onShareTimeline() {
    return { title: '进制转换 · 随身工具箱' }
  },

  persist() {
    storage.set(STORE_KEY, {
      value: this.data.value,
      fromRadix: this.data.fromRadix
    })
  },

  onValue(e) {
    this.setData({ value: e.detail.value })
    this.persist()
  },

  onRadix(e) {
    this.setData({ fromRadix: Number(e.currentTarget.dataset.v), show: false })
    this.persist()
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  onConvert() {
    const raw = String(this.data.value || '').trim().replace(/\s/g, '')
    if (!raw) {
      wx.showToast({ title: '请输入数值', icon: 'none' })
      return
    }

    const from = this.data.fromRadix
    const num = parseInt(raw, from)
    if (Number.isNaN(num)) {
      wx.showToast({ title: '无法按该进制解析', icon: 'none' })
      return
    }

    if (!quota.consumeQuota('radix')) {
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

    const results = [
      { label: '二进制', value: num.toString(2) },
      { label: '八进制', value: num.toString(8) },
      { label: '十进制', value: num.toString(10) },
      { label: '十六进制', value: num.toString(16).toUpperCase() }
    ]
    this.setData({ show: true, results })
    ads.showInterstitial()
  },

  onCopy(e) {
    copyText(e.currentTarget.dataset.v)
  }
})