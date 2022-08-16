import './App.css';
import react, { useEffect, useRef, useCallback, useState } from 'react';
import { Link, BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './components/home'
import Eip712 from './components/eip712'


function App() {
  return (
    
    <BrowserRouter>
      <div className='App'>
        <div>
          <Link to={'/'}>
            Home
          </Link>
          <br/>
          <Link to={'eip712'}>
          Eip712
          </Link>
        </div>
      <Routes>
            <Route path='/' element={<Home/>}></Route>
            <Route path='/eip712' element={<Eip712/>}></Route>
          </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App;
