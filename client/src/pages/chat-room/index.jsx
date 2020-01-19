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
  const [mesHistory, setMesHistory] = useState()
  const [mes, setMes] = useState()
  const [nickName, setNickName] = useState()
  console.log('---------')
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
  }, [])
  const addMes = val => {
    console.log(mesHistory, val)
    lists += val
    setMesHistory(lists)
    // 消息框滚动到底部
    let chatRoom = document.querySelector('#chatRoom')
    if (chatRoom.scrollHeight > chatRoom.clientHeight) {
      //设置滚动条到最底部
      chatRoom.scrollTop = chatRoom.scrollHeight - chatRoom.clientHeight
    }
  }
  const sendMes = () => {
    send(ioSocket, mes, nickName)
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
      <div id='chatRoom'>
        <div id='mesConts' dangerouslySetInnerHTML={{ __html: mesHistory }}>
          {/* {mesHistory} */}
        </div>
      </div>
      <div className='messText'>
        <InputItem
          // {...getFieldProps('autofocus')}
          clear
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
          value={mes}>
          消息
        </InputItem>
        <Button onClick={sendMes}>发送</Button>
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
        <Button onClick={() => changeNickName()}>输入昵称，点击进入房间</Button>
      </div>
    </div>
  )
}

function send(ioSocket, mesVal, nickName) {
  console.log(nickName, mesVal)
  if (!nickName || nickName === 'null') {
    alert('请先输入昵称，再进入房间')
    Toast.info('请先输入昵称，再进入房间 !!!', 1);
    return
  }
  if (!!mesVal) {
    ioSocket.send(mesVal)
  } else {
    // alert('请输入消息')
    Toast.info('请输入消息 !!!', 1);
  }
  // console.log(sayInput.value)
  // sayInput.value = ''
  // setTimeout(() => {
  //   sayInput.focus()
  //   sayInput.scrollIntoView()
  // }, 0);
}

export default Chat
