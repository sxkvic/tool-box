/**
 * 流量主广告位配置
 * 开通条件：小程序累计 UV ≥ 500（以公众平台显示为准）
 * 开通路径：公众平台 → 推广 → 流量主 → 新建广告位
 *
 * 把下面的占位符替换成你后台创建的广告位 ID 后，广告才会展示。
 * 未填写时页面会隐藏广告，不影响工具功能。
 */
const AD_CONFIG = {
  // 是否启用广告（开发调试可先设 false）
  enabled: true,

  banner: {
    unitId: ''
  },

  interstitial: {
    unitId: ''
  },

  rewarded: {
    unitId: ''
  },

  // 每日免费使用次数（仅 limited 工具扣次）
  dailyFreeQuota: 12,

  // 看一次激励视频额外获得的次数
  rewardExtraQuota: 5
}

module.exports = {
  AD_CONFIG
}