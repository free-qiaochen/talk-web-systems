import React from 'react'
import { Progress } from 'antd-mobile'
import {
  // Line, 
  Circle
} from 'rc-progress'
import './process.scss'

export default class MyProgress extends React.Component {
  // constructor(props){
  //   super(props)
  // }
  state = {
    // percent: 50,
    uploadProgress: 0,
  }
  add = () => {
    let p = this.state.percent + 10
    if (this.state.percent >= 100) {
      p = 0
    }
    this.setState({ percent: p })
  }
  componentWillReceiveProps (nextProps) {
    console.log(nextProps.process, this.state.uploadProgress)
    // 进度不能倒退
    if (nextProps.process > this.state.uploadProgress) {
      this.setState({
        uploadProgress: nextProps.process
      });
    }
    // 到达100%后要清空
    if (nextProps.process === 100) {
      setTimeout(() => {
        this.setState({
          uploadProgress: 0
        });
      }, 0);
    }
  }
  render () {
    const { percent, process } = this.props
    const { uploadProgress } = this.state
    return (
      <div className='progress-container'>
        {percent > 0 && <Progress percent={percent} position='fixed' />}
        {process > 0 && process < 100 &&
          <div className='shadow'>
            <div className='processConts'>
              <span className='cont'>{`上传进度:${parseInt(uploadProgress)}%`}</span>
              <Circle percent={uploadProgress} strokeWidth='6' strokeColor='#1686e6' />
            </div>
          </div>}
        {/* <div style={{ height: 18 }} /> */}
        {/* <Progress percent={40} position="normal" unfilled={false} appearTransition /> */}
        {/* <WingBlank>
          <Button onClick={this.add}>(+-)10</Button>
        </WingBlank> */}
      </div>
    )
  }
}

// .show-info {
//   margin-top: 18px;
//   display: flex;
//   align-items: center;
// }
// .show-info .progress {
//   margin-right: 5px;
//   width: 100%;
// }
