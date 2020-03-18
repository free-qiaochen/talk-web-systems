import axios from 'axios'
import global from '../config'

axios.defaults.baseURL = global.getCurrentServer()

// 请求拦截器
axios.interceptors.request.use(
  config => {
    // config.headers= {}
    return config
  },
  error => Promise.reject(error)
)
// 响应拦截器
axios.interceptors.response.use(
  response => {
    if (response.data.code && response.data.code ===500) {
      return Promise.reject()
    }
    return response.data
  },
  error => Promise.reject(error)
)

// 取消请求方法
const cancelToken = ()=>{
  return new axios.CancelToken(cancel=>{
    // cancel 就是取消请求的方法
    global.requestList.push({cancel})
  })
}
/**
 * 封装axios对外暴露的请求方法，
 * 提供cancel取消请求方法
 * @param {*} url 
 * @param {*} data 
 * @param {*} method 
 * @param {*} ContentType 
 */ 
export const getData = (url,data,method='get',ContentType='application/json')=>{
  if (ContentType === 'application/x-www-form-urlencoded') {
    // data = qs.stringify(data)
  }
  let config = {
    url,
    data,
    method:method.toLowerCase(),
    headers:{
      'content-Type':ContentType
    },
    cancelToken:cancelToken(),
  }
  if (method.toLowerCase()==='get') {
    config.params = data
  }
  return axios(config)
}
