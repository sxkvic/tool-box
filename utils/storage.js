/**
 * 本地 storage 安全读写
 */
function get(key, fallback) {
  try {
    const v = wx.getStorageSync(key)
    if (v === '' || v === undefined || v === null) return fallback
    return v
  } catch (e) {
    return fallback
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (e) {
    return false
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key)
  } catch (e) {}
}

module.exports = { get, set, remove }