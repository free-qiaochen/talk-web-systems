服务端功能规划，主要思路记录；
1、

## 小记 node --- express

node --- express 创建服务，跨域设置，路由，热更新

## 一、第三方包 express

安装：npm i express -S

### 1、启动一个服务

```javascript
const express = require('express)
let app = express()
app.listen(8080) //监听
app.get('/',(req,res)=>{}) //设置路由
```

### 2、请求方式可以使用 get,post,put,delete...

app.all:代表全部路由，一般写在页面最底部，用来响应 404；
当多个相同的路径，请求方式不同是，找到一个则找不到下一个；

```javascript
cosnt app = require('express')()
app.listen(8080,()=>{console.log('8080端口服务已启动')})
app.get('/',(req,res)=>{res.send('hello')})
```

### 3、请求的参数

参数接收：
_查询字符串接收使用 req.query_
path 路径使用 req.params
path 路径是伪静态，对网络蜘蛛有优化，写地址需要带动态的，需要冒号写:name；
:nid/:page，接收之后是{nid:123,page:11}；
_---_
使用 URLSearchParams 接口；（前端可以直接使用），不需要连接服务用；
var query = new URLSearchParams(url);
可以使用 for...of 遍历；
获取单个字段：query.get(key); 括号获取具体的名；
查询：query.has(key)；判断是否存在；
添加字段：query.append(key,value)；
删除：query.delete(key)；
修改：query.set(key,value)；
转回去：query.toString()；转回路由；
urlsearchParams 配合 Object.fromEntries()；将假对象转换为真对象

```javascript
Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'))
// { foo: "bar", baz: "qux" }
```

### 4、路由

1> 依据 path（请求地址）不同，返回不同响应；（请求方法 get，post，put，delete）
2> 地址 path 可以用正则表达式形式
3> `res.send()` 向前端发送响应内容
4> res.sendFile(path)；开放静态页面；需要填写绝对路径
`res.sendFile(`\${\_\_dirname}/index.html`)`
5> 所有路由都是从'/'根开始的；
6> app.method(path,callback)；获取响应方式； ？？

### 5、路由模块化(拆分路由模块)

1> 创建

```javascript
// --- /router/users.js
const express = require('express')
const routers = express.Router()
routers.get()
module.exports = routers
```

2> 引入
使用`app.use(routes)`引用

```javascript
const routers = require('./router/users.js')
app.use('./api/users', routers)
```

之后 users.js 文件下的所有 api 访问都需要添加 `/api/users` 的前缀了

### 6、express 的跨域问题

服务端配置 cors 处理

```javascript
app.use('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild'
  )
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE,OPTIONS')
  next()
})
```

---

### 7、接收前端传入的 post 方法的参数

- 下载 npm 包 `body-parser`
- 引入模块 `const bodyParser = require('body-parser')`
- 加载 json 中间件
  `app.use(bodyParser.json())`
- 加载解析 urlencoded 请求体的中间件
  `app.use(bodyParser.urlencoded({extended:false}));`
- req.body,显示传入的 data 数据
  使用 postman 测试接口：点击 params---body----x-www-form-urlencoded；

#### 8、node 修改自动重启，热更新

- 全局安装：`npm i -g nodemon`
- 在项目根目录（和服务入口文件同级）创建一个文件，nodemon.json 并写入，之后启动项目需要`nodemon index.js`启动

```json
// nodemon.json
{
  "restartable": "rs",
  "ignore": [".git", ".svn", "node_modules/**/node_modules"],
  "verbose": true,
  "execMap": {
    "js": "node --harmony"
  },
  "watch": [],
  "env": {
    "NODE_ENV": "development"
  },
  "ext": "js json"
}
```

- 修改入口文件( 可省略？？ )

```js
const debug = require('debug')('my-application')
app.listen(80, () => {
  debug('服务器运行在80端口上')
})
```

- 修改 package.json 的 script 运行脚本

```json
"scripts": {
    "start": "nodemon ./index.js"
}
```

之后就可以直接 npm start 启动服务了

**javascript 运行机制**
  javascript 是单线程的
  主要用途是与用户交互，操作 dom，因此只能是单线程，

所有同步任务都会放到栈中，回调函数都会放在任务对列，只有执行栈全部清空才会执行任务队列，回调函数比如定时器。

setTimout 的最小时间是 4ms，低于 4 毫秒自动设为 4ms。

nodejs 的  
process.nextTick(不推荐使用)和 setImmediate 的值是一个回调函数。

process.nextTick 方法可以在当前"执行栈"的尾部之前执行。比 settimeout 先执行，

setImmediate 方法则是在当前"任务队列"的尾部添加事件，它指定的任务总是注册到下一次 Event Loop 时执行，同一轮的 event 先执行，如同 setTimeout(func, 0)

多个 process.nextTick 语句总是在当前"执行栈"一次执行完，多个 setImmediate 可能则需要多次 loop 才能执行完。

process.nextTick(function foo() {
process.nextTick(foo);
});
将会一直循环递归，不会去执行其他的代码
