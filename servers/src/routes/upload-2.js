// 升级版文件合并，顺序性

var express = require('express')
const routers = express.Router()
const path = require("path")
const fse = require("fs-extra")
const multiparty = require("multiparty")
const msgDb = require('../models/talk')

// ----------------------
// 文件片的存储目录
const ChunkFileDir = path.resolve(__dirname, "../../../", "uploadFile/chunkFile");
//合成的文件的存储目录
const TotalFileDir = path.resolve(__dirname, "../../../", "uploadFile/totalFile");
// 服务端基础路径
let serverUrl = ''
// 
const resolvePost = req => {
  new Promise(resolve => {
    let chunk = ''
    req.on('data', data => {
      chunk += data
    })
    req.on('end', () => {
      resolve(JSON.parse(chunk))
    })
  })
}
// 发送（接收）文件接口
routers.post('/upload-file', function (req, res) {
  try {
    //关于multiparty的讲解，请看：https://www.cnblogs.com/wangyinqian/p/7811719.html
    const multipart = new multiparty.Form();
    // 解析FormData数据
    multipart.parse(req, async (err, fields, files) => {
      if (err) {
        return;
      }
      console.log('fields:', fields)
      // console.log('files:',files)
      //chunk:{
      // path:存储临时文件的路径,
      // size:临时文件的大小,
      // }
      const [chunk] = files.chunk;
      const [hash] = fields.fileHash;
      //获取切片总数量
      clientChunkNumber = +fields.chunkNumber[0];
      //获取文件名称
      // const [fileName] = fields.fileName;
      const fileName = String(fields.fileHash[0]).split('-')[0];
      //本次文件的文件夹名称，如 xx/xx/uploadFile/chunkFile/梁博-出现又离开.mp3
      const chunkDir = `${ChunkFileDir}/${fileName}`;

      // 切片目录不存在，创建切片目录chunkDir
      if (!fse.existsSync(chunkDir)) {
        // ---添加await，异步过程，
        await fse.mkdirs(chunkDir);
      } else if (fse.existsSync(chunkDir + `/${hash}`)) {
        console.log('该文件切片已存在')
        res.send("已接收文件片 " + hash)
        return
      }
      //将每片文件移动进chunkDir下，添加await,异步过程
      await fse.move(chunk.path, `${chunkDir}/${hash}`);
      //server 端计算切片数量，
      // serverChunkNumber = serverChunkNumber + 1
      //当到数时，自动合并文件
      // if (clientChunkNumber === serverChunkNumber && serverChunkNumber !== 0) {
      //   //这里方便测试，用 get 方法单独来 merge 文件
      //   console.log('ifMerge', clientChunkNumber, serverChunkNumber)
      //   // mergeFileChunk(ChunkFileDir,fileName)
      //   serverChunkNumber = 0
      //   // res.status(200).json('Done!')
      //   // res.send('Done!')
      // }
      //这么写返回 client 会出现乱码
      console.log('切片已接收', hash)
      res.status(200).json("已接收文件片 " + hash);
      // res.send("已接收文件片 " + hash)

    });

  } catch (err) {
    // res.status(400).json(err)
    res.send(err)
  }
})
//合并文件
routers.get('/merge', async (req, res) => {
  serverUrl = req.headers.host
  // console.log(req)
  const { fileHash, chunkSize, oldName,nickName } = req.query
  console.log(fileHash, chunkSize, oldName,nickName)
  // oldName 待用！！！！！！
  // 合并文件路径
  const filePath = path.resolve(TotalFileDir, `${fileHash}`)
  try {
    // filePath合并文件路径，fileHash 当前文件hash名，chunkSize--切片大小,oldName原有名字
    await mergeFileChunk(filePath, fileHash, chunkSize, oldName,nickName)
    // res.status(200).json("合并文件成功!");
    // res.send('合并文件成功!')
    res.end(
      JSON.stringify({ code: 0, message: 'merge suc!' })
    )
  } catch (err) {
    // res.status(400).json(err, 'err104')
    res.send({ code: 1, message: '合并上传失败！' })
  }
});
// 提取文件后缀名
const extractExt = fileName => {
  return fileName.slice(fileName.lastIndexOf('.'), fileName.length)
}
// 返回已经上传切片名字的列表
const createUploadedList = async fileHash => {
  // 当前文件的切片目录
  const curChunkfileDir = path.resolve(ChunkFileDir, fileHash)
  return fse.existsSync(curChunkfileDir) ? await fse.readdir(curChunkfileDir) : []
}
/**
 * 验证文件上传情况，[已上传,未上传(部分上传)]
 * @param {*} fileName 
 * @param {*} fileHash 
 */
