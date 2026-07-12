/**
 * 工具目录（首页与最近/收藏共用）
 */
const BASE_TOOLS = [
  {
    id: 'weight',
    code: 'L-00',
    name: '体重管理',
    desc: '记录趋势目标与健康评估',
    icon: 'weight',
    path: '/pages/tool-weight/index',
    category: 'life',
    keywords: '体重 减肥 增肌 bmi 体脂 健康 目标 记录 趋势'
  },
  {
    id: 'food',
    code: 'L-01',
    name: '今天吃什么',
    desc: '纠结星人菜单抽签',
    icon: 'food',
    path: '/pages/tool-food/index',
    category: 'life',
    keywords: '今天吃什么 吃饭 菜单 随机 午饭 晚饭 纠结'
  },
  {
    id: 'random',
    code: 'L-02',
    name: '随机抽取',
    desc: '名单、数字范围、骰子',
    icon: 'random',
    path: '/pages/tool-random/index',
    category: 'life',
    keywords: '随机 抽签 骰子 抽取 名单'
  },
  {
    id: 'relation',
    code: 'L-03',
    name: '亲戚称呼',
    desc: '绕分亲戚关系怎么叫',
    icon: 'relation',
    path: '/pages/tool-relation/index',
    category: 'life',
    keywords: '亲戚 称呼 绕分 舅妈 表亲'
  },
  {
    id: 'password',
    code: 'E-01',
    name: '密码生成',
    desc: '本地安全随机密码',
    icon: 'password',
    path: '/pages/tool-password/index',
    category: 'efficiency',
    keywords: '密码 生成 随机 安全 口令'
  },
  {
    id: 'pomodoro',
    code: 'E-02',
    name: '番茄钟',
    desc: '专注计时与休息提醒',
    icon: 'pomodoro',
    path: '/pages/tool-pomodoro/index',
    category: 'efficiency',
    keywords: '番茄钟 专注 计时 番茄 工作'
  },
  {
    id: 'text',
    code: 'E-03',
    name: '文本统计',
    desc: '字数、行数与文本清洗',
    icon: 'text',
    path: '/pages/tool-text/index',
    category: 'efficiency',
    keywords: '文本 字数 统计 字符'
  },
  {
    id: 'timestamp',
    code: 'E-04',
    name: '时间戳',
    desc: '时间与 Unix 时间戳互转',
    icon: 'timestamp',
    path: '/pages/tool-timestamp/index',
    category: 'efficiency',
    keywords: '时间戳 时间 日期 unix'
  },
  {
    id: 'countdown',
    code: 'E-05',
    name: '纪念日倒计时',
    desc: '生日考试发工资倒数',
    icon: 'countdown',
    path: '/pages/tool-countdown/index',
    category: 'efficiency',
    keywords: '纪念日 倒计时 生日 考试 倒数 日子'
  },
  {
    id: 'todo',
    code: 'E-06',
    name: '简易待办',
    desc: '本地待办清单速记',
    icon: 'todo',
    path: '/pages/tool-todo/index',
    category: 'efficiency',
    keywords: '待办 清单 todo 任务 备忘'
  },
  {
    id: 'loan',
    code: 'C-01',
    name: '房贷速算',
    desc: '等额本息 / 等额本金',
    icon: 'loan',
    path: '/pages/tool-loan/index',
    category: 'calc',
    keywords: '房贷 贷款 利息 月供 等额本息 等额本金'
  },
  {
    id: 'unit',
    code: 'C-02',
    name: '单位换算',
    desc: '长度、重量、温度换算',
    icon: 'unit',
    path: '/pages/tool-unit/index',
    category: 'calc',
    keywords: '单位 换算 长度 米 厘米 重量 千克 温度'
  },
  {
    id: 'bmi',
    code: 'C-03',
    name: 'BMI 计算',
    desc: '身高体重健康指数',
    icon: 'bmi',
    path: '/pages/tool-bmi/index',
    category: 'calc',
    keywords: 'bmi 体重 身高 健康 减肥'
  },
  {
    id: 'radix',
    code: 'C-04',
    name: '进制转换',
    desc: '二、八、十、十六进制',
    icon: 'radix',
    path: '/pages/tool-radix/index',
    category: 'calc',
    keywords: '进制 二进制 十六进制 转换'
  },
  {
    id: 'color',
    code: 'C-05',
    name: '颜色转换',
    desc: 'HEX 与 RGB 互转',
    icon: 'color',
    path: '/pages/tool-color/index',
    category: 'calc',
    keywords: '颜色 hex rgb 色值'
  },
  {
    id: 'discount',
    code: 'C-06',
    name: '折扣计算',
    desc: '打折 / 满减 / 百分比',
    icon: 'discount',
    path: '/pages/tool-discount/index',
    category: 'calc',
    keywords: '折扣 打折 满减 百分比 优惠 实付'
  }
]

const CATEGORIES = [
  {
    id: 'life',
    code: '01',
    title: '生活决策',
    en: 'LIFE DECISIONS',
    desc: '体重、饮食、抽签与称呼'
  },
  {
    id: 'efficiency',
    code: '02',
    title: '效率工具',
    en: 'EFFICIENCY',
    desc: '密码、专注、待办与倒计时'
  },
  {
    id: 'calc',
    code: '03',
    title: '计算换算',
    en: 'CALCULATORS',
    desc: '房贷、折扣、单位与色值'
  }
]

const TOOL_MAP = BASE_TOOLS.reduce((m, t) => {
  m[t.id] = t
  return m
}, {})

function getToolById(id) {
  return TOOL_MAP[id] || null
}

function getToolsByIds(ids) {
  return (ids || []).map((id) => TOOL_MAP[id]).filter(Boolean)
}

module.exports = {
  BASE_TOOLS,
  CATEGORIES,
  TOOL_MAP,
  getToolById,
  getToolsByIds
}
