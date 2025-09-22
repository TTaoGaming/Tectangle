# Foundation App (Colliding Sphere) - Comprehensive Summary
time 8/18/2025 3:24pm

## 1. Overview of the Foundation App

The Foundation App, also known as the "Colliding Sphere" application, is an interactive web-based 3D model playground that allows users to control 3D models using hand gestures and voice commands in real-time. Built with modern web technologies, this application demonstrates the integration of computer vision, 3D rendering, and speech recognition to create an immersive user experience.

### Key Features:
- Real-time hand gesture recognition for 3D model manipulation
- Voice command support for changing interaction modes
- Drag-and-drop functionality for importing custom 3D models (GLB/GLTF format)
- Multiple interaction modes: drag, rotate, scale, and animate
- Visual feedback through hand landmark visualization
- Audio feedback for interactions
- Responsive design that works across different screen sizes

### Technologies Used:
- **Three.js**: For 3D rendering and scene management
- **MediaPipe**: For hand tracking and gesture recognition using the HandLandmarker task
- **Web Speech API**: For speech recognition and command processing
- **Web Audio API**: For generating audio feedback
- **HTML5 Canvas**: For rendering the 3D scene and hand visualization
- **JavaScript (ES6 Modules)**: For application logic and component management

## 2. How to Use the App

### Setup Requirements:
- Modern web browser with WebGL support (Chrome recommended)
- Camera access for hand tracking
- Microphone access for speech recognition
- Internet connection (for loading CDN resources)

### Running the Application:
1. Clone or download the repository
2. Navigate to the project directory
3. Serve the files using any local web server:
   - Python: `python -m http.server 8000`
   - Node: `npx http-server -p 8000` or `npx live-server --port=8000`
4. Open your browser and navigate to `http://localhost:8000`
5. Allow camera and microphone permissions when prompted

### Interaction Methods:
- **Voice Commands**: Say "drag", "rotate", "scale", or "animate" to change the interaction mode
- **Hand Gestures**: Pinch fingers to control the 3D model based on the current interaction mode
- **Drag and Drop**: Drag and drop a new 3D model (GLB/GLTF format) onto the page to import it

### Interaction Modes:
1. **Drag Mode (Default)**: Pinch to grab and move the model around the screen
2. **Rotate Mode**: Pinch and move your hand left/right to rotate the model
3. **Scale Mode**: Use two hands - pinch with both and move hands closer/farther to scale the model
4. **Animate Mode**: Pinch and move your hand up/down to cycle through available animations

## 3. How to Hook in Custom Logic

The Foundation App is designed with extensibility in mind, allowing developers to customize and extend its functionality.

### Extensibility Points:

#### 1. Custom Interaction Modes
To add a new interaction mode:
1. Add the mode name to the `validCommands` array in [`SpeechManager.js:154`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/SpeechManager.js#L154-L159)
2. Add the mode to the interaction mode UI in [`game.js:426`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L426-L431)
3. Add mode-specific logic in the hand processing loop in [`game.js:909`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L909-L1070)
4. Add mode configuration to `interactionModeColors` in [`game.js:229`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L229-L250)
5. Add instructions for the new mode in `interactionModeInstructions` in [`game.js:262`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L262-L267)

#### 2. Custom 3D Models
The app supports loading custom GLB/GLTF models:
1. Replace the default model file at `assets/Stan.gltf`
2. Modify the model loading path in [`game.js:637`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L637-L699)
3. Adjust scaling and positioning parameters as needed in [`game.js:689`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L689-L693)

#### 3. Custom Audio Feedback
Modify the audio feedback in [`audioManager.js`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/audioManager.js):
1. Adjust the oscillator parameters in `playInteractionClickSound()` method
2. Modify the gain envelope for different sound characteristics
3. Add new sound effects by creating additional methods in the AudioManager class

#### 4. Custom Visual Feedback
Customize the visual appearance:
1. Modify hand visualization colors in `interactionModeColors` in [`game.js:229`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L229-L250)
2. Adjust hand landmark visualization in `_updateHandLines()` method in [`game.js:1324`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L1324-L1443)
3. Modify UI elements in [`styles.css`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/styles.css)

### Customization Options:

#### 1. Sensitivity Adjustments
- Modify `rotateSensitivity` in [`game.js:252`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L252-L252) for rotation speed
- Adjust `scaleSensitivity` in [`game.js:255`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L255-L255) for scaling responsiveness
- Change `smoothingFactor` in [`game.js:211`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L211-L211) for hand tracking smoothness

#### 2. Visual Customizations
- Adjust `fingertipDefaultOpacity` and `fingertipGrabOpacity` in [`game.js:259`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L259-L260) for hand landmark visibility
- Modify `grabbingPulseSpeed` and `grabbingPulseAmplitude` in [`game.js:256`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L256-L258) for grab animation effects

#### 3. Speech Command Extensions
- Add new commands to the `commandMap` in [`SpeechManager.js:179`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/SpeechManager.js#L179-L189)
- Implement corresponding functionality in the main Game class

## 4. Technical Architecture Details

### Core Components:

#### 1. Game Class ([`game.js`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js))
The main application controller that manages:
- Three.js scene setup and rendering
- Hand tracking integration with MediaPipe
- User interaction handling
- 3D model management
- UI state management
- Animation control
- Drag and drop functionality

#### 2. AudioManager Class ([`audioManager.js`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/audioManager.js))
Handles all audio-related functionality:
- Web Audio API context management
- Audio feedback for user interactions
- Audio context resumption on user interaction

#### 3. SpeechManager Class ([`SpeechManager.js`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/SpeechManager.js))
Manages speech recognition:
- Web Speech API integration
- Command recognition and processing
- Transcript display management

### Data Flow:

1. **Initialization**:
   - DOM setup and UI creation
   - Three.js scene, camera, and renderer initialization
   - Speech recognition setup
   - Asset loading (3D model)
   - Hand tracking initialization with MediaPipe

2. **Main Loop**:
   - Continuous hand landmark detection via MediaPipe
   - Hand data processing and smoothing
   - Interaction mode-specific logic execution
   - 3D scene updates
   - Rendering

3. **User Interaction**:
   - Voice commands processed by SpeechManager
   - Hand gestures detected and interpreted
   - 3D model manipulation based on current mode
   - Visual and audio feedback

### File Structure:
```
foundation/
├── index.html          # Main HTML file
├── main.js             # Application entry point
├── game.js             # Main Game class and logic
├── audioManager.js     # Audio handling
├── SpeechManager.js    # Speech recognition
├── styles.css          # UI styling
├── README.md           # Project documentation
├── INSPECTION_REPORT.md # Technical analysis
├── assets/             # 3D models and other assets
│   └── Stan.gltf       # Default 3D model
└── .github/            # GitHub configuration
```

## 5. API References for Key Components

### Game Class Methods:

#### Public Methods:
- `start()`: Initializes the game and starts the main loop
- `_setInteractionMode(mode)`: Changes the current interaction mode
- `_playAnimation(name)`: Plays a specific animation on the 3D model

#### Key Private Methods:
- `_init()`: Asynchronous initialization of all components
- `_setupThree()`: Initializes Three.js scene, camera, and renderer
- `_setupHandTracking()`: Initializes MediaPipe hand tracking
- `_updateHands()`: Processes hand tracking results and updates interactions
- `_animate()`: Main animation loop
- `_loadDroppedModel(file)`: Handles loading of user-dropped 3D models

### AudioManager Class:

#### Methods:
- `resumeContext()`: Resumes the audio context (required by browsers)
- `playInteractionClickSound()`: Plays a click sound for interactions

### SpeechManager Class:

#### Constructor:
- `SpeechManager(onTranscript, onRecognitionActive, onCommandRecognized)`: Initializes speech recognition with callback functions

#### Methods:
- `startRecognition()`: Starts speech recognition
- `stopRecognition()`: Stops speech recognition
- `requestPermissionAndStart()`: Requests microphone permission and starts recognition

### Key Properties:

#### Game Class Properties:
- `interactionMode`: Current interaction mode ('drag', 'rotate', 'scale', 'animate')
- `pandaModel`: Reference to the loaded 3D model
- `hands`: Array storing data about detected hands
- `scene`, `camera`, `renderer`: Three.js core components

#### Hand Object Structure:
- `landmarks`: Array of hand landmark positions
- `anchorPos`: Position of the hand anchor point
- `lineGroup`: Three.js group containing hand visualization
- `isPinching`: Boolean indicating if hand is in pinch gesture
- `pinchPointScreen`: Screen coordinates of pinch point
- `isFist`: Boolean indicating if hand is detected as a fist

## 6. Troubleshooting Tips

### Common Issues and Solutions:

#### 1. Camera Not Working
- **Issue**: Camera permission denied or not accessible
- **Solution**: 
  - Check browser permissions for camera access
  - Ensure no other applications are using the camera
  - Try refreshing the page and re-granting permissions
  - Check if your browser supports getUserMedia API

#### 2. Hand Tracking Not Working
- **Issue**: Hand landmarks not detected or tracking is unstable
- **Solution**:
  - Ensure adequate lighting conditions
  - Position hands within the camera view
  - Check that MediaPipe CDN resources are loading (internet connection)
  - Try adjusting the `smoothingFactor` in [`game.js:211`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L211-L211) for better tracking stability

#### 3. Speech Recognition Not Working
- **Issue**: Voice commands not recognized
- **Solution**:
  - Check browser permissions for microphone access
  - Ensure you're using a supported browser (Chrome recommended)
  - Speak clearly and at an appropriate volume
  - Check that Web Speech API is enabled in your browser
  - Try clicking on the page to activate audio context

#### 4. 3D Model Not Loading
- **Issue**: Default or dropped model not appearing
- **Solution**:
  - Check browser console for loading errors
  - Verify that the model file is in GLB/GLTF format
  - Ensure the model file is correctly placed in the assets directory
  - Check that the model loading path in [`game.js:637`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L637-L699) is correct

#### 5. Poor Performance
- **Issue**: Application running slowly or lagging
- **Solution**:
  - Try reducing the video resolution in [`game.js:764`](file:///c%3A/Dev/Spatial%20Input%20Mobile/August%20Tectangle%20Sprint/foundation/game.js#L764-L774)
  - Reduce the complexity of the 3D model
  - Close other applications using system resources
  - Try a different browser or device with better specifications

#### 6. Audio Not Working
- **Issue**: No audio feedback for interactions
- **Solution**:
  - Check system volume and mute settings
  - Ensure browser tab is not muted
  - Try clicking on the page to activate audio context
  - Check browser console for Web Audio API errors

### Browser Compatibility:
- **Recommended**: Google Chrome (latest version)
- **Supported**: Firefox, Edge (with potential limitations)
- **Not Supported**: Safari (limited Web Speech API support)

### Development Tips:
1. Use browser developer tools to monitor console output for errors
2. Check network tab to ensure all CDN resources are loading correctly
3. Use the performance tab to identify bottlenecks
4. Test on different devices and browsers to ensure compatibility
5. When modifying the code, ensure all module imports are correctly resolved