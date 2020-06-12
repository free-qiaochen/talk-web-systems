import React, { useEffect, useState, useCallback, useRef } from 'react'
import IO from 'socket.io-client'
import { Toast, Button, InputItem, Icon } from 'antd-mobile'
import * as imageConversion from 'image-conversion'
import './index.scss'
import globals from '../../config'
import { socketEvents } from './component/socket-io'
import MyProgress from '../../components/process/process'
import UploadFile from './component/upload'
import { getChartList, delMes } from '../../api/chart'
import { formatFileName } from '@utils/common'

// let mesLists
let ioSocket

function Chat(props) {
  const [mesHistorys, setMesHistorys] = useState('') // 历史消息
  const [mes, setMes] = useState() // 当前输入的消息
  const [nickName, setNickName] = useState() // 昵称
  const [onlineNum, setOnlineNum] = useState(1) // 在线人数
  const [percent, setPercent] = useState(0)
  const [ifUploadShow, setIfUploadShow] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const latestMesList = useRef(mesHistorys)
  // console.log('---------', mesHistorys)
  // let autoFocusInst

  /** 接收到服务端message ，显示消息
   * @params val 新消息，onlineNum在线人数，
   * leaveObj 有人(进入)离开对象信息
   *
   *  */
  const addMes = useCallback(
    (val, onlineNums, leaveObj) => {
      // console.log(mesHistorys, val, onlineNums)
      if (onlineNums >= 1) setOnlineNum(Number(onlineNums))
      if (leaveObj && leaveObj.type === 'leave') {
        Toast.info(`${leaveObj.name}：离开了！`)
        return
      } else if (leaveObj && leaveObj.type === 'in') {
        Toast.info(`欢迎新朋友,请自定义个人昵称!`)
        return
      }
      // console.log(
      //   '这里取值mesHistorys有问题，mesHistorys:',
      //   mesHistorys,
      //   latestMesList.current
      // )
      // mesLists = mesLists ? mesLists + val : val
      // 有了hack处理后，可以不再组件外声明变量存储，可间接使用到最新state数据
      const mesLists = latestMesList.current ? latestMesList.current + val : val
      // console.log('设置之前：', mesLists)
      setMesHistorys(mesLists)
      // console.log('后：', mesHistorys)
      scrollToBottom()
      if (leaveObj && leaveObj.type === 'img') {
        setTimeout(() => {
          scrollToBottom()
        }, 1000)
      }
    },
    [//mesHistorys
    ]
  )
  /**发送消息
   * @params type--消息类型
   *  */
  const sendMes = useCallback(
    (type, fileName) => {
      // console.log('---:',nickName, mes,mesHistorys)
      if (!nickName || nickName === 'null') {
        // alert('请先输入昵称，再进入房间')
        Toast.info('请先输入昵称，再进入房间 !!!', 1)
        return
      }
      if (type === 'img') {
        sendImg(ioSocket, 'curImg', addMes, onlineNum)
        setMes('')
        return
      }
      if (type === 'file') {
        sendText(ioSocket, fileName, type)
        setMes('')
        return
      }
      sendText(ioSocket, mes)
      setMes('')
    },
    [addMes, mes, nickName, onlineNum]
  )
  const changeNickName = useCallback(
    function(names) {
      let name = names || nickName
      if (!ioSocket || !name || name === 'undefined') return
      console.log(names, '---change nickName', nickName)
      sessionStorage.setItem('nickName', name)
      ioSocket.send(name, 'nick')
    },
    [nickName]
  )
  const initHistoryList = useCallback(
    async num => {
      // api获取数据
      // console.log('获取数据----------api')
      let data = await getChartList({ num })
      // console.log('init api data--', data)
      if (data && data.length > 0) {
        const nickName = sessionStorage.getItem('nickName') || null
        let Messages
        let targets = data.reverse()
        targets.forEach(item => {
          let className = item.nickName === nickName ? 'mesRight' : 'mes'
          let pre = className === 'mesRight' ? '' : item.nickName + ':'
          if (item.type === 'href') {
            Messages += `<p class="${className}"><a href="${
              item.says
            }" target="_blank">${pre + formatFileName(item.says)}</a></p>`
          } else {
            if (className === 'mesRight') {
              Messages += `<p class="${className}">${pre + item.says}</p>`
            } else {
              Messages += `<p class="${className}">${pre + item.says}</p>`
            }
          }
        })
        addMes(Messages)
        // mesLists = Messages
      } else {
        return []
      }
    },
    [addMes]
  )
  const switchUpload = useCallback(() => {
    setIfUploadShow(!ifUploadShow)
  }, [ifUploadShow])

  const inits = useCallback(() => {
    socketEvents(ioSocket, addMes)
    initHistoryList(20)
  }, [initHistoryList, addMes])
  // 删除
  const delMesFunc = useCallback(async () => {
    await delMes(11)
    let list = await initHistoryList(20)
    console.log('list', list)
    setMesHistorys(list)
  }, [initHistoryList])
  // 进度变化
  const changeProcess = useCallback((val, type) => {
    // console.log('----processType:',type)
    if (!(type === 'upload')) {
      setPercent(val)
    }else{
      setUploadProgress(val)
    }
  }, [])
  // hack for mesHistorys cannot read new value!
  useEffect(() => {
    latestMesList.current = mesHistorys
  })
  /**
   * didMount,可是又依赖其他变量，该钩子有问题，待修复，
   * 添加依赖会有问题，
   *  */
  useEffect(() => {
    // 添加第二个参数[],表示无依赖，相当于didMount钩子
    // lists = ''
    // 连接
    // 初始化链接服务socket
    console.log('begin connect')
    const serverUrl = globals.getCurrentServer()
    ioSocket = IO(serverUrl)
    // 检测到已有昵称则直接使用
    let nickName = sessionStorage.getItem('nickName') || null
    if (nickName && nickName !== null && nickName !== 'undefined') {
      setNickName(nickName)
      changeNickName(nickName)
    }
    // 请求接口，获取最近（20条）的历史信息
    inits()
    console.log('connect')
    // 组件销毁调用函数
    return comWillUnMount
  }, [])
  return (
    <div className='chats'>
      <MyProgress percent={percent} process={uploadProgress} />

      {onlineNum >= 1 && (
        <div className='onlineNum'>
          <span className='delHistorys' onClick={delMesFunc}>
            清空历史--
          </span>
          <span>在线人数：{onlineNum}</span>
        </div>
      )}
      <div id='chatRoom'>
        <div id='mesConts' dangerouslySetInnerHTML={{ __html: mesHistorys }}>
          {/* {mesHistory} */}
        </div>
      </div>
      <div className='messText'>
        <InputItem
          clear
          className='mesInput'
          placeholder='输入消息，发送'
          onKeyUp={e => {
            if (e.keyCode === 13) {
              // console.log('---', mesHistorys)
              sendMes()
            }
          }}
          onChange={val => {
            setMes(val)
          }}
          value={mes}></InputItem>
        {mes ? (
          <Button type='ghost' inline onClick={sendMes}>
            发送
          </Button>
        ) : (
          <Icon className='more' type='ellipsis' onClick={switchUpload} />
        )}
      </div>
      {ifUploadShow && (
        <UploadFile
          sendMes={sendMes}
          nickName={nickName}
          changeProcess={changeProcess}
        />
      )}
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

function comWillUnMount() {
  console.log('组件将销毁')
  // console.log(ioSocket, mes, nickName);
  ioSocket.close() // 断开socket 连接
}
// 消息框滚动到底部
function scrollToBottom() {
  let chatRoom = document.querySelector('#chatRoom')
  if (chatRoom.scrollHeight > chatRoom.clientHeight) {
    //设置滚动条到最底部
    chatRoom.scrollTop = chatRoom.scrollHeight - chatRoom.clientHeight
  }
}
/**
 *
 * @param {*} ioSocket
 * @param {*} mesVal
 * @param {*} type
 */
function sendText(ioSocket, mesVal, type) {
  if (!!mesVal) {
    // 添加防护措施(防止输入端植入代码)
    let safeMes = mesVal.replace(/<[^<>]+>/g, '')
    // 发送文件名字不再入库，因为在api中已入库
    type === 'file' ? ioSocket.send(safeMes, 'file') : ioSocket.send(safeMes)
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
async function sendImg(ioSocket, imgsId, addMes, onlineNum) {
  const imgInput = document.getElementById(imgsId)
  console.log(imgInput)
  if (!imgInput.value) {
    Toast.info('请先选择图片 !!!', 1)
    // return
  }
  let file = imgInput.files[0]
  let miniFile = await imgConversion(file)
  let reader = new FileReader()
  reader.readAsDataURL(miniFile)
  Toast.loading('发送中', 0)
  reader.onload = function() {
    let imgs = { img: this.result, nickName: '', name: file.name }
    ioSocket.emit('sendImg', imgs)
    // console.log(imgs)
    imgInput.value = ''
    Toast.hide()
    // 自己发送的图片本地回显
    let imgHtml = `<div class="mesRight">
      <img src="${imgs.img}"/>
    </div>`
    addMes(imgHtml, onlineNum, { type: 'img' })
  }
}
// 图片压缩(转换)
async function imgConversion(imgFile) {
  try {
    const res = await imageConversion.compressAccurately(imgFile, 200)
    console.log(res)
    return res
  } catch (error) {
    console.error(error)
    return(error)
  }
}

export default Chat
