var mongoose = require('mongoose')
var initConnect = require('../mongo/connect')

// console.log(initConnect)
initConnect()

var schema = new mongoose.Schema({
  nickName: String,
  size: Number,
  says: String,
  times: Date,
});
var Talk = mongoose.model('talking', schema);
// 保存数据法一
// var demo = new Talk({
//   nickName:'xiaomi',
//   says:'hello xm',
//   size:1,
//   times:Date.now()
// })
// demo.save(function (err) {
//   if (err) {
//     console.log(err)
//   }
//   console.log('save suc')
// })

// 保存数据法二：
// Talk.create({
//   nickName: 'lisi',
//   says: 'I am lisi'
// }, function (err) {
//   if (err) console.log(err)
//   console.log('save 2 suc')

// })

// 保存数据法三：
// Talk.update({
//   nickName: 'lisi',
//   says: 'I am lisi'
// }, function (err) {
//   if (err) console.log(err)
//   console.log('save 2 suc')

// })

// 查找数据 findOne(查一条)
// Talk.find({},'nickName', function (err, talk) {
//   console.log(talk)
// })

// 删除 (可以删除所有匹配查询条件的文档)
// Talk.remove({nickName:'xiaoming'},function (err) {
//   if (err) {
//     return handleError(err)
//   }
//   console.log('removed')
// })

// 更新 update
// 更新且返回给应用层 findOneAndUpdate

// const callback = (data)=>{
//   console.log(data)
// }

// 封装查询，存储数据库（聊天信息）方法
module.exports = {
  save: function (data,callback) {
    data.times = new Date()
    if (data.nickName) {
      // Talk.update({_id:id},data)
      Talk.create(data,err=>{
        if (err) return callback(err)
        return callback('save suceess！')
      })
    }
  },
  findMes: function (conditions,wantData,options,callback) {
    Talk.find(conditions,wantData,options,(err,datas)=>{
      if (err) {
        return callback(err)
      }
      return callback(null,datas)
    })
  },
  updateMessage: function (conditions,newData,callback) {
    Talk.deleteMany(conditions,newData,err=>{
      if (err) {
        return callback(err)
      }else{
        return callback(null)
      }
    })
  }
}