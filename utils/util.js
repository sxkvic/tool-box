function formatDate(date, withTime = true) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (!withTime) return `${y}-${m}-${day}`
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

function copyText(text) {
  if (text === undefined || text === null || text === '') {
    wx.showToast({ title: '没有可复制内容', icon: 'none' })
    return
  }
  wx.setClipboardData({
    data: String(text),
    success() {
      wx.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

module.exports = {
  formatDate,
  copyText,
  clamp
}
