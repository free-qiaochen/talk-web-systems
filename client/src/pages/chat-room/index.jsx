import React, { useEffect, useState } from 'react'
import './index.scss'
import IO from 'socket.io-client'
import { socketEvents } from './component/socket-io'
import { Button, InputItem } from 'antd-mobile'
import global from '../../config'
import { getChartList } from '../../api/chart'

let ifInit = true
let autoFocusInst, ioSocket, lists
function Chat(props) {
  // const { getFieldProps } = props.form
  const [mesHistory, setMesHistory] = useState()
  const [mes, setMes] = useState()
  const [nickName, setNickName] = useState()
  console.log('---------', ifInit)
  const addMes = val => {
    console.log(mesHistory, val)
    lists += val
    setMesHistory(lists)
  }
  const sendMes = () => {
    send(ioSocket, mes, nickName)
    setMes('')
  }
  async function changeNickName(params) {
    // 连接
    if (ifInit) {
      console.log('connect', ifInit)
      ioSocket = IO(global.serveUrl.local)
      socketEvents(ioSocket, addMes, nickName)
      ifInit = false
      // api获取数据
      console.log('获取数据----------api')
      let data = await getChartList()
      console.log(data)
    }
    sessionStorage.setItem('nickName', nickName)
    ioSocket.send(nickName, 'nick')
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
        <Button onClick={changeNickName}>输入昵称，点击进入房间</Button>
      </div>
    </div>
  )
}

function send(ioSocket, mesVal, nickName) {
  if (nickName === '' || !nickName) {
    alert('请先输入昵称，再进入房间')
    return
  }
  ioSocket.send(mesVal)
  // console.log(sayInput.value)
  // sayInput.value = ''
  // setTimeout(() => {
  //   sayInput.focus()
  //   sayInput.scrollIntoView()
  // }, 0);
}

export default Chat
