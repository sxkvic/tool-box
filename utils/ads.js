const { AD_CONFIG } = require('../config/ads')

let interstitialAd = null
let rewardedVideoAd = null

function hasUnitId(id) {
  return !!(id && String(id).trim() && !String(id).includes('xxxx'))
}

function isAdReady() {
  return AD_CONFIG.enabled
}

/** 预加载插屏 */
function preloadInterstitial() {
  if (!isAdReady() || !hasUnitId(AD_CONFIG.interstitial.unitId)) return
  if (!wx.createInterstitialAd) return

  try {
    interstitialAd = wx.createInterstitialAd({
      adUnitId: AD_CONFIG.interstitial.unitId
    })
    interstitialAd.onError((err) => {
      console.warn('[ads] interstitial error', err)
    })
  } catch (e) {
    console.warn('[ads] createInterstitialAd fail', e)
  }
}

/**
 * 展示插屏（建议在「出结果」后调用，避免首页强弹）
 * @returns {Promise<boolean>} 是否成功拉起
 */
function showInterstitial() {
  return new Promise((resolve) => {
    if (!isAdReady() || !hasUnitId(AD_CONFIG.interstitial.unitId)) {
      resolve(false)
      return
    }
    if (!interstitialAd) {
      preloadInterstitial()
    }
    if (!interstitialAd) {
      resolve(false)
      return
    }
    interstitialAd
      .show()
      .then(() => resolve(true))
      .catch(() => {
        // 未就绪时尝试 load 再 show
        interstitialAd
          .load()
          .then(() => interstitialAd.show())
          .then(() => resolve(true))
          .catch((err) => {
            console.warn('[ads] interstitial show fail', err)
            resolve(false)
          })
      })
  })
}

/**
 * 展示激励视频
 * @returns {Promise<boolean>} true=完整观看
 */
function showRewardedVideo() {
  return new Promise((resolve) => {
    if (!isAdReady() || !hasUnitId(AD_CONFIG.rewarded.unitId)) {
      wx.showToast({ title: '广告位未配置', icon: 'none' })
      resolve(false)
      return
    }
    if (!wx.createRewardedVideoAd) {
      wx.showToast({ title: '当前基础库不支持', icon: 'none' })
      resolve(false)
      return
    }

    if (!rewardedVideoAd) {
      try {
        rewardedVideoAd = wx.createRewardedVideoAd({
          adUnitId: AD_CONFIG.rewarded.unitId
        })
        rewardedVideoAd.onError((err) => {
          console.warn('[ads] rewarded error', err)
        })
      } catch (e) {
        resolve(false)
        return
      }
    }

    let settled = false
    const onClose = (res) => {
      if (settled) return
      settled = true
      rewardedVideoAd.offClose(onClose)
      const ok = !!(res && res.isEnded)
      if (!ok) {
        wx.showToast({ title: '需完整观看才能领取', icon: 'none' })
      }
      resolve(ok)
    }
    rewardedVideoAd.onClose(onClose)

    rewardedVideoAd
      .show()
      .catch(() => {
        rewardedVideoAd
          .load()
          .then(() => rewardedVideoAd.show())
          .catch((err) => {
            console.warn('[ads] rewarded show fail', err)
            rewardedVideoAd.offClose(onClose)
            wx.showToast({ title: '广告暂时无法播放', icon: 'none' })
            resolve(false)
          })
      })
  })
}

function getBannerUnitId() {
  if (!isAdReady() || !hasUnitId(AD_CONFIG.banner.unitId)) return ''
  return AD_CONFIG.banner.unitId
}

module.exports = {
  preloadInterstitial,
  showInterstitial,
  showRewardedVideo,
  getBannerUnitId,
  AD_CONFIG
}
