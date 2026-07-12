const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')

const RANGES = [
  { text: '偏瘦：BMI < 18.5', color: '#6ea8ff' },
  { text: '正常：18.5 ≤ BMI < 24', color: '#4ade80' },
  { text: '偏胖：24 ≤ BMI < 28', color: '#fbbf24' },
  { text: '肥胖：BMI ≥ 28', color: '#f87171' }
]

function judge(bmi) {
  if (bmi < 18.5) {
    return {
      levelText: '偏瘦',
      levelColor: '#6ea8ff',
      hint: '可适当增加优质蛋白与力量训练，关注营养均衡。'
    }
  }
  if (bmi < 24) {
    return {
      levelText: '正常',
      levelColor: '#4ade80',
      hint: '保持良好作息与运动习惯即可，继续保持！'
    }
  }
  if (bmi < 28) {
    return {
      levelText: '偏胖',
      levelColor: '#fbbf24',
      hint: '建议控制总热量，增加有氧运动，循序渐进。'
    }
  }
  return {
    levelText: '肥胖',
    levelColor: '#f87171',
    hint: '建议结合饮食与运动综合调整，必要时咨询专业人士。'
  }
}

Page({
  onLoad() {
    recents.pushRecent('bmi')
    const s = storage.get('bmi_state_v1', null)
    if (s && typeof s === 'object') {
      this.setData({
        height: s.height != null ? String(s.height) : '',
        weight: s.weight != null ? String(s.weight) : ''
      })
    }
  },

  data: {
    theme: 'mc',
    height: '',
    weight: '',
    bmi: '',
    levelText: '',
    levelColor: '',
    hint: '',
    ranges: RANGES
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
    const bmi = this.data.bmi
    const level = this.data.levelText
    return {
      title: bmi ? `我的 BMI ${bmi}（${level}）` : 'BMI 计算 - 随身工具箱',
      path: '/pages/tool-bmi/index'
    }
  },

  onShareTimeline() {
    const bmi = this.data.bmi
    const level = this.data.levelText
    return {
      title: bmi ? `BMI ${bmi}（${level}）· 随身工具箱` : 'BMI 计算 · 随身工具箱'
    }
  },

  onHeight(e) {
    this.setData({ height: e.detail.value })
    storage.set('bmi_state_v1', { height: e.detail.value, weight: this.data.weight })
  },
  onWeight(e) {
    this.setData({ weight: e.detail.value })
    storage.set('bmi_state_v1', { height: this.data.height, weight: e.detail.value })
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  async onCalc() {
    const h = Number(this.data.height)
    const w = Number(this.data.weight)
    if (!h || !w || h < 50 || h > 250 || w < 10 || w > 300) {
      wx.showToast({ title: '请输入合理身高体重', icon: 'none' })
      return
    }

    if (!quota.consumeQuota('bmi')) {
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

    const m = h / 100
    const bmi = w / (m * m)
    const bmiText = bmi.toFixed(1)
    const j = judge(bmi)
    this.setData({
      bmi: bmiText,
      ...j
    })
    ads.showInterstitial()
  }
})
