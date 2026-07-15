/**
 * 本地食物营养库（每 100g）
 * 数据风格参考《中国食物成分表》及常见公开营养数据，用于估算，非实验室检测值。家常菜为均估（用油差异大）；酒类含酒精能量。
 * 字段：kcal 千卡, protein/fat/carb 克
 */
const FOOD_CATS = [
  { id: 'all', name: '全部' },
  { id: 'dish', name: '家常菜' },
  { id: 'staple', name: '主食' },
  { id: 'meat', name: '肉蛋' },
  { id: 'dairy', name: '奶豆' },
  { id: 'veg', name: '蔬菜' },
  { id: 'fruit', name: '水果' },
  { id: 'snack', name: '零食' },
  { id: 'drink', name: '饮品调味' }
]

const FOODS = [
  {
    "id": "staple_1",
    "cat": "staple",
    "name": "米饭(蒸)",
    "aliases": "白米饭 大米饭",
    "kcal": 116,
    "protein": 2.6,
    "fat": 0.3,
    "carb": 25.9,
    "portion": 150
  },
  {
    "id": "staple_2",
    "cat": "staple",
    "name": "粥(大米)",
    "aliases": "白粥 米粥",
    "kcal": 46,
    "protein": 1.1,
    "fat": 0.3,
    "carb": 9.8,
    "portion": 250
  },
  {
    "id": "staple_3",
    "cat": "staple",
    "name": "面条(煮)",
    "aliases": "挂面 汤面",
    "kcal": 110,
    "protein": 3.5,
    "fat": 0.5,
    "carb": 22.5,
    "portion": 200
  },
  {
    "id": "staple_4",
    "cat": "staple",
    "name": "馒头",
    "aliases": "白馒头 花卷",
    "kcal": 223,
    "protein": 7,
    "fat": 1.1,
    "carb": 47,
    "portion": 100
  },
  {
    "id": "staple_5",
    "cat": "staple",
    "name": "包子(肉)",
    "aliases": "猪肉包 肉包",
    "kcal": 227,
    "protein": 8,
    "fat": 8.5,
    "carb": 28.5,
    "portion": 100
  },
  {
    "id": "staple_6",
    "cat": "staple",
    "name": "饺子(猪肉白菜)",
    "aliases": "水饺 猪肉饺",
    "kcal": 230,
    "protein": 10,
    "fat": 9,
    "carb": 26,
    "portion": 150
  },
  {
    "id": "staple_7",
    "cat": "staple",
    "name": "馄饨",
    "aliases": "云吞",
    "kcal": 210,
    "protein": 8.5,
    "fat": 7,
    "carb": 28,
    "portion": 150
  },
  {
    "id": "staple_8",
    "cat": "staple",
    "name": "油条",
    "aliases": "",
    "kcal": 388,
    "protein": 6.9,
    "fat": 17.6,
    "carb": 51,
    "portion": 70
  },
  {
    "id": "staple_9",
    "cat": "staple",
    "name": "面包(白)",
    "aliases": "吐司",
    "kcal": 265,
    "protein": 8.3,
    "fat": 3.2,
    "carb": 50,
    "portion": 50
  },
  {
    "id": "staple_10",
    "cat": "staple",
    "name": "全麦面包",
    "aliases": "全麦吐司",
    "kcal": 246,
    "protein": 9,
    "fat": 3.5,
    "carb": 43,
    "portion": 50
  },
  {
    "id": "staple_11",
    "cat": "staple",
    "name": "燕麦片(干)",
    "aliases": "燕麦 麦片",
    "kcal": 367,
    "protein": 15,
    "fat": 6.7,
    "carb": 61,
    "portion": 40
  },
  {
    "id": "staple_12",
    "cat": "staple",
    "name": "玉米(鲜)",
    "aliases": "煮玉米",
    "kcal": 112,
    "protein": 4,
    "fat": 1.2,
    "carb": 22.8,
    "portion": 200
  },
  {
    "id": "staple_13",
    "cat": "staple",
    "name": "红薯",
    "aliases": "地瓜 番薯",
    "kcal": 99,
    "protein": 1.1,
    "fat": 0.2,
    "carb": 24.7,
    "portion": 150
  },
  {
    "id": "staple_14",
    "cat": "staple",
    "name": "土豆(蒸)",
    "aliases": "马铃薯",
    "kcal": 81,
    "protein": 2.6,
    "fat": 0.2,
    "carb": 17.8,
    "portion": 150
  },
  {
    "id": "staple_15",
    "cat": "staple",
    "name": "米粉(煮)",
    "aliases": "河粉",
    "kcal": 108,
    "protein": 2,
    "fat": 0.2,
    "carb": 24.5,
    "portion": 200
  },
  {
    "id": "staple_16",
    "cat": "staple",
    "name": "意大利面(煮)",
    "aliases": "意面 通心粉",
    "kcal": 131,
    "protein": 5,
    "fat": 1.1,
    "carb": 25,
    "portion": 180
  },
  {
    "id": "staple_17",
    "cat": "staple",
    "name": "糙米饭",
    "aliases": "糙米",
    "kcal": 111,
    "protein": 2.6,
    "fat": 0.9,
    "carb": 23,
    "portion": 150
  },
  {
    "id": "staple_18",
    "cat": "staple",
    "name": "烙饼",
    "aliases": "单饼 手抓饼皮",
    "kcal": 255,
    "protein": 7.5,
    "fat": 3.5,
    "carb": 49,
    "portion": 100
  },
  {
    "id": "staple_19",
    "cat": "staple",
    "name": "披萨(综合)",
    "aliases": "pizza",
    "kcal": 266,
    "protein": 11,
    "fat": 10,
    "carb": 33,
    "portion": 150
  },
  {
    "id": "staple_20",
    "cat": "staple",
    "name": "方便面(油炸面饼干)",
    "aliases": "泡面 方便面饼",
    "kcal": 472,
    "protein": 9,
    "fat": 21,
    "carb": 62,
    "portion": 80
  },
  {
    "id": "meat_21",
    "cat": "meat",
    "name": "鸡胸肉(熟)",
    "aliases": "鸡胸 鸡脯",
    "kcal": 165,
    "protein": 31,
    "fat": 3.6,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_22",
    "cat": "meat",
    "name": "鸡腿肉(去皮熟)",
    "aliases": "鸡腿",
    "kcal": 180,
    "protein": 24,
    "fat": 9,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_23",
    "cat": "meat",
    "name": "鸡肉(烤)",
    "aliases": "",
    "kcal": 167,
    "protein": 25,
    "fat": 7,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_24",
    "cat": "meat",
    "name": "猪肉(瘦)",
    "aliases": "瘦猪肉 里脊",
    "kcal": 143,
    "protein": 20.3,
    "fat": 6.2,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_25",
    "cat": "meat",
    "name": "猪肉(肥瘦)",
    "aliases": "五花肉 肥瘦肉",
    "kcal": 395,
    "protein": 13.2,
    "fat": 37,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_26",
    "cat": "meat",
    "name": "排骨(熟)",
    "aliases": "猪排骨",
    "kcal": 278,
    "protein": 22,
    "fat": 20,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_27",
    "cat": "meat",
    "name": "牛肉(瘦)",
    "aliases": "牛瘦肉 牛里脊",
    "kcal": 106,
    "protein": 20.2,
    "fat": 2.3,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_28",
    "cat": "meat",
    "name": "牛排(熟)",
    "aliases": "西冷 肋眼",
    "kcal": 250,
    "protein": 27,
    "fat": 15,
    "carb": 0,
    "portion": 150
  },
  {
    "id": "meat_29",
    "cat": "meat",
    "name": "羊肉(瘦)",
    "aliases": "",
    "kcal": 118,
    "protein": 19,
    "fat": 4.5,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_30",
    "cat": "meat",
    "name": "鱼肉(草鱼)",
    "aliases": "草鱼",
    "kcal": 113,
    "protein": 16.6,
    "fat": 5.2,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_31",
    "cat": "meat",
    "name": "三文鱼",
    "aliases": "鲑鱼",
    "kcal": 139,
    "protein": 17.2,
    "fat": 7.8,
    "carb": 0,
    "portion": 100
  },
  {
    "id": "meat_32",
    "cat": "meat",
    "name": "虾(对虾)",
    "aliases": "基围虾 虾仁",
    "kcal": 93,
    "protein": 18.6,
    "fat": 0.8,
    "carb": 2.8,
    "portion": 100
  },
  {
    "id": "meat_33",
    "cat": "meat",
    "name": "螃蟹",
    "aliases": "大闸蟹",
    "kcal": 95,
    "protein": 17.5,
    "fat": 2.6,
    "carb": 2.3,
    "portion": 100
  },
  {
    "id": "meat_34",
    "cat": "meat",
    "name": "鸡蛋(煮)",
    "aliases": "鸡蛋 水煮蛋",
    "kcal": 144,
    "protein": 13.3,
    "fat": 8.8,
    "carb": 2.8,
    "portion": 50
  },
  {
    "id": "meat_35",
    "cat": "meat",
    "name": "鸭蛋",
    "aliases": "",
    "kcal": 180,
    "protein": 12.6,
    "fat": 13,
    "carb": 3.1,
    "portion": 60
  },
  {
    "id": "meat_36",
    "cat": "meat",
    "name": "鹌鹑蛋",
    "aliases": "",
    "kcal": 160,
    "protein": 12.8,
    "fat": 11.1,
    "carb": 2.1,
    "portion": 10
  },
  {
    "id": "meat_37",
    "cat": "meat",
    "name": "火腿肠",
    "aliases": "火腿 香肠",
    "kcal": 212,
    "protein": 12,
    "fat": 16,
    "carb": 5,
    "portion": 50
  },
  {
    "id": "meat_38",
    "cat": "meat",
    "name": "培根",
    "aliases": "",
    "kcal": 459,
    "protein": 14,
    "fat": 45,
    "carb": 1,
    "portion": 30
  },
  {
    "id": "meat_39",
    "cat": "meat",
    "name": "鸡翅(烤)",
    "aliases": "奥尔良鸡翅",
    "kcal": 240,
    "protein": 20,
    "fat": 17,
    "carb": 0,
    "portion": 50
  },
  {
    "id": "meat_40",
    "cat": "meat",
    "name": "牛肉干",
    "aliases": "",
    "kcal": 550,
    "protein": 45,
    "fat": 40,
    "carb": 3,
    "portion": 30
  },
  {
    "id": "dairy_41",
    "cat": "dairy",
    "name": "纯牛奶",
    "aliases": "牛奶 全脂奶",
    "kcal": 54,
    "protein": 3,
    "fat": 3.2,
    "carb": 3.4,
    "portion": 250
  },
  {
    "id": "dairy_42",
    "cat": "dairy",
    "name": "脱脂牛奶",
    "aliases": "脱脂奶",
    "kcal": 35,
    "protein": 3.4,
    "fat": 0.1,
    "carb": 5,
    "portion": 250
  },
  {
    "id": "dairy_43",
    "cat": "dairy",
    "name": "酸奶(原味)",
    "aliases": "发酵乳",
    "kcal": 72,
    "protein": 2.5,
    "fat": 2.7,
    "carb": 9.3,
    "portion": 150
  },
  {
    "id": "dairy_44",
    "cat": "dairy",
    "name": "希腊酸奶",
    "aliases": "",
    "kcal": 97,
    "protein": 9,
    "fat": 5,
    "carb": 3.6,
    "portion": 150
  },
  {
    "id": "dairy_45",
    "cat": "dairy",
    "name": "豆浆",
    "aliases": "豆奶",
    "kcal": 31,
    "protein": 2.6,
    "fat": 1.2,
    "carb": 2,
    "portion": 250
  },
  {
    "id": "dairy_46",
    "cat": "dairy",
    "name": "豆腐(北豆腐)",
    "aliases": "老豆腐",
    "kcal": 98,
    "protein": 12.2,
    "fat": 4.8,
    "carb": 2,
    "portion": 100
  },
  {
    "id": "dairy_47",
    "cat": "dairy",
    "name": "豆腐(南豆腐)",
    "aliases": "嫩豆腐 内酯",
    "kcal": 57,
    "protein": 6.2,
    "fat": 2.5,
    "carb": 2.6,
    "portion": 100
  },
  {
    "id": "dairy_48",
    "cat": "dairy",
    "name": "豆腐干",
    "aliases": "豆干",
    "kcal": 140,
    "protein": 16.2,
    "fat": 6,
    "carb": 4,
    "portion": 50
  },
  {
    "id": "dairy_49",
    "cat": "dairy",
    "name": "油豆腐",
    "aliases": "",
    "kcal": 244,
    "protein": 17,
    "fat": 17.6,
    "carb": 4.3,
    "portion": 50
  },
  {
    "id": "dairy_50",
    "cat": "dairy",
    "name": "奶酪(切达)",
    "aliases": "芝士 cheese",
    "kcal": 403,
    "protein": 25,
    "fat": 33,
    "carb": 1.3,
    "portion": 20
  },
  {
    "id": "dairy_51",
    "cat": "dairy",
    "name": "黄油",
    "aliases": "动物黄油",
    "kcal": 717,
    "protein": 0.9,
    "fat": 81,
    "carb": 0.1,
    "portion": 10
  },
  {
    "id": "dairy_52",
    "cat": "dairy",
    "name": "蛋白粉(乳清)",
    "aliases": "乳清蛋白",
    "kcal": 400,
    "protein": 80,
    "fat": 5,
    "carb": 8,
    "portion": 30
  },
  {
    "id": "veg_53",
    "cat": "veg",
    "name": "西兰花",
    "aliases": "花椰菜",
    "kcal": 36,
    "protein": 4.1,
    "fat": 0.6,
    "carb": 4.3,
    "portion": 100
  },
  {
    "id": "veg_54",
    "cat": "veg",
    "name": "菠菜",
    "aliases": "",
    "kcal": 28,
    "protein": 2.6,
    "fat": 0.3,
    "carb": 4.5,
    "portion": 100
  },
  {
    "id": "veg_55",
    "cat": "veg",
    "name": "白菜",
    "aliases": "大白菜",
    "kcal": 17,
    "protein": 1.5,
    "fat": 0.1,
    "carb": 3.2,
    "portion": 100
  },
  {
    "id": "veg_56",
    "cat": "veg",
    "name": "娃娃菜",
    "aliases": "",
    "kcal": 13,
    "protein": 1.3,
    "fat": 0.2,
    "carb": 2.1,
    "portion": 100
  },
  {
    "id": "veg_57",
    "cat": "veg",
    "name": "生菜",
    "aliases": "罗马生菜",
    "kcal": 13,
    "protein": 1.3,
    "fat": 0.3,
    "carb": 1.8,
    "portion": 100
  },
  {
    "id": "veg_58",
    "cat": "veg",
    "name": "黄瓜",
    "aliases": "",
    "kcal": 15,
    "protein": 0.8,
    "fat": 0.2,
    "carb": 2.9,
    "portion": 100
  },
  {
    "id": "veg_59",
    "cat": "veg",
    "name": "番茄",
    "aliases": "西红柿",
    "kcal": 19,
    "protein": 0.9,
    "fat": 0.2,
    "carb": 4,
    "portion": 100
  },
  {
    "id": "veg_60",
    "cat": "veg",
    "name": "胡萝卜",
    "aliases": "红萝卜",
    "kcal": 39,
    "protein": 1,
    "fat": 0.2,
    "carb": 8.8,
    "portion": 100
  },
  {
    "id": "veg_61",
    "cat": "veg",
    "name": "芹菜",
    "aliases": "",
    "kcal": 14,
    "protein": 0.8,
    "fat": 0.1,
    "carb": 2.9,
    "portion": 100
  },
  {
    "id": "veg_62",
    "cat": "veg",
    "name": "茄子",
    "aliases": "",
    "kcal": 23,
    "protein": 1.1,
    "fat": 0.2,
    "carb": 4.9,
    "portion": 100
  },
  {
    "id": "veg_63",
    "cat": "veg",
    "name": "青椒",
    "aliases": "柿子椒",
    "kcal": 22,
    "protein": 1,
    "fat": 0.2,
    "carb": 4.9,
    "portion": 100
  },
  {
    "id": "veg_64",
    "cat": "veg",
    "name": "洋葱",
    "aliases": "",
    "kcal": 39,
    "protein": 1.1,
    "fat": 0.2,
    "carb": 9,
    "portion": 100
  },
  {
    "id": "veg_65",
    "cat": "veg",
    "name": "大蒜",
    "aliases": "",
    "kcal": 126,
    "protein": 4.5,
    "fat": 0.2,
    "carb": 27.6,
    "portion": 10
  },
  {
    "id": "veg_66",
    "cat": "veg",
    "name": "蘑菇",
    "aliases": "香菇 平菇",
    "kcal": 24,
    "protein": 2.7,
    "fat": 0.1,
    "carb": 4.1,
    "portion": 100
  },
  {
    "id": "veg_67",
    "cat": "veg",
    "name": "海带(泡发)",
    "aliases": "",
    "kcal": 16,
    "protein": 1.2,
    "fat": 0.1,
    "carb": 3,
    "portion": 100
  },
  {
    "id": "veg_68",
    "cat": "veg",
    "name": "豆芽",
    "aliases": "绿豆芽",
    "kcal": 18,
    "protein": 2.1,
    "fat": 0.1,
    "carb": 2.6,
    "portion": 100
  },
  {
    "id": "veg_69",
    "cat": "veg",
    "name": "莲藕",
    "aliases": "",
    "kcal": 70,
    "protein": 1.9,
    "fat": 0.2,
    "carb": 16.4,
    "portion": 100
  },
  {
    "id": "veg_70",
    "cat": "veg",
    "name": "南瓜",
    "aliases": "",
    "kcal": 22,
    "protein": 0.7,
    "fat": 0.1,
    "carb": 5.3,
    "portion": 100
  },
  {
    "id": "veg_71",
    "cat": "veg",
    "name": "冬瓜",
    "aliases": "",
    "kcal": 12,
    "protein": 0.4,
    "fat": 0.2,
    "carb": 2.6,
    "portion": 100
  },
  {
    "id": "veg_72",
    "cat": "veg",
    "name": "玉米笋",
    "aliases": "",
    "kcal": 30,
    "protein": 2,
    "fat": 0.2,
    "carb": 5.5,
    "portion": 100
  },
  {
    "id": "fruit_73",
    "cat": "fruit",
    "name": "苹果",
    "aliases": "",
    "kcal": 53,
    "protein": 0.2,
    "fat": 0.2,
    "carb": 13.7,
    "portion": 150
  },
  {
    "id": "fruit_74",
    "cat": "fruit",
    "name": "香蕉",
    "aliases": "",
    "kcal": 93,
    "protein": 1.4,
    "fat": 0.2,
    "carb": 22,
    "portion": 120
  },
  {
    "id": "fruit_75",
    "cat": "fruit",
    "name": "橙子",
    "aliases": "脐橙",
    "kcal": 48,
    "protein": 0.8,
    "fat": 0.2,
    "carb": 11.1,
    "portion": 150
  },
  {
    "id": "fruit_76",
    "cat": "fruit",
    "name": "柚子",
    "aliases": "",
    "kcal": 42,
    "protein": 0.8,
    "fat": 0.2,
    "carb": 9.5,
    "portion": 150
  },
  {
    "id": "fruit_77",
    "cat": "fruit",
    "name": "葡萄",
    "aliases": "",
    "kcal": 44,
    "protein": 0.5,
    "fat": 0.2,
    "carb": 10.3,
    "portion": 100
  },
  {
    "id": "fruit_78",
    "cat": "fruit",
    "name": "西瓜",
    "aliases": "",
    "kcal": 31,
    "protein": 0.5,
    "fat": 0.1,
    "carb": 7.5,
    "portion": 200
  },
  {
    "id": "fruit_79",
    "cat": "fruit",
    "name": "草莓",
    "aliases": "",
    "kcal": 32,
    "protein": 1,
    "fat": 0.2,
    "carb": 7.1,
    "portion": 100
  },
  {
    "id": "fruit_80",
    "cat": "fruit",
    "name": "蓝莓",
    "aliases": "",
    "kcal": 57,
    "protein": 0.7,
    "fat": 0.3,
    "carb": 14.5,
    "portion": 100
  },
  {
    "id": "fruit_81",
    "cat": "fruit",
    "name": "猕猴桃",
    "aliases": "奇异果",
    "kcal": 61,
    "protein": 0.8,
    "fat": 0.6,
    "carb": 14.5,
    "portion": 100
  },
  {
    "id": "fruit_82",
    "cat": "fruit",
    "name": "梨",
    "aliases": "",
    "kcal": 44,
    "protein": 0.4,
    "fat": 0.1,
    "carb": 11,
    "portion": 150
  },
  {
    "id": "fruit_83",
    "cat": "fruit",
    "name": "桃子",
    "aliases": "",
    "kcal": 42,
    "protein": 0.9,
    "fat": 0.1,
    "carb": 10.1,
    "portion": 150
  },
  {
    "id": "fruit_84",
    "cat": "fruit",
    "name": "芒果",
    "aliases": "",
    "kcal": 35,
    "protein": 0.6,
    "fat": 0.2,
    "carb": 8.3,
    "portion": 150
  },
  {
    "id": "fruit_85",
    "cat": "fruit",
    "name": "火龙果",
    "aliases": "",
    "kcal": 55,
    "protein": 1.1,
    "fat": 0.2,
    "carb": 13.3,
    "portion": 150
  },
  {
    "id": "fruit_86",
    "cat": "fruit",
    "name": "樱桃",
    "aliases": "车厘子",
    "kcal": 46,
    "protein": 1.1,
    "fat": 0.2,
    "carb": 10.2,
    "portion": 100
  },
  {
    "id": "fruit_87",
    "cat": "fruit",
    "name": "榴莲",
    "aliases": "",
    "kcal": 147,
    "protein": 2.6,
    "fat": 3.3,
    "carb": 27.1,
    "portion": 100
  },
  {
    "id": "fruit_88",
    "cat": "fruit",
    "name": "牛油果",
    "aliases": "鳄梨 avocado",
    "kcal": 171,
    "protein": 2,
    "fat": 15.3,
    "carb": 7.4,
    "portion": 100
  },
  {
    "id": "snack_89",
    "cat": "snack",
    "name": "杏仁",
    "aliases": "",
    "kcal": 578,
    "protein": 22,
    "fat": 50,
    "carb": 15,
    "portion": 20
  },
  {
    "id": "snack_90",
    "cat": "snack",
    "name": "核桃",
    "aliases": "",
    "kcal": 646,
    "protein": 14.9,
    "fat": 58.8,
    "carb": 19.1,
    "portion": 20
  },
  {
    "id": "snack_91",
    "cat": "snack",
    "name": "花生(炒)",
    "aliases": "",
    "kcal": 581,
    "protein": 23.9,
    "fat": 44.4,
    "carb": 21,
    "portion": 20
  },
  {
    "id": "snack_92",
    "cat": "snack",
    "name": "瓜子(葵花籽)",
    "aliases": "香瓜子",
    "kcal": 597,
    "protein": 23,
    "fat": 49.9,
    "carb": 13,
    "portion": 20
  },
  {
    "id": "snack_93",
    "cat": "snack",
    "name": "薯片",
    "aliases": "",
    "kcal": 548,
    "protein": 5,
    "fat": 35,
    "carb": 52,
    "portion": 30
  },
  {
    "id": "snack_94",
    "cat": "snack",
    "name": "巧克力(牛奶)",
    "aliases": "",
    "kcal": 535,
    "protein": 7,
    "fat": 30,
    "carb": 59,
    "portion": 20
  },
  {
    "id": "snack_95",
    "cat": "snack",
    "name": "饼干(苏打)",
    "aliases": "",
    "kcal": 433,
    "protein": 8,
    "fat": 12,
    "carb": 72,
    "portion": 25
  },
  {
    "id": "snack_96",
    "cat": "snack",
    "name": "蛋糕(奶油)",
    "aliases": "",
    "kcal": 349,
    "protein": 5,
    "fat": 15,
    "carb": 50,
    "portion": 80
  },
  {
    "id": "snack_97",
    "cat": "snack",
    "name": "冰淇淋",
    "aliases": "",
    "kcal": 207,
    "protein": 3.5,
    "fat": 11,
    "carb": 24,
    "portion": 80
  },
  {
    "id": "snack_98",
    "cat": "snack",
    "name": "绿豆糕",
    "aliases": "",
    "kcal": 349,
    "protein": 8,
    "fat": 5,
    "carb": 70,
    "portion": 40
  },
  {
    "id": "drink_99",
    "cat": "drink",
    "name": "可乐",
    "aliases": "汽水 碳酸饮料",
    "kcal": 43,
    "protein": 0,
    "fat": 0,
    "carb": 10.6,
    "portion": 250
  },
  {
    "id": "drink_100",
    "cat": "drink",
    "name": "橙汁",
    "aliases": "",
    "kcal": 45,
    "protein": 0.5,
    "fat": 0.1,
    "carb": 10.4,
    "portion": 250
  },
  {
    "id": "drink_101",
    "cat": "drink",
    "name": "咖啡(黑无糖)",
    "aliases": "美式 黑咖啡",
    "kcal": 2,
    "protein": 0.2,
    "fat": 0,
    "carb": 0,
    "portion": 200
  },
  {
    "id": "drink_102",
    "cat": "drink",
    "name": "拿铁(全脂)",
    "aliases": "咖啡拿铁",
    "kcal": 55,
    "protein": 2.8,
    "fat": 2.8,
    "carb": 4.5,
    "portion": 300
  },
  {
    "id": "drink_103",
    "cat": "drink",
    "name": "奶茶(标准)",
    "aliases": "珍珠奶茶底",
    "kcal": 70,
    "protein": 1.5,
    "fat": 2,
    "carb": 12,
    "portion": 350
  },
  {
    "id": "drink_104",
    "cat": "drink",
    "name": "啤酒",
    "aliases": "",
    "kcal": 37,
    "protein": 0.4,
    "fat": 0,
    "carb": 3.1,
    "portion": 330
  },
  {
    "id": "drink_105",
    "cat": "drink",
    "name": "白酒(40度估)",
    "aliases": "白酒",
    "kcal": 230,
    "protein": 0,
    "fat": 0,
    "carb": 0,
    "portion": 50
  },
  {
    "id": "drink_106",
    "cat": "drink",
    "name": "红葡萄酒",
    "aliases": "红酒",
    "kcal": 76,
    "protein": 0.1,
    "fat": 0,
    "carb": 2,
    "portion": 150
  },
  {
    "id": "drink_107",
    "cat": "drink",
    "name": "绿茶",
    "aliases": "茶 无糖茶",
    "kcal": 1,
    "protein": 0.2,
    "fat": 0,
    "carb": 0,
    "portion": 250
  },
  {
    "id": "drink_108",
    "cat": "drink",
    "name": "蜂蜜",
    "aliases": "",
    "kcal": 321,
    "protein": 0.4,
    "fat": 0,
    "carb": 82,
    "portion": 15
  },
  {
    "id": "drink_109",
    "cat": "drink",
    "name": "白砂糖",
    "aliases": "砂糖 蔗糖",
    "kcal": 400,
    "protein": 0,
    "fat": 0,
    "carb": 100,
    "portion": 10
  },
  {
    "id": "drink_110",
    "cat": "drink",
    "name": "食用油(植物油)",
    "aliases": "菜籽油 花生油 橄榄油",
    "kcal": 899,
    "protein": 0,
    "fat": 99.9,
    "carb": 0,
    "portion": 10
  },
  {
    "id": "drink_111",
    "cat": "drink",
    "name": "酱油",
    "aliases": "",
    "kcal": 63,
    "protein": 5.6,
    "fat": 0.1,
    "carb": 10.1,
    "portion": 10
  },
  {
    "id": "drink_112",
    "cat": "drink",
    "name": "番茄酱",
    "aliases": "ketchup",
    "kcal": 81,
    "protein": 1.5,
    "fat": 0.2,
    "carb": 18,
    "portion": 15
  },
  {
    "id": "dish_113",
    "cat": "dish",
    "name": "番茄炒蛋",
    "aliases": "西红柿炒蛋 番茄蛋",
    "kcal": 110,
    "protein": 6.5,
    "fat": 7,
    "carb": 5,
    "portion": 150
  },
  {
    "id": "dish_114",
    "cat": "dish",
    "name": "青椒肉丝",
    "aliases": "青椒炒肉",
    "kcal": 145,
    "protein": 11,
    "fat": 9,
    "carb": 4,
    "portion": 150
  },
  {
    "id": "dish_115",
    "cat": "dish",
    "name": "鱼香肉丝",
    "aliases": "鱼香",
    "kcal": 160,
    "protein": 10,
    "fat": 10,
    "carb": 7,
    "portion": 150
  },
  {
    "id": "dish_116",
    "cat": "dish",
    "name": "宫保鸡丁",
    "aliases": "宫爆鸡丁",
    "kcal": 175,
    "protein": 14,
    "fat": 10,
    "carb": 7,
    "portion": 150
  },
  {
    "id": "dish_117",
    "cat": "dish",
    "name": "红烧肉",
    "aliases": "五花肉 红烧",
    "kcal": 350,
    "protein": 13,
    "fat": 30,
    "carb": 6,
    "portion": 100
  },
  {
    "id": "dish_118",
    "cat": "dish",
    "name": "糖醋里脊",
    "aliases": "",
    "kcal": 230,
    "protein": 14,
    "fat": 12,
    "carb": 16,
    "portion": 120
  },
  {
    "id": "dish_119",
    "cat": "dish",
    "name": "麻婆豆腐",
    "aliases": "麻婆 豆腐",
    "kcal": 120,
    "protein": 8,
    "fat": 8,
    "carb": 5,
    "portion": 200
  },
  {
    "id": "dish_120",
    "cat": "dish",
    "name": "蒜蓉西兰花",
    "aliases": "",
    "kcal": 55,
    "protein": 3.5,
    "fat": 2.5,
    "carb": 4.5,
    "portion": 150
  },
  {
    "id": "dish_121",
    "cat": "dish",
    "name": "凉拌黄瓜",
    "aliases": "拍黄瓜",
    "kcal": 35,
    "protein": 1,
    "fat": 2,
    "carb": 3.5,
    "portion": 150
  },
  {
    "id": "dish_122",
    "cat": "dish",
    "name": "酸辣土豆丝",
    "aliases": "土豆丝",
    "kcal": 95,
    "protein": 1.5,
    "fat": 4,
    "carb": 14,
    "portion": 150
  },
  {
    "id": "dish_123",
    "cat": "dish",
    "name": "蛋炒饭",
    "aliases": "炒饭",
    "kcal": 186,
    "protein": 5.5,
    "fat": 6,
    "carb": 28,
    "portion": 250
  },
  {
    "id": "dish_124",
    "cat": "dish",
    "name": "盖浇饭(红烧)",
    "aliases": "盖饭",
    "kcal": 160,
    "protein": 7,
    "fat": 5,
    "carb": 22,
    "portion": 350
  },
  {
    "id": "dish_125",
    "cat": "dish",
    "name": "黄焖鸡米饭",
    "aliases": "",
    "kcal": 155,
    "protein": 8,
    "fat": 5.5,
    "carb": 19,
    "portion": 400
  },
  {
    "id": "dish_126",
    "cat": "dish",
    "name": "麻辣香锅",
    "aliases": "",
    "kcal": 180,
    "protein": 10,
    "fat": 12,
    "carb": 8,
    "portion": 300
  },
  {
    "id": "dish_127",
    "cat": "dish",
    "name": "火锅(均估涮菜肉)",
    "aliases": "火锅食材混合",
    "kcal": 140,
    "protein": 12,
    "fat": 8,
    "carb": 4,
    "portion": 250
  },
  {
    "id": "dish_128",
    "cat": "dish",
    "name": "汉堡(牛肉)",
    "aliases": "汉堡包",
    "kcal": 265,
    "protein": 13,
    "fat": 12,
    "carb": 28,
    "portion": 180
  },
  {
    "id": "dish_129",
    "cat": "dish",
    "name": "炸鸡块",
    "aliases": "鸡块 炸鸡",
    "kcal": 280,
    "protein": 15,
    "fat": 17,
    "carb": 16,
    "portion": 100
  },
  {
    "id": "dish_130",
    "cat": "dish",
    "name": "薯条",
    "aliases": "",
    "kcal": 298,
    "protein": 3.4,
    "fat": 15,
    "carb": 38,
    "portion": 100
  },
  {
    "id": "dish_131",
    "cat": "dish",
    "name": "沙拉(蔬菜少酱)",
    "aliases": "蔬菜沙拉",
    "kcal": 45,
    "protein": 2,
    "fat": 2,
    "carb": 4.5,
    "portion": 200
  },
  {
    "id": "dish_132",
    "cat": "dish",
    "name": "寿司(三文鱼)",
    "aliases": "",
    "kcal": 150,
    "protein": 7,
    "fat": 3.5,
    "carb": 22,
    "portion": 100
  },
  {
    "id": "dish_133",
    "cat": "dish",
    "name": "回锅肉",
    "aliases": "回锅",
    "kcal": 280,
    "protein": 14,
    "fat": 23,
    "carb": 4,
    "portion": 150
  },
  {
    "id": "dish_134",
    "cat": "dish",
    "name": "小炒肉",
    "aliases": "农家小炒肉",
    "kcal": 210,
    "protein": 13,
    "fat": 15,
    "carb": 5,
    "portion": 150
  },
  {
    "id": "dish_135",
    "cat": "dish",
    "name": "土豆烧牛肉",
    "aliases": "牛腩炖土豆 炖牛肉",
    "kcal": 145,
    "protein": 12,
    "fat": 7,
    "carb": 9,
    "portion": 200
  },
  {
    "id": "dish_136",
    "cat": "dish",
    "name": "可乐鸡翅",
    "aliases": "鸡翅",
    "kcal": 220,
    "protein": 15,
    "fat": 12,
    "carb": 12,
    "portion": 150
  },
  {
    "id": "dish_137",
    "cat": "dish",
    "name": "红烧茄子",
    "aliases": "鱼香茄子 烧茄子",
    "kcal": 120,
    "protein": 2,
    "fat": 8,
    "carb": 10,
    "portion": 180
  },
  {
    "id": "dish_138",
    "cat": "dish",
    "name": "地三鲜",
    "aliases": "土豆茄子青椒",
    "kcal": 135,
    "protein": 2.5,
    "fat": 9,
    "carb": 12,
    "portion": 180
  },
  {
    "id": "dish_139",
    "cat": "dish",
    "name": "蒜苔炒肉",
    "aliases": "蒜薹炒肉",
    "kcal": 155,
    "protein": 11,
    "fat": 10,
    "carb": 5,
    "portion": 150
  },
  {
    "id": "dish_140",
    "cat": "dish",
    "name": "西红柿鸡蛋汤",
    "aliases": "番茄蛋汤 蛋花汤",
    "kcal": 35,
    "protein": 2.5,
    "fat": 1.5,
    "carb": 3,
    "portion": 250
  },
  {
    "id": "dish_141",
    "cat": "dish",
    "name": "紫菜蛋花汤",
    "aliases": "紫菜汤",
    "kcal": 25,
    "protein": 2,
    "fat": 1,
    "carb": 2,
    "portion": 250
  },
  {
    "id": "dish_142",
    "cat": "dish",
    "name": "清炒时蔬",
    "aliases": "素炒青菜 清炒菜心 炒青菜",
    "kcal": 45,
    "protein": 2,
    "fat": 3,
    "carb": 3,
    "portion": 150
  },
  {
    "id": "dish_143",
    "cat": "dish",
    "name": "蒸蛋羹",
    "aliases": "水蒸蛋 炖蛋",
    "kcal": 80,
    "protein": 6.5,
    "fat": 5.5,
    "carb": 1.5,
    "portion": 150
  },
  {
    "id": "dish_144",
    "cat": "dish",
    "name": "水煮肉片",
    "aliases": "水煮牛肉 水煮",
    "kcal": 185,
    "protein": 14,
    "fat": 13,
    "carb": 3,
    "portion": 200
  },
  {
    "id": "dish_145",
    "cat": "dish",
    "name": "京酱肉丝",
    "aliases": "酱肉丝",
    "kcal": 195,
    "protein": 13,
    "fat": 12,
    "carb": 8,
    "portion": 150
  },
  {
    "id": "dish_146",
    "cat": "dish",
    "name": "酸菜鱼",
    "aliases": "老坛酸菜鱼",
    "kcal": 120,
    "protein": 12,
    "fat": 6,
    "carb": 4,
    "portion": 250
  },
  {
    "id": "dish_147",
    "cat": "dish",
    "name": "糖醋排骨",
    "aliases": "排骨",
    "kcal": 260,
    "protein": 14,
    "fat": 16,
    "carb": 14,
    "portion": 150
  },
  {
    "id": "dish_148",
    "cat": "dish",
    "name": "白切鸡",
    "aliases": "白斩鸡",
    "kcal": 165,
    "protein": 18,
    "fat": 10,
    "carb": 1,
    "portion": 150
  },
  {
    "id": "dish_149",
    "cat": "dish",
    "name": "蚂蚁上树",
    "aliases": "肉末粉丝",
    "kcal": 150,
    "protein": 6,
    "fat": 7,
    "carb": 16,
    "portion": 150
  },
  {
    "id": "dish_150",
    "cat": "dish",
    "name": "蚝油生菜",
    "aliases": "蚝油菜心",
    "kcal": 50,
    "protein": 1.5,
    "fat": 3.5,
    "carb": 4,
    "portion": 150
  },
  {
    "id": "dish_151",
    "cat": "dish",
    "name": "干煸豆角",
    "aliases": "干煸四季豆 豆角",
    "kcal": 130,
    "protein": 4,
    "fat": 9,
    "carb": 8,
    "portion": 150
  },
  {
    "id": "dish_152",
    "cat": "dish",
    "name": "木须肉",
    "aliases": "木樨肉 鸡蛋炒肉",
    "kcal": 160,
    "protein": 12,
    "fat": 11,
    "carb": 4,
    "portion": 150
  }
]

