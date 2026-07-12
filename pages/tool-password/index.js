const quota = require('../../utils/quota')
const ads = require('../../utils/ads')
const themeUtil = require('../../utils/theme')
const recents = require('../../utils/recents')
const storage = require('../../utils/storage')
const { copyText, clamp } = require('../../utils/util')

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGIT = '0123456789'
const SYMBOL = '!@#$%^&*()-_=+[]{}|;:,.<>?/~`'
const STORE_KEY = 'password_state_v1'

/**
 * 密码随机源
 * 1) 优先原生加密随机（Web Crypto / 微信 getRandomValues）
 * 2) 多源熵播种 + xoshiro 风格 PRNG + 拒绝采样
 * 注意：seed 预热绝不能再走 nextU32，否则未标记 _seeded 时会递归炸栈
 */
const _state = [0x9e3779b9, 0x243f6a88, 0xb7e15162, 0xdeadbeef]
let _seeded = false
let _counter = 0

function _rotl(x, k) {
  return ((x << k) | (x >>> (32 - k))) >>> 0
}

function _mix32(x) {
  x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x7feb352d)
  x = Math.imul((x ^ (x >>> 15)) >>> 0, 0x846ca68b)
  return (x ^ (x >>> 16)) >>> 0
}

function _asByteList(src) {
  if (!src) return []
  if (typeof src === 'string') {
    const out = []
    for (let i = 0; i < src.length; i++) out.push(src.charCodeAt(i) & 0xff)
    return out
  }
  if (typeof ArrayBuffer !== 'undefined' && src instanceof ArrayBuffer) {
    try {
      return Array.prototype.slice.call(new Uint8Array(src))
    } catch (e) {
      return []
    }
  }
  if (typeof src.length === 'number') {
    const out = []
    for (let i = 0; i < src.length; i++) out.push((src[i] || 0) & 0xff)
    return out
  }
  if (src.byteLength && src.buffer) {
    try {
      return Array.prototype.slice.call(new Uint8Array(src.buffer, src.byteOffset || 0, src.byteLength))
    } catch (e) {
      return []
    }
  }
  return []
}

function _collectEntropyWords() {
  const words = []
  const push = function (n) {
    words.push(_mix32((Number(n) || 0) >>> 0))
  }

  push(Date.now())
  push(Date.now() * 1.7)
  try {
    if (typeof performance !== 'undefined' && performance.now) {
      push(performance.now() * 1000)
      push(performance.now() * 9973)
    }
  } catch (e) {}

  for (let i = 0; i < 8; i++) {
    push(Math.floor(Math.random() * 0x100000000))
    push(Math.floor(Math.random() * 0x100000000) ^ (Date.now() + i * 2654435761))
  }

  push(_counter++)
  push((_counter * 1597334677) >>> 0)

  try {
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      const sys = wx.getSystemInfoSync()
      if (sys) {
        push(sys.screenWidth)
        push(sys.screenHeight)
        push(sys.windowWidth)
        push((sys.pixelRatio || 1) * 1000)
        push(String(sys.brand || '').length * 1315423911)
        push(String(sys.model || '').length * 2654435761)
        push(String(sys.system || '').length * 2246822519)
      }
    }
  } catch (e) {}

  try {
    if (typeof wx !== 'undefined' && wx.getStorageInfoSync) {
      push((wx.getStorageInfoSync().currentSize || 0) * 1000)
    }
  } catch (e) {}

  const t0 = Date.now()
  let junk = 0
  for (let i = 0; i < 64; i++) junk = (junk + i * 17) | 0
  push(Date.now() - t0)
  push(junk)

  return words
}

