import React, { Component } from 'react';
import './App.scss';
import MinukuHeatmap from './Components/MinukuHeatmap';

class App extends Component {
  render() {
    return (
      <div className="App">
        <MinukuHeatmap/>
      </div>
    );
  }
}

export default App;
