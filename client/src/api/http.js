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
    if (response.data.code && response.data.code === 500) {
      return Promise.reject()
    }
    return response.data
  },
  error => Promise.reject(error)
)

// 取消请求方法
const cancelToken = () => {
  return new axios.CancelToken(cancel => {
    // cancel 就是取消请求的方法
    global.requestList.push({ cancel })
    // global.requestList  待清除，在所有请求的loading结束后
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
export const getData = (url, data, method = 'get', ContentType = 'application/json',upProcess,upItem) => {
  if (ContentType === 'application/x-www-form-urlencoded') {
    // data = qs.stringify(data)
  }
  let config = {
    url,
    data,
    method: method.toLowerCase(),
    headers: {
      'content-Type': ContentType
    },
    onUploadProgress: function (progressEvent) {  // 上传进度
      // let {loaded,total} = progressEvent
      // console.log(loaded,total,progressEvent)
      let complete = (progressEvent.loaded / progressEvent.total * 100 | 0)
      upItem.percentage = complete
      upProcess(upItem)
      console.log('上传 ' + complete) // 单次上传文件太小会导致总是100，来不及
      return progressEvent
    },
    cancelToken: cancelToken(), // 暂停上传
  }
  if (method.toLowerCase() === 'get') {
    config.params = data
  }
  return axios(config)
}