/** 内部步进：不触发重播种，避免 seed 预热递归 */
function _stepU32() {
  const s0 = _state[0] >>> 0
  const s1 = _state[1] >>> 0
  const s2 = _state[2] >>> 0
  const s3 = _state[3] >>> 0
  const result = Math.imul(_rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0
  const t = (s1 << 9) >>> 0
  let ns2 = (s2 ^ s0) >>> 0
  let ns3 = (s3 ^ s1) >>> 0
  let ns1 = (s1 ^ ns2) >>> 0
  let ns0 = (s0 ^ ns3) >>> 0
  ns2 = (ns2 ^ t) >>> 0
  ns3 = _rotl(ns3, 11)
  _state[0] = ns0
  _state[1] = ns1
  _state[2] = ns2
  _state[3] = ns3
  return result
}

function seedPrng(extraBytes) {
  const words = _collectEntropyWords()
  const bytes = _asByteList(extraBytes)
  if (bytes.length) {
    for (let i = 0; i < bytes.length; i += 4) {
      const b0 = bytes[i] || 0
      const b1 = bytes[i + 1] || 0
      const b2 = bytes[i + 2] || 0
      const b3 = bytes[i + 3] || 0
      words.push(_mix32((b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0))
    }
  }

  let a = 0x9e3779b9
  let b = 0x243f6a88
  let c = 0xb7e15162
  let d = 0xdeadbeef
  for (let i = 0; i < words.length; i++) {
    const w = words[i] >>> 0
    a = _mix32(a ^ w)
    b = _mix32((b + w + i) >>> 0)
    c = _mix32(c ^ ((w + a) >>> 0))
    d = _mix32((d + (w ^ b) + i * 0x85ebca6b) >>> 0)
  }
  if ((a | b | c | d) === 0) d = 1

  _state[0] = a >>> 0
  _state[1] = b >>> 0
  _state[2] = c >>> 0
  _state[3] = d >>> 0
  // 必须先标记已播种，再预热
  _seeded = true
  for (let i = 0; i < 16; i++) _stepU32()
}

function nextU32() {
  if (!_seeded) seedPrng()
  return _stepU32()
}

/**
 * 同步拿原生随机字节。兼容：
 * - Web Crypto: crypto.getRandomValues(TypedArray)
 * - 微信对象回调式: wx.getRandomValues({ length, success })
 * 全部失败返回 null，不抛错
 */
function tryNativeRandomBytes(len) {
  const n = Math.max(1, len | 0)

  // Web Crypto
  try {
    let cryptoObj = null
    if (typeof globalThis !== 'undefined' && globalThis.crypto) cryptoObj = globalThis.crypto
    if (!cryptoObj && typeof crypto !== 'undefined') cryptoObj = crypto
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const out = new Uint8Array(n)
      cryptoObj.getRandomValues(out)
      const list = _asByteList(out)
      if (list.length >= n) return list
    }
  } catch (e) {}

  // 微信：部分基础库是回调对象 API，不是 WebCrypto 签名
  try {
    if (typeof wx !== 'undefined' && typeof wx.getRandomValues === 'function') {
      // 尝试 TypedArray / ArrayBuffer 同步写法
      try {
        const out = new Uint8Array(n)
        const ret = wx.getRandomValues(out)
        if (ret && ret.byteLength) {
          const list = _asByteList(ret)
          if (list.length) return list
        }
        const list2 = _asByteList(out)
        // 若被填充过（非全 0 概率极低全 0），直接用；否则走 PRNG
        let nonzero = false
        for (let i = 0; i < list2.length; i++) {
          if (list2[i]) {
            nonzero = true
            break
          }
        }
        if (nonzero) return list2
      } catch (e) {}

      // 对象式：无法真正同步等待 success，这里不阻塞，交给 PRNG
    }
  } catch (e) {}

  return null
}

function reseed() {
  try {
    const native = tryNativeRandomBytes(32)
    if (native && native.length) seedPrng(native)
    else seedPrng()
  } catch (e) {
    try {
      seedPrng()
    } catch (e2) {
      _seeded = true
    }
  }
}

/** 均匀随机整数 [0, max) */
function randomInt(max) {
  const m = max | 0
  if (m <= 1) return 0
  // 优先原生
  try {
    const native = tryNativeRandomBytes(4)
    if (native && native.length >= 4) {
      const x =
        ((native[0] << 24) | (native[1] << 16) | (native[2] << 8) | native[3]) >>> 0
      return x % m
    }
  } catch (e) {}

  if (!_seeded) reseed()
  const limit = Math.floor(0x100000000 / m) * m
  let x = 0
  let guard = 0
  do {
    x = nextU32()
    if (++guard > 32) break
  } while (x >= limit)
  return x % m
}

function pick(chars) {
  if (!chars || !chars.length) return ''
  return chars.charAt(randomInt(chars.length))
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

function buildCharset(opts) {
  let set = ''
  if (opts.lower) set += LOWER
  if (opts.upper) set += UPPER
  if (opts.digit) set += DIGIT
  if (opts.symbol) set += SYMBOL
  return set
}

function strengthOf(pwd) {
  let score = 0
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (pwd.length >= 16) score += 1
  if (/[a-z]/.test(pwd)) score += 1
  if (/[A-Z]/.test(pwd)) score += 1
  if (/\d/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1
  const uniq = {}
  let uniqCount = 0
  for (let i = 0; i < pwd.length; i++) {
    const ch = pwd.charAt(i)
    if (!uniq[ch]) {
      uniq[ch] = 1
      uniqCount++
    }
  }
  if (uniqCount >= Math.min(10, Math.floor(pwd.length * 0.6))) score += 1

  if (score <= 2) return { label: '弱', color: '#f87171', level: 1 }
  if (score <= 4) return { label: '中', color: '#fbbf24', level: 2 }
  if (score <= 6) return { label: '强', color: '#4ade80', level: 3 }
  return { label: '很强', color: '#5ce1ff', level: 4 }
}

function looksWeak(pwd) {
  if (!pwd || pwd.length < 4) return true
  if (/(.)\1{2,}/.test(pwd)) return true
  const seq = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const rev = '9876543210zyxwvutsrqponmlkjihgfedcba'
  const lower = pwd.toLowerCase()
  for (let i = 0; i < lower.length - 3; i++) {
    const slice = lower.slice(i, i + 4)
    if (seq.indexOf(slice) >= 0) return true
    if (rev.indexOf(slice) >= 0) return true
  }
  return false
}

function fallbackPassword(opts, len) {
  const set = buildCharset(opts) || LOWER + DIGIT
  let out = ''
  for (let i = 0; i < len; i++) {
    out += set.charAt(Math.floor(Math.random() * set.length))
  }
  return out
}

function generatePassword(opts, len) {
  const set = buildCharset(opts)
  if (!set) return ''

  reseed()

  let pwd = ''
  let attempt = 0
  do {
    const required = []
    if (opts.lower) required.push(pick(LOWER))
    if (opts.upper) required.push(pick(UPPER))
    if (opts.digit) required.push(pick(DIGIT))
    if (opts.symbol) required.push(pick(SYMBOL))

    const chars = required.slice()
    while (chars.length < len) chars.push(pick(set))
    shuffleInPlace(chars)
    pwd = chars.slice(0, len).join('')
    attempt++
  } while (looksWeak(pwd) && attempt < 8)

  if (!pwd || pwd.length !== len) {
    pwd = fallbackPassword(opts, len)
  }
  return pwd
}

function readInitialTheme() {
  try {
    return themeUtil.getThemeId()
  } catch (e) {
    return 'mc'
  }
}

Page({
  data: {
    theme: readInitialTheme(),
    length: 16,
    lengthIndex: 2,
    lengthOptions: [8, 12, 16, 20, 24, 32],
    lower: true,
    upper: true,
    digit: true,
    symbol: true,
    password: '',
    strengthLabel: '',
    strengthColor: '',
    strengthLevel: 0,
    history: [],
    generating: false
  },

  syncTheme() {
    try {
      const id = themeUtil.ensureTheme()
      if (id !== this.data.theme) {
        this.setData({ theme: id })
      } else {
        themeUtil.applyChrome(id)
      }
      return id
    } catch (e) {
      console.warn('[password] syncTheme', e)
      return this.data.theme
    }
  },

  onLoad() {
    this.syncTheme()
    try {
      recents.pushRecent('password')
    } catch (e) {}
    try {
      reseed()
    } catch (e) {
      console.warn('[password] seed fail', e)
    }
    this.restore()
  },

  onShow() {
    this.syncTheme()
  },

  onShareAppMessage() {
    return { title: '密码生成 - 随身工具箱', path: '/pages/tool-password/index' }
  },

  onShareTimeline() {
    return { title: '密码生成 · 本地安全随机 · 随身工具箱' }
  },

  restore() {
    const s = storage.get(STORE_KEY, null)
    if (!s || typeof s !== 'object') return
    const lengthOptions = this.data.lengthOptions
    let length = Number(s.length) || 16
    if (lengthOptions.indexOf(length) < 0) length = 16
    const lengthIndex = Math.max(0, lengthOptions.indexOf(length))
    this.setData({
      length,
      lengthIndex,
      lower: s.lower !== false,
      upper: s.upper !== false,
      digit: s.digit !== false,
      symbol: s.symbol !== false,
      history: Array.isArray(s.history) ? s.history.slice(0, 8) : []
    })
  },

  persist(patch) {
    const next = Object.assign(
      {
        length: this.data.length,
        lower: this.data.lower,
        upper: this.data.upper,
        digit: this.data.digit,
        symbol: this.data.symbol,
        history: this.data.history
      },
      patch || {}
    )
    storage.set(STORE_KEY, next)
  },

  onLengthChange(e) {
    const lengthIndex = Number(e.detail.value)
    const length = this.data.lengthOptions[lengthIndex]
    this.setData({ lengthIndex, length })
    this.persist({ length })
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    const next = !this.data[key]
    const state = {
      lower: this.data.lower,
      upper: this.data.upper,
      digit: this.data.digit,
      symbol: this.data.symbol
    }
    state[key] = next
    if (!state.lower && !state.upper && !state.digit && !state.symbol) {
      wx.showToast({ title: '至少开启一种字符', icon: 'none' })
      return
    }
    this.setData({ [key]: next })
    this.persist({ [key]: next })
  },

  refreshQuota() {
    try {
      const bar = this.selectComponent('#quotaBar')
      if (bar && bar.refresh) bar.refresh()
    } catch (e) {}
  },

  generate() {
    const opts = {
      lower: this.data.lower,
      upper: this.data.upper,
      digit: this.data.digit,
      symbol: this.data.symbol
    }
    if (!buildCharset(opts)) {
      wx.showToast({ title: '请选择字符类型', icon: 'none' })
      return ''
    }
    const len = clamp(Number(this.data.length) || 16, 4, 64)
    try {
      return generatePassword(opts, len)
    } catch (e) {
      console.warn('[password] generate fail', e)
      return fallbackPassword(opts, len)
    }
  },

  onGenerate() {
    if (this.data.generating) return
    this.setData({ generating: true })

    let password = ''
    try {
      password = this.generate()
    } catch (e) {
      console.warn('[password] onGenerate', e)
      this.setData({ generating: false })
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
      return
    }

    if (!password) {
      this.setData({ generating: false })
      return
    }

    // 先校验次数，再写入结果
    let allowed = true
    try {
      allowed = quota.consumeQuota('password')
    } catch (e) {
      allowed = true
    }

    if (!allowed) {
      this.setData({ generating: false })
      wx.showModal({
        title: '今日次数已用完',
        content: '观看激励视频可获得额外次数',
        confirmText: '去观看',
        success: (res) => {
          if (!res.confirm) return
          Promise.resolve()
            .then(() => ads.showRewardedVideo())
            .then((ok) => {
              if (ok) {
                try {
                  quota.addRewardBonus()
                } catch (e) {}
                this.refreshQuota()
                wx.showToast({ title: '次数已增加', icon: 'success' })
              }
            })
            .catch(() => {
              wx.showToast({ title: '广告暂时无法播放', icon: 'none' })
            })
        }
      })
      return
    }

    this.refreshQuota()

    let strength
    try {
      strength = strengthOf(password)
    } catch (e) {
      strength = { label: '中', color: '#fbbf24', level: 2 }
    }

    const history = [password]
      .concat((this.data.history || []).filter((p) => p !== password))
      .slice(0, 8)

    this.setData({
      password,
      strengthLabel: strength.label,
      strengthColor: strength.color,
      strengthLevel: strength.level,
      history,
      generating: false
    })
    this.persist({ history })

    try {
      ads.showInterstitial()
    } catch (e) {}
  },

  onCopy() {
    copyText(this.data.password)
  },

  onCopyHist(e) {
    copyText(e.currentTarget.dataset.v)
  }
})
