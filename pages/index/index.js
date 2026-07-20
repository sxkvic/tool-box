const themeUtil = require('../../utils/theme')
try { themeUtil.ensureTheme() } catch (e) {}
const recentsUtil = require('../../utils/recents')
const { BASE_TOOLS, CATEGORIES, getToolsByIds } = require('../../utils/tools')

function withDelay(list, base = 0.12) {
  return list.map((t, i) => Object.assign({}, t, { delay: (i * 0.04 + base).toFixed(2) + 's' }))
}

function decorateTools(list, favSet) {
  return list.map((t) =>
    Object.assign({}, t, {
      fav: !!favSet[t.id]
    })
  )
}

function buildSections(tools, favSet) {
  return CATEGORIES.map((cat, idx) => {
    const items = withDelay(
      decorateTools(
        tools.filter((t) => t.category === cat.id),
        favSet
      ),
      0.1 + idx * 0.05
    )
    return Object.assign({}, cat, {
      items,
      count: items.length
    })
  }).filter((s) => s.count > 0)
}

function themeLabelOf(id) {
  return id === 'light' ? '纯白' : '深空'
}

function makeFavSet(ids) {
  const s = {}
  ;(ids || []).forEach((id) => {
    s[id] = true
  })
  return s
}

Page({
  data: (function () {
    const chrome = themeUtil.getChrome()
    const light = chrome.theme === 'light'
    return {
    sections: [],
    recentTools: [],
    favTools: [],
    keyword: '',
    toolCount: BASE_TOOLS.length,
    theme: chrome.theme,
    chromeBg: chrome.chromeBg,
    navBg: chrome.navBg,
    navFront: chrome.navFront,
    bgTextStyle: chrome.bgTextStyle,
    themeLabel: themeLabelOf(chrome.theme),
    statusText: light ? 'READY' : 'SYSTEM ONLINE',
    heroSub: light ? 'CLEAN LAB · 纯前端工具合集' : 'MISSION CONTROL · 纯前端工具合集',
    themeIco: light ? '☀' : '☾',
    themeAnimating: false,
    themeVeilTone: light ? 'veil-to-light' : 'veil-to-mc',
    pageAnimClass: '',
    veilClass: '',
    switchClass: '',
    isSearch: false,
    hasQuick: false
    }
  })(),

  onLoad() {
    this.syncTheme()
    this.refreshLists()
  },

  onShow() {
    this.syncTheme()
    this.refreshLists(this.data.keyword)
  },

  themeFields(id) {
    const light = id === 'light'
    const chrome = themeUtil.getChrome(id)
    return {
      theme: id,
      chromeBg: chrome.chromeBg,
      navBg: chrome.navBg,
      navFront: chrome.navFront,
      bgTextStyle: chrome.bgTextStyle,
      themeLabel: themeLabelOf(id),
      statusText: light ? 'READY' : 'SYSTEM ONLINE',
      heroSub: light ? 'CLEAN LAB · 纯前端工具合集' : 'MISSION CONTROL · 纯前端工具合集',
      themeIco: light ? '☀' : '☾'
    }
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    this.setData(this.themeFields(id))
  },

  refreshLists(keyword) {
    const favIds = recentsUtil.getFavorites()
    const recentIds = recentsUtil.getRecents()
    const favSet = makeFavSet(favIds)

    const kw = (keyword || '').trim().toLowerCase()
    let matched = BASE_TOOLS
    if (kw) {
      matched = BASE_TOOLS.filter((t) => {
        const hay = `${t.name} ${t.desc} ${t.keywords} ${t.code} ${t.category}`.toLowerCase()
        return hay.includes(kw)
      })
    }

    const recentTools = decorateTools(getToolsByIds(recentIds), favSet).slice(0, 6)
    const favTools = decorateTools(getToolsByIds(favIds), favSet)
    const sections = buildSections(matched, favSet)
    const hasQuick = !kw && (recentTools.length > 0 || favTools.length > 0)

    this.setData({
      keyword: keyword || '',
      isSearch: !!kw,
      recentTools,
      favTools,
      sections,
      hasQuick,
      toolCount: BASE_TOOLS.length
    })
  },

  applyTheme(id) {
    if (this._themeLock) return
    if (!id || id === this.data.theme) return

    this._themeLock = true
    const next = id
    const veil = next === 'light' ? 'veil-to-light' : 'veil-to-mc'

    this.setData({
      themeAnimating: true,
      themeVeilTone: veil,
      pageAnimClass: 'theme-animating',
      veilClass: 'show',
      switchClass: 'spinning'
    })

    setTimeout(() => {
      themeUtil.setTheme(next)
      this.setData(this.themeFields(next))
    }, 160)

    setTimeout(() => {
      this.setData({
        themeAnimating: false,
        pageAnimClass: '',
        veilClass: '',
        switchClass: ''
      })
      this._themeLock = false
    }, 480)
  },

  onToggleTheme() {
    if (this._themeLock) return
    const next = this.data.theme === 'light' ? 'mc' : 'light'
    this.applyTheme(next)
  },

  onShareAppMessage() {
    return {
      title: '随身工具箱 · 15 个纯前端小工具',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: '随身工具箱 · 纯前端工具合集'
    }
  },

  onSearch(e) {
    const keyword = (e.detail.value || '').trim()
    this.refreshLists(keyword)
  },

  onClearSearch() {
    this.refreshLists('')
  },

  goTool(e) {
    const path = e.currentTarget.dataset.path
    const id = e.currentTarget.dataset.id
    if (id) recentsUtil.pushRecent(id)
    if (path) wx.navigateTo({ url: path })
  },

  onToggleFav(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const res = recentsUtil.toggleFavorite(id)
    wx.showToast({
      title: res.on ? '已收藏' : '已取消',
      icon: 'none',
      duration: 900
    })
    this.refreshLists(this.data.keyword)
  },

  onRemoveRecent(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    recentsUtil.removeRecent(id)
    this.refreshLists(this.data.keyword)
  },

  onClearRecents() {
    if (!this.data.recentTools || !this.data.recentTools.length) return
    const self = this
    wx.showModal({
      title: '清空最近使用',
      content: '确定清空全部最近使用记录？',
      success(res) {
        if (!res.confirm) return
        recentsUtil.clearRecents()
        self.refreshLists(self.data.keyword)
        wx.showToast({ title: '已清空', icon: 'none' })
      }
    })
  }
})