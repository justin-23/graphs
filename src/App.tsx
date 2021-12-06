import React from 'react';
import logo from './logo.svg';
import './App.css';

import Board from './Board';
import { getDefaultCompilerOptions } from 'typescript';


function App() {
  return (
    <div className="App">
      <div className="title">
        Graph Editor by Justin Lee
      </div>
         <Board />
    </div>
  );
}



export default App;
