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
      }
  }
};

let code = workercode.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

const blob = new Blob([code], {type: "application/javascript"});
const worker_script = URL.createObjectURL(blob);

export default worker_script;