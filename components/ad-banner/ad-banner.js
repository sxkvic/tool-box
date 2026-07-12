const ads = require('../../utils/ads')

Component({
  properties: {
    // 可选：外部指定广告位；不传则读 config/ads.js
    customUnitId: {
      type: String,
      value: ''
    }
  },

  data: {
    unitId: ''
  },

  lifetimes: {
    attached() {
      const id = this.properties.customUnitId || ads.getBannerUnitId() || ''
      this.setData({ unitId: id })
    }
  },

  methods: {
    onLoad() {},
    onError(e) {
      console.warn('[ad-banner]', e.detail)
      this.setData({ unitId: '' })
    }
  }
})
