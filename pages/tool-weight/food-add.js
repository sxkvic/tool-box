const themeUtil = require('../../utils/theme')
const weightHub = require('../../utils/weight')
const dietHub = require('../../utils/diet')
const foodDb = require('../../utils/food-db')
const foodVisual = require('../../utils/food-visual')

const QUICK_GRAMS = [50, 100, 150, 200, 250, 300]

function readTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

function mealName(id) {
  const m = dietHub.MEALS.find((x) => x.id === id)
  return m ? m.name : '加餐'
}

Page({
  data: {
    theme: readTheme(),
    date: '',
    meal: 'snack',
    mealName: '加餐',
    meals: dietHub.MEALS,
    keyword: '',
    cats: [],
    cat: 'all',
    list: [],
    recent: [],
    selected: null,
    grams: '',
    preview: null,
    quickGrams: QUICK_GRAMS,
    saving: false,
    saveLabel: '加入加餐'
  },

  onLoad(query) {
    const meal = (query && query.meal) || 'snack'
    const date = (query && query.date) || weightHub.todayStr()
    this._dietState = dietHub.load()
    const name = mealName(meal)
    this.setData({
      meal,
      mealName: name,
      date,
      saveLabel: '加入' + name
    })
    this.setData({
      cats: foodDb.FOOD_CATS.map((c) => {
        const v = foodVisual.CAT_VISUAL[c.id]
        return {
          id: c.id,
          name: c.name,
          emoji: c.id === 'all' ? '✨' : (v ? v.emoji : '🥗')
        }
      })
    })
    this.syncTheme()
    this.refreshList()
  },

  onShow() {
    this.syncTheme()
  },

  syncTheme() {
    const id = themeUtil.ensureTheme()
    if (id !== this.data.theme) this.setData({ theme: id })
    else themeUtil.applyChrome(id)
  },

  refreshList() {
    const keyword = this.data.keyword
    const cat = this.data.cat
    const list = foodDb.searchFoods(keyword, cat).slice(0, 80).map((f) => {
      const v = foodVisual.getVisual(f)
      return {
        id: f.id,
        name: f.name,
        cat: f.cat,
        line: f.kcal + ' kcal/100g · 蛋白' + f.protein + ' 脂' + f.fat + ' 碳' + f.carb,
        portion: f.portion || 100,
        emoji: v.emoji,
        bg: v.bg
      }
    })
    const recent = dietHub.recentFoods(this._dietState || dietHub.load()).map((f) => {
      const v = foodVisual.getVisual(f)
      return {
        id: f.id,
        name: f.name,
        line: f.kcal + ' kcal/100g',
        portion: f.portion || 100,
        emoji: v.emoji,
        bg: v.bg
      }
    })
    this.setData({ list, recent })
  },

  onKeyword(e) {
    this.setData({ keyword: e.detail.value })
    this.refreshList()
  },

  onClearKeyword() {
    this.setData({ keyword: '' })
    this.refreshList()
  },

  onCat(e) {
    const cat = e.currentTarget.dataset.id
    if (!cat || cat === this.data.cat) return
    this.setData({ cat })
    this.refreshList()
  },

  onMeal(e) {
    const meal = e.currentTarget.dataset.id
    if (!meal) return
    const name = mealName(meal)
    this.setData({ meal, mealName: name, saveLabel: '加入' + name })
  },

  pickFood(e) {
    const id = e.currentTarget.dataset.id
    const food = foodDb.getFoodById(id)
    if (!food) return
    const grams = String(food.portion || 100)
    const preview = foodDb.scaleNutrition(food, Number(grams))
    const v = foodVisual.getVisual(food)
    this.setData({
      selected: {
        id: food.id,
        name: food.name,
        per100: '每100g · ' + food.kcal + 'kcal P' + food.protein + ' F' + food.fat + ' C' + food.carb,
        emoji: v.emoji,
        bg: v.bg
      },
      grams,
      preview
    })
  },

  clearSelected() {
    this.setData({ selected: null, grams: '', preview: null })
  },

  onGrams(e) {
    const grams = e.detail.value
    this.setData({ grams })
    this.updatePreview(grams)
  },

  onQuickGram(e) {
    const g = e.currentTarget.dataset.g
    if (g == null) return
    const grams = String(g)
    this.setData({ grams })
    this.updatePreview(grams)
  },

  updatePreview(grams) {
    const sel = this.data.selected
    if (!sel) return
    const food = foodDb.getFoodById(sel.id)
    if (!food) return
    const n = Number(grams)
    if (!Number.isFinite(n) || n <= 0) {
      this.setData({ preview: null })
      return
    }
    this.setData({ preview: foodDb.scaleNutrition(food, n) })
  },

  onSave() {
    if (this.data.saving) return
    const sel = this.data.selected
    if (!sel) {
      wx.showToast({ title: '请先选择食物', icon: 'none' })
      return
    }
    const grams = Number(this.data.grams)
    if (!Number.isFinite(grams) || grams <= 0) {
      wx.showToast({ title: '请输入克重', icon: 'none' })
      return
    }
    this.setData({ saving: true, saveLabel: '添加中…' })
    try {
      const state = dietHub.addEntry(this._dietState || dietHub.load(), {
        foodId: sel.id,
        grams,
        meal: this.data.meal,
        date: this.data.date
      })
      this._dietState = state
      wx.showToast({ title: '已添加', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 350)
    } catch (e) {
      wx.showToast({ title: '添加失败，请检查克重', icon: 'none' })
      this.setData({ saving: false, saveLabel: '加入' + this.data.mealName })
    }
  }
})
