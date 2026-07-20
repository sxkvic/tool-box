const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const medHub = require('../../utils/med')

const GENDER_OPTS = medHub.GENDERS
const TEMP_SORT_KEY = 'med_temp_sort_v1'

function readTempSort() {
  const v = storage.get(TEMP_SORT_KEY, 'desc')
  return v === 'asc' ? 'asc' : 'desc'
}

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

try {
  themeUtil.ensureTheme()
} catch (e) {}

function defaultDoseParts() {
  const now = new Date()
  return {
    date: medHub.formatDate(now),
    time: medHub.formatTime(now)
  }
}

function parseDoseParts(dateStr, timeStr) {
  if (!dateStr) return Date.now()
  const t = timeStr || '00:00'
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const tm = String(t).match(/^(\d{1,2}):(\d{2})$/)
  if (!m || !tm) return Date.now()
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(tm[1]),
    Number(tm[2]),
    0,
    0
  )
  const ts = d.getTime()
  return Number.isNaN(ts) ? Date.now() : ts
}

Page({
  data: (function () {
    const chrome = themeUtil.getChrome(readTheme())
    const parts = defaultDoseParts()
    const tParts = defaultDoseParts()
    return {
      theme: chrome.theme,
      chromeBg: chrome.chromeBg,
      navBg: chrome.navBg,
      navFront: chrome.navFront,
      bgTextStyle: chrome.bgTextStyle,

      persons: [],
      currentPersonId: '',
      currentPerson: null,
      medList: [],
      medPreviewGroups: [],
      medCount: 0,
      medHasMore: false,
      tempList: [],
      chartSeries: [],
      tempPreviewGroups: [],
      tempCount: 0,
      tempHasMore: false,
      tempSort: 'desc',
      tempSortLabel: '时间倒序',

      formPersonName: '',
      formAge: '',
      formGender: 'male',
      formGenderIndex: 0,
      genderOptions: GENDER_OPTS,
      formGenderLabel: '男',
      personFocus: false,

      formMedicine: '',
      formAdvice: '',
      formDate: parts.date,
      formTime: parts.time,
      formInterval: '',

      formTemp: '',
      formTempDate: tParts.date,
      formTempTime: tParts.time,
      tempFocus: false,

      sheetShow: false,
      sheetKind: '',
      keyboardHeight: 0,
      sheetPopupStyle:
        'background: linear-gradient(180deg, #121a2c 0%, #0a101c 100%); max-height: 85vh; overflow: hidden; padding: 0;',

      chartW: 300,
      chartH: 160
    }
  })(),

  onLoad() {
    recents.pushRecent('med')
    const tempSort = readTempSort()
    this.setData({
      tempSort,
      tempSortLabel: tempSort === 'asc' ? '时间升序' : '时间倒序'
    })
    this.syncTheme()
    this.refresh()
  },

  onShow() {
    this.syncTheme()
    this.refresh()
    this.startRemainTimer()
    this._bindKeyboardListener()
  },

  onHide() {
    this.stopRemainTimer()
    this._unbindKeyboardListener()
  },

  onUnload() {
    this.stopRemainTimer()
    this._unbindKeyboardListener()
    this._clearFocusTimer()
    this._clearKbFallbackTimer()
  },

  onShareAppMessage() {
    const p = this.data.currentPerson
    return {
      title: p ? `健康记录 · ${p.name}` : '健康记录 - 随身工具箱',
      path: '/pages/tool-med/index'
    }
  },

  onShareTimeline() {
    return { title: '健康记录 · 随身工具箱' }
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    const chrome = themeUtil.getChrome(id)
    if (id !== this.data.theme) {
      this.setData({
        theme: chrome.theme,
        chromeBg: chrome.chromeBg,
        navBg: chrome.navBg,
        navFront: chrome.navFront,
        bgTextStyle: chrome.bgTextStyle,
        sheetPopupStyle: this._sheetPopupStyle(this.data.keyboardHeight || 0)
      })
    } else {
      themeUtil.applyChrome(id)
    }
  },

  startRemainTimer() {
    this.stopRemainTimer()
    this._remainTimer = setInterval(() => this.refreshListOnly(), 30000)
  },

  stopRemainTimer() {
    if (this._remainTimer) {
      clearInterval(this._remainTimer)
      this._remainTimer = null
    }
  },

  refresh() {
    const state = medHub.load()
    // 迁移后落盘一次，保证后续都是新结构
    medHub.save(state)
    const now = Date.now()
    const persons = state.persons.map((p) => medHub.decoratePerson(p, state, now))
    let currentPersonId = this.data.currentPersonId
    if (currentPersonId && !persons.some((p) => p.id === currentPersonId)) {
      currentPersonId = ''
    }
    // 默认选中首位
    if (!currentPersonId && persons.length) {
      currentPersonId = persons[0].id
    }
    const currentPerson = persons.find((p) => p.id === currentPersonId) || null
    // 用药：主页最多 3 条，按天分组；更多进明细页
    const MED_PREVIEW = 3
    const medList = currentPerson
      ? medHub.getMedSeries(medHub.medsOfPerson(state, currentPerson.id), now, {
          order: 'desc'
        })
      : []
    const medPreviewGroups = medHub.groupMedsByDate(medList.slice(0, MED_PREVIEW), {
      order: 'desc'
    })

    const tempSort = this.data.tempSort === 'asc' ? 'asc' : 'desc'
    // 曲线：该成员全部体温（时间升序）；列表：可切换排序，主页最多 5 条
    const TEMP_PREVIEW = 5
    const personTemps = currentPerson
      ? medHub.tempsOfPerson(state, currentPerson.id)
      : []
    const chartSeries = medHub.getTempSeries(personTemps, { order: 'asc' })
    const tempList = medHub.getTempSeries(personTemps, { order: tempSort })
    const previewList = tempList.slice(0, TEMP_PREVIEW)
    const tempPreviewGroups = medHub.groupTempsByDate(previewList, { order: tempSort })

    this.setData({
      persons,
      currentPersonId,
      currentPerson,
      medList,
      medPreviewGroups,
      medCount: medList.length,
      medHasMore: medList.length > MED_PREVIEW,
      tempList,
      chartSeries,
      tempPreviewGroups,
      tempCount: tempList.length,
      tempHasMore: tempList.length > TEMP_PREVIEW,
      tempSort,
      tempSortLabel: tempSort === 'asc' ? '时间升序' : '时间倒序'
    })
    this.measureAndDraw()
  },

  refreshListOnly() {
    const state = medHub.load()
    const now = Date.now()
    const persons = state.persons.map((p) => medHub.decoratePerson(p, state, now))
    const currentPerson = persons.find((p) => p.id === this.data.currentPersonId) || null
    const MED_PREVIEW = 3
    const medList = currentPerson
      ? medHub.getMedSeries(medHub.medsOfPerson(state, currentPerson.id), now, {
          order: 'desc'
        })
      : []
    const medPreviewGroups = medHub.groupMedsByDate(medList.slice(0, MED_PREVIEW), {
      order: 'desc'
    })
    this.setData({
      persons,
      currentPerson,
      medList,
      medPreviewGroups,
      medCount: medList.length,
      medHasMore: medList.length > MED_PREVIEW
    })
  },

  measureAndDraw() {
    const self = this
    const h = self.data.chartH || 160
    if (!self.data.currentPerson) return
    // 弹层打开时 canvas 已卸载，不绘制
    if (self.data.sheetShow) return
    wx.createSelectorQuery()
      .in(this)
      .select('.chart-wrap')
      .boundingClientRect((rect) => {
        if (self.data.sheetShow) return
        let w = rect && rect.width ? Math.floor(rect.width) : 0
        if (!w) {
          try {
            const sys = wx.getSystemInfoSync()
            const rpx = (sys.windowWidth || 375) / 750
            w = Math.floor((sys.windowWidth || 375) - 48 * rpx * 2)
          } catch (e) {
            w = self.data.chartW || 300
          }
        }
        if (w < 120) w = 120
        if (w !== self.data.chartW) {
          self.setData({ chartW: w }, () => self.drawChart(w, h))
        } else {
          self.drawChart(w, h)
        }
      })
      .exec()
  },

  drawChart(w, h) {
    if (!this.data.currentPerson || this.data.sheetShow) return
    // 必须用该成员全部体温（升序），与列表「最多 5 条」无关
    let series = this.data.chartSeries
    if (!Array.isArray(series) || !series.length) {
      const state = medHub.load()
      series = medHub.getTempSeries(
        medHub.tempsOfPerson(state, this.data.currentPerson.id),
        { order: 'asc' }
      )
    }
    medHub.drawTempChart('tempChart', this, series, this.data.theme, {
      w: w || this.data.chartW,
      h: h || this.data.chartH
    })
  },

  onSetTempSort(e) {
    const order = e.currentTarget.dataset.order === 'asc' ? 'asc' : 'desc'
    if (order === this.data.tempSort) return
    storage.set(TEMP_SORT_KEY, order)
    this.setData(
      {
        tempSort: order,
        tempSortLabel: order === 'asc' ? '时间升序' : '时间倒序'
      },
      () => this.refresh()
    )
  },

  goMedMore() {
    const personId = this.data.currentPersonId
    if (!personId) return
    wx.navigateTo({
      url: `/pages/tool-med/meds?personId=${encodeURIComponent(personId)}&sort=desc`
    })
  },

  goTempMore() {
    const personId = this.data.currentPersonId
    if (!personId) return
    const sort = this.data.tempSort === 'asc' ? 'asc' : 'desc'
    wx.navigateTo({
      url: `/pages/tool-med/temps?personId=${encodeURIComponent(personId)}&sort=${sort}`
    })
  },

  preventMove() {},

  _clearFocusTimer() {
    if (this._focusTimer) {
      clearTimeout(this._focusTimer)
      this._focusTimer = null
    }
  },

  _clearKbFallbackTimer() {
    if (this._kbFallbackTimer) {
      clearTimeout(this._kbFallbackTimer)
      this._kbFallbackTimer = null
    }
  },

  /** van-popup 内联样式：深色底 + 限高 + 键盘抬升，延续 Mission Control */
  _sheetPopupStyle(keyboardHeight) {
    const h = Math.max(0, Number(keyboardHeight) || 0)
    const theme = this.data.theme || 'mc'
    const bg =
      theme === 'light'
        ? 'linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%)'
        : 'linear-gradient(180deg, #121a2c 0%, #0a101c 100%)'
    let maxH = '85vh'
    try {
      const sys = wx.getSystemInfoSync() || {}
      const winH = sys.windowHeight || 0
      if (winH > 0) {
        maxH = Math.max(240, Math.floor(winH * 0.88 - h)) + 'px'
      }
    } catch (e) {}
    // 覆盖 Vant 默认白底，保持圆角与项目深空风格
    return [
      'background: ' + bg + ' !important',
      'background-color: transparent !important',
      'max-height: ' + maxH,
      'bottom: ' + h + 'px',
      'overflow: hidden',
      'padding: 0',
      'box-sizing: border-box',
      'border-radius: 24px 24px 0 0'
    ].join(';')
  },

  _applyKeyboardHeight(h) {
    if (!this.data.sheetShow) return
    const next = Math.max(0, Number(h) || 0)
    if (next === this.data.keyboardHeight) return
    this.setData({
      keyboardHeight: next,
      sheetPopupStyle: this._sheetPopupStyle(next)
    })
  },

  /** 全局键盘高度（真机比 input 的 keyboardheightchange 更稳） */
  _bindKeyboardListener() {
    if (this._kbBound) return
    if (typeof wx.onKeyboardHeightChange !== 'function') return
    this._kbHandler = (res) => {
      if (!this.data.sheetShow) return
      this._applyKeyboardHeight(res && res.height)
    }
    try {
      wx.onKeyboardHeightChange(this._kbHandler)
      this._kbBound = true
    } catch (e) {}
  },

  _unbindKeyboardListener() {
    if (!this._kbBound) return
    try {
      if (typeof wx.offKeyboardHeightChange === 'function' && this._kbHandler) {
        wx.offKeyboardHeightChange(this._kbHandler)
      }
    } catch (e) {}
    this._kbBound = false
    this._kbHandler = null
  },

  onKeyboardHeight(e) {
    if (!this.data.sheetShow) return
    const h = (e && e.detail && e.detail.height) || 0
    this._applyKeyboardHeight(h)
  },

  /**
   * 失焦兜底：真机部分机型收起键盘不回调 height=0。
   * 延迟稍长，避免在「姓名→年龄」切换输入框时误回落。
   */
  onSheetFieldBlur() {
    this._clearKbFallbackTimer()
    this._kbFallbackTimer = setTimeout(() => {
      if (!this.data.sheetShow) return
      // 若期间全局监听已把高度置 0，则无需处理
      if (this.data.keyboardHeight <= 0) return
      // 仍抬着但已无键盘事件时，强制回落
      this._applyKeyboardHeight(0)
    }, 360)
  },

  onSelectPerson(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.currentPersonId) return
    this.setData({ currentPersonId: id }, () => this.refresh())
  },

  /** 长按：设为默认（排到首位） */
  onPersonSetDefault(e) {
    const index = Number(e.currentTarget.dataset.index)
    const id = e.currentTarget.dataset.id
    if (!id || !Number.isInteger(index) || index <= 0) {
      if (index === 0) {
        wx.showToast({ title: '已是默认成员', icon: 'none' })
      }
      return
    }
    const next = medHub.movePerson(medHub.load(), index, 0)
    medHub.save(next)
    this.setData({ currentPersonId: id }, () => {
      wx.showToast({ title: '已设为默认', icon: 'none' })
      this.refresh()
    })
  },

  /**
   * 打开 Vant 底部弹层（动画由 van-popup 负责）
   */
  _openSheet(kind, extra) {
    this._clearFocusTimer()
    this._clearKbFallbackTimer()
    try {
      wx.hideKeyboard()
    } catch (e) {}
    const base = Object.assign(
      {
        sheetShow: true,
        sheetKind: kind,
        keyboardHeight: 0,
        sheetPopupStyle: this._sheetPopupStyle(0),
        tempFocus: false,
        personFocus: false
      },
      extra || {}
    )
    this.setData(base)
  },

  openPersonSheet() {
    this._openSheet('person', {
      formPersonName: '',
      formAge: '',
      formGender: 'male',
      formGenderIndex: 0,
      formGenderLabel: '男'
    })
  },

  openMedSheet() {
    if (!this.data.currentPersonId) {
      wx.showToast({ title: '请先添加成员', icon: 'none' })
      return
    }
    const parts = defaultDoseParts()
    this._openSheet('med', {
      formMedicine: '',
      formAdvice: '',
      formDate: parts.date,
      formTime: parts.time,
      formInterval: ''
    })
  },

  openTempSheet() {
    if (!this.data.currentPersonId) {
      wx.showToast({ title: '请先添加成员', icon: 'none' })
      return
    }
    const tParts = defaultDoseParts()
    this._openSheet('temp', {
      formTemp: '',
      formTempDate: tParts.date,
      formTempTime: tParts.time,
      tempFocus: false
    })
    // 等 van-popup 进场后再聚焦
    this._focusTimer = setTimeout(() => {
      if (!this.data.sheetShow || this.data.sheetKind !== 'temp') return
      this.setData({ tempFocus: true })
    }, 320)
  },

  closeSheet() {
    this._clearFocusTimer()
    this._clearKbFallbackTimer()
    try {
      wx.hideKeyboard()
    } catch (e) {}
    this.setData({
      sheetShow: false,
      keyboardHeight: 0,
      sheetPopupStyle: this._sheetPopupStyle(0),
      tempFocus: false,
      personFocus: false
    })
  },

  /** van-popup 离场动画结束：恢复 canvas */
  onSheetAfterLeave() {
    this.setData({ sheetKind: '' })
    setTimeout(() => this.measureAndDraw(), 30)
  },

  onPersonName(e) {
    this.setData({ formPersonName: e.detail.value })
  },
  onAge(e) {
    this.setData({ formAge: e.detail.value })
  },
  onGender(e) {
    const idx = Number(e.detail.value) || 0
    const opt = GENDER_OPTS[idx] || GENDER_OPTS[0]
    this.setData({
      formGenderIndex: idx,
      formGender: opt.id,
      formGenderLabel: opt.label
    })
  },
  onMedicine(e) {
    this.setData({ formMedicine: e.detail.value })
  },
  onAdvice(e) {
    this.setData({ formAdvice: e.detail.value })
  },
  onDate(e) {
    this.setData({ formDate: e.detail.value })
  },
  onTime(e) {
    this.setData({ formTime: e.detail.value })
  },
  onInterval(e) {
    this.setData({ formInterval: e.detail.value })
  },
  onTempInput(e) {
    this.setData({ formTemp: e.detail.value })
  },
  onTempDate(e) {
    this.setData({ formTempDate: e.detail.value })
  },
  onTempTime(e) {
    this.setData({ formTempTime: e.detail.value })
  },

  onSavePerson() {
    const name = (this.data.formPersonName || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }
    const age =
      this.data.formAge === '' || this.data.formAge == null
        ? null
        : medHub.parseAge(this.data.formAge)
    if (this.data.formAge !== '' && this.data.formAge != null && age == null) {
      wx.showToast({ title: '年龄不合法', icon: 'none' })
      return
    }
    const res = medHub.addPerson(medHub.load(), {
      name,
      age,
      gender: this.data.formGender
    })
    if (!res.ok) {
      wx.showToast({ title: '保存失败', icon: 'none' })
      return
    }
    medHub.save(res.state)
    // 新成员在末尾，选中方便继续录入；合并同名则选中该成员
    this.setData({ currentPersonId: res.person.id })
    this.closeSheet()
    wx.showToast({ title: res.merged ? '已更新同名成员' : '已添加', icon: 'success' })
    this.refresh()
  },

  onAddMed() {
    const personId = this.data.currentPersonId
    if (!personId) {
      wx.showToast({ title: '请先选择成员', icon: 'none' })
      return
    }
    const medicineName = (this.data.formMedicine || '').trim()
    if (!medicineName) {
      wx.showToast({ title: '请填写药品名称', icon: 'none' })
      return
    }
    // 间隔可选；有填则校验为正数小时
    const intervalRaw = (this.data.formInterval || '').trim()
    let intervalHours = null
    if (intervalRaw !== '') {
      intervalHours = medHub.parseIntervalHours(intervalRaw)
      if (intervalHours == null) {
        wx.showToast({ title: '间隔需为正数小时', icon: 'none' })
        return
      }
    }
    const doseTime = parseDoseParts(this.data.formDate, this.data.formTime)
    const advice = (this.data.formAdvice || '').trim()
    const res = medHub.addMed(medHub.load(), {
      personId,
      medicineName,
      advice,
      doseTime,
      intervalHours
    })
    if (!res.ok) {
      wx.showToast({ title: '保存失败', icon: 'none' })
      return
    }
    medHub.save(res.state)
    this.closeSheet()
    wx.showToast({ title: '已记用药', icon: 'success' })
    this.refresh()
  },

  onAddTemp() {
    const personId = this.data.currentPersonId
    if (!personId) {
      wx.showToast({ title: '请先选择成员', icon: 'none' })
      return
    }
    const value = medHub.parseTemp(this.data.formTemp)
    if (value == null) {
      wx.showToast({ title: '体温需在 30–45℃', icon: 'none' })
      return
    }
    const ts = parseDoseParts(this.data.formTempDate, this.data.formTempTime)
    const res = medHub.addTemp(medHub.load(), { personId, value, ts })
    if (!res.ok) {
      wx.showToast({ title: '保存失败', icon: 'none' })
      return
    }
    medHub.save(res.state)
    this.closeSheet()
    wx.showToast({ title: '已记体温', icon: 'success' })
    this.refresh()
  },

  onDeleteMed(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const self = this
    wx.showModal({
      title: '删除用药',
      content: '确定删除这条用药？',
      success(res) {
        if (!res.confirm) return
        medHub.save(medHub.removeMed(medHub.load(), id))
        wx.showToast({ title: '已删除', icon: 'none' })
        self.refresh()
      }
    })
  },

  onDeleteTemp(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const self = this
    wx.showModal({
      title: '删除体温',
      content: '确定删除这条体温记录？',
      success(res) {
        if (!res.confirm) return
        medHub.save(medHub.removeTemp(medHub.load(), id))
        wx.showToast({ title: '已删除', icon: 'none' })
        self.refresh()
      }
    })
  },

  onDeletePerson() {
    const p = this.data.currentPerson
    if (!p) return
    const self = this
    wx.showModal({
      title: '删除成员',
      content: `将删除「${p.name}」及其全部用药与体温记录`,
      success(res) {
        if (!res.confirm) return
        medHub.save(medHub.removePerson(medHub.load(), p.id))
        self.setData({ currentPersonId: '' })
        wx.showToast({ title: '已删除', icon: 'none' })
        self.refresh()
      }
    })
  }
})
