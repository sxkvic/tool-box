const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText } = require('../../utils/util')

// 基准单位换算系数
const CATALOG = {
  length: {
    name: '长度',
    units: [
      { label: '米 m', toBase: 1 },
      { label: '千米 km', toBase: 1000 },
      { label: '厘米 cm', toBase: 0.01 },
      { label: '毫米 mm', toBase: 0.001 },
      { label: '英寸 in', toBase: 0.0254 },
      { label: '英尺 ft', toBase: 0.3048 },
      { label: '里（市里）', toBase: 500 }
    ]
  },
  weight: {
    name: '重量',
    units: [
      { label: '千克 kg', toBase: 1 },
      { label: '克 g', toBase: 0.001 },
      { label: '毫克 mg', toBase: 0.000001 },
      { label: '吨 t', toBase: 1000 },
      { label: '斤', toBase: 0.5 },
      { label: '两', toBase: 0.05 },
      { label: '磅 lb', toBase: 0.45359237 }
    ]
  },
  temp: {
    name: '温度',
    units: [
      { label: '摄氏 °C', key: 'c' },
      { label: '华氏 °F', key: 'f' },
      { label: '开尔文 K', key: 'k' }
    ]
  }
}

const STORE_KEY = 'unit_state_v1'

function tempToC(value, key) {
  if (key === 'c') return value
  if (key === 'f') return ((value - 32) * 5) / 9
  if (key === 'k') return value - 273.15
  return value
}

function tempFromC(c, key) {
  if (key === 'c') return c
  if (key === 'f') return (c * 9) / 5 + 32
  if (key === 'k') return c + 273.15
  return c
}

Page({
  data: {
    theme: 'mc',
    categories: [
      { key: 'length', name: '长度' },
      { key: 'weight', name: '重量' },
      { key: 'temp', name: '温度' }
    ],
    category: 'length',
    fromUnits: CATALOG.length.units,
    toUnits: CATALOG.length.units,
    fromIndex: 0,
    toIndex: 1,
    inputValue: '',
    result: ''
  },

  onLoad() {
    recents.pushRecent('unit')
    const s = storage.get(STORE_KEY, null)
    if (s && typeof s === 'object' && CATALOG[s.category]) {
      const units = CATALOG[s.category].units
      const fromIndex = Math.min(Number(s.fromIndex) || 0, units.length - 1)
      const toIndex = Math.min(Number(s.toIndex) != null ? Number(s.toIndex) : 1, units.length - 1)
      this.setData({
        category: s.category,
        fromUnits: units,
        toUnits: units,
        fromIndex,
        toIndex,
        inputValue: s.inputValue != null ? String(s.inputValue) : ''
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
      title: r ? `换算结果：${r}` : '单位换算 - 随身工具箱',
      path: '/pages/tool-unit/index'
    }
  },

  onShareTimeline() {
    return { title: '单位换算 · 随身工具箱' }
  },

  persist() {
    storage.set(STORE_KEY, {
      category: this.data.category,
      fromIndex: this.data.fromIndex,
      toIndex: this.data.toIndex,
      inputValue: this.data.inputValue
    })
  },

  onCategory(e) {
    const key = e.currentTarget.dataset.key
    const units = CATALOG[key].units
    this.setData({
      category: key,
      fromUnits: units,
      toUnits: units,
      fromIndex: 0,
      toIndex: Math.min(1, units.length - 1),
      result: ''
    })
    this.persist()
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value })
    this.persist()
  },

  onFromChange(e) {
    this.setData({ fromIndex: Number(e.detail.value), result: '' })
    this.persist()
  },

  onToChange(e) {
    this.setData({ toIndex: Number(e.detail.value), result: '' })
    this.persist()
  },

  onQuotaChange() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  async onConvert() {
    const raw = this.data.inputValue
    if (raw === '' || raw === undefined) {
      wx.showToast({ title: '请输入数值', icon: 'none' })
      return
    }
    const value = Number(raw)
    if (Number.isNaN(value)) {
      wx.showToast({ title: '请输入有效数字', icon: 'none' })
      return
    }

    if (!quota.consumeQuota('unit')) {
      wx.showModal({
        title: '今日次数已用完',
        content: '观看激励视频可获得额外次数',
        confirmText: '去观看',
        success: async (res) => {
          if (res.confirm) {
            const ok = await ads.showRewardedVideo()
            if (ok) {
              quota.addRewardBonus()
              this.onQuotaChange()
              wx.showToast({ title: '次数已到账', icon: 'success' })
            }
          }
        }
      })
      return
    }
    this.onQuotaChange()

    const { category, fromIndex, toIndex, fromUnits, toUnits } = this.data
    let result

    if (category === 'temp') {
      const fromKey = fromUnits[fromIndex].key
      const toKey = toUnits[toIndex].key
      const c = tempToC(value, fromKey)
      result = tempFromC(c, toKey)
    } else {
      const base = value * fromUnits[fromIndex].toBase
      result = base / toUnits[toIndex].toBase
    }

    const text =
      Math.abs(result) >= 1e6 || (Math.abs(result) > 0 && Math.abs(result) < 1e-4)
        ? result.toExponential(6)
        : String(parseFloat(result.toPrecision(10)))

    this.setData({ result: text })
    ads.showInterstitial()
  },

  onCopy() {
    copyText(this.data.result)
  }
})
