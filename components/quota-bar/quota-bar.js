const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')

Component({
  properties: {
    free: {
      type: Boolean,
      value: false
    }
  },

  data: {
    remain: 0,
    rewardExtra: 5,
    themeClass: ''
  },

  lifetimes: {
    attached() {
      this.refresh()
      this.syncTheme()
    }
  },

  pageLifetimes: {
    show() {
      this.refresh()
      this.syncTheme()
    }
  },

  methods: {
    syncTheme() {
      const id = themeUtil.getThemeId()
      this.setData({ themeClass: id === 'light' ? 'quota-light' : '' })
    },

    refresh() {
      const info = quota.getQuotaInfo()
      this.setData({
        remain: info.remain,
        rewardExtra: info.rewardExtra
      })
    },

    async onReward() {
      if (this.data.free) {
        wx.showToast({ title: '本工具不限次数', icon: 'none' })
        return
      }
      const ok = await ads.showRewardedVideo()
      if (ok) {
        const info = quota.addRewardBonus()
        this.setData({ remain: info.remain })
        this.triggerEvent('rewarded', info)
        wx.showToast({ title: `+${info.rewardExtra} 次`, icon: 'success' })
      }
    }
  }
})