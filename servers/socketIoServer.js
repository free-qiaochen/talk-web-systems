var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs')
const fse = require("fs-extra")
var path = require('path')
const msgDb = require('./src/models/talk')
const file_routers = require('./src/routes/upload-2')


// http 設置
app.use('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE,OPTIONS');
  next()
})
// 静态文件托管，可以让前端通过服务器绝对地址访问到文件(http://10.105.18.185:5005/files/1.zip)
app.use('/files', express.static('../uploadFile/totalFile'))
app.use('/file/', file_routers)
// 获取聊天列表接口
app.get('/chat', function (req, res) {
  let { num } = req.query
  // console.log(req.query)
  const findOption = {}
  msgDb.findMes(findOption, { nickName: 1, says: 1,type:1, _id: 0 }, { limit: Number(num), sort: { _id: -1 } }, callback)
  function callback (err, data) {
    console.log(err,data, 'data')
    res.send(data)
  }
})
// 清空数据库消息
app.get('/delMes', function (req, res) {
  let { num } = req.query
  console.log(num)
  // msgDb.updateMessage({}, {}, () => {
  //   res.send('删除成功')
  // })
})


// socket.io 設置
// 在線用戶
var onlineUsers = {}
// 當前用戶人數
var onlineCount = 0
var i = 0
// socket.emit() 只让自己收到消息
// socket.broadcast.emit() 发给除了自己的其他所有人，当用户退出时比较有用
// io.emit() 发给所有人

io.on('connection', function (socket) {
  console.log('有人上線了！！');
  // console.log(socket);
  // 監聽新用戶的加入
  socket.name = ++i
  onlineUsers[socket.name] = socket
  onlineCount++
  // 发送消息给自己
  socket.emit('takeCar', `${socket.name}`, onlineCount)
  // 監聽新用戶的退出
  socket.on('disconnect', function () {
    console.log('有人退出！');
    delete onlineUsers[socket.name]
    onlineCount--
    socket.broadcast.emit('leave', `${socket.name}`, onlineCount)
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
  // 监听发送图片
  socket.on('sendImg', function (data) {
    data.nickName = socket.name
    socket.broadcast.emit('receiveImg', data, onlineCount)
    //图片文件的存储目录
    const TotalFileDir = path.resolve(__dirname, "../", "uploadFile/totalFile");
    const totalPaths = TotalFileDir + `/${data.name}`
    // 目录，文件不存在就创建
    fse.ensureDirSync(TotalFileDir)
    fse.ensureFileSync(totalPaths, '')
    //过滤data:URL
    var base64Data = data.img.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = Buffer.from(base64Data, 'base64');
    fse.writeFile(totalPaths, dataBuffer, function (err) {
      if (err) {
        console.error(err)
        // res.send(err);
      }else{
        console.log('图片写入成功！')
      }
    });
    // console.log(socket.handshake.headers)
    const filePath = `http://${socket.handshake.headers.host}/files/${data.name}`
    console.log(filePath)
    const mesData = {
      nickName: data.nickName,
      says: filePath,
      type: 'href'
    }
    // 图片入库，有问题？？
    msgDb.save(mesData, (mes) => {
      console.log(mes)
    })
  })
})
function broadcast (msg, socket) {
  for (const key in onlineUsers) {
    onlineUsers[key].send(socket.name + '：' + msg, onlineCount)
  }
}

http.listen(5005, function () {
  console.log('listening on port 5005');

})
