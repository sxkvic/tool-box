/**
 * 简化版亲戚称呼：基于关系链查表
 * 覆盖常见路径，复杂远亲会提示「建议当面确认」
 */
const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')

const RELATIONS = [
  { key: 'f', label: '爸爸' },
  { key: 'm', label: '妈妈' },
  { key: 'h', label: '老公' },
  { key: 'w', label: '老婆' },
  { key: 'ob', label: '哥哥' },
  { key: 'yb', label: '弟弟' },
  { key: 'os', label: '姐姐' },
  { key: 'ys', label: '妹妹' },
  { key: 's', label: '儿子' },
  { key: 'd', label: '女儿' }
]

// key: 关系链（用 , 连接），value: 称呼；{m}/{f} 表示按「我」性别区分
const MAP = {
  f: '爸爸',
  m: '妈妈',
  h: '老公',
  w: '老婆',
  ob: '哥哥',
  yb: '弟弟',
  os: '姐姐',
  ys: '妹妹',
  s: '儿子',
  d: '女儿',

  'f,f': '爷爷',
  'f,m': '奶奶',
  'm,f': '外公',
  'm,m': '外婆',

  'f,ob': '伯父',
  'f,yb': '叔叔',
  'f,os': '姑妈',
  'f,ys': '姑妈',
  'm,ob': '舅舅',
  'm,yb': '舅舅',
  'm,os': '姨妈',
  'm,ys': '姨妈',

  'f,ob,w': '伯母',
  'f,yb,w': '婶婶',
  'f,os,h': '姑父',
  'f,ys,h': '姑父',
  'm,ob,w': '舅妈',
  'm,yb,w': '舅妈',
  'm,os,h': '姨父',
  'm,ys,h': '姨父',

  'f,ob,s': '堂哥/堂弟',
  'f,ob,d': '堂姐/堂妹',
  'f,yb,s': '堂哥/堂弟',
  'f,yb,d': '堂姐/堂妹',
  'f,os,s': '表哥/表弟',
  'f,os,d': '表姐/表妹',
  'f,ys,s': '表哥/表弟',
  'f,ys,d': '表姐/表妹',
  'm,ob,s': '表哥/表弟',
  'm,ob,d': '表姐/表妹',
  'm,yb,s': '表哥/表弟',
  'm,yb,d': '表姐/表妹',
  'm,os,s': '表哥/表弟',
  'm,os,d': '表姐/表妹',
  'm,ys,s': '表哥/表弟',
  'm,ys,d': '表姐/表妹',

  'h,f': '公公',
  'h,m': '婆婆',
  'w,f': '岳父',
  'w,m': '岳母',
  'h,ob': '大伯子',
  'h,yb': '小叔子',
  'h,os': '大姑子',
  'h,ys': '小姑子',
  'w,ob': '大舅子',
  'w,yb': '小舅子',
  'w,os': '大姨子',
  'w,ys': '小姨子',

  'ob,w': '嫂子',
  'yb,w': '弟妹',
  'os,h': '姐夫',
  'ys,h': '妹夫',

  's,w': '儿媳',
  'd,h': '女婿',
  's,s': '孙子',
  's,d': '孙女',
  'd,s': '外孙',
  'd,d': '外孙女',

  'f,f,f': '曾祖父',
  'f,f,m': '曾祖母',
  'f,s': '{m}的兄弟 / {f}自己或兄弟（请按排行）',
  'f,d': '姑奶奶辈需结合排行，当面确认更稳妥',

  'ob,s': '侄子',
  'ob,d': '侄女',
  'yb,s': '侄子',
  'yb,d': '侄女',
  'os,s': '外甥',
  'os,d': '外甥女',
  'ys,s': '外甥',
  'ys,d': '外甥女'
}

Page({
  onLoad() {
    recents.pushRecent('relation')
  },

  data: {
    theme: 'mc',
    gender: 'male',
    relations: RELATIONS,
    path: [],
    pathKeys: [],
    call: '',
    note: ''
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
    const call = this.data.call
    return {
      title: call && call !== '暂未收录该关系' ? `亲戚称呼：${call}` : '亲戚称呼 - 随身工具箱',
      path: '/pages/tool-relation/index'
    }
  },

  onShareTimeline() {
    const call = this.data.call
    return {
      title: call && call !== '暂未收录该关系' ? `亲戚称呼：${call} · 随身工具箱` : '亲戚称呼 · 随身工具箱'
    }
  },

  onGender(e) {
    this.setData({ gender: e.currentTarget.dataset.g })
  },

  onPick(e) {
    const { key, label } = e.currentTarget.dataset
    const path = this.data.path.concat(label)
    const pathKeys = this.data.pathKeys.concat(key)
    if (pathKeys.length > 5) {
      wx.showToast({ title: '路径太长，请清空重选', icon: 'none' })
      return
    }
    this.setData({ path, pathKeys, call: '', note: '' })
  },

  onBack() {
    const path = this.data.path.slice(0, -1)
    const pathKeys = this.data.pathKeys.slice(0, -1)
    this.setData({ path, pathKeys, call: '', note: '' })
  },

  onReset() {
    this.setData({ path: [], pathKeys: [], call: '', note: '' })
  },

  refreshQuota() {
    const bar = this.selectComponent('#quotaBar')
    if (bar) bar.refresh()
  },

  onQuery() {
    if (!this.data.pathKeys.length) return
    if (!quota.consumeQuota('relation')) {
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

    const key = this.data.pathKeys.join(',')
    let call = MAP[key]
    let note = ''

    if (!call) {
      // 尝试缩短匹配失败
      call = '暂未收录该关系'
      note = '远房亲戚称呼各地习惯不同，建议结合家中排行当面确认。'
    } else {
      call = call
        .replace(/\{m\}/g, this.data.gender === 'male' ? '你' : '你')
        .replace(/\{f\}/g, this.data.gender === 'male' ? '你' : '你')
      if (call.includes('/') || call.includes('确认')) {
        note = '具体称呼可能因排行、地区习惯略有差异。'
      }
    }

    this.setData({ call, note })
    ads.showInterstitial()
  }
})
