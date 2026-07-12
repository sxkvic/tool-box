const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText } = require('../../utils/util')

const STORE_KEY = 'loan_state_v1'

function money(n) {
  if (!Number.isFinite(n)) return '-'
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function calcEqualPrincipalAndInterest(principal, monthlyRate, months) {
  if (monthlyRate === 0) {
    const pay = principal / months
    return {
      monthly: pay,
      totalPay: principal,
      totalInterest: 0
    }
  }
  const pow = Math.pow(1 + monthlyRate, months)
  const monthly = (principal * monthlyRate * pow) / (pow - 1)
  const totalPay = monthly * months
  return {
    monthly,
    totalPay,
    totalInterest: totalPay - principal
  }
}

function calcEqualPrincipal(principal, monthlyRate, months) {
  const base = principal / months
  let totalInterest = 0
  let first = 0
  let last = 0
  for (let i = 0; i < months; i++) {
    const remain = principal - base * i
    const interest = remain * monthlyRate
    const pay = base + interest
    totalInterest += interest
    if (i === 0) first = pay
    if (i === months - 1) last = pay
  }
  return {
    first,
    last,
    monthlyAvg: (principal + totalInterest) / months,
    totalPay: principal + totalInterest,
    totalInterest
  }
}

Page({
  data: {
    theme: 'mc',
    method: 'interest',
    methods: [
      { key: 'interest', name: '等额本息' },
      { key: 'principal', name: '等额本金' }
    ],
    amount: '100',
    years: '30',
    rate: '3.6',
    result: null
  },

  onLoad() {
    recents.pushRecent('loan')
    this.restore()
  },

  onShow() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
  },

  onShareAppMessage() {
    const r = this.data.result
    return {
      title: r ? `房贷估算：${r.summary}` : '房贷速算 - 随身工具箱',
      path: '/pages/tool-loan/index'
    }
  },

  onShareTimeline() {
    return { title: '房贷速算 · 等额本息/本金 · 随身工具箱' }
  },

  restore() {
    const s = storage.get(STORE_KEY, null)
    if (!s || typeof s !== 'object') return
    this.setData({
      method: s.method === 'principal' ? 'principal' : 'interest',
      amount: s.amount != null ? String(s.amount) : '100',
      years: s.years != null ? String(s.years) : '30',
      rate: s.rate != null ? String(s.rate) : '3.6'
    })
  },

  persist() {
    storage.set(STORE_KEY, {
      method: this.data.method,
      amount: this.data.amount,
      years: this.data.years,
      rate: this.data.rate
    })
  },

  onMethod(e) {
    this.setData({ method: e.currentTarget.dataset.key, result: null })
    this.persist()
  },

  onAmount(e) {
    this.setData({ amount: e.detail.value })
    this.persist()
  },
  onYears(e) {
    this.setData({ years: e.detail.value })
    this.persist()
  },
  onRate(e) {
    this.setData({ rate: e.detail.value })
    this.persist()
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  async onCalc() {
    const amountWan = Number(this.data.amount)
    const years = Number(this.data.years)
    const rateYear = Number(this.data.rate)

    if (!amountWan || amountWan <= 0 || amountWan > 10000) {
      wx.showToast({ title: '请输入合理贷款金额', icon: 'none' })
      return
    }
    if (!years || years < 1 || years > 50) {
      wx.showToast({ title: '年限 1-50 年', icon: 'none' })
      return
    }
    if (Number.isNaN(rateYear) || rateYear < 0 || rateYear > 30) {
      wx.showToast({ title: '请输入合理年利率', icon: 'none' })
      return
    }

    if (!quota.consumeQuota('loan')) {
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

    const principal = amountWan * 10000
    const months = Math.round(years * 12)
    const monthlyRate = rateYear / 100 / 12
    const method = this.data.method

    let result = null
    if (method === 'interest') {
      const r = calcEqualPrincipalAndInterest(principal, monthlyRate, months)
      result = {
        methodName: '等额本息',
        lines: [
          { label: '每月还款', value: `¥ ${money(r.monthly)}` },
          { label: '还款总额', value: `¥ ${money(r.totalPay)}` },
          { label: '利息总额', value: `¥ ${money(r.totalInterest)}` },
          { label: '贷款本金', value: `¥ ${money(principal)}` },
          { label: '贷款月数', value: `${months} 期` }
        ],
        summary: `每月固定 ¥ ${money(r.monthly)}`
      }
    } else {
      const r = calcEqualPrincipal(principal, monthlyRate, months)
      result = {
        methodName: '等额本金',
        lines: [
          { label: '首月还款', value: `¥ ${money(r.first)}` },
          { label: '末月还款', value: `¥ ${money(r.last)}` },
          { label: '月均还款', value: `¥ ${money(r.monthlyAvg)}` },
          { label: '还款总额', value: `¥ ${money(r.totalPay)}` },
          { label: '利息总额', value: `¥ ${money(r.totalInterest)}` },
          { label: '贷款月数', value: `${months} 期` }
        ],
        summary: `首月 ¥ ${money(r.first)} · 逐月递减`
      }
    }

    this.setData({ result })
    ads.showInterstitial()
  },

  onCopy() {
    const r = this.data.result
    if (!r) return
    const text = [r.methodName, r.summary]
      .concat(r.lines.map((l) => `${l.label}：${l.value}`))
      .join('\n')
    copyText(text)
  }
})