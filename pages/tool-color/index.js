const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText, clamp } = require('../../utils/util')

const STORE_KEY = 'color_state_v1'

function normalizeHex(input) {
  let s = String(input || '').trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null
  return s.toUpperCase()
}

function hexToRgbObj(hex) {
  const n = normalizeHex(hex)
  if (!n) return null
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
    hex: `#${n}`
  }
}

function rgbToHexStr(r, g, b) {
  const to = (n) =>
    clamp(Math.round(Number(n)), 0, 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return `#${to(r)}${to(g)}${to(b)}`
}

Page({
  data: {
    theme: 'mc',
    hex: '',
    r: '',
    g: '',
    b: '',
    preview: '',
    outHex: '',
    outRgb: '',
    palette: [
      { hex: '#05070c' },
      { hex: '#5ce1ff' },
      { hex: '#7c9cff' },
      { hex: '#3dff9a' },
      { hex: '#ffb020' },
      { hex: '#ff5c7a' },
      { hex: '#ffffff' },
      { hex: '#0b1b2b' },
      { hex: '#9eb6ff' },
      { hex: '#1a2338' }
    ]
  },

  onLoad() {
    recents.pushRecent('color')
    const s = storage.get(STORE_KEY, null)
    if (s && typeof s === 'object') {
      this.setData({
        hex: s.hex != null ? String(s.hex) : '',
        r: s.r != null ? String(s.r) : '',
        g: s.g != null ? String(s.g) : '',
        b: s.b != null ? String(s.b) : '',
        preview: s.preview || '',
        outHex: s.outHex || '',
        outRgb: s.outRgb || ''
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
    const hex = this.data.outHex || this.data.hex
    return {
      title: hex ? `颜色 ${hex}` : '颜色转换 - 随身工具箱',
      path: '/pages/tool-color/index'
    }
  },

  onShareTimeline() {
    const hex = this.data.outHex || this.data.hex
    return { title: hex ? `颜色 ${hex} · 随身工具箱` : '颜色转换 · 随身工具箱' }
  },

  persist(extra) {
    storage.set(
      STORE_KEY,
      Object.assign(
        {
          hex: this.data.hex,
          r: this.data.r,
          g: this.data.g,
          b: this.data.b,
          preview: this.data.preview,
          outHex: this.data.outHex,
          outRgb: this.data.outRgb
        },
        extra || {}
      )
    )
  },

  onHex(e) {
    this.setData({ hex: e.detail.value })
    this.persist({ hex: e.detail.value })
  },
  onR(e) {
    this.setData({ r: e.detail.value })
    this.persist({ r: e.detail.value })
  },
  onG(e) {
    this.setData({ g: e.detail.value })
    this.persist({ g: e.detail.value })
  },
  onB(e) {
    this.setData({ b: e.detail.value })
    this.persist({ b: e.detail.value })
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  ensureQuota() {
    if (quota.consumeQuota('color')) {
      this.refreshQuota()
      return true
    }
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
    return false
  },

  applyColor(obj) {
    const outRgb = `rgb(${obj.r}, ${obj.g}, ${obj.b})`
    this.setData({
      preview: obj.hex,
      outHex: obj.hex,
      outRgb,
      hex: obj.hex,
      r: String(obj.r),
      g: String(obj.g),
      b: String(obj.b)
    })
    this.persist({
      preview: obj.hex,
      outHex: obj.hex,
      outRgb,
      hex: obj.hex,
      r: String(obj.r),
      g: String(obj.g),
      b: String(obj.b)
    })
  },

  hexToRgb() {
    if (!this.ensureQuota()) return
    const obj = hexToRgbObj(this.data.hex)
    if (!obj) {
      wx.showToast({ title: 'HEX 格式不正确', icon: 'none' })
      return
    }
    this.applyColor(obj)
    ads.showInterstitial()
  },

  rgbToHex() {
    if (!this.ensureQuota()) return
    if (this.data.r === '' || this.data.g === '' || this.data.b === '') {
      wx.showToast({ title: '请填写 RGB', icon: 'none' })
      return
    }
    const hex = rgbToHexStr(this.data.r, this.data.g, this.data.b)
    const obj = hexToRgbObj(hex)
    if (!obj) {
      wx.showToast({ title: 'RGB 无效', icon: 'none' })
      return
    }
    this.applyColor(obj)
    ads.showInterstitial()
  },

  pickPalette(e) {
    const hex = e.currentTarget.dataset.hex
    if (!hex) return
    if (!this.ensureQuota()) return
    const obj = hexToRgbObj(hex)
    if (!obj) return
    this.applyColor(obj)
  },

  onCopy(e) {
    copyText(e.currentTarget.dataset.v || this.data.outHex)
  }
})