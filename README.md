# Hex2 - Hexagonal Zoom Animation

A React component that creates a mesmerizing hexagonal grid animation with zoom and fade transitions. Each hexagon displays random images from Picsum Photos that transition with smooth zoom and fade effects.

## Features

- **Hexagonal Grid**: Creates a tessellating hexagonal pattern
- **Smooth Animations**: Images zoom in from scale 2→1 while fading in
- **Continuous Scrolling**: The grid continuously scrolls upward
- **Dynamic Image Loading**: Random images from Picsum Photos
- **Interactive Controls**: Real-time adjustment of animation parameters
- **Responsive Design**: Adapts to different screen sizes

## Demo

The component includes interactive controls for:
- **Outer Scale**: Controls the overall size of hexagons (0.5 - 3.0)
- **Inner Scale**: Controls the scaling of images within hexagons (0.5 - 1.0)
- **Speed**: Controls scroll speed in rows per second (0.1 - 2.0)
- **Interval**: Controls how often images change in milliseconds (1000 - 10000)

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd Hex2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Basic Usage

```jsx
import FramerHexZoomAnimation from './components/FramerHexZoomAnimation';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FramerHexZoomAnimation
        outerScale={1.5}
        innerScale={0.96}
        speed={0.5}
        interval={5000}
      />
    </div>
  );
}
```

### With Custom Styling

```jsx
<FramerHexZoomAnimation
  outerScale={1.5}
  innerScale={0.96}
  speed={0.5}
  interval={5000}
  style={{
    border: '2px solid #333',
    borderRadius: '10px'
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `outerScale` | number | 1.5 | Scales the overall hexagon size (0.5 - 3.0) |
| `innerScale` | number | 0.96 | Scales images within hexagons (0.5 - 1.0) |
| `speed` | number | 0.5 | Scroll speed in rows per second (0.1 - 2.0) |
| `interval` | number | 5000 | Time between image changes in milliseconds (1000 - 10000) |
| `width` | string/number | "100%" | Canvas width |
| `height` | string/number | "100%" | Canvas height |
| `style` | object | {} | Additional CSS styles |

## How It Works

1. **Grid Generation**: Creates a hexagonal grid pattern using mathematical calculations
2. **Image Loading**: Loads random images from Picsum Photos for each hexagon
3. **Animation Loop**: Uses `requestAnimationFrame` for smooth 60fps animations
4. **Transition Effects**: 
   - Outgoing images fade out (alpha: 1→0)
   - Incoming images zoom in (scale: 2→1) while fading in (alpha: 0→1)
5. **Continuous Scrolling**: The entire grid scrolls upward continuously
6. **Responsive**: Automatically adjusts to window resize events

## Technical Details

- **Canvas API**: Uses HTML5 Canvas for high-performance rendering
- **Image Loading**: Asynchronous image loading with cross-origin support
- **Memory Management**: Proper cleanup of animation frames and event listeners
- **Performance**: Optimized for smooth 60fps animations

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 