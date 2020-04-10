/**
 * 同步计算hash的方式，不用webWorker
 */
import SparkMd5 from 'spark-md5'

function calcFileHash(data,callback) {
  const { fileChunkList } = data
  const spark = new SparkMd5.ArrayBuffer()
  let percentage = 0
  let count = 0
  const loadNext = index => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(fileChunkList[index].chunk)
    reader.onload = e => {
      count++
      spark.append(e.target.result)
      if (count === fileChunkList.length) {
        // self.postMessage({
        //   percentage: 100,
        //   hash: spark.end()
        // })
        // self.close()
        callback({percentage:100,hash:spark.end()})
      } else {
        percentage += 100 / fileChunkList.length
        // self.postMessage({
        //   percentage
        // })
        callback({percentage})
        // 递归计算下一个切片
        loadNext(count)
      }
    }
  }
  loadNext(0)
}

export default calcFileHash;