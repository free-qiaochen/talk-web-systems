// 文件上传，图片上传，切片，大文件，进度，优化速度

import React, { useEffect, useState, useCallback } from 'react'
import { Toast, Button } from 'antd-mobile'
import global from '@/config'
import { uploadFile, mergeFile, ifUpload } from '@/api/chart'
// import { promises } from 'dns'
import ClipboardJS from 'clipboard'
// import worker_script from '/hash.js';
var myWorker = new Worker('/hash.js')

function UploadFile (props) {
  const { sendMes, changeProcess } = props
  const [fileDatas, setFileDatas] = useState()
  const [chunkFileMes, setChunkFileMes] = useState({})
  const [uploading, setUploading] = useState(false)
  hackChangeProcess = changeProcess
  /**
   *  选择文件变化，更新数据
   *  */
  const getFile = useCallback(
    e => {
      e.persist() // react hack
      const [file] = e.target.files
      if (!file) {
        return
      }
      setFileDatas(file)
      changeProcess(0)
    },
    [changeProcess]
  )
  /**
   * 点击发送文件，分图片和其他文件
   *  */
  const sendFiles = useCallback(
    async type => {
      console.log(fileDatas)
      if (!fileDatas) {
        Toast.info('请先选择文件')
        return
      }
      changeProcess(0)
      if (fileDatas && fileDatas.type.includes('image')) {
        sendMes('img')
      } else {
        if (type === 'continue') {
          continueUpload(chunkFileMes, fileDatas.name)
          return
        }
        console.log('文件切片')
        // 获取文件切片
        const { splitFileList, chunkNumber, chunkSize } = createFileChunk(
          fileDatas
        )
        console.log(splitFileList)
        // ？？？计算文件hash，为何不在切片之前
        const fileHash = await calculateHash(
          splitFileList,
          changeProcess,
          setUploading
        )
        setUploading(true)
        console.log(fileHash)
        // 数据
        const chunkLists = splitFileList.map((file, index) => ({
          fileHash,
          index,
          hash: fileHash + '-' + index,
          chunk: file,
          percentage: 0
        }))
        setChunkFileMes({
          splitFileList: chunkLists,
          chunkNumber,
          chunkSize,
          fileHash
        })
        const fileName = fileDatas.name
        // 校验当前文件是否已经发送过
        const { uploadedList, shouldUpload } = await verifyUpload(
          fileName,
          fileHash
        )
        console.log('shouldUpload', shouldUpload)
        if (!shouldUpload) {
          Toast.info('文件秒传成功，文件已存在了！')
          return
        }
        // hack for 取值，因为setState异步，为了取到最新state
        let latestChunkFileMes = {
          splitFileList: chunkLists,
          chunkNumber,
          chunkSize,
          fileHash
        }
        // ??待优化,取值有问题？？
        console.log('chunkFileMes:', chunkFileMes, latestChunkFileMes)
        changeProcess(0) // 进度重置
        // 切片上传功能函数
        uploadFunc(
          uploadedList, latestChunkFileMes,
          fileName)
      }
    },
    [sendMes, fileDatas, chunkFileMes, changeProcess]
  )

  // 赋值粘贴板
  const copyFunc = className => {
    let clipboard = new ClipboardJS(className)
    clipboard.on('success', function (e) {
      console.info('Action:', e.action)
      console.info('Text:', e.text)
      console.info('Trigger:', e.trigger)
      e.clearSelection()
    })
    clipboard.on('error', function (e) {
      console.error('Action:', e.action)
      console.error('Trigger:', e.trigger)
    })
  }
  //
  // const testPercent = useCallback(() => {
  //   console.log(a)
  //   changeProcess(a++)
  // }, [changeProcess])
  useEffect(() => {
    console.log('didMount?')
    copyFunc('.copyText')
    myWorker.onmessage = m => {
      console.log('msg from worker: ', m.data)
    }
    myWorker.postMessage('im from main')
  }, [])
  return (
    <div className='mesImages'>
      <input
        type='file'
        id='curImg'
        accept='*.jpe?g,*.png'
        onChange={e => {
          getFile(e)
        }}
      />
      <Button type='ghost' inline onClick={sendFiles}>
        发送图片
      </Button>
      {/* <Button onClick={testPercent}>测试percent</Button> */}
      {uploading && (
        <div className='uploadOption'>
          <Button className='pause' inline onClick={pauseUpload}>
            暂停
          </Button>
          <Button className='goOn' inline onClick={() => sendFiles('continue')}>
            恢复
          </Button>
          <Button inline
            className='copyText'
            data-clipboard-text="Just because you can doesn't mean you should — clipboard.js">
            copy
          </Button>
        </div>
      )}
      {/* <button class="btn" data-clipboard-action="cut" data-clipboard-target="#bar">
        Cut to clipboard
      </button> */}
    </div>
  )
}

