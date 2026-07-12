const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')

const PRESETS = {
  daily: {
    name: '日常',
    items: [
      '黄焖鸡米饭', '麻辣香锅', '番茄炒蛋盖饭', '牛肉面', '炸鸡汉堡',
      '酸菜鱼', '寿司拼盘', '麻辣烫', '披萨', '炒河粉',
      '鸡公煲', '螺蛳粉', '烤肉饭', '咖喱饭', '沙县小吃',
      '饺子', '关东煮', '轻食沙拉', '小龙虾', '火锅'
    ]
  },
  breakfast: {
    name: '早餐',
    items: [
      '豆浆油条', '包子粥', '三明治咖啡', '手抓饼', '牛奶麦片',
      '肠粉', '煎饺', '酸奶水果', '煎饼果子', '馄饨'
    ]
  },
  healthy: {
    name: '清淡',
    items: [
      '蔬菜沙拉', '杂粮饭配鸡胸', '清蒸鱼', '番茄鸡蛋面', '燕麦碗',
      '蒸蛋羹', '凉拌黄瓜', '菌菇汤面', '水煮青菜豆腐', '水果拼盘'
    ]
  },
  heavy: {
    name: '重口',
    items: [
      '麻辣火锅', '重庆小面', '烧烤撸串', '炸鸡啤酒', '冒菜',
      '水煮牛肉', '干锅牛蛙', '酸辣粉', '烤鱼', '炸串'
    ]
  }
}

const MODE_LIST = [
  { key: 'daily', name: '日常' },
  { key: 'breakfast', name: '早餐' },
  { key: 'healthy', name: '清淡' },
  { key: 'heavy', name: '重口' },
  { key: 'custom', name: '自定义' }
]

const STORE_KEY = 'food_state_v1'

function shufflePick(list) {
  if (!list.length) return ''
  return list[Math.floor(Math.random() * list.length)]
}

function countCustom(text) {
  return (text || '')
    .split(/[\n,，、]/)
    .map((s) => s.trim())
    .filter(Boolean).length
}

Page({
  data: {
    theme: 'mc',
    modes: MODE_LIST,
    mode: 'daily',
    customText: '',
    spinning: false,
    result: '',
    history: [],
    poolHint: PRESETS.daily.items.length
  },

  onLoad() {
    recents.pushRecent('food')
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
      title: r ? `今天吃：${r}` : '今天吃什么 - 随身工具箱',
      path: '/pages/tool-food/index'
    }
  },

  onShareTimeline() {
    const r = this.data.result
    return { title: r ? `今天吃：${r} · 随身工具箱` : '今天吃什么 · 随身工具箱' }
  },

  restore() {
    const s = storage.get(STORE_KEY, null)
    if (!s || typeof s !== 'object') return
    const mode = s.mode || 'daily'
    const customText = s.customText || ''
    const poolHint =
      mode === 'custom' ? countCustom(customText) : ((PRESETS[mode] && PRESETS[mode].items.length) || 0)
    this.setData({
      mode,
      customText,
      history: Array.isArray(s.history) ? s.history.slice(0, 12) : [],
      result: s.result || '',
      poolHint
    })
  },

  persist(patch) {
    const next = Object.assign(
      {
        mode: this.data.mode,
        customText: this.data.customText,
        history: this.data.history,
        result: this.data.result
      },
      patch || {}
    )
    storage.set(STORE_KEY, next)
  },

  onMode(e) {
    const mode = e.currentTarget.dataset.mode
    const poolHint =
      mode === 'custom'
        ? countCustom(this.data.customText)
        : ((PRESETS[mode] && PRESETS[mode].items.length) || 0)
    this.setData({ mode, result: '', poolHint })
    this.persist({ mode, result: '' })
  },

  onCustom(e) {
    const customText = e.detail.value
    const poolHint = countCustom(customText)
    this.setData({ customText, poolHint })
    this.persist({ customText })
  },

  getPool() {
    const { mode, customText } = this.data
    if (mode === 'custom') {
      return (customText || '')
        .split(/[\n,，、]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return (PRESETS[mode] && PRESETS[mode].items.slice()) || []
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  async onDraw() {
    if (this.data.spinning) return

    const pool = this.getPool()
    if (pool.length < 2) {
      wx.showToast({ title: '至少准备 2 个选项', icon: 'none' })
      return
    }

    if (!quota.consumeQuota('food')) {
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

    this.setData({ spinning: true, result: '' })

    let ticks = 0
    const maxTicks = 12
    const timer = setInterval(() => {
      ticks += 1
      const temp = shufflePick(pool)
      this.setData({ result: temp })
      if (ticks >= maxTicks) {
        clearInterval(timer)
        const final = shufflePick(pool)
        const history = [final].concat(this.data.history.filter((x) => x !== final)).slice(0, 12)
        this.setData({
          spinning: false,
          result: final,
          history
        })
        this.persist({ result: final, history })
        ads.showInterstitial()
      }
    }, 70)
  }
})