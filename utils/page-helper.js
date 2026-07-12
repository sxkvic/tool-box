/**
 * 工具页通用辅助：主题、最近使用、分享
 */
const themeUtil = require('./theme')
const recents = require('./recents')

function bindToolPage(page, toolId, shareTitle) {
  const path = toolId ? `/pages/tool-${toolId === 'random' ? 'random' : toolId}/index` : '/pages/index/index'
  // 注意：部分 id 与目录一致，统一用传入 path 更稳
  const sharePath = page._sharePath || path

  const originOnShow = page.onShow
  page.onShow = function () {
    try {
      if (toolId) recents.pushRecent(toolId)
    } catch (e) {}
    const id = themeUtil.ensureTheme()
    if (this.data && this.data.theme !== undefined && id !== this.data.theme) {
      this.setData({ theme: id })
    } else {
      themeUtil.applyChrome(id)
    }
    if (typeof originOnShow === 'function') originOnShow.call(this)
  }

  if (!page.onShareAppMessage) {
    page.onShareAppMessage = function () {
      return {
        title: shareTitle || '随身工具箱',
        path: page._sharePath || sharePath
      }
    }
  }

  if (!page.onShareTimeline) {
    page.onShareTimeline = function () {
      return { title: shareTitle || '随身工具箱 · 纯前端工具合集' }
    }
  }

  return page
}

module.exports = {
  bindToolPage
}