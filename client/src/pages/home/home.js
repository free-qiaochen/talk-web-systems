import React, {useState,useEffect  } from 'react';
import './home.scss';
import { Button } from 'antd-mobile'

function Home () {
  const [count,setCount] = useState(1)
  useEffect(()=>{
    console.log(`点击了${count} 次`)
  })
  return (
    <div className="home">
      <div className="conts">
        home内容区 {count}
      </div>
      <Button
        type="primary"
        className="commodity-module__bottom__btn"
        style={{
          backgroundColor: '0',
          color: '#000'
        }}
        onClick={() => goPackage(setCount,count)}
      >{'home btn'}</Button>
    </div>
  );
}
function goPackage (setCount,count) {
  console.log('---')
  setCount(count + 1)
}

export default Home;
