Component({
  options: {
    addGlobalClass: true,
    styleIsolation: 'apply-shared'
  },

  properties: {
    title: { type: String, value: '' },
    theme: { type: String, value: 'mc' },
    background: { type: String, value: '' },
    color: { type: String, value: '' },
    /** back | home | none */
    left: { type: String, value: 'back' },
    fixed: { type: Boolean, value: true }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    totalHeight: 64,
    wrapStyle: 'background:#05070c;color:#ffffff;',
    titleColor: '#ffffff',
    showBack: true,
    showHome: false
  },

  observers: {
    'theme, background, color, left': function () {
      this.applyVisual()
    }
  },

  lifetimes: {
    attached() {
      this.measure()
      this.applyVisual()
    },
    ready() {
      this.measure()
    }
  },

  methods: {
    measure() {
      let status = 20
      let nav = 44
      try {
        const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
        status = (sys && sys.statusBarHeight) || 20
      } catch (e) {}
      try {
        const mb = wx.getMenuButtonBoundingClientRect()
        if (mb && mb.height && mb.top != null) {
          // 与右侧胶囊垂直居中对齐
          nav = Math.max(40, (mb.top - status) * 2 + mb.height)
        }
      } catch (e) {}
      const total = status + nav
      if (
        total !== this.data.totalHeight ||
        status !== this.data.statusBarHeight ||
        nav !== this.data.navBarHeight
      ) {
        this.setData({
          statusBarHeight: status,
          navBarHeight: nav,
          totalHeight: total
        })
      }
    },

    applyVisual() {
      const theme = this.data.theme || 'mc'
      const light = theme === 'light'
      const bg = this.data.background || (light ? '#f5f7fb' : '#05070c')
      const fg = this.data.color || (light ? '#0f172a' : '#ffffff')
      const left = this.data.left || 'back'
      this.setData({
        wrapStyle: 'background:' + bg + ';color:' + fg + ';',
        titleColor: fg,
        showBack: left === 'back',
        showHome: left === 'home'
      })
    },

    onBack() {
      const pages = getCurrentPages()
      if (pages && pages.length > 1) {
        wx.navigateBack({ delta: 1 })
        return
      }
      wx.reLaunch({ url: '/pages/index/index' })
    },

    onHome() {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  }
})