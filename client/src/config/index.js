export default {
  mode:'local',
  serveUrl: {
    local: 'http://10.108.2.94:5005/',
    // local: 'http://192.168.199.148:5005/', // my in home
    server: 'http://47.104.107.19:5005/', // 服务器地址
    hnyS: 'http://10.105.19.124:8008/'
  },
  getCurrentServer: function (params) {
    let isProduction = process.env.NODE_ENV === 'production'
    return isProduction ? this.serveUrl['server'] : this.serveUrl[this.mode]
  },
  requestList:[],
  fileUploadProcess:0,  // 0-100,
}