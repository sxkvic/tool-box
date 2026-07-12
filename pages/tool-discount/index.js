const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText } = require('../../utils/util')

const STORE_KEY = 'discount_state_v1'

function money(n) {
  if (!Number.isFinite(n)) return '-'
  return n.toFixed(2)
}

Page({
  data: {
    theme: 'mc',
    mode: 'discount',
    modes: [
      { key: 'discount', name: '打折' },
      { key: 'off', name: '满减' },
      { key: 'percent', name: '百分比' }
    ],
    price: '',
    rate: '8.5',
    full: '100',
    minus: '20',
    base: '',
    percent: '10',
    result: null
  },

  onLoad() {
    recents.pushRecent('discount')
    const s = storage.get(STORE_KEY, null)
    if (s && typeof s === 'object') {
      this.setData({
        mode: s.mode || 'discount',
        price: s.price != null ? String(s.price) : '',
        rate: s.rate != null ? String(s.rate) : '8.5',
        full: s.full != null ? String(s.full) : '100',
        minus: s.minus != null ? String(s.minus) : '20',
        base: s.base != null ? String(s.base) : '',
        percent: s.percent != null ? String(s.percent) : '10'
      })
    }
  },

  onShow() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
  },

  onShareAppMessage() {
    const r = this.data.result
    return {
      title: r ? `计算结果：${r.main}` : '折扣计算 - 随身工具箱',
      path: '/pages/tool-discount/index'
    }
  },

  onShareTimeline() {
    const r = this.data.result
    return { title: r ? `${r.main} · 折扣计算` : '折扣计算 · 打折/满减/百分比 · 随身工具箱' }
  },

  persist() {
    storage.set(STORE_KEY, {
      mode: this.data.mode,
      price: this.data.price,
      rate: this.data.rate,
      full: this.data.full,
      minus: this.data.minus,
      base: this.data.base,
      percent: this.data.percent
    })
  },

  onMode(e) {
    this.setData({ mode: e.currentTarget.dataset.key, result: null })
    this.persist()
  },
  onField(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [key]: e.detail.value })
    this.persist()
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  buildResult() {
    const mode = this.data.mode
    if (mode === 'discount') {
      const price = Number(this.data.price)
      let rate = Number(this.data.rate)
      if (!price || price <= 0) {
        wx.showToast({ title: '请输入原价', icon: 'none' })
        return null
      }
      if (Number.isNaN(rate) || rate <= 0) {
        wx.showToast({ title: '请输入折扣', icon: 'none' })
        return null
      }
      if (rate > 1) rate = rate / 10
      if (rate > 1) rate = rate / 10
      const pay = price * rate
      const save = price - pay
      return {
        main: `实付 ¥ ${money(pay)}`,
        lines: [
          { label: '原价', value: `¥ ${money(price)}` },
          { label: '折扣', value: `${(rate * 10).toFixed(2).replace(/\.?0+$/, '')} 折` },
          { label: '实付', value: `¥ ${money(pay)}` },
          { label: '节省', value: `¥ ${money(save)}` }
        ]
      }
    }
    if (mode === 'off') {
      const price = Number(this.data.price)
      const full = Number(this.data.full)
      const minus = Number(this.data.minus)
      if (!price || price <= 0) {
        wx.showToast({ title: '请输入订单金额', icon: 'none' })
        return null
      }
      if (!full || full <= 0 || Number.isNaN(minus) || minus < 0) {
        wx.showToast({ title: '请输入满减条件', icon: 'none' })
        return null
      }
      const times = Math.floor(price / full)
      const save = times * minus
      const pay = Math.max(0, price - save)
      return {
        main: `实付 ¥ ${money(pay)}`,
        lines: [
          { label: '订单金额', value: `¥ ${money(price)}` },
          { label: '满减规则', value: `每满 ${money(full)} 减 ${money(minus)}` },
          { label: '触发次数', value: `${times} 次` },
          { label: '共减', value: `¥ ${money(save)}` },
          { label: '实付', value: `¥ ${money(pay)}` }
        ]
      }
    }
    const base = Number(this.data.base)
    const percent = Number(this.data.percent)
    if (Number.isNaN(base)) {
      wx.showToast({ title: '请输入数值', icon: 'none' })
      return null
    }
    if (Number.isNaN(percent)) {
      wx.showToast({ title: '请输入百分比', icon: 'none' })
      return null
    }
    const part = (base * percent) / 100
    const up = base + part
    const down = base - part
    return {
      main: `${percent}% = ${money(part)}`,
      lines: [
        { label: '基数', value: money(base) },
        { label: '百分比', value: `${percent}%` },
        { label: '对应值', value: money(part) },
        { label: '加上后', value: money(up) },
        { label: '减去后', value: money(down) }
      ]
    }
  },

  async onCalc() {
    const result = this.buildResult()
    if (!result) return

    if (!quota.consumeQuota('discount')) {
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
  },

  onCopy() {
    const r = this.data.result
    if (!r) return
    copyText([r.main].concat(r.lines.map((l) => `${l.label}：${l.value}`)).join('\n'))
  }
})