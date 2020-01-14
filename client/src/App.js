import React from 'react'
import logo from './logo.svg'
import './App.css'
import { Button } from 'antd-mobile'
import Page from './pages/page'
import Home from './pages/home/home'
import { BrowserRouter as Router, Link } from 'react-router-dom'

function App() {
  return (
    <div className='App'>
      <header className='App-header'>
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <a
          className='App-link'
          href='https://reactjs.org'
          target='_blank'
          rel='noopener noreferrer'>
          Learn React
        </a>
        <a className='App-link' href='http://47.104.107.19:8080/'>
          talk with me
        </a>
      </header>
      <Button
        type='primary'
        className='commodity-module__bottom__btn'
        style={{
          backgroundColor: '0',
          color: '#000'
        }}
        onClick={() => goPackage()}>
        {'立即购买'}
      </Button>
      <Router>
        <ul>
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
            <Link to='/chat'>chat</Link>
          </li>
        </ul>
        <Page />
      </Router>
    </div>
  )
}
function goPackage(params) {
  console.log('---')
}

export default App
