var app = require('express')()

var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs')
const msgDb = require('./src/models/talk')

// http 設置
app.use('/', (req,res,next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE,OPTIONS');
  next()
})

app.get('/chat', function (req, res) {
  const findOption = {}
  msgDb.findMes(findOption, { nickName: 1, says: 1, _id: 0 }, {}, callback)
  function callback (err, data) {
    // console.log(data, 'data')
    res.send(data)
  }
})

// socket.io 設置
// 在線用戶
var onlineUsers = {}
// 當前用戶人數
var onlineCount = 0
var i = 0

io.on('connection', function (socket) {
  console.log('有人上線了！！');
  // console.log(socket);
  // 監聽新用戶的加入
  socket.name = ++i
  onlineUsers[socket.name] = socket

  // 監聽新用戶的退出
  socket.on('disconnect', function () {
    console.log('有人退出！');
    delete onlineUsers[socket.name]

  })
  // 監聽用戶發佈的聊天內容
  socket.on('message', function (msg, type) {
    // console.log(msg,type)
    // 修改昵称
    if (type === 'nick') {
      delete onlineUsers[socket.name]
      socket.name = msg
      onlineUsers[msg] = socket
      broadcast(`修改昵称为：${msg}`, socket)
    } else {
      broadcast(msg, socket)
      // 聊天数据入库
      const mesData = {
        nickName: socket.name,
        says: msg,
      }
      msgDb.save(mesData, (mes) => {
        console.log(mes)
      })
    }
  })
})
function broadcast (msg, socket) {
  for (const key in onlineUsers) {
    onlineUsers[key].send(socket.name + '：' + msg)
  }
}

http.listen(5005, function () {
  console.log('listening on port 5005');

})
