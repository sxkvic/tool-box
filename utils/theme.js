/**
 * 主题管理
 * mc    深空控制台（Mission Control）
 * light 纯白极简（Clean Lab）
 */
const THEMES = {
  mc: {
    id: 'mc',
    name: '深空',
    desc: 'SpaceX · HUD',
    navBg: '#05070c',
    navFront: '#ffffff',
    bg: '#05070c'
  },
  light: {
    id: 'light',
    name: '纯白',
    desc: 'Clean Lab',
    navBg: '#f5f7fb',
    navFront: '#000000',
    bg: '#eef2f7'
  }
}

const STORAGE_KEY = 'app_theme'

function getThemeId() {
  try {
    const id = wx.getStorageSync(STORAGE_KEY)
    return THEMES[id] ? id : 'mc'
  } catch (e) {
    return 'mc'
  }
}

function getTheme() {
  return THEMES[getThemeId()]
}

function getThemeOptions() {
  return [
    { id: 'mc', name: THEMES.mc.name, desc: THEMES.mc.desc },
    { id: 'light', name: THEMES.light.name, desc: THEMES.light.desc }
  ]
}

/**
 * 同步导航栏/窗口底色
 * @param {string} themeId
 * @param {{animate?: boolean}} [opts] 仅手动切换主题时开动画；刷新/进页默认无动画，避免顶部闪黑
 */
function applyChrome(themeId, opts) {
  const t = THEMES[themeId] || THEMES.mc
  const animate = !!(opts && opts.animate)
  try {
    wx.setNavigationBarColor({
      frontColor: t.navFront,
      backgroundColor: t.navBg,
      animation: animate
        ? { duration: 180, timingFunc: 'easeIn' }
        : { duration: 0, timingFunc: 'linear' }
    })
  } catch (e) {}
  try {
    wx.setBackgroundColor({
      backgroundColor: t.bg,
      backgroundColorTop: t.bg,
      backgroundColorBottom: t.bg
    })
  } catch (e) {}
  try {
    wx.setBackgroundTextStyle({
      textStyle: themeId === 'light' ? 'dark' : 'light'
    })
  } catch (e) {}
}

function setTheme(themeId) {
  const id = THEMES[themeId] ? themeId : 'mc'
  try {
    wx.setStorageSync(STORAGE_KEY, id)
  } catch (e) {}
  // 用户主动切换：保留轻微过渡
  applyChrome(id, { animate: true })
  try {
    const app = getApp()
    if (app && app.globalData) app.globalData.theme = id
  } catch (e) {}
  return id
}

function ensureTheme() {
  const id = getThemeId()
  applyChrome(id, { animate: false })
  return id
}

/** 给页面 data / page-meta 用的色值，首帧即可对齐，减少刷新闪色 */
function getChrome(themeId) {
  const id = THEMES[themeId] ? themeId : getThemeId()
  const t = THEMES[id] || THEMES.mc
  return {
    theme: id,
    chromeBg: t.bg,
    navBg: t.navBg,
    navFront: t.navFront,
    bgTextStyle: id === 'light' ? 'dark' : 'light'
  }
}

module.exports = {
  THEMES,
  getThemeId,
  getTheme,
  getThemeOptions,
  getChrome,
  setTheme,
  applyChrome,
  ensureTheme
}