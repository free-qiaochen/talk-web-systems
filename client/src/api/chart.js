import { getData } from './http'

// 初始进入聊天页面，获取最近10条聊天信息
export const getChartList = (data) => getData('/chat',data)

// 发送文件（大文件）
export const uploadFile = (data) => getData('/file/upload-file',data,'post','application/x-www-form-urlencoded')
// 发送合并请求
export const mergeFile = (data) => getData('/file/merge',data)
/* export const getChartList = () => {
  let xhr = new XMLHttpRequest()
  xhr.open('get', 'http://10.105.18.185:5005/chat', true)
  xhr.send()
  xhr.onload = function (e) {
    console.log(e.target.response, '接受请求')
  }
} */