export default UploadFile
/**
 *文件切片 ,默认100Kb
 * @params files--目标文件，chunkSize--切片大小
 *  */
function createFileChunk (files, chunkSize = 1000 * 1024) {
  const fileChunkList = []
  // 向上取整
  const length = Math.ceil(files.size / chunkSize)
  let curIndex = 0
  while (curIndex < length) {
    let cur = curIndex * chunkSize
    const fileChunk = files.slice(cur, cur + chunkSize)
    fileChunkList.push(fileChunk)
    curIndex++
  }
  return { splitFileList: fileChunkList, chunkNumber: length, chunkSize }
}
/**
 * 请求api，进行文件合并
 * @param {*} fileName
 * @param {*} chunkSize
 */
async function mergeFileFunc (fileName, chunkSize, oldName) {
  console.log('请求合并')
  let data = await mergeFile({ curFile: fileName, chunkSize, oldName })
  console.log(data && data.message)
}
/**
 * 计算文件hash
 * @param {*} fileChunkList 文件切片集合,changeProcess进度,setUploading上传状态
 * @return hash
 */
function calculateHash (fileChunkList, changeProcess, setUploading) {
  setUploading(false)
  return new Promise(resolve => {
    let worker = new Worker('/hash.js')
    worker.postMessage({ fileChunkList })
    worker.onmessage = e => {
      const { percentage, hash } = e.data
      console.log('percentage:', percentage)
      changeProcess(percentage)
      // this.hashPercentage=percentage
      if (hash) {
        resolve(hash)
      }
    }
  })
}
/**
 * 切片文件包装，上传，请求合并
 * @param {*} splitFileList 文件切片集合
 * @param {*} chunkNumber 切片总数量
 * @param {*} fileName 文件名
 * @param {*} fileHash 文件hash（spark-md5）
 * @param {*} chunkSize 切片大小
 */
async function uploadFunc (uploadedList = [], chunkFileMes, fileName) {
  const { splitFileList, chunkNumber, fileHash, chunkSize } = chunkFileMes
  // 遍历切片集合，
  const Lists = splitFileList && splitFileList.filter(({ hash }) => !uploadedList.includes(hash))
  console.log(splitFileList, uploadedList, Lists)
  // 注意此处的取值，确保了顺序
  const fileChunkList = Lists.length > 0 && Lists.map(({ chunk, hash, index }) => {
    const obj = new FormData()
    obj.append('chunk', chunk) // 片文件
    // hash码，标识文件片？？？
    obj.append('hash', fileName + '-' + index)
    obj.append('fileHash', hash)
    // 上传文件的名称
    obj.append('fileName', fileName)
    // 文件片数，方便后端标识并合并
    obj.append('chunkNumber', chunkNumber + '')
    // 生成文件hash
    return { obj }
  })
  hackCurChunkList = splitFileList
  // 切片文件集合挨个发送给后端
  const fetchList = fileChunkList.map(async ({ obj }, index) => {
    await uploadFile(obj, processCalc, splitFileList[index])
    // 上传进度
  })
  await Promise.all(fetchList)
  console.log('上传成功,开始合并')
  // fileName 改为 fileHash
  const fileType = fileName.slice(fileName.lastIndexOf('.'), fileName.length)
  await mergeFileFunc(fileHash + fileType, chunkSize, fileName)
}
var hackCurChunkList = []
var hackChangeProcess
// 计算文件上传进度
function processCalc (val) {
  // 当前片的进度
  // console.log(val,hackCurChunkList)
  let process = 0
  const fileLength = hackCurChunkList.length
  hackCurChunkList.forEach(item => {
    process += item.percentage
  });
  let proVal = Number(process / fileLength)
  console.log(proVal)
  hackChangeProcess(proVal)
}
/**
 * 文件秒传：向服务端验证文件是否上传
 * @param {*} fileName
 * @param {*} fileHash
 * @return boolean
 */
async function verifyUpload (fileName, fileHash) {
  const data = await ifUpload({ fileName, fileHash })
  console.log(data)
  return data
}
// 暂停上传
function pauseUpload (params) {
  console.log('pause upload')
  global.requestList.forEach(xhr => {
    xhr.cancel()
  })
  global.requestList = []
}
// 恢复上传??????合并到发送按钮上，否则是拆分上传方法
async function continueUpload (chunkFileMes, fileName) {
  // const { splitFileList, chunkNumber, fileHash, chunkSize } = chunkFileMes
  const { fileHash } = chunkFileMes
  const { uploadedList, shouldUpload } = await verifyUpload(fileName, fileHash)
  if (!shouldUpload) {
    Toast.info('文件秒传成功，文件已存在了！')
    return
  }
  await uploadFunc(
    uploadedList, chunkFileMes,
    fileName,
  )
  return uploadedList
}
