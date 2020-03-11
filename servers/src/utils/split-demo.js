var app = require('express')()

var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs')
const msgDb = require('./src/models/talk')
const path = require("path")
const fse = require("fs-extra")
const multiparty = require("multiparty")

// http 設置
app.use('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE,OPTIONS');
  next()
})
// 获取聊天列表接口
app.get('/chat', function (req, res) {
  let { num } = req.query
  // console.log(req.query)
  const findOption = {}
  msgDb.findMes(findOption, { nickName: 1, says: 1, _id: 0 }, { limit: Number(num), sort: { _id: -1 } }, callback)
  function callback (err, data) {
    // console.log(data, 'data')
    res.send(data)
  }
})
// ----------------------
// 文件片的存储目录
const ChunkFileDir = path.resolve(__dirname, "../", "uploadFile/chunkFile");
//合成的文件的存储目录
const TotalFileDir = path.resolve(__dirname, "../", "uploadFile/totalFile");
let fileName = ''
let serverChunkNumber = 0
let clientChunkNumber = 0
let chunkDir = ''
let nameIndex = 0 //合成重复文件重命名后缀
// 发送（接收）文件接口
app.post('/upload-file', function (req, res) {
  try {
    //关于multiparty的讲解，请看：https://www.cnblogs.com/wangyinqian/p/7811719.html
    const multipart = new multiparty.Form();
    // 解析FormData数据
    multipart.parse(req, (err, fields, files) => {
      if (err) {
        return;
      }
      //chunk:{
      // path:存储临时文件的路径,
      // size:临时文件的大小,
      // }
      const [chunk] = files.chunk;
      const [hash] = fields.hash;
      //获取切片总数量
      clientChunkNumber = +fields.chunkNumber[0];
      //获取文件名称
      [fileName] = fields.fileName;
      //本次文件的文件夹名称，如 xx/xx/uploadFile/chunkFile/梁博-出现又离开.mp3
      chunkDir = `${ChunkFileDir}/${fileName}`;

      // 切片目录不存在，创建切片目录chunkDir
      if (!fse.existsSync(chunkDir)) {
        fse.mkdirs(chunkDir);
      } else {
        console.log('文件切片目录已存在')
        res.send("已接收文件片 " + hash)
        return
      }
      //将每片文件移动进chunkDir下
      fse.move(chunk.path, `${chunkDir}/${hash}`);
      //server 端计算切片数量，
      serverChunkNumber = serverChunkNumber + 1
      //当到数时，自动合并文件
      if (clientChunkNumber === serverChunkNumber && serverChunkNumber !== 0) {
        //这里方便测试，用 get 方法单独来 merge 文件
        console.log('ifMerge', clientChunkNumber, serverChunkNumber)
        // mergeFileChunk(ChunkFileDir,TotalFileDir,fileName)
        serverChunkNumber = 0
        // res.status(200).json('Done!')
        // res.send('Done!')
      }
      //这么写返回 client 会出现乱码
      // res.end("已接收文件片 "+hash);
      // res.status(200).json("已接收文件片 " + hash);
      res.send("已接收文件片 " + hash)

    });

  } catch (err) {
    // res.status(400).json(err)
    res.send(err)
  }
})
//合并文件
app.get('/merge', async (req, res) => {
  try {
    await mergeFileChunk(ChunkFileDir, fileName)

    // res.status(200).json("合并文件成功!");
    res.send('合并文件成功!')
  } catch (err) {
    // res.status(400).json(err, 'err104')
    res.send('err404!')
  }
});
// 合并文件
const mergeFileChunk = async (chunkDirs, fileName) => {
  const chunkDir = chunkDirs + '/' + fileName
  console.log(chunkDirs, '--', fileName)
  // 指定合成文件名以及目录
  let totalPaths = TotalFileDir + '/' + '合成-' + `${fileName}`
  if (fse.existsSync(TotalFileDir + '/' + '合成-' + `${fileName}`)) {
    console.log('文件已存在')
    totalPaths = TotalFileDir + '/' + `${++nameIndex}--合成-${fileName}`
    // return
  }
  // 目录，文件不存在就创建
  fse.ensureDirSync(TotalFileDir)
  fse.ensureFileSync(totalPaths, '')
  // 读取切片文件目录，返回切片文件集合
  const chunkPaths = fse.readdirSync(chunkDir)
  console.log(chunkPaths)
  // 循环读取切片文件内容并合并进totalPaths中--???合并有问题?????????????
  chunkPaths.forEach((chunkPath, index) => {
    console.log('合并：', index, chunkPaths.length)
    // 获取单个切片文件的目录
    const chunkFilePath = `${chunkDir}/${chunkPath}`
    // 同步按顺序读取文件切片，保证文件正常合成
    const data = fse.readFileSync(chunkFilePath)
    // 将每个文件片合并进单一文件中
    fse.appendFileSync(totalPaths, data)
    // 删除片文件
    // fse.unlinkSync(chunkFilePath)
  });
  // 删除切片目录
  // fse.rmdirSync(chunkDir)
  console.log('合成了')
}
// 合并切片
/* const mergeFileChunk = async (chunkDirs, fileName) => {
  let chunkDir = chunkDirs + '/'+fileName
  //指定合成的文件名及位置
  const totalPaths = TotalFileDir + '/' + '合成-' + fileName
  // 目录不存在，创建目录
  // if (!fse.existsSync(TotalFileDir)) {
  //   fse.mkdirs(TotalFileDir);
  // }
  fse.ensureDirSync(TotalFileDir)
  fse.ensureFileSync(totalPaths,'')
  //生成合成的空文件
  // fse.writeFileSync(totalPaths, '')
  //读取切片文件目录，返回切片文件集合
  const chunkPaths = fse.readdirSync(chunkDir)
  //循环读取切片文件内容并合并进totalPaths中
  chunkPaths.forEach((chunkPath,index) => {
    console.log('合并：',index)
    //获取单个切片文件目录
    const chunkFilePath = `${chunkDir}/${chunkPath}`
    //xxx/xxx/uploadFile/chunkFile/梁博-出现又离开.mp3-0
    //同步按顺序读取文件切片，这样才能保证是按顺序将切片合成一整首歌
    const data = fse.readFileSync(chunkFilePath)

    //xxx/xxx/uploadFile/totalFile/梁博-出现又离开.mp3
    //将每个文件片合进单一文件中
    fse.appendFileSync(totalPaths, data);

    //删除文件
    // fse.unlinkSync(chunkFilePath);
  });

  //删除切片的目录
  // fse.rmdirSync(chunkDir);

} */

// -----------

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
