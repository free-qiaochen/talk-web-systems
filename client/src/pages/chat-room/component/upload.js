// 文件上传，图片上传，切片，大文件，进度，优化速度

import React, { useEffect, useState, useCallback } from 'react'
import { Toast, Button, InputItem } from 'antd-mobile'
import { uploadFile, mergeFile } from '@/api/chart'

function UploadFile (props) {
  const { sendMes } = props
  const [fileDatas, setFileDatas] = useState()
  /**
   *  选择文件变化，更新数据
   *  */
  const getFile = useCallback((e) => {
    e.persist()
    const [file] = e.target.files
    if (!file) {
      return
    }
    setFileDatas(file)
  }, [])
  /**
   * 点击发送文件，分图片和其他文件
   *  */
  const sendFiles = useCallback(() => {
    console.log(fileDatas)
    if (!fileDatas) {
      Toast.info('请先选择文件')
      return
    }
    i = 0
    if (fileDatas && fileDatas.type.includes('image')) {
      sendMes('img')
    } else {
      console.log('文件切片')
      // 获取文件切片
      const { splitFileList, chunkNumber } = createFileChunk(fileDatas)
      console.log(splitFileList)
      // 切片文件挨个发送给后端
      splitFileList.forEach((file, index) => {
        const obj = new FormData()
        obj.append('chunk', file)  // 片文件
        // hash码，标识文件片？？？
        obj.append('hash', fileDatas.name + '-' + index)
        // 上传文件的名称
        obj.append('fileName', fileDatas.name)
        // 文件片数，方便后端标识并合并
        obj.append('chunkNumber', chunkNumber + '')
        // 请求server，发送数据
        fetchBigFileData(obj,chunkNumber)
      });
    }
  }, [sendMes, fileDatas])
  return (
    <div className='mesImages'>
      <input type='file' id='curImg' accept='*.jpe?g,*.png' onChange={(e) => { getFile(e) }} />
      <Button type='ghost' inline onClick={sendFiles}>
        发送图片
      </Button>
    </div>
  )
}

export default UploadFile
/**
 *文件切片 ,默认10Kb
 * @params files--目标文件，chunkSize--切片大小
 *  */
function createFileChunk (files, chunkSize = 100 * 1024) {
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
  return { splitFileList: fileChunkList, chunkNumber: length }
}
/* 
* 
*/
let i = 0
async function fetchBigFileData (file,chunkNumber) {
  let data = await uploadFile(file)
  console.log(data)
  ++i
  if (i === chunkNumber) {
    await mergeFile()
    console.log('上传成功')
  }
}
