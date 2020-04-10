import calcFileHash from './calc-hash'
import { deviceType } from "@/tools/device-type";
import global from '@/config'
import { uploadFile, mergeFile, ifUpload } from '@/api/chart'
import {
  Toast,
} from 'antd-mobile'
/**
 *文件切片 ,默认100Kb
 * @params files--目标文件，chunkSize--切片大小
 *  */
export function createFileChunk (files, chunkSize = 1000 * 1024) {
  console.log('开始切片--')
  const fileChunkList = []
  // 向上取整
  const length = Math.ceil(files.size / chunkSize)
  let curIndex = 0
  while (curIndex < length) {
    let cur = curIndex * chunkSize
    const fileChunk = files.slice(cur, cur + chunkSize)
    fileChunkList.push({ chunk: fileChunk }) // 修改？？？
    curIndex++
  }
  return { splitFileList: fileChunkList, chunkNumber: length, chunkSize }
}
/**
 * 请求api，进行文件合并
 * @param {*} fileName
 * @param {*} chunkSize
 */
async function mergeFileFunc (fileHash, chunkSize, oldName, nickName, sendMes) {
  console.log('请求合并')
  let data = await mergeFile({
    fileHash,
    chunkSize,
    oldName,
    nickName
  })
  if (data && data.code === 0) {
    console.log(data && data.message)
    data && Toast.info(data.message)
    sendMes('file', oldName) // 触发socket发送文件名（文件上传完毕后）
  }
  Toast.info(data.message)
}
/**
 * 计算文件hash
 * @param {*} fileChunkList 文件切片集合,changeProcess进度,setUploading上传状态
 * @return hash
 */
export function calculateHash (fileChunkList, changeProcess, setUploading) {
  setUploading(false)
  console.log('start calc hash')
  return new Promise((resolve, reject) => {
    try {
      console.log(deviceType())
      if (typeof Worker !== 'undefined' && (deviceType() === 'pc')) {
        console.log('浏览器支持webworker，开始计算hash')
        let worker = new Worker('/hash.js')
        worker.postMessage({ fileChunkList })
        worker.onmessage = e => {
          const { percentage, hash } = e.data
          // console.log('percentage:', percentage)
          changeProcess(percentage)
          // this.hashPercentage=percentage
          if (hash) {
            resolve(hash)
          } else {
            // console.warn('没计算到hash！')
            // reject('calc hash failed!')
          }
        }
      } else {
        console.log('改浏览器不支持webWorker计算hash')
        const callBack = callBackObj => {
          const { percentage, hash } = callBackObj
          // console.log('percentage:', percentage)
          changeProcess(percentage)
          if (hash) {
            resolve(hash)
          } else {
            // console.warn('没计算到hash！')
            // reject('calc hash failed!')
          }
        }
        //
        calcFileHash({ fileChunkList }, callBack)
      }
    } catch (error) {
      console.warn(error)
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
export async function uploadFunc (
  uploadedList = [],
  chunkFileMes,
  fileName,
  nickName,
  sendMes, changeProcess
) {
  const { splitFileList, chunkNumber, fileHash, chunkSize } = chunkFileMes
  hackChangeProcess = changeProcess
  // 遍历切片集合，
  const Lists =
    splitFileList &&
    splitFileList.filter(({ hash }) => !uploadedList.includes(hash))
  console.log(splitFileList, uploadedList, Lists)
  // 注意此处的取值，确保了顺序
  const fileChunkList =
    (Lists.length > 0 &&
      Lists.map(({ chunk, hash, index }) => {
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
      })) ||
    []
  hackCurChunkList = Lists  // 当前要上传的切片集合（续传时是剩余需要上传的部分）
  // 切片文件集合挨个发送给后端
  const fetchList = fileChunkList.map(async ({ obj }, index) => {
    await uploadFile(obj, processCalc, hackCurChunkList[index])
    // 上传进度
  })
  await Promise.all(fetchList)
  console.log('上传成功,开始合并')
  // fileName 改为 fileHash
  // const fileType =
  //   fileName.lastIndexOf('.') !== -1
  //     ? fileName.slice(fileName.lastIndexOf('.'), fileName.length)
  //     : ''
  await mergeFileFunc(fileHash, chunkSize, fileName, nickName, sendMes)
  return true
}
var hackCurChunkList = []
export let hackChangeProcess
// 计算文件上传进度
function processCalc (val) {
  // 当前片的进度
  let process = 0
  const fileLength = hackCurChunkList.length
  hackCurChunkList.forEach(item => {
    process += item.percentage
  })
  let proVal = Number(process / fileLength)
  console.log(process, proVal)
  console.log('---', val, '---', fileLength)
  hackChangeProcess(proVal, 'upload')
}
/**
 * 文件秒传：向服务端验证文件是否上传
 * @param {*} fileName
 * @param {*} fileHash
 * @return boolean
 */
export async function verifyUpload (fileName, fileHash) {
  const data = await ifUpload({ fileName, fileHash })
  console.log(data)
  return data
}
// 暂停上传
export function pauseUpload (params) {
  console.log('pause upload')
  global.requestList.forEach(xhr => {
    xhr.cancel()
  })
  global.requestList = []
}
// 恢复上传??????合并到发送按钮上，否则是拆分上传方法
export async function continueUpload (chunkFileMes, fileName, nickName, sendMes, changeProcess) {
  // const { splitFileList, chunkNumber, fileHash, chunkSize } = chunkFileMes
  const { fileHash } = chunkFileMes
  const { uploadedList, shouldUpload } = await verifyUpload(fileName, fileHash)
  if (!shouldUpload) {
    Toast.info('文件秒传成功，文件已存在了！')
    return
  }
  await uploadFunc(uploadedList, chunkFileMes, fileName, nickName, sendMes, changeProcess)
  return uploadedList
}
