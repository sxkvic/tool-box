const themeUtil = require('../../utils/theme')

Component({
  properties: {
    name: {
      type: String,
      value: 'unit'
    },
    size: {
      type: Number,
      value: 40
    }
  },
  data: {
    sizeRpx: 40,
    isDice: false,
    themeClass: ''
  },
  observers: {
    'name, size'(name, size) {
      const n = Number(size)
      this.setData({
        sizeRpx: n > 0 ? n : 40,
        isDice: name === 'random' || name === 'dice'
      })
    }
  },
  lifetimes: {
    attached() {
      this.syncTheme()
      const n = Number(this.data.size)
      this.setData({
        sizeRpx: n > 0 ? n : 40,
        isDice: this.data.name === 'random' || this.data.name === 'dice'
      })
    }
  },
  pageLifetimes: {
    show() {
      this.syncTheme()
    }
  },
  methods: {
    syncTheme() {
      const id = themeUtil.getThemeId()
      this.setData({ themeClass: id === 'light' ? 'ico-light' : '' })
    }
  }
})