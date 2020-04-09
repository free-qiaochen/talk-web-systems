import { Loading } from 'element-ui'
import _ from 'lodash'

// 记录当前页面总请求的次数
let loadingRequestCount = 0

let loadingInstance

export const showLoading = () => {
  if (loadingRequestCount === 0) {
    loadingInstance = Loading.service({
      fullscreen: true,
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0)'
    })
  }
  loadingRequestCount++
}

export const hideLoading = () => {
  if (loadingRequestCount <= 0) return
  loadingRequestCount--
  if (loadingRequestCount === 0) {
    _.debounce(tryCloseLoading, 300)()
  }
}
const tryCloseLoading = () => {
  if (loadingRequestCount === 0) {
    loadingInstance.close()
  }
}
