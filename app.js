const { AD_CONFIG } = require('./config/ads')
const theme = require('./utils/theme')

App({
  globalData: {
    adConfig: AD_CONFIG,
    theme: 'mc'
  },

  onLaunch() {
    this.globalData.theme = theme.ensureTheme()
    try {
      const ads = require('./utils/ads')
      ads.preloadInterstitial()
    } catch (e) {}
  },

  onShow() {
    this.globalData.theme = theme.ensureTheme()
  }
})