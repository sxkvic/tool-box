const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const { formatDate, copyText } = require('../../utils/util')

function parseDateInput(str) {
  const s = String(str).trim().replace(/\//g, '-')
  // 支持 2026-07-12 或 2026-07-12 12:00:00
  const m = s.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  )
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const h = Number(m[4] || 0)
  const mi = Number(m[5] || 0)
  const se = Number(m[6] || 0)
  const dt = new Date(y, mo, d, h, mi, se)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

Page({
  data: {
    theme: 'mc',
    nowText: '',
    nowSec: '',
    nowMs: '',
    tsInput: '',
    dateOut: '',
    dateInput: '',
    tsOut: '',
    tsOutSec: ''
  },

  onLoad() {
    recents.pushRecent('timestamp')
    this.refreshNow()
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
    const d = this.data.dateOut
    return {
      title: d ? `时间戳：${d}` : '时间戳转换 - 随身工具箱',
      path: '/pages/tool-timestamp/index'
    }
  },

  onShareTimeline() {
    return { title: '时间戳 · 随身工具箱' }
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  refreshNow() {
    const n = new Date()
    this.setData({
      nowText: formatDate(n),
      nowSec: String(Math.floor(n.getTime() / 1000)),
      nowMs: String(n.getTime())
    })
  },

  copySec() {
    copyText(this.data.nowSec)
  },
  copyMs() {
    copyText(this.data.nowMs)
  },
  copyDateOut() {
    copyText(this.data.dateOut)
  },
  copyVal(e) {
    copyText(e.currentTarget.dataset.v)
  },

  onTsInput(e) {
    this.setData({ tsInput: e.detail.value })
  },
  onDateInput(e) {
    this.setData({ dateInput: e.detail.value })
  },

  ensureQuota() {
    if (quota.consumeQuota('timestamp')) {
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

  tsToDate() {
    if (!this.ensureQuota()) return
    let n = Number(String(this.data.tsInput).trim())
    if (!n || Number.isNaN(n)) {
      wx.showToast({ title: '请输入时间戳', icon: 'none' })
      return
    }
    // 10 位当秒，13 位当毫秒
    if (String(Math.floor(Math.abs(n))).length <= 10) {
      n = n * 1000
    }
    const d = new Date(n)
    if (Number.isNaN(d.getTime())) {
      wx.showToast({ title: '无效时间戳', icon: 'none' })
      return
    }
    this.setData({ dateOut: formatDate(d) })
    ads.showInterstitial()
  },

  dateToTs() {
    if (!this.ensureQuota()) return
    const d = parseDateInput(this.data.dateInput)
    if (!d) {
      wx.showToast({ title: '日期格式不正确', icon: 'none' })
      return
    }
    const ms = d.getTime()
    this.setData({
      tsOut: String(ms),
      tsOutSec: String(Math.floor(ms / 1000))
    })
    ads.showInterstitial()
  }
})
