/**
 * 该文件模块暂时无用，因开发打包运行sparkmd5报错，待后续想办法？？？？？？？？？？？
 */

import SparkMd5 from 'spark-md5'

const workercode = (self) => {

  self.onmessage = function(e) {
      console.log('I am worker,Message received from main script');
      var workerResult = 'Received from main: ' + (e.data);
      console.log('Posting message back to main script');
      // self.postMessage(workerResult);
      const {fileChunkList} = e.data
      const spark = new SparkMd5.ArrayBuffer()
      let percentage = 0
      let count = 0
      const loadNext = index => {
        const reader = new FileReader()
        reader.readAsArrayBuffer(fileChunkList[index].file)
        reader.onload = e=>{
          count++
          spark.append(e.target.result)
          if (count===fileChunkList.length) {
            self.postMessage({
              percentage:100,
              hash:spark.end()
            })
            self.close()
          }else{
            percentage+=100/fileChunkList.length
            self.postMessage({
              percentage
            })
            // 递归计算下一个切片
            loadNext(count)
          }
        }
      }
      loadNext(0)
  }
};

let code = workercode.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

const blob = new Blob([code], {type: "application/javascript"});
const worker_script = URL.createObjectURL(blob);

export default worker_script;