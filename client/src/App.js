import React from 'react'
import logo from './logo.svg'
import './App.scss'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import { Button } from 'antd-mobile'
import Page from './pages/page'
// import TabMenu from "./components/tab";

function App () {
  return (
    <div className='App'>
      <header className='App-header'>
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <a className='App-link' href='http://47.104.107.19:8080/'>
          talk with me
        </a>
      </header>
      <Router>
        <ul className="menus">
          <li>
            <Link to='/'>com</Link>
          </li>
          <li>
            <Link to='/home'>home</Link>
          </li>
          <li>
            <Link to='/list'>list</Link>
          </li>
          <li>
            <Link to='/chatRoom'>chat</Link>
          </li>
        </ul>
        {/* <TabMenu /> */}
        <Page />
      </Router>
    </div>
  )
}
function goPackage (params) {
  console.log('---')
}

export default App
