import React, { useState } from 'react';
import './App.css';
import FramerHexZoomAnimation from './components/FramerHexZoomAnimation';

function App() {
  const [outerScale, setOuterScale] = useState(1.5);
  const [innerScale, setInnerScale] = useState(0.96);
  const [speed, setSpeed] = useState(0.5);
  const [interval, setInterval] = useState(5000);

  return (
    <div className="App">
      <div className="controls">
        <h1>Hexagonal Zoom Animation</h1>
        <div className="control-group">
          <label>
            Outer Scale: {outerScale}
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={outerScale}
              onChange={(e) => setOuterScale(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Inner Scale: {innerScale}
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.01"
              value={innerScale}
              onChange={(e) => setInnerScale(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Speed (rows/s): {speed}
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div className="control-group">
          <label>
            Interval (ms): {interval}
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value))}
            />
          </label>
        </div>
      </div>
      <div className="animation-container">
        <FramerHexZoomAnimation
          outerScale={outerScale}
          innerScale={innerScale}
          speed={speed}
          interval={interval}
        />
      </div>
    </div>
  );
}

export default App; 