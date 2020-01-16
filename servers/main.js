const app = require('express')()
// http 設置
app.use('/', (req,res,next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE,OPTIONS');
  next()
})
app.get('/chat', function (req, res) {
    res.send('1234564561231')
})
app.listen(5005, ()=>console.log('5005'))