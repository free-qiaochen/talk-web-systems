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
axios.interceptors.response.use(
  response => {
    if (response.data.code && response.data.code ===500) {
      return Promise.reject()
    }
    return response.data
  },
  error => Promise.reject(error)
)

export const getData = (url,data,method='get',ContentType='application/json')=>{
  let config = {
    url,
    data,
    method:method.toLowerCase(),
    headers:{
      'content-Type':ContentType
    },
  }
  if (method.toLowerCase()==='get') {
    config.params = data
  }
  return axios(config)
}