routers.get('/verify', async (req, res) => {
  const { fileName, fileHash } = req.query
  const ext = extractExt(fileName)
  const filePath = path.resolve(TotalFileDir, `${fileHash}${ext}`)
  console.log('确认文件存在：', filePath)
  let txt
  if (fse.existsSync(filePath)) {
    txt = JSON.stringify({ shouldUpload: false })
  } else {
    txt = JSON.stringify({
      shouldUpload: true,
      uploadedList: await createUploadedList(fileHash)
    })
  }
  res.end(txt)
})

/**
 * 把切片文件六合并到指定路径下，
 * @param {*} path 
 * @param {*} writeStream 
 */
const pipeStream = (path, writeStream) => {
  return new Promise(resolve => {
    // 
    const readStream = fse.createReadStream(path);
    readStream.on('end', () => {
      fse.unlinkSync(path)  // 读取结束后删除切片
      console.log('读取结束后delete切片')
      resolve()
    })
    // 
    readStream.pipe(writeStream)
  })
}
// 合并切片
const mergeFileChunk = async (targetFile, fileName, size, oldName,nickName) => {
  console.log('---:', targetFile, fileName, size)
  // 处理切片的存储目录，hash名字，确保去除后缀
  const hashName = fileName.includes('.') ? fileName.split('.')[0] : fileName
  // 切片文件目录,返回绝对路径
  const chunkDir = path.resolve(ChunkFileDir, hashName)
  console.log('读取到切片缓存的目录：', chunkDir)
  // 读取切片文件目录，返回切片文件集合
  const chunkPaths = await fse.readdir(chunkDir)
  // 根据切片下标进行排序，防止顺序错乱,???
  chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1])
  // 文件不存在就创建
  fse.ensureFileSync(targetFile, '')
  // 遍历切片进行合并
  const mergeing = chunkPaths.map(async (chunkPath, index) => {
    const chunkFilePath = path.resolve(chunkDir, chunkPath)
    // 并发合并,提高速度
    const chunkFileStream = fse.createWriteStream(targetFile, {
      start: index * size,
      end: (index + 1) * size
    })
    const done = await pipeStream(chunkFilePath, chunkFileStream)
    return done
  })
  // console.log('merge status:',mergeing)
  await Promise.all(mergeing)
  // 合并后删除切片的目录
  console.log('delete:', chunkDir)
  if (fse.existsSync(chunkDir)) {
    console.log('存在chunkDir，')
  }
  fse.rmdirSync(chunkDir)
  // copy文件到下载目录存储一份，文件名修改为原名
  fse.ensureDirSync(`${TotalFileDir}/old-file`)
  let copyFile = `${TotalFileDir}/old-file/${oldName}`
  fse.copyFile(targetFile, copyFile, function (err) {
    if (err) console.log('copy something wrong was happened')
    else console.log('copy file succeed');
  })
  saveDatas(oldName,nickName)
}
/**
 * // 文件服务器路径入库存储
 * @param {*} fileName 上传的文件原名
 * @param {*} nickName 用户昵称
 */
function saveDatas (fileName,nickName='xxx') {
  const filePath = `http://${serverUrl}/files/old-file/${fileName}`
  console.log(filePath)
  const mesData = {
    nickName: nickName,
    says: filePath,
    type: 'href'
  }
  // 文件入库，有问题
  msgDb.save(mesData, (mes) => {
    console.log(mes)
  })
}

// -----------

module.exports = routers
