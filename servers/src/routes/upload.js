var express = require('express')
const routers = express.Router()
const path = require("path")
const fse = require("fs-extra")
const multiparty = require("multiparty")

// ----------------------
// 文件片的存储目录
const ChunkFileDir = path.resolve(__dirname, "../../../", "uploadFile/chunkFile");
//合成的文件的存储目录
const TotalFileDir = path.resolve(__dirname, "../../../", "uploadFile/totalFile");
let fileName = ''
let serverChunkNumber = 0
let clientChunkNumber = 0
let chunkDir = ''
let nameIndex = 0 //合成重复文件重命名后缀
// 发送（接收）文件接口
routers.post('/upload-file', function (req, res) {
  try {
    //关于multiparty的讲解，请看：https://www.cnblogs.com/wangyinqian/p/7811719.html
    const multipart = new multiparty.Form();
    // 解析FormData数据
    multipart.parse(req, (err, fields, files) => {
      if (err) {
        return;
      }
      //chunk:{
      // path:存储临时文件的路径,
      // size:临时文件的大小,
      // }
      const [chunk] = files.chunk;
      const [hash] = fields.hash;
      //获取切片总数量
      clientChunkNumber = +fields.chunkNumber[0];
      //获取文件名称
      [fileName] = fields.fileName;
      console.log('接收切片：',fileName)
      //本次文件的文件夹名称，如 xx/xx/uploadFile/chunkFile/梁博-出现又离开.mp3
      chunkDir = `${ChunkFileDir}/${fileName}`;

      // 切片目录不存在，创建切片目录chunkDir
      if (!fse.existsSync(chunkDir)) {
        fse.mkdirs(chunkDir);
      } else if (fse.existsSync(chunkDir + `/${hash}`)) {
        console.log('该文件切片已存在')
        res.send("已接收文件片 " + hash)
        return
      }
      //将每片文件移动进chunkDir下
      fse.move(chunk.path, `${chunkDir}/${hash}`);
      //server 端计算切片数量，
      serverChunkNumber = serverChunkNumber + 1
      //当到数时，自动合并文件
      if (clientChunkNumber === serverChunkNumber && serverChunkNumber !== 0) {
        //这里方便测试，用 get 方法单独来 merge 文件
        console.log('ifMerge', clientChunkNumber, serverChunkNumber)
        // mergeFileChunk(ChunkFileDir,TotalFileDir,fileName)
        serverChunkNumber = 0
        // res.status(200).json('Done!')
        // res.send('Done!')
      }
      //这么写返回 client 会出现乱码
      // res.end("已接收文件片 "+hash);
      // res.status(200).json("已接收文件片 " + hash);
      res.send("已接收文件片 " + hash)

    });
  } catch (err) {
    console.log('err--',err)
    res.status(400).json(err)
    // res.send(err)
  }
})
//合并文件
routers.get('/merge', async (req, res) => {
  try {
    console.log('合并文件传参--',fileName)
    await mergeFileChunk(ChunkFileDir, fileName)
    // res.status(200).json("合并文件成功!");
    res.send('合并文件成功!')
  } catch (err) {
    // res.status(400).json(err, 'err104')
    res.send('err404!')
  }
});
// 合并文件
const mergeFileChunk = async (chunkDirs, fileName) => {
  const chunkDir = chunkDirs + '/' + fileName
  console.log(chunkDirs, '--', fileName)
  // 指定合成文件名以及目录
  let totalPaths = TotalFileDir + '/' + '合成-' + `${fileName}`
  if (fse.existsSync(TotalFileDir + '/' + '合成-' + `${fileName}`)) {
    console.log('文件已存在')
    totalPaths = TotalFileDir + '/' + `${++nameIndex}--合成-${fileName}`
    // return
  }
  // 目录，文件不存在就创建
  fse.ensureDirSync(TotalFileDir)
  fse.ensureFileSync(totalPaths, '')
  // 读取切片文件目录，返回切片文件集合
  let chunkPaths = fse.readdirSync(chunkDir)
  console.log(chunkPaths)
  // 循环读取切片文件内容并合并进totalPaths中--???合并有问题?????????????
  mergeFile(chunkPaths,chunkDir,totalPaths)

}
// @params 切片文件集合，切片文件所在目录，合成文件地址
function mergeFile (chunkPaths,chunkDir,totalPaths) {
  // hack 处理，合并缺失,递归调用自己
  if (chunkPaths.length < clientChunkNumber) {
    setTimeout(() => {
      const newchunkPaths = fse.readdirSync(chunkDir)
      mergeFile(newchunkPaths,chunkDir,totalPaths)
    }, 1000)
    console.log(chunkPaths.length,clientChunkNumber,'切片缺失，再等等！待修复，递归1!')
    return
  }
  chunkPaths.forEach((chunkPath, index) => {
    console.log('合并：', index, chunkPaths.length)
    // 获取单个切片文件的目录
    const chunkFilePath = `${chunkDir}/${chunkPath}`
    // 同步按顺序读取文件切片，保证文件正常合成
    const data = fse.readFileSync(chunkFilePath)
    // 将每个文件片合并进单一文件中
    fse.appendFileSync(totalPaths, data)
    // 删除片文件
    // fse.unlinkSync(chunkFilePath)
  });
  // 删除切片目录
  // fse.rmdirSync(chunkDir)
  console.log('合成了')
}


// -----------

module.exports = routers
