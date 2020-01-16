
var mongoose = require('mongoose')
// console.log(mongoose)

module.exports = function initConnect (params) {
  var mongodbUrl = 'mongodb://47.104.107.19/self-website'
  // var mongodbUrl = 'mongodb://120.27.8.21/local'
  mongoose.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true })

  var db = mongoose.connection;
  db.on('error', function (err) {
    console.log(err)
  });


  db.once('open', function (data) {
    // we're connected!
    console.log('CONNECT mongodb suc!')
    // console.log(data)
    // Tank.save({name:'11',size:'11111111'})
    // console.log(Tank.find())
  });
}

