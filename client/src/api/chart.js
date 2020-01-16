import { getData } from './http'

// 初始进入聊天页面，获取最近10条聊天信息
export const getChartList = () => getData('/chat')

/* export const getChartList = () => {
  let xhr = new XMLHttpRequest()
  xhr.open('get', 'http://10.105.18.185:5005/chat', true)
  xhr.send()
  xhr.onload = function (e) {
    console.log(e.target.response, '接受请求')
  }
} */