const EXTRA_FOODS = require('./food-extra')

// merge extra; base wins on same id
const _seen = new Set(FOODS.map((f) => f.id))
EXTRA_FOODS.forEach((f) => {
  if (f && f.id && !_seen.has(f.id)) {
    FOODS.push(f)
    _seen.add(f.id)
  }
})

const FOOD_MAP = FOODS.reduce((m, f) => {
  m[f.id] = f
  return m
}, {})

function searchFoods(keyword, cat) {
  const kw = (keyword || '').trim().toLowerCase()
  let list = FOODS
  if (cat && cat !== 'all') list = list.filter((f) => f.cat === cat)
  if (!kw) {
    // 浏览「全部」时家常菜靠前，避免被食材淹没
    if (!cat || cat === 'all') {
      const dishes = list.filter((f) => f.cat === 'dish')
      const others = list.filter((f) => f.cat !== 'dish')
      return dishes.concat(others)
    }
    return list.slice()
  }
  return list.filter((f) => {
    const blob = (f.name + ' ' + (f.aliases || '')).toLowerCase()
    return blob.indexOf(kw) >= 0
  })
}

function getFoodById(id) {
  return FOOD_MAP[id] || null
}

function scaleNutrition(food, grams) {
  const g = Number(grams)
  if (!food || !Number.isFinite(g) || g <= 0) {
    return { grams: 0, kcal: 0, protein: 0, fat: 0, carb: 0 }
  }
  const r = g / 100
  const round1 = (n) => Math.round(n * 10) / 10
  return {
    grams: round1(g),
    kcal: Math.round(food.kcal * r),
    protein: round1(food.protein * r),
    fat: round1(food.fat * r),
    carb: round1(food.carb * r)
  }
}

const DATA_NOTE = {
  unit: 'per 100g',
  ingredient: 'approx public composition values; typical +/-10-15%',
  dish: 'home-recipe average; oil/sauce +/-20-40%',
  alcohol: 'kcal includes ethanol; macros alone undercount',
  use: 'diet diary estimate only'
}

module.exports = {
  FOOD_CATS,
  FOODS,
  FOOD_MAP,
  DATA_NOTE,
  searchFoods,
  getFoodById,
  scaleNutrition
}
