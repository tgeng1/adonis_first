/****************************************************************************
名称：常用工具函数集合
日期：2019年10月22日
****************************************************************************/

const log = use('Logger')
const Env = use('Env')
const Hashids = use('Hashids')

const Util = {
  /************************************************************************
   * 业务
   ************************************************************************/

  /**
   * 每个函数正常结束时，都须调用此函数
   * @example
   * return Util.end({msg:'', status: 1, data:{}})
   * @description
   * 用途：规范函数的返回值，使得返回值具有相同结构
   * （可选参数status）<0: 操作异常，=0：不符合业务条件被拒绝，>0：操作成功
   * @returns { error, status, msg, data }
   */
  end: (obj) => {
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      throw new Error('end(obj)的obj应该是个对象')
    }
    if (obj.error) {
      //之前出现了异常，则继续抛出
      throw new Error(obj.msg)
    }
    obj.error = false
    obj.status = !!obj.status || obj.status === 0 ? obj.status : 1 //status的值，<0: 异常，=0：正常但操作被拒绝，>0：成功
    obj.msg = obj.msg || 'success'
    obj.data = Util.deepClone(obj.data) || {}
    return obj
  },

  /**
   * 函数内部抛出异常时，须在catch里调用本函数
   * @example
   * return Util.error({msg:'', stack: err.stack, track:'随机值'})
   * @description
   * 用途：规范函数的返回值，使得返回值具有相同结构
   * track的作用是跟踪错误，可以随机输入一串乱码
   * @returns { error, status, msg, data, stack, track }
   */
  error: (obj) => {
    //不是object
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      throw new Error('error(obj)的obj应该是个对象')
    }
    obj.error = true
    obj.status = !!obj.status || obj.status === 0 ? obj.status : -1
    obj.msg = obj.msg || '程序执行出错'
    obj.data = obj.data || {}
    obj.track = obj.track || ''
    if (obj.stack) {
      log.info(obj.stack.substring(0, Util.strIndexOfMulti(obj.stack, 'at ', 3)))
    }
    log.notice(obj.track)
    if (JSON.stringify(obj.data) !== '{}') {
      let errdata = JSON.parse(JSON.stringify(obj.data))
      log.error(errdata)
    }
    log.error(obj.msg)
    throw new Error(obj.msg)
    //return obj
  },

  /**
   * 正常结束时，返回给前端的信息
   * @example
   * end2front({msg:'', data:{}, code: 0})
   * @description
   * 根据前端的要求，返回相应的数据结构
   * @returns object
   */
  end2front: (obj) => {
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      throw new Error('end2front(obj)的obj应该是个对象')
    }
    obj.msg = obj.msg || 'success'
    obj.data = obj.data || {}
    obj.code = obj.code || 0
    return obj
  },

  /**
   * 捕捉到异常时，返回给前端的信息
   * @example
   * error2front({msg:'', code: 9999, track:'随机值'})
   * @description
   * 如果要向前端显示真实错误，则{ isShowMsg: true }
   * @returns object
   */
  error2front: (obj) => {
    //不是object
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      throw new Error('error2front(obj)的obj应该是个对象')
    }
    log.notice(obj.track)
    log.error(obj.msg)
    //对前端屏蔽真实错误
    obj.msg = Env.get('NODE_ENV') === 'development' ? obj.msg : obj.isShowMsg ? obj.msg : '程序执行出错'
    obj.data = obj.data || {}
    obj.code = obj.code || 9999
    obj.track = obj.track || ''

    if (JSON.stringify(obj.data) !== '{}') {
      let errdata = Object.assign({}, obj.data)
      log.error(errdata)
    }

    return obj
  },

  /**
   * 对数字进行加密
   * @example
   * encode(id)
   */
  encode: (id) => {
    if (!id) {
      log.error('待加密encode的参数是空值')
      return null
    }
    if (!Util.isNumber(id)) {
      log.error('待加密encode的参数不是数值型')
      return id
    }
    if (Env.get('NODE_ENV') === 'development') {
      //开发环境下不加密，便于测试
      return id
    }
    return Hashids.encodeHex(id)
  },

  /**
   * 把字符串解密还原成数字
   * @example
   * decode(str)
   */
  decode: (str) => {
    if (!str) {
      log.error('待解密decode的参数是空值')
      return null
    }
    if (Env.get('NODE_ENV') === 'development') {
      //开发环境下不转换，便于测试
      return str
    }
    let origin_id = Hashids.decodeHex(str)
    if (!Util.isNumber(origin_id)) {
      log.error('解密后decode的参数不是数值型')
      return null
    }
    return origin_id
  },

  /************************************************************************
   * Arrays
   ************************************************************************/

  /*
        数组深拷贝
        var arr = [1,2,3,4,5]
        var [ ...arr2 ] = arr
    */

  /**
   * 把对象数组中，某个键的值当成键，并分组
   * @example
   * arrGroupBy(memberList, 'role_name')
   * @returns object
   */
  arrGroupBy: (arr, key) => {
    let groupedByKey = {}
    arr.map((obj) => {
      if (groupedByKey[obj[key]]) groupedByKey[obj[key]].push(obj)
      else groupedByKey[obj[key]] = [obj]
    })
    return groupedByKey
  },

  /**
   * 返回数组中的最大值
   * arrMax([1,2,3]) 返回 3
   */
  arrMax: (arr) => Math.max(...arr),

  /**
   * 返回数组中的最小值
   *  arrMin([1,2,3]) 返回 1
   */
  arrMin: (arr) => Math.min(...arr),

  /**
   * 将数组块平均拆分为指定大小的较小数组，返回一个二维数组。
   * arrSplit([1,2,3,4,5],2) 返回 [[1,2],[3,4],[5]]
   */
  arrSplit: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size)),

  /**
   * 计算数组中某个元素值的出现次数（大小写敏感）
   * arrItemCount(['a', 'a', 'b'], 'a') 返回 2
   */
  arrItemCount: (arr, value) => arr.reduce((a, v) => (v === value ? a + 1 : a + 0), 0),

  /**
   * 返回去重后的数组
   * arrNoDouble([1,2,2,3]) 返回 [1,2,3]
   */
  arrNoDouble: (arr) => [...new Set(arr)],

  /**
   * 返回两个数组中相同的元素（注：大小写敏感）
   * arrRetainDoubleCase([1,2],[2,3]) 返回 [2]
   */
  arrRetainDoubleCase: (a, b) => {
    const s = new Set(b)
    return a.filter((x) => s.has(x))
  },

  /**
   * 返回两个数组中相同的元素（注：大小写不敏感）
   * arrRetainDouble(['A','b','C'], ['c']) 返回 ['c']
   */
  arrRetainDouble: (a, b) => {
    let a1 = [],
      b1 = []
    for (let i of b) {
      b1.push(i.toLowerCase())
    }
    for (let i of a) {
      a1.push(i.toLowerCase())
    }
    const s = new Set(b1)
    return a1.filter((x) => s.has(x))
  },

  /**
   * 删除2个数组同时存在的元素，返回一个合并后的新数组
   * arrDeleteDoubleAndUnion([1,2],[2,3]) 返回 [1,3]
   */
  arrDeleteDoubleAndUnion: (a, b) => {
    const sA = new Set(a),
      sB = new Set(b)
    return [...a.filter((x) => !sB.has(x)), ...b.filter((x) => !sA.has(x))]
  },

  /**
   * 从A数组中删除AB数组同时存在的元素，返回一个新数组
   * arrDeleteDouble([1,2],[2,3]) 返回 [1]
   */
  arrDeleteDouble: (a, b) => {
    const s = new Set(b)
    return a.filter((x) => !s.has(x))
  },

  /**
   * 2个数组合并、去重、返回一个新数组
   * arrNoDoubleUnion([1,2],[2,3]) 返回 [1,2,3]
   */
  arrNoDoubleUnion: (a, b) => Array.from(new Set([...a, ...b])),

  /**
   * 返回数组中的所有元素, 除第一个
   * arrDeleteFirst([1,2,3]) 返回 [2,3]
   */
  arrDeleteFirst: (arr) => (arr.length > 1 ? arr.slice(1) : arr),

  /**
   * 返回数组中的所有元素, 除最后一个
   * arrDeleteLast([1,2,3]) 返回 [1,2]
   */
  arrDeleteLast: (arr) => arr.slice(0, -1),

  /**
   * 返回从右边开始数，第n个位置开始的数组
   * arrSliceLast([1,2,3],2) 返回 [2,3]
   */
  arrSliceLast: (arr, n = 1) => arr.slice(arr.length - n, arr.length),

  /**
   * 删除指定的元素值（可多个），返回一个新数组
   * arrDelete(['a','b','c','d','e'],'a','c') 返回 ['b','d','e']
   */
  arrDelete: (arr, ...args) => arr.filter((v) => !args.includes(v)),

  /**
   * 删除指定的元素值，返回原数组，原数组改变
   * arrDeleteRaw['a','b','c','d','e'],'d') 返回 ['a','b','c','e']
   */
  arrDeleteRaw: function (arr, val) {
    var i = 0
    while (i < arr.length) {
      if (arr[i] == val) {
        arr.splice(i, 1)
      } else {
        i++
      }
    }
    return arr
  },

  /**
   * 检查给定数组中是否包含某值（大小写敏感）
   * arrIncludesCase([1,2],3) 返回 false
   * 等同于js原生[1,2].includes(3)
   */
  arrIncludesCase: function (arr, val) {
    var i = arr.length
    while (i--) {
      if (arr[i] === val) {
        return true
      }
    }
    return false
  },

  /**
   * 判断数组中是否包含某值（大小写不敏感）
   * arrIncludes([1,2],3) 返回 false
   */
  arrIncludes: function (arr, val) {
    var i = arr.length
    while (i--) {
      if (arr[i].toLowerCase() == val.toLowerCase()) {
        return true
      }
    }
    return false
  },

  /**
   * 把数组里的所有元素转成小写
   */
  arr2LowerCase: function (arr) {
    if (!arr) {
      return []
    }
    let arr2 = []
    for (let item of arr) {
      arr2.push(item.toLowerCase())
    }
    return arr2
  },

  /**
   * 随机返回数组中的一个元素值
   * arrRandomValue([1,2,3]): 1、2、3里的随机一个值
   */
  arrRandomValue: (arr) => arr[Math.floor(Math.random() * arr.length)],

  /**
   * 返回一个打乱了顺序的数组
   * arrRandomSort([1,2,3]): 可能返回[2,1,3]
   */
  arrRandomSort: (arr) => arr.sort(() => Math.random() - 0.5),

  /**
   * 返回数组中每间隔n个的那些元素组成的数组
   * arrEveryNth([1,2,3,4,5,6,7,8,9,10],3): [1, 4, 7, 10]
   */
  arrEveryNth: (arr, nth) => arr.filter((e, i) => i % nth === 0),

  /**
   * 返回数字数组的平均值(浮点数)
   */
  arrAvg: (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length,

  /**
   * 返回一个数字数组的总和
   */
  arrSum: (arr) => arr.reduce((acc, val) => acc + val, 0),

  /**
   * 返回给定数组中有多少个数小于或等于给定值的百分比
   * arrPercentIle([1,2,3,4],3): 62.5
   */
  arrPercentIle: (arr, val) => (100 * arr.reduce((acc, v) => acc + (v < val ? 1 : 0) + (v === val ? 0.5 : 0), 0)) / arr.length,

  /************************************************************************
   * 日期类
   ************************************************************************/
  /**
   * 把秒数换算成天、时、分、秒组成的json
   * number2timeJson(10000) 返回 {second: 40, minute: 46, hour: 2, day: 0}
   */
  number2timeJson: function (value) {
    var theTime = parseInt(value) // 秒
    var theTime1 = 0 // 分
    var theTime2 = 0 // 小时
    var theTime3 = 0 //天
    if (theTime > 60) {
      theTime1 = parseInt(theTime / 60)
      theTime = parseInt(theTime % 60)
      if (theTime1 > 60) {
        theTime2 = parseInt(theTime1 / 60)
        theTime1 = parseInt(theTime1 % 60)
        if (theTime2 > 24) {
          theTime3 = parseInt(theTime2 / 24)
          theTime2 = parseInt(theTime2 % 24)
        }
      }
    }

    var result = {}
    result.second = theTime ? parseInt(theTime) : 0
    result.minute = theTime1 ? parseInt(theTime1) : 0
    result.hour = theTime2 ? parseInt(theTime2) : 0
    result.day = theTime3 ? parseInt(theTime3) : 0
    return result
  },
  /**
     格式化日期
     moment('2019-1-1').format("YYYY-MM-DD HH:mm:ss")

     日期减去10分钟
     moment('2019-01-01 00:00:00').subtract(10, "minutes")

     日期加上10个月
     moment('2019-01-01 00:00:00').add(10, "months").format("YYYY-MM-DD HH:mm:ss")

     2个日期相差多少间隔 a.diff(b, 'days')  ==  a - b
     moment('2019-01-01 00:00:00').diff(moment('2019-01-01 01:00:00'),'minutes') = -60;

     是否是合法日期
     moment('2019-13-02').isValid()

     日期转时间戳
     moment('2019-06-12 12:30:10').valueOf()//毫秒
     moment('2019-06-12 12:30:10').unix()//秒

     时间戳(毫秒）转日期
     moment(1560313810687).format('YYYY-MM-DD HH:mm:ss')

     获取当月的天数
     moment().daysInMonth()
     moment("2012-02", "YYYY-MM").daysInMonth() // 29

     转换
     moment().toArray()
     moment().toObject()

     比较
     moment('2010-10-20').isSame('2010-01-01', 'year');  // true
     moment('2010-10-20').isBefore('2010-12-31', 'year'); // false
     moment('2010-10-20').isAfter('2009-12-31', 'year'); // true
     moment('2010-10-20').isBetween('2009-12-31', '2012-01-01', 'year'); // true

     是否闰年
     moment().isLeapYear();
     moment([2001]).isLeapYear()

    */
  dateHelp: () => {},

  /************************************************************************
   * 函数类
   ************************************************************************/

  /**
   * 防抖：比如只在一次触发后，delay秒内没再触发，才执行一次。
   * 即点击完，等delay秒才会执行
   * @example
   * debounce(fn, 500)
   * @returns function
   */
  debounce: function (fn, delay = 1000) {
    let timer = null
    return function () {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, arguments)
        timer = null
      }, delay)
    }
  },

  /**
   * 节流：持续触发时，保证每delay秒内只执行一次
   * @example
   * throttle(fn, 1000)
   * @returns function
   */
  throttle: function (func, delay) {
    var timer = null
    var startTime = Date.now()
    return function () {
      var curTime = Date.now()
      var remaining = delay - (curTime - startTime)
      var context = this
      var args = arguments
      clearTimeout(timer)
      if (remaining <= 0) {
        func.apply(context, args)
        startTime = Date.now()
      } else {
        timer = setTimeout(func, remaining)
      }
    }
  },

  /**
   * 让程序暂停 n 毫秒
   * await sleep(1000)
   */
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
     * 避免调用await函数时大量使用try{func()}catch(e){}结构，用to函数使得页面整洁
     * [err, result] = await to(func());
       if (err) {
         return console.log(err)
       }
     */
  to: (promise) => {
    if (!promise || !Promise.prototype.isPrototypeOf(promise)) {
      return new Promise((resolve, reject) => {
        reject(new Error('to要求参数是promise类型'))
      }).catch((err) => {
        return [err, null]
      })
    }
    return promise
      .then(function () {
        return [null, ...arguments]
      })
      .catch((err) => {
        return [err, null]
      })
  },

  /**
   * 在控制台打印函数执行时间，并返回函数结果
   * function aa(){}
   * let result = funcTime(aa) 返回 xxxx ms
   */
  funcTime: (callback) => {
    console.time('耗费时间')
    const r = callback()
    console.timeEnd('耗费时间')
    return r
  },

  /************************************************************************
   * Math 数学类
   ************************************************************************/

  /**
   * 将数字四舍五入到指定的位数
   */
  mathRound: (num, n = 0) => {
    num = parseFloat(num)
    n = parseInt(n)
    return (Math.round(num * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n)
  },

  /**
   * 两个参数之间的随机整数
   * mathRandomDuration(5,7) 返回随机数：5 <= x <= 7
   */
  mathRandomInt: (lowerValue, upperValue) => {
    var chioces = upperValue - lowerValue + 1
    return Math.floor(Math.random() * chioces + lowerValue)
  },

  /**
   * 两个参数之间的随机浮点数
   * mathRandomDuration(5,7) 返回随机数：5 <= x <= 7
   */
  mathRandomFloat: (min, max) => Math.random() * (max - min) + min,

  /**
   * 返回从0开始的斐波那契数列的长度为n的数组
   * mathFibonacci(5): [0, 1, 1, 2, 3]
   */
  mathFibonacci: (n) =>
    Array(n)
      .fill(0)
      .reduce((acc, val, i) => acc.concat(i > 1 ? acc[i - 1] + acc[i - 2] : i), []),

  // isDivisible: 检查第一个数值参数是否可被另一个数字变量整除
  // 使用模数运算符 (%) 检查余数是否等于0
  isDivisible: (dividend, divisor) => dividend % divisor === 0,

  // isEven: 如果给定的数字为偶数, 则返回true, 否则为false
  isEven: (num) => num % 2 === 0,

  /**
   * 计算最大公约数
   */
  mathGCD: (a, b) => {
    let x = a,
      y = b
    let _gcd = (_x, _y) => (!_y ? _x : _gcd(_y, _x % _y))
    return _gcd(a, b)
  },

  /**
   * 计算最小公倍数
   */
  mathLCM: (x, y) => {
    const gcd = (x, y) => (!y ? x : gcd(y, x % y))
    return Math.abs(x * y) / gcd(x, y)
  },

  /************************************************************************
   * 对象类
   ************************************************************************/

  /**
   * 删除对象的空属性
   * @example
   *
   */
  objDeleteEmpty: (obj) => {
    Object.keys(obj).forEach((key) => !obj[key] && delete obj[key])
    return obj
  },

  /**
   * 复制并过滤：第二个参数覆盖第一个参数，且第二个参数多余的key不理睬
   * @example
   * assignFilter({name}, {name:'xx', aa:1 }) 返回 {name: 'xx'}
   * @returns object
   */
  assignFilter: (expectObj, rawObj) => {
    for (let k in rawObj) {
      if (expectObj.hasOwnProperty(k)) {
        expectObj[k] = rawObj[k]
      }
    }
    return expectObj
  },

  /* 对象拷贝
        var obj = {
            name: 'FungLeo',
            sex: 'man',
        }
        var { ...obj2 } = obj//浅拷贝
        var obj2 = JSON.parse(JSON.stringify(obj))//基本类型的深拷贝
   */

  /**
   * 对象深拷贝
   * @example
   * deepClone(obj)
   * @returns object
   */
  deepClone: function (x) {
    // Object.create(null) 的对象，没有hasOwnProperty方法
    function hasOwnProp(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key)
    }

    // 仅对对象和数组进行深拷贝，其他类型，直接返回
    function isClone(x) {
      const t = Util.type(x)
      return t === 'object' || t === 'array'
    }

    const t = Util.type(x)

    let root = x

    if (t === 'array') {
      root = []
    } else if (t === 'object') {
      root = {}
    }

    // 循环数组
    const loopList = [
      {
        parent: root,
        key: undefined,
        data: x,
      },
    ]

    while (loopList.length) {
      // 深度优先
      const node = loopList.pop()
      const parent = node.parent
      const key = node.key
      const data = node.data
      const tt = Util.type(data)

      // 初始化赋值目标，key为undefined则拷贝到父元素，否则拷贝到子元素
      let res = parent
      if (typeof key !== 'undefined') {
        res = parent[key] = tt === 'array' ? [] : {}
      }

      if (tt === 'array') {
        for (let i = 0; i < data.length; i++) {
          // 避免一层死循环 a.b = a
          if (data[i] === data) {
            res[i] = res
          } else if (isClone(data[i])) {
            // 下一次循环
            loopList.push({
              parent: res,
              key: i,
              data: data[i],
            })
          } else {
            res[i] = data[i]
          }
        }
      } else if (tt === 'object') {
        for (let k in data) {
          if (hasOwnProp(data, k)) {
            // 避免一层死循环 a.b = a
            if (data[k] === data) {
              res[k] = res
            } else if (isClone(data[k])) {
              // 下一次循环
              loopList.push({
                parent: res,
                key: k,
                data: data[k],
              })
            } else {
              res[k] = data[k]
            }
          }
        }
      }
    }

    return root
  },

  /**
   * 是否有某个属性/键（大小写敏感）
   * objHas({aa:1}, 'aa'): true
   */
  objHas: function (obj, key) {
    return obj.hasOwnProperty(key)
  },

  /**
   * 字符串：驼峰转为连字符
   */
  str2Line: (hump) => hump.replace(/([A-Z]|\d)/g, (a, l) => `_${l.toLowerCase()}`),
  /**
   * 字符串：连字符转为驼峰
   */
  str2Camel: (name) =>
    name.replace(/\_(\w)/g, function (all, letter) {
      return letter.toUpperCase()
    }),

  /**
   * 驼峰转为连字符
   * @example
   * toLine({ userName: 1 }) 返回 {user_name: 1}
   * @description
   * 通常在操作数据库之前调用本函数，把变量转换成表的真实字段
   * @returns object
   */

  toLine: (data) => {
    let newData = null
    if (Util.isObj(data)) {
      newData = {}
      for (let key in data) {
        newData[Util.str2Line(key)] = data[key]
      }
    } else if (Util.isArray(data)) {
      if (Util.isString(data[0])) {
        newData = []
        for (let key of data) {
          newData.push(Util.str2Line(key))
        }
      } else if (Util.isObj(data[0])) {
        newData = []
        for (let a of data) {
          let newObj = {}
          for (let k in a) {
            newObj[Util.str2Line(k)] = a[k]
          }
          newData.push(newObj)
        }
      } else {
        newData = data
      }
    } else if (Util.isString(data)) {
      newData = Util.str2Line(data)
    } else {
      newData = data
    }
    return newData
  },

  /**
   * 连字符转为驼峰
   * @example
   * toCamel({ user_name: 1 }) 返回 {userName: 1}
   * @description
   * 通常在获取数据库数据之后调用本函数，把变量转换成js常用的驼峰写法
   * @returns object
   */

  toCamel: (data) => {
    let newData = null
    if (Util.isObj(data)) {
      newData = {}
      for (let key in data) {
        newData[Util.str2Camel(key)] = data[key]
      }
    } else if (Util.isArray(data)) {
      if (Util.isString(data[0])) {
        newData = []
        for (let key of data) {
          newData.push(Util.str2Camel(key))
        }
      } else if (Util.isObj(data[0])) {
        newData = []
        for (let a of data) {
          let newObj = {}
          for (let k in a) {
            newObj[Util.str2Camel(k)] = a[k]
          }
          newData.push(newObj)
        }
      } else {
        newData = data
      }
    } else if (Util.isString(data)) {
      newData = Util.str2Camel(data)
    } else {
      newData = data
    }

    return newData
  },

  /**
   * url参数转换为对象
   * @example
   * Util.query2obj('http://abc.com?search_word=中国')
   */
  query2obj: function (url) {
    var reg_url = /^[^\?]+\?([\w\W]+)$/,
      reg_para = /([^&=]+)=([\w\W]*?)(&|$|#)/g,
      arr_url = reg_url.exec(url),
      ret = {}
    if (arr_url && arr_url[1]) {
      var str_para = arr_url[1],
        result
      while ((result = reg_para.exec(str_para)) != null) {
        ret[result[1]] = result[2]
      }
    }
    return ret
  },

  /**
   * param 将要转为URL参数字符串的对象
   * key URL参数字符串的前缀
   * encode true/false 是否进行URL编码,默认为true
   * return URL参数字符串
   * @example
   * Util.obj2query({ a: 1, b: 2 })
   */
  obj2query: function (param, key, encode) {
    if (param == null) return ''
    var paramStr = ''
    var t = typeof param
    if (t == 'string' || t == 'number' || t == 'boolean') {
      paramStr += '&' + key + '=' + (encode == null || encode ? encodeURIComponent(param) : param)
    } else {
      for (var i in param) {
        var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i)
        paramStr += Util.obj2query(param[i], k, encode)
      }
    }
    return paramStr
  },

  /************************************************************************
   * 字符串类
   ************************************************************************/

  /*
   * 删除bom头 \xef\xbb\xbf
   */
  strDeleteBOM: function (content) {
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1)
    }
    return content
  },

  /**
   * 返回字符串第n次出现的下标位置
   * strIndexOfMulti('00ab00ab', 'ab', 2) 返回 6
   * @param {字符串} str
   * @param {待查找} cha
   * @param {第n次出现} num
   */
  strIndexOfMulti: function (str, cha, num) {
    var x = str.indexOf(cha)
    for (var i = 0; i < num - 1; i++) {
      x = str.indexOf(cha, x + 1)
    }
    return x
  },

  /**
   * 返回字符串在某个字符串中出现的次数
   * strCount('a23aaa23aa','23') 返回 2
   */
  strCount: function (s, c) {
    return s.split(c).length - 1
  },

  /**
   * 返回字符串中出现最多的字符和次数，返回json对象
   * strFindMost('啊12啊啊啊3') 返回 {value: "啊", count: 4}
   */
  strFindMost: function (str) {
    let obj = {}
    for (let i = 0; i < str.length; i++) {
      let key = str[i] //key中存储的是每一个字符串
      if (obj[key]) {
        //判断这个键值对中有没有这个键
        obj[key]++
      } else {
        obj[key] = 1 //obj[w]=1
      }
    }
    let maxCount = 0 //假设是出现次数最多的次数
    let maxString = '' //假设这个字符串是次数出现最多的字符串
    for (let key in obj) {
      if (maxCount < obj[key]) {
        maxCount = obj[key] //保存最大的次数
        maxString = key
      }
    }
    return { value: maxString, count: maxCount }
  },

  /**
   * 清除字符串的任意空格
   * strDeleteSpace('  he l lo  ') 返回 hello
   */
  strDeleteSpace: (str) => str.replace(/\s/g, ''),

  /**
   * 清除左空格
   */
  strLTrim: function (str) {
    return str.replace(/^\s+/, '')
  },

  /**
   * 清除右空格
   */
  strRTrim: function (val) {
    return val.replace(/\s+$/, '')
  },

  /**
   * 反转字符串
   * strReverse('abc') 返回 'cba'
   */
  strReverse: (str) => [...str].reverse().join(''),

  /**
   * 按字母顺序排序
   * strSort('badce') 返回 'abcde'
   */
  strSort: (str) =>
    str
      .split('')
      .sort((a, b) => a.localeCompare(b))
      .join(''),

  /************************************************************************
   * 类型检测与转换
   ************************************************************************/

  /**
   * Map转二维数组
   */
  map2arr: function (x) {
    return [...x]
  },

  /**
   * 二维数组转Map，如[[a,1],[b,2]]可转成Map对象
   */
  arr2map: function (x) {
    return new Map(x)
  },

  /**
   * Map转json对象
   * Map对象的键值要为字符串，不能是复杂对象
   */
  map2obj: function (x) {
    //转为json对象
    let obj = Object.create(null)
    for (let [k, v] of x) {
      obj[k] = v
    }
    return obj
  },

  /**
   * json对象转Map
   * 传入json对象，返回Map对象
   */
  obj2map: function (obj) {
    let strMap = new Map()
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k])
    }
    return strMap
  },

  /**
   * 判断一个变量是否是false
   * 有的字符串值为'null'、'undefined'也认为是false
   */
  isFalse: function (data) {
    if (!data) {
      return true
    } else {
      if (Object.prototype.toString.call(data) == '[object String]') {
        //是字符串
        let str = data.toLowerCase()
        if (str === 'null' || str === 'undefined') {
          return true
        }
      }
    }
    return false
  },

  /**
   * 把null或'null'或'undefined'转为''
   * null2empty(data, '')
   */
  null2empty: function (data, empty) {
    if (!data) {
      data = empty
    } else if (Object.prototype.toString.call(data) == '[object String]') {
      let str = data.toLowerCase()
      if (str === 'null' || str === 'undefined') {
        data = empty
      }
    }
    return data
  },

  /**
   * 检测类型
   * @example
   *
   */
  type: function (x, strict = false) {
    const toString = Object.prototype.toString
    strict = !!strict

    // fix typeof null = object
    if (x === null) {
      return 'null'
    }

    const t = typeof x

    // 严格模式 区分NaN和number
    if (strict && t === 'number' && isNaN(x)) {
      return 'nan'
    }

    // number string boolean undefined symbol
    if (t !== 'object') {
      return t
    }

    let cls
    let clsLow
    try {
      cls = toString.call(x).slice(8, -1)
      clsLow = cls.toLowerCase()
    } catch (e) {
      // ie下的 activex对象
      return 'object'
    }

    if (clsLow !== 'object') {
      if (strict) {
        // 区分NaN和new Number
        if (clsLow === 'number' && isNaN(x)) {
          return 'NaN'
        }
        // 区分 String() 和 new String()
        if (clsLow === 'number' || clsLow === 'boolean' || clsLow === 'string') {
          return cls
        }
      }
      return clsLow
    }

    if (x.constructor == Object) {
      return clsLow
    }

    // Object.create(null)
    try {
      // __proto__ 部分早期firefox浏览器
      if (Object.getPrototypeOf(x) === null || x.__proto__ === null) {
        return 'object'
      }
    } catch (e) {
      // ie下无Object.getPrototypeOf会报错
    }

    // function A() {}; new A
    try {
      const cname = x.constructor.name

      if (typeof cname === 'string') {
        return cname
      }
    } catch (e) {
      // 无constructor
    }

    // function A() {}; A.prototype.constructor = null; new A
    return 'unknown'
  },

  /**
   * 是否是空的json对象：{}
   *
   */
  isObjEmpty: function (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  },

  /**
   * 是否是json对象
   *
   */
  isObj: function (obj) {
    return Object.prototype.toString.call(obj) == '[object Object]'
  },

  /**
   * 判断是否为一个数字
   * @param {*} value
   */
  isNumber: function (value) {
    return !isNaN(parseFloat(value)) && isFinite(value)
  },

  /**
   * 是否是数组
   */
  isArray: function (value) {
    return Object.prototype.toString.call(value) == '[object Array]'
  },

  /**
   * 是否是函数
   */
  isFunction: function (value) {
    return Object.prototype.toString.call(value) == '[object Function]'
  },

  /**
   * 是否是字符串
   */
  isString: (str) => Object.prototype.toString.call(str) == '[object String]',

  /**
   * 是否是布尔值
   */
  isBoolean: (val) => Object.prototype.toString.call(val) == '[object Boolean]',
}

module.exports = Util
