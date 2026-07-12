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
    navBg: '#eef2f7',
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

function applyChrome(themeId) {
  const t = THEMES[themeId] || THEMES.mc
  try {
    wx.setNavigationBarColor({
      frontColor: t.navFront,
      backgroundColor: t.navBg,
      animation: { duration: 180, timingFunc: 'easeIn' }
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
  applyChrome(id)
  try {
    const app = getApp()
    if (app && app.globalData) app.globalData.theme = id
  } catch (e) {}
  return id
}

function ensureTheme() {
  const id = getThemeId()
  applyChrome(id)
  return id
}

module.exports = {
  THEMES,
  getThemeId,
  getTheme,
  getThemeOptions,
  setTheme,
  applyChrome,
  ensureTheme
}
