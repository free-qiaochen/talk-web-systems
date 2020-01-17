##### 0.0.0.0.1. 小何的笔记 借鉴 -->

一、http
HTTP 无状态的，服务器不能发送请求给客户端，需要客户端发送请求之后服务端返回响应给客户端，之后会直接断开，不能实现实时推送技术；

现在，很多网站为了实现推送技术，所用的技术都是 Ajax 轮询。轮询是在特定的的时间间隔（如每 1 秒），由浏览器对服务器发出 HTTP 请求，然后由服务器返回最新的数据给客户端的浏览器。这种传统的模式带来很明显的缺点，即浏览器需要不断的向服务器发出请求，然而 HTTP 请求可能包含较长的头部，其中真正有效的数据可能只是很小的一部分，显然这样会浪费很多的带宽等资源
二、websocket
1、websocket：双向通讯，客户端可以给服务端，服务端可以给客户端发送消息；
2、下载第三方包：npm i socket.io 到项目目录；

websocket 使用场景 1.社交订阅 2.多玩家游戏 3.协同合作 4.点击流数据 5.股票基金等实时报价 6.体育实况更新 7.基于位置的应用 8.在线教育 9.多媒体聊天
三、搭建 websocket 服务器；

```js
const express = require('express')
let app = express()

//创建websocket服务
const server = require('http').createServer(app)
const io = require('socket.io')(server)

//监听与客户端的连接事件;
io.on('connection', socket => {
  //这个socket是前端传入的变量名;
  console.log('服务端连接成功')
}) //io连接事件可以随意放置; 监听到事件则会给出应答;

//这里要用server去监听端口，app.listen监听不能找到socket.io文件；
server.listen(3000)
```

1、websocket 连接成功之后，会自动创建一个隐藏的 js 文件，路径：/socket.io/socket.io.js；

2、在静态页面里，创建 script 标签引入该 js 文件，引入之后有一个 io 对象，可以调用一下 io 对象：let socket = io()；就可以使用 socket.emit 和 socket.on 了；
建立的客户端，服务端能记住每个连接成功的客户端，哪个浏览器发送的消息，哪个浏览器接收；

四、互发消息
1、socket.emit()；只让自己收到消息；
2、socket.broadcast.emit()；除了自己其他人都会收到消息，当用户退出最有用，因为不需要给退出的用户得知
3、io.emit()；都会收到消息；

```js
//前端发送
socket.emit('fasong', 'hahaha')

//后端接收
socket.on('fasong', data => {
  socket.emit('huida', data) //将数据再发给前台;
})

//前端接收
socket.on('huida', data => {
  console.log(data) //接收到自己发出的消息;
})
```

如何进入一个房间和离开一个房间

```js
io.on('connection', socket => {
  console.log('有人上线了')
  // 加入指定的房间
  socket.join('a room')
  // 用to或者in是一样的, 用emit来给事件
  io.to('a room').emit('some event')
  // 进入多个房间
  soket
    .to('room1')
    .to('room2')
    .emit('hello')
  socket.on('disconnection', socket => {
    console.log('有人离开了')
  })
})
```

在房间内发送消息

```js
// 不包括发送者
soket.broadcast.to('roomA').emit('message', '大家好')
// 包括发送者
io.sockets.in('roomA').emit('message', '大家好')
```

给指定用户发送消息
`io.sockets.socket(socketId).emit('message','唯有你')`
如何 set 和 get socket 属性

```js
io.sockets.on('connection', function(socket) {
  // 监听设置nickname事件
  socket.on('set nickname', name => {
    // 将socket的nickname属性设置为传入参数的name
    socket.set('nickname', name, () => {
      socket.emit('ready')
    })
  })
  // 监听获取nickname事件
  socket.on('get nickname', () => {
    socket.get('nickname', (err, name) => {
      console.log('获取用户', name)
    })
  })
})
```

离开一个房间
`soket.leave(room[,callback])`

### 0.0.1. 五、聊天室

```js
//前端发送
socket.emit('fasong', '您好呀server')
socket.emit('/user/list', list => {})
socket.emit('user/modify', 'hny', result => {}) // 多个参数发送方式

//后端接收
socket.on('fasong', msg => {
  io.emit('huida', msg)
})
socket.on('user/modify', (name, callback) => {
  // 接收多个参数方式
  user.name = name
  callback('修改成功')
})
socket.on('/user/list', callback => {
  callback('success')
})

//前端展示
socket.on('huida', msg => {
  document.write(msg + '<br>')
})
```

- 客户端（前端）连接 socket.io

```js
// socketIoClient.js
import IO from 'socket.io-client'
// const socket = IO('ws://localhost:3006', {
//   path: '/router' // 如果需要可以添加地址
// })
const ioSocket = IO('http://47.104.107.19:5005/')
// 监听连接服务器
ioSocket.on('connect', function(data) {
  // ioSocket.send('hello ,I am from client')
})
// 接收服务端的信息
ioSocket.on('message', function(msg) {
  // 本人消息过滤，样式和内容过滤
  console.log(msg)
})
ioSocket.on('disconnect', function(params) {
  console.log('服务端关闭了！')
})
```

- 服务端 socket.io 服务

```js
// socketIoServer.js
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs')

// 跨域設置
app.use('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild'
  )
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE,OPTIONS')
  next()
})

// socket.io 設置
// 在線用戶
var onlineUsers = {}
var i = 0
// socket.emit() 只让自己收到消息
// socket.broadcast.emit() 发给除了自己的其他所有人，当用户退出时比较有用
// io.emit() 发给所有人

io.on('connection', function(socket) {
  console.log('有人上線了！！')
  // console.log(socket);
  // 監聽新用戶的加入
  socket.name = ++i
  onlineUsers[socket.name] = socket
  // 发送消息给所有人
  io.emit('message', `欢迎${socket.name}`)
  // 監聽新用戶的退出
  socket.on('disconnect', function() {
    console.log('有人退出！')
    delete onlineUsers[socket.name]
  })
  // 監聽用戶發佈的聊天內容
  socket.on('message', function(msg, type) {
    console.log(msg,type)
    broadcast(msg, socket)
  })
})
function broadcast(msg, socket) {
  for (const key in onlineUsers) {
    onlineUsers[key].send(socket.name + '：' + msg)
  }
}
// 监听5005端口
http.listen(5005, function() {
  console.log('listening on port 5005')
})
```
