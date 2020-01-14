var app = require('express')()

var http = require('http').Server(app)
var io = require('socket.io')(http)

var fs = require('fs')

// http 設置
app.get('/', function (req,res) {
  // res.send('ok')
  fs.readFile('./socketIoClient.html',function (err, data) {
    if (err) {
      console.log(err);
      callback('未找到文件')
    } else {
      callback(data)
    }
  })
  function callback(data) {
    res.send(data.toString())
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
  socket.on('message', function (msg,type) {
    // console.log(msg,type)
    // 修改昵称
    if (type === 'nick') {
      delete onlineUsers[socket.name]
      socket.name = msg
      onlineUsers[msg] = socket
      broadcast(`修改昵称为：${msg}`, socket)
    } else {
      broadcast(msg, socket)
    }
  })
})
function broadcast(msg, socket) {
  for (const key in onlineUsers) {
    onlineUsers[key].send(socket.name+'：'+ msg)
  }
}

http.listen(5005, function () {
  console.log('listening on port 5005');
  
})
