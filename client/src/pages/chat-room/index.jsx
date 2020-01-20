import React, { useEffect, useState } from 'react'
import './index.scss'
import IO from 'socket.io-client'
import { socketEvents } from './component/socket-io'
import { Toast, Button, InputItem } from 'antd-mobile'

// Toast.info('This is a toast tips !!!', 1);

// Toast.success('Load success !!!', 1);

import global from '../../config'
import { getChartList } from '../../api/chart'

// let ifInit = true
let ioSocket
function Chat(props) {
  const [mesHistory, setMesHistory] = useState() // 历史消息
  const [mes, setMes] = useState() // 当前输入的消息
  const [nickName, setNickName] = useState() // 昵称
  const [onlineNum, setOnlineNum] = useState(1) // 在线人数
  // console.log('---------')
  let lists, autoFocusInst
  useEffect(() => {
    // 添加第二个参数[],表示无依赖，相当于didMount钩子
    lists = ''
    // 连接
    // 初始化链接服务socket
    console.log('begin connect')
    ioSocket = IO(global.getCurrentServer())
    socketEvents(ioSocket, addMes)
    console.log('connect')
    // 检测到已有昵称则直接使用
    let nickName = sessionStorage.getItem('nickName') || null
    if (nickName && nickName !== null && nickName != 'undefined') {
      setNickName(nickName)
      changeNickName(nickName)
    }
    // 请求接口，获取最近（20条）的历史信息
    initHistoryList(20)
    // 组件销毁调用函数
    return comWillUnMount
  }, [])
  const comWillUnMount = () => {
    console.log('组件将销毁')
    // console.log(ioSocket, mes, nickName);
    ioSocket.close() // 断开socket 连接
  }

  /** 接收到服务端message ，显示消息
   * @params val 新消息，onlineNum在线人数，
   * leaveObj 有人(进入)离开对象信息
   *
   *  */
  const addMes = (val, onlineNums, leaveObj) => {
    // console.log(mesHistory, val, onlineNums)
    if (onlineNums >= 1) setOnlineNum(Number(onlineNums))
    if (leaveObj && leaveObj.type === 'leave') {
      Toast.info(`${leaveObj.name}：离开了！`)
      return
    } else if (leaveObj && leaveObj.type === 'in') {
      Toast.info(`欢迎新朋友,请自定义个人昵称!`)
      return
    }
    lists += val
    setMesHistory(lists)
    scrollToBottom()
    if (leaveObj && leaveObj.type === 'img') {
      setTimeout(()=>{
        scrollToBottom()
      },1000)
    }
  }
  const scrollToBottom = () => {
    // 消息框滚动到底部
    let chatRoom = document.querySelector('#chatRoom')
    if (chatRoom.scrollHeight > chatRoom.clientHeight) {
      //设置滚动条到最底部
      chatRoom.scrollTop = chatRoom.scrollHeight - chatRoom.clientHeight
    }
  }
  /**发送消息
   * @params type--消息类型
   *  */
  const sendMes = type => {
    console.log(nickName, mes)
    if (!nickName || nickName === 'null') {
      // alert('请先输入昵称，再进入房间')
      Toast.info('请先输入昵称，再进入房间 !!!', 1)
      return
    }
    if (type === 'img') {
      sendImg(ioSocket, 'curImg')
      return
    }
    sendText(ioSocket, mes)
    setMes('')
  }
  function changeNickName(names) {
    let name = names || nickName
    if (!ioSocket || !name || name == 'undefined') return
    console.log(names, '---change nickName', nickName)
    sessionStorage.setItem('nickName', name)
    ioSocket.send(name, 'nick')
  }
  async function initHistoryList(num) {
    // api获取数据
    // console.log('获取数据----------api')
    let data = await getChartList({ num })
    console.log('init api data--', data)
    if (data && data.length > 0) {
      const nickName = sessionStorage.getItem('nickName') || null
      let Messages
      let targets = data.reverse()
      targets.forEach(item => {
        let className = item.nickName === nickName ? 'mesRight' : 'mes'
        // let message = className === 'mesRight' ? msg.replace(nickName + '：', '') : msg
        if (className === 'mesRight') {
          Messages += `<p class="${className}">${item.says}</p>`
        } else {
          Messages += `<p class="${className}">${item.nickName +
            ':' +
            item.says}</p>`
        }
      })
      addMes(Messages)
    }
  }
  return (
    <div className='chats'>
      {onlineNum >= 1 && <div className='onlineNum'>在线人数：{onlineNum}</div>}
      <div id='chatRoom'>
        <div id='mesConts' dangerouslySetInnerHTML={{ __html: mesHistory }}>
          {/* {mesHistory} */}
        </div>
      </div>
      <div className='mesImages'>
        发送图片，表情包
        <input type='file' id='curImg' accept='*.jpe?g,*.png' />
        <button onClick={() => sendMes('img')}>发送</button>
      </div>
      <div className='messText'>
        <InputItem
          clear
          className='mesInput'
          placeholder='输入消息，发送'
          ref={el => (autoFocusInst = el)}
          onKeyUp={e => {
            if (e.keyCode === 13) {
              sendMes()
            }
          }}
          onChange={val => {
            setMes(val)
          }}
          value={mes}></InputItem>
        <Button type='ghost' inline onClick={sendMes}>
          发送
        </Button>
      </div>
      <div className='changeName'>
        <InputItem
          clear
          placeholder='修改昵称'
          onKeyUp={e => {
            if (e.keyCode === 13) {
              changeNickName()
            }
          }}
          onChange={val => {
            setNickName(val)
          }}
          value={nickName}>
          昵称
        </InputItem>
        <Button type='ghost' onClick={() => changeNickName()}>
          输入昵称，点击进入房间
        </Button>
      </div>
    </div>
  )
}
// 发送文本消息
function sendText(ioSocket, mesVal) {
  if (!!mesVal) {
    // 添加防护措施(防止输入端植入代码)
    let safeMes = mesVal.replace(/<[^<>]+>/g, '')
    ioSocket.send(safeMes)
  } else {
    // alert('请输入消息')
    Toast.info('请输入消息 !!!', 1)
  }
  // console.log(sayInput.value)
  // sayInput.value = ''
  // setTimeout(() => {
  //   sayInput.focus()
  //   sayInput.scrollIntoView()
  // }, 0);
}
// 发送图片
function sendImg(ioSocket, imgsId) {
  const imgInput = document.getElementById(imgsId)
  let file = imgInput.files[0]
  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = function() {
    let imgs = { img: this.result,nickName:'' }
    ioSocket.emit('sendImg', imgs)
    console.log(imgs)
  }
}

export default Chat
