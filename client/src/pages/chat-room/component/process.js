import React from 'react'
import { Progress } from 'antd-mobile';

export default class MyProgress extends React.Component {
  state = {
    percent: 50,
  };
  add = () => {
    let p = this.state.percent + 10;
    if (this.state.percent >= 100) {
      p = 0;
    }
    this.setState({ percent: p });
  }
  render() {
    const { percent } = this.state;
    return (
      <div className="progress-container">
        <Progress percent={percent} position="fixed" />
        {/* <div style={{ height: 18 }} /> */}
        {/* <Progress percent={40} position="normal" unfilled={false} appearTransition /> */}
        {/* <WingBlank>
          <Button onClick={this.add}>(+-)10</Button>
        </WingBlank> */}
      </div>
    );
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