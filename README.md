# Iron Device — Audio Analysis Demo

A web-based dashboard that visualizes **chipset temperature** and **speaker excursion displacement** in real-time upon uploading an audio file.  
The system currently operates using a **Mock Engine** until the actual analysis library (`.so`) is integrated. Once the library is ready, you can switch engines simply by toggling environment variables.

---

## 🚀 Key Features

* **Audio File Drag-and-Drop**: Support for WAV, MP3, FLAC, and AAC formats.
* **Waveform Rendering**: Playback controls and visualization powered by `WaveSurfer.js`.
* **Real-time Temperature Chart**: Includes threshold indicators (**WARN 65°C** / **DANGER 75°C**).
* **Speaker Excursion Chart**: Real-time visualization of displacement.
* **Interactive Charts**: Supports mouse wheel and trackpad pinch-to-zoom for data inspection.
* **System Status Panel**: Displays sample rate, frame count, and resolution.

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **UI** | React 19 · Tailwind CSS |
| **Charts** | Apache ECharts (`echarts-for-react`) |
| **Audio** | WaveSurfer.js |
| **FFI (Upcoming)** | koffi |
| **Container** | Docker (`node:20-slim`) |

---

## 💻 Getting Started

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build
```bash
  npm run build
  npm start
```

### Docker
```bash
  # Build the image
  docker build -t iron-device-sim .

  # Run the container
  docker run -p 3000:3000 iron-device-sim
```

### .so Integration Guide
Follow these 3 steps to replace the Mock Engine with the actual libaudio_analysis.so binary.

1. Update lib/native-engine.ts Implement the function signatures based on your .so header file.
```TypeScript
// Refer to the .so header and fill in the TODO sections
this.lib = koffi.load(soPath);
```

2. Enable NativeEngine in lib/audio-engine.ts Uncomment the relevant lines within the getEngine() function.

```typeScript
  // Uncomment the following lines (3 lines)
  const { NativeEngine } = require("./native-engine");
  _engine = new NativeEngine(soPath);
```

3. Set Environment Variables and Restart

```bash
  # Local Environment
  USE_MOCK=false SO_PATH=/path/to/libaudio_analysis.so npm start

  # Docker
  docker run -p 3000:3000 \
    -e USE_MOCK=false \
    -e SO_PATH=/app/native/libaudio_analysis.so \
    -v /host/path/libaudio_analysis.so:/app/native/libaudio_analysis.so \
    iron-device-sim
```