// import SparkMD5 from 'spark-md5'
// const SparkMd5 = importScripts('spark-md5')

// const workercode = (self) => {

// self.importScripts("https://cdn.bootcss.com/spark-md5/3.0.0/spark-md5.min.js");
/* self.importScripts("/spark-md5.min.js");

self.onmessage = function (e) {
  console.log('I am worker,Message received from main script');
  var workerResult = 'Received from main: ' + (e.data);
  console.log('Posting message back to main script');
  // self.postMessage(workerResult);
  const { fileChunkList } = e.data
  if (!fileChunkList) {
    return
  }
  const spark = new self.SparkMD5.ArrayBuffer()
  let percentage = 0
  let count = 0
  const loadNext = index => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(fileChunkList[index])
    reader.onload = e => {
      count++
      spark.append(e.target.result)
      if (count === fileChunkList.length) {
        self.postMessage({
          percentage: 100,
          hash: spark.end()
        })
        self.close()
      } else {
        percentage += 100 / fileChunkList.length
        self.postMessage({
          percentage
        })
        // 递归计算下一个切片
        loadNext(count)
      }
    }
  }
  loadNext(0)
} */
// };

// let code = workercode.toString();
// code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

// const blob = new Blob([code], {type: "application/javascript"});
// const worker_script = URL.createObjectURL(blob);

// export default worker_script;



self.importScripts("/spark-md5.min.js") // 导入脚本
// 生成文件 hash
self.onmessage = e => {
  const { fileChunkList } = e.data;
  // if (!fileChunkList) {
  //   return
  // }
  console.log('worker onmessage')
  const spark = new self.SparkMD5.ArrayBuffer();
  let percentage = 0;
  let count = 0;
  const loadNext = index => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fileChunkList[index].chunk);
    reader.onload = e => {
      count++;
      spark.append(e.target.result);
      if (count === fileChunkList.length) {
        self.postMessage({
          percentage: 100,
          hash: spark.end()
        });
        self.close();
      } else {
        percentage += 100 / fileChunkList.length;
        self.postMessage({
          percentage
        });
        // 递归计算下一个切片
        loadNext(count);
      }
    };
  };
  loadNext(0);
}
