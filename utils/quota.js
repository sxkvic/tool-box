/**
 * 每日免费次数（纯本地，无后端）
 * storage key: tool_quota_YYYY-MM-DD
 *
 * 分层策略：
 * - free: 不扣次（番茄钟/文本/时间戳/单位/进制/颜色/亲戚称呼/折扣/倒计时/待办/体重管理）
 * - limited: 扣 1 次（抽签、吃什么、密码、房贷、BMI 等）
 */
const { AD_CONFIG } = require('../config/ads')

/** 不消耗每日次数的工具 */
const FREE_TOOLS = {
  pomodoro: true,
  text: true,
  timestamp: true,
  unit: true,
  radix: true,
  color: true,
  relation: true,
  discount: true,
  countdown: true,
  todo: true,
  weight: true
}

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `tool_quota_${y}-${m}-${day}`
}

function readState() {
  const key = todayKey()
  try {
    const raw = wx.getStorageSync(key)
    if (raw && typeof raw === 'object') {
      return {
        used: Number(raw.used) || 0,
        bonus: Number(raw.bonus) || 0
      }
    }
  } catch (e) {}
  return { used: 0, bonus: 0 }
}

function writeState(state) {
  try {
    wx.setStorageSync(todayKey(), state)
  } catch (e) {}
}

function getQuotaInfo() {
  const free = AD_CONFIG.dailyFreeQuota || 12
  const state = readState()
  const total = free + state.bonus
  const remain = Math.max(0, total - state.used)
  return {
    free,
    bonus: state.bonus,
    used: state.used,
    total,
    remain,
    rewardExtra: AD_CONFIG.rewardExtraQuota || 5
  }
}

function isFreeTool(toolId) {
  return !!(toolId && FREE_TOOLS[toolId])
}

/**
 * 消耗 1 次
 * @param {string} [toolId] 工具 id，free 工具直接返回 true 且不扣次
 */
function consumeQuota(toolId) {
  if (isFreeTool(toolId)) return true
  const info = getQuotaInfo()
  if (info.remain <= 0) return false
  const state = readState()
  state.used += 1
  writeState(state)
  return true
}

function addRewardBonus() {
  const state = readState()
  state.bonus += AD_CONFIG.rewardExtraQuota || 5
  writeState(state)
  return getQuotaInfo()
}

module.exports = {
  FREE_TOOLS,
  isFreeTool,
  getQuotaInfo,
  consumeQuota,
  addRewardBonus
}
