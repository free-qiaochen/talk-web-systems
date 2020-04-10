// 文件上传，图片上传，切片，大文件，进度，优化速度

import React, {
  // useEffect,
  useState,
  useCallback
} from 'react'
import {
  Toast,
  Button
  // ImagePicker
} from 'antd-mobile'
import './upload.scss'
// var myWorker = new Worker('/hash.js')
import {
  createFileChunk,
  uploadFunc,
  pauseUpload,
  continueUpload,
  calculateHash,
  verifyUpload
} from './upload-utils/upload'

function UploadFile(props) {
  const { sendMes, changeProcess, nickName } = props
  const [fileDatas, setFileDatas] = useState([])
  const [chunkFileMes, setChunkFileMes] = useState({})
  const [uploading, setUploading] = useState(false)
  /**
   *  选择文件变化，更新数据
   *  */
  const getFile = useCallback(
    e => {
      e.persist() // react hack
      const [file] = e.target.files
      // console.log(
      //   'select file:',
      //   e.target.files[0],
      //   '--',
      //   file.name,
      //   '--',
      //   file.size,
      //   '--',
      //   file.type
      // )
      setFileDatas(file)
      if (!file) {
        return
      }
      changeProcess(0)
    },
    [changeProcess]
  )

  const initFileLoad = useCallback(() => {
    // 清空文件，图片输入框
    setFileDatas(null)
    console.log(document.querySelectorAll('#curImg').value)
    document.getElementById('curImg').value = ''
  }, [])
  /**
   * 点击发送文件，分图片和其他文件
   *  */
  const sendFiles = useCallback(
    async type => {
      // const fileDatas = fileDatas[0].file
      console.log(fileDatas)
      if (!fileDatas || !fileDatas.size) {
        Toast.info('请先选择文件')
        return
      }
      changeProcess(0)
      if (fileDatas && fileDatas.type.includes('image')) {
        sendMes('img') //socket发送图片
        setTimeout(() => {
          initFileLoad() //清空输入框显示的名字
        }, 2000)
      } else {
        if (type === 'continue') {
          // 续传
          continueUpload(
            chunkFileMes,
            fileDatas.name,
            nickName,
            sendMes,
            changeProcess
          )
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
        const chunkLists = splitFileList.map(({ chunk }, index) => ({
          fileHash,
          index,
          hash: fileHash + '-' + index,
          chunk: chunk,
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
        // console.log('shouldUpload', shouldUpload)
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
        // 待优化,取值有问题
        // console.log('chunkFileMes:', chunkFileMes, latestChunkFileMes)
        changeProcess(0) // 进度重置
        // 切片上传功能函数
        await uploadFunc(
          uploadedList,
          latestChunkFileMes,
          fileName,
          nickName,
          sendMes,
          changeProcess
        )
        initFileLoad()
      }
    },
    [sendMes, fileDatas, chunkFileMes, changeProcess, nickName, initFileLoad]
  )
  // useEffect(() => {
  //   console.log('didMount?')
  //   copyFunc('.copyText')
  //   myWorker.onmessage = m => {
  //     console.log('msg from worker: ', m.data)
  //   }
  //   myWorker.postMessage('im from main')
  // }, [])
  return (
    <div className='mesFiles'>
      <input
        type='file'
        name='file'
        id='curImg'
        value=''
        onChange={e => {
          getFile(e)
        }}
      />
      <span className='fileArea'>
        {(fileDatas && fileDatas.name) || '文件上传...'}
      </span>
      {/* <ImagePicker files={fileDatas}
          onChange={onChange}
          onImageClick={(index, fs) => console.log(index, fs)}
          selectable={fileDatas.length < 3}
          accept="image/gif,image/jpeg,image/jpg,image/png,*" /> */}
      <Button className='sendFile' type='ghost' inline onClick={sendFiles}>
        发送
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
          <Button
            inline
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
