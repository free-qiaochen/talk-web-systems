export default {
  mode:'local',
  serveUrl: {
    local: 'http://10.105.18.185:5005/',
    server: 'http://47.104.107.19:5005/', // 服务器地址
    hnyS: 'http://10.105.19.124:8008/'
  },
  getCurrentServer: function (params) {
    let isProduction = process.env.NODE_ENV === 'production'
    return isProduction ? this.serveUrl['server'] : this.serveUrl[this.mode]
  }
}