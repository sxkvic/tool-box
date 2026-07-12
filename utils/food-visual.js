/**
 * 食物视觉映射：分类配色 + emoji 缩略图
 * 不引入真实图片资源，保证体积与离线可用
 */
const foodDb = require('./food-db')

const CAT_VISUAL = {
  staple: { emoji: '🍚', bg: 'linear-gradient(145deg,#fde68a,#f59e0b)', soft: 'rgba(245,158,11,0.18)', ink: '#78350f' },
  meat: { emoji: '🍗', bg: 'linear-gradient(145deg,#fda4af,#e11d48)', soft: 'rgba(225,29,72,0.16)', ink: '#881337' },
  dairy: { emoji: '🥛', bg: 'linear-gradient(145deg,#e0f2fe,#38bdf8)', soft: 'rgba(56,189,248,0.16)', ink: '#0c4a6e' },
  veg: { emoji: '🥬', bg: 'linear-gradient(145deg,#bbf7d0,#22c55e)', soft: 'rgba(34,197,94,0.16)', ink: '#14532d' },
  fruit: { emoji: '🍎', bg: 'linear-gradient(145deg,#fecaca,#f87171)', soft: 'rgba(248,113,113,0.16)', ink: '#7f1d1d' },
  snack: { emoji: '🍪', bg: 'linear-gradient(145deg,#fde68a,#d97706)', soft: 'rgba(217,119,6,0.16)', ink: '#78350f' },
  drink: { emoji: '🧋', bg: 'linear-gradient(145deg,#ddd6fe,#8b5cf6)', soft: 'rgba(139,92,246,0.16)', ink: '#4c1d95' },
  dish: { emoji: '🍜', bg: 'linear-gradient(145deg,#fed7aa,#f97316)', soft: 'rgba(249,115,22,0.16)', ink: '#7c2d12' }
}

const DEFAULT_VISUAL = { emoji: '🥗', bg: 'linear-gradient(145deg,#e2e8f0,#94a3b8)', soft: 'rgba(148,163,184,0.18)', ink: '#334155' }

// 关键词优先匹配（按常见度）
const NAME_EMOJI = [
  [/鸡胸|鸡腿|鸡翅|鸡/, '🍗'],
  [/牛奶|酸奶|纯奶|豆奶|奶茶/, '🥛'],
  [/奶酪|芝士|黄油|奶油/, '🧀'],
  [/馒头|包子|花卷|饺子|馄饨/, '🥟'],
  [/牛肉|牛排|牛腱|牛腩/, '🥩'],
  [/猪肉|排骨|五花|里脊|猪/, '🥓'],
  [/鱼|三文|鲈|带鱼|虾|蟹|海鲜|鱿鱼/, '🐟'],
  [/蛋|煎蛋|蒸蛋|茶叶蛋/, '🥚'],
  [/米饭|大米|白饭/, '🍚'],
  [/粥|燕麦/, '🥣'],
  [/面|面条|挂面|拉面|意面/, '🍝'],
  [/面包|吐司|三明治/, '🍞'],
  [/汉堡|披萨/, '🍔'],
  [/西兰花|青菜|菠菜|生菜|黄瓜|番茄|西红柿|土豆|红薯|玉米|胡萝卜|茄子|豆腐/, '🥦'],
  [/苹果|香蕉|橙|橘子|葡萄|西瓜|草莓|梨|桃|芒果|蓝莓|火龙/, '🍎'],
  [/坚果|花生|杏仁|核桃/, '🥜'],
  [/薯片|饼干|巧克力|蛋糕|甜|零食/, '🍪'],
  [/可乐|雪碧|果汁|咖啡|茶|豆浆|酒|啤酒/, '🧋'],
  [/火锅|麻辣烫|炒|炖|汤|沙拉|盖饭/, '🍜']
]

function pickEmoji(food) {
  if (!food) return DEFAULT_VISUAL.emoji
  const name = food.name || ''
  const aliases = food.aliases || ''
  // 优先匹配正式名称，避免别名里的“猪/牛”抢占包子等主食
  for (let i = 0; i < NAME_EMOJI.length; i++) {
    if (NAME_EMOJI[i][0].test(name)) return NAME_EMOJI[i][1]
  }
  for (let i = 0; i < NAME_EMOJI.length; i++) {
    if (NAME_EMOJI[i][0].test(aliases)) return NAME_EMOJI[i][1]
  }
  const cat = CAT_VISUAL[food.cat]
  return cat ? cat.emoji : DEFAULT_VISUAL.emoji
}

function getVisual(foodOrId) {
  let food = foodOrId
  if (typeof foodOrId === 'string') food = foodDb.getFoodById(foodOrId)
  if (!food || typeof food !== 'object') {
    return Object.assign({ cat: 'all' }, DEFAULT_VISUAL)
  }
  const base = CAT_VISUAL[food.cat] || DEFAULT_VISUAL
  return {
    cat: food.cat || 'all',
    emoji: pickEmoji(food),
    bg: base.bg,
    soft: base.soft,
    ink: base.ink
  }
}

function decorateFood(food) {
  if (!food) return null
  const v = getVisual(food)
  return Object.assign({}, food, {
    emoji: v.emoji,
    bg: v.bg,
    soft: v.soft,
    ink: v.ink
  })
}

function decorateList(list) {
  return (list || []).map(decorateFood).filter(Boolean)
}

module.exports = {
  CAT_VISUAL,
  getVisual,
  pickEmoji,
  decorateFood,
  decorateList
}
