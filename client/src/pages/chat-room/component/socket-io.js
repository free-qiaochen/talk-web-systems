

// const ioSocket = io('http://47.104.107.19:5005/')

// 监听socket.io 连接，接收消息等事件
function socketEvents (ioSocket,addMes,ifinit) {
  // const ioSocket = IO('http://47.104.107.19:5005/')
  // if (!ifinit) return
  // 监听连接服务器
  ioSocket.on('connect', function (data) {
    // ioSocket.send('hello ,I am from client')
  })
  // 接收服务端的信息
  // 方式1
  ioSocket.on('message', function (msg,onlineNum) {
    console.log(msg)
    // const msg = msgs.split('&onlineCount=')[0]
    // const num = msgs.split('&onlineCount=')[1]
    // 本人消息过滤，样式和内容过滤
    const nickName = sessionStorage.getItem('nickName') || null
    console.log(nickName,'---nickNames',msg,onlineNum)
    var className = msg.split('：')[0] === nickName ? 'mesRight' : 'mes'
    var message = className === 'mesRight' ? msg.replace(nickName + '：', '') : msg
    var newMess = `<p class="${className}">${message}</p>`
    addMes(newMess,onlineNum)
  })
  // 方式2????
  // ioSocket.on('news',function (msg) {
  //   var charRoom = document.querySelector('#chatRoom')
  //   charRoom.innerHTML += msg + '--11'+'<br />'
  // })
  ioSocket.on('disconnect', function (params) {
    console.log('服务端关闭了！')
  })
}

export {socketEvents}