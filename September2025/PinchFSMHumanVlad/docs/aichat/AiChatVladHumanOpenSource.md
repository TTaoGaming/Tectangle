# Executive summary — **@vladmandic/human** (one page)

**What it is (TL;DR)**
`@vladmandic/human` is a mature, full-featured JavaScript/TypeScript computer-vision toolkit that runs in browser, WebWorker and Node.js (tfjs backends) and combines many pre-trained models into a unified API: face detection & mesh, face description/recognition, body pose, 3D hand + finger tracking, iris/gaze analysis, age/gender/emotion, segmentation and gesture recognition. It’s designed so you enable only the models you need and it dynamically loads weights on demand. ([GitHub][1])

**Why it’s a good fit for “gesture → keyboard”**

* It already extracts the low-level signals you need: hand keypoints, finger positions, face/eye landmarks and high-level gestures (rules built on landmark geometry). That means you don’t have to train hand/keypoint models yourself — you consume `human`’s results and map them to keyboard actions. ([GitHub][1])
* Works in browser (WebGL/WebGPU/WASM) and Node (tfjs-node, CUDA) so you can prototype in the browser and later move to a local desktop app (Electron) if you want native key synth. ([GitHub][1])

**Core API (practical summary)**

* `const human = new Human(config?)` — create instance with a single JSON config. ([GitHub][2])
* `await human.detect(input, config?)` — run detection on a single image/frame and receive a **single `result` object** containing all enabled modules (faces, hands, body, gestures, segmentation, performance, etc.). `human.result` also holds the last result. ([GitHub][2])
* `await human.video(input, config?)` — run continuous detection loop (webcam/video). Results are updated live in `human.result`. ([GitHub][2])
* Helpers: `human.load()`, `human.warmup()`, `human.reset()`, `human.models.*` (load/list/validate), `human.draw.*`, `human.webcam.*`. There are built-in draw helpers and smoothing/caching options. ([GitHub][2])

**Important result shape you’ll use**
`result` contains arrays/objects for detected faces, hands, body keypoints, gesture detections and a `persons` getter that groups parts that belong to the same person. Gesture recognition is implemented as rules on detected landmarks (source is `src/gesture.ts`), so gesture names and their landmark-based definitions are available in the code/docs. ([GitHub][3])

**How to wire it to keyboard input — minimal plan (prototype)**

1. Pick environment: browser prototype (quick) or Electron/Node (to synth native OS key presses). Browser approach can still synthesize `KeyboardEvent`s for web apps; for system hotkeys you’ll need native bridge (Electron / native agent). ([GitHub][1])

2. Minimal config: enable `hand` (and optionally `gesture`, `pose` or `iris`) and set `modelBasePath` to the hosted models CDN. Example config:

   ```js
   const human = new Human({
     modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
     backend: 'webgl',
     hand: { enabled: true },
     gesture: { enabled: true }
   });
   await human.load();      // loads only configured models
   await human.warmup();
   await human.video(videoElement);
   ```

   (This follows the library’s single-config approach and load-on-demand model behavior.) ([GitHub][2])

3. In your loop, read `human.result` (or the returned result from `detect`) and inspect `result.hands`, `result.gestures` or `result.persons`. Create a small state machine to debounce and smooth gestures (the library also provides smoothing/caching hooks). Map a recognized gesture label to a keyboard action and dispatch:

   ```js
   // (browser) dispatch a synthetic key press to focused element
   const e = new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp' });
   document.activeElement?.dispatchEvent(e);
   ```

   For OS-level keys (global hotkeys), use Electron’s `globalShortcut` or a local native helper. ([GitHub][2])

**Pros / Cons (quick)**

* **Pros:** Single unified API for many models; demos + examples; dynamic model loading; multiple backends (WebGPU/WebGL/WASM/tfjs-node); MIT license. ([GitHub][1], [Yarn][4])
* **Cons / caveats:** Real-time performance depends on backend & device — choose minimal models and use smoothing/caching. Hand/gesture accuracy is rule-based and may require tuning for your gestures and lighting. Privacy: models run client-side but face/biometric features require careful privacy consideration. ([GitHub][1])

**Next steps I recommend (fast path)**

1. Run the **Main Live Demo** in your browser to see `human` output and which fields appear for hands/gestures. (Demo links live in the repo.) ([GitHub][1])
2. Fork the demo or a CodeSandbox example, enable only `hand`+`gesture`, and prototype mapping 3–5 gestures to keys. Use browser `KeyboardEvent` for an in-page demo. ([CodeSandbox][5], [GitHub][2])
3. If you need OS-level key synthesis, wrap the prototype in Electron and forward gesture events to a native key-synth module.
4. Iterate: tune gesture rules in `src/gesture.ts` or add custom rules based on landmark geometry for higher accuracy. ([GitHub][6])

---

If you want, I can **(pick one)**:

* produce a ready-to-run minimal browser example that maps 3 hand gestures → arrow keys (HTML + JS), or
* inspect the demo’s `gesture` / `hand` output and extract the exact property names you’ll check for mapping (so your mapping code uses exact fields).

Which do you want me to build for you right now?

[1]: https://github.com/vladmandic/human "GitHub - vladmandic/human: Human: AI-powered 3D Face Detection & Rotation Tracking, Face Description & Recognition, Body Pose Tracking, 3D Hand & Finger Tracking, Iris Analysis, Age & Gender & Emotion Prediction, Gaze Tracking, Gesture Recognition"
[2]: https://github.com/vladmandic/human/wiki/Usage "Usage · vladmandic/human Wiki · GitHub"
[3]: https://github.com/vladmandic/human/wiki/Result?utm_source=chatgpt.com "Result · vladmandic/human Wiki"
[4]: https://classic.yarnpkg.com/en/package/%40vladmandic/human?utm_source=chatgpt.com "@vladmandic/human | Yarn"
[5]: https://codesandbox.io/examples/package/%40vladmandic/human?utm_source=chatgpt.com "vladmandic/human examples"
[6]: https://github.com/vladmandic/human/wiki/Gesture?utm_source=chatgpt.com "Gesture Recognition - vladmandic/human Wiki"


---------------

# Deep dive — how to *actually* work with `@vladmandic/human` (practical guide + examples)

Nice choice — `human` already supplies the heavy CV plumbing (hand keypoints, gestures, pose, smoothing, draw helpers, demos and Node/Electron compatibility). Below I’ll walk you from repo → a working developer flow, what files to create, how the API is shaped, and concrete code patterns you’ll use to map gestures → keyboard actions.

All API/source references below are taken from the repo/demos/docs. ([GitHub][1])

---

# 1) Mental model / API surface (big picture)

* **Single main class**: you create `const human = new Human(config)` and that instance is your single entry point (load models, run detection, get results). ([GitHub][1])
* **Two ways to run detection**:

  * `await human.detect(input)` — one-shot detection on an image/frame (returns result object).
  * `await human.video(videoElement)` — built-in continuous loop for webcam/video; it updates `human.result` continuously. ([GitHub][1])
* **Helpers & lifecycle**: `human.load()` (load weights for enabled modules), `human.warmup()` (optional), `human.reset()` (clear state), `human.models.*`, `human.draw.*`, `human.webcam.*`. Use these to control performance and visuals. ([GitHub][1])
* **Result object**: After detection you read `result` (or `human.result`). It contains arrays/objects like `result.hands`, `result.faces`, `result.pose`, `result.gestures` and a `result.persons` getter that groups parts by person. Gesture detection is implemented as landmark rules — you can read/extend them. ([GitHub][1])

---

# 2) How to structure your small project (recommended files)

A minimal browser prototype to map gestures → keyboard:

```
gesture-keyboard/
├─ index.html            # simple page + video + canvas
├─ src/
│  ├─ main.js            # bootstraps Human, loads models, starts video loop
│  ├─ mapper.js          # maps human.result → logical gestures (debounce, FSM)
│  └─ keyboard-bridge.js # sends KeyboardEvent (or forwards to Electron)
├─ package.json
└─ README.md
```

If you intend to synthesize system-wide keys later, wrap this in **Electron** and add `main-electron.js` to handle native key synthesis and accept gesture IPC messages from the renderer.

---

# 3) Minimal working browser example (copy/paste and run)

This uses the built-in loop (`human.video`) and polls `human.result`. It maps a simple “open-hand / fist / point” gesture to ArrowUp/ArrowDown/Enter (example only).

index.html (very small):

```html
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Gesture → Keyboard</title></head>
<body>
  <video id="video" autoplay playsinline style="display:none"></video>
  <canvas id="overlay"></canvas>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

src/main.js

```js
import { Human } from 'https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.esm.js';
import { mapGestures } from './mapper.js';
import { sendKey } from './keyboard-bridge.js';

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');

const human = new Human({
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  backend: 'webgl',               // choose WebGL / WebGPU / wasm depending on browser
  cacheSensitivity: 0.5,         // example perf tuning
  hand: { enabled: true },       // enable only what you need
  gesture: { enabled: true },
  // pose: { enabled: false },   // disable unneeded modules
});

async function start() {
  await human.load();    // loads only configured models
  await human.warmup();
  // start webcam stream (human has helpers but plain getUserMedia works)
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }});
  video.srcObject = stream;
  await video.play();

  // start the built-in continuous detection loop
  human.video(video, { canvas }); // this will update human.result continuously

  // poll results (or subscribe via demo events; polling is simplest)
  setInterval(() => {
    const res = human.result;
    if (!res) return;
    // optional: draw results using built-in draw helpers
    if (human.draw && human.draw.canvas) human.draw.canvas(res, canvas);
    // map gestures → logical action(s)
    const action = mapGestures(res);
    if (action) sendKey(action); // dispatch keyboard to page or IPC to Electron
  }, 80); // tune polling interval to balance latency/CPU
}
start().catch(console.error);
```

src/mapper.js (very small stateful debounce)

```js
let last = { name: null, time: 0, count: 0 };

export function mapGestures(result) {
  // example: library returns result.gesture or result.hands; adapt to observed output
  const gestures = result.gestures || [];
  if (!gestures.length) {
    last.count = 0;
    return null;
  }

  const g = gestures[0]; // quick pick top gesture; refine for multi-person
  const name = g.name || g.score && g.score.name || null; // defensive
  if (!name) return null;

  const now = Date.now();
  if (name === last.name) {
    last.count++;
  } else {
    last.name = name;
    last.count = 1;
    last.time = now;
  }

  // require 3 consecutive frames (simple debounce)
  if (last.count >= 3 && now - last.time > 120) {
    last.time = now;
    last.count = 0;
    // map labels to keyboard actions
    if (name === 'open') return { key: 'ArrowUp' };
    if (name === 'fist') return { key: 'ArrowDown' };
    if (name === 'pinch' || name === 'point') return { key: 'Enter' };
  }
  return null;
}
```

src/keyboard-bridge.js

```js
export function sendKey(action) {
  if (!action) return;
  // In-browser: dispatch KeyboardEvent onto the focused element
  const ev = new KeyboardEvent('keydown', { key: action.key, code: action.key, bubbles: true, cancelable: true });
  (document.activeElement || document.body).dispatchEvent(ev);
  // Optional: also send keyup after short delay to mimic real key press
  setTimeout(() => {
    const evUp = new KeyboardEvent('keyup', { key: action.key, code: action.key, bubbles: true });
    (document.activeElement || document.body).dispatchEvent(evUp);
  }, 50);
}
```

> NOTE: for system/global keys you **must** move to Electron or a native helper — browser synthetic `KeyboardEvent` only affects web pages (not other apps).

---

# 4) Practical tips for working with the codebase / dev loop

* **Start from the demos**: the repo ships many self-contained demos (Simple Live Demo, Main Live Demo, Events demo). Run the live demo to inspect the exact `result` fields your mapping code will consume. ([GitHub][1])
* **Enable only the modules you need** (hand + gesture) — this massively reduces latency and memory use. Set `modelBasePath` to the CDN or to your locally hosted models to avoid download delays. ([GitHub][1])
* **Use smoothing & caching**: `human` includes temporal interpolation and caching to smooth landmark jitter; use config options in `human` to tune smoothing. This reduces false gesture flicker. ([GitHub][1])
* **Debug by logging the exact `human.result`**: in early stages `console.log(human.result)` or display JSON in a small overlay to learn the exact property names and scores to use for thresholds.
* **Read the gesture rules**: gestures are implemented as landmark rules in the source — copying or tweaking them is usually easier than training new models. Look for `src/gesture.ts` (or similar) in the repo to see source definitions. ([GitHub][1])
* **Performance**: prefer `webgl`/`webgpu` backends for browsers. Consider running heavy processing in **WebWorker** mode or using the repo’s multi-worker patterns if you need to process multiple streams. ([GitHub][1])

---

# 5) Handling multi-person, false positives & robustness

* **Person grouping**: `result.persons` groups body/face/hands to individual persons — use that if you only want gestures from the primary person. ([GitHub][1])
* **Confidence thresholds**: gestures/landmarks come with scores — implement a minimum score and require several consecutive frames (debounce) before emitting an action.
* **State machine**: treat gestures as transient input (e.g., gesture must be held for X frames to be considered a press; another gesture might mean release). This avoids rapid toggling.

---

# 6) When to create new files vs. attaching listeners

* Create dedicated modules:

  * `mapper.js` for any logic that turns raw landmarks/gestures → *logical actions* (pure functions, easy to test).
  * `keyboard-bridge.js` for platform-specific key dispatch (browser vs Electron vs native).
  * `gesture-rules.js` if you want custom gesture rules derived from landmarks.
* **Don’t try to hook into internal loops**: use the public methods (`detect`, `video`) and `human.result` — that’s the stable API. The repo does provide demo event examples; you can study the event demo if you prefer an event-driven style, but polling `human.result` is simple and reliable. ([GitHub][1])

---

# 7) Moving to Electron / OS-level keys

* Basic flow: keep the detection in the **renderer** (web code) for GPU acceleration; when you recognize a gesture, send a small message to the **main** process via `ipcRenderer.send('gesture', { name })`. The main process then uses a native module (eg. `robotjs`, `nut.js`, or OS APIs) to synthesize a global key press. The repo has an **Electron demo** to reference. ([GitHub][1])

---

# 8) Debugging checklist

* Confirm models are loaded (`await human.load()` resolves).
* Print `human.result` and inspect `result.hands`, `result.gestures`, `result.persons`. Use the demo to compare. ([GitHub][1])
* If detection is slow: disable other modules, reduce input resolution, switch backend to `webgl`, run only every Nth frame.
* If gestures flicker: increase smoothing, use debounce across frames, require min score.

---

# 9) Next quick wins I can do for you (pick one — I’ll deliver right now)

1. Produce a complete runnable **browser repo** (index.html + scripts) that maps 3 gestures → keyboard (copy/paste ready).
2. Inspect the live demo’s `result` shape and return the exact property names/example objects you should check for `result.hands`, `result.gestures`, and `result.persons` (so your mapping code uses exact fields).
3. Create an **Electron skeleton** (main + renderer) that forwards gestures from renderer → main and shows how to call `robotjs` or Electron native APIs to emit global keys.

Tell me which one you want and I’ll generate the full code for it right away (no waiting).

(If you prefer, I can also scan the repo’s `src/gesture.ts` and show you how to tweak the built-in gesture definitions.) ([GitHub][1])

[1]: https://github.com/vladmandic/human "GitHub - vladmandic/human: Human: AI-powered 3D Face Detection & Rotation Tracking, Face Description & Recognition, Body Pose Tracking, 3D Hand & Finger Tracking, Iris Analysis, Age & Gender & Emotion Prediction, Gaze Tracking, Gesture Recognition"
.


Executive Summary: vladmandic/human

The vladmandic/human GitHub repository provides a powerful and comprehensive AI library for human-centric analysis from images and video streams. For a developer planning to build a gesture-to-keyboard input application, this library offers a robust foundation with pre-built functionalities for detecting and recognizing a variety of human gestures, significantly reducing development time and complexity. The library is designed for both client-side (browser) and server-side (Node.js) execution, providing flexibility for various application architectures.

At its core, the Human library processes input from sources like webcams, videos, or static images and applies a suite of deep learning models to detect and analyze human features. These features include detailed 3D face and body pose tracking, hand and finger tracking, and iris analysis. Building upon this detailed anatomical data, the library offers a dedicated gesture recognition module that can identify a range of pre-defined gestures.

Key Capabilities for Gesture-to-Keyboard Input:

Multi-Modal Gesture Recognition: The library doesn't just focus on hands. It analyzes facial expressions, body posture, and hand movements to determine gestures. This allows for a rich and nuanced set of inputs for your application. For instance, a head nod could act as a "yes" input, while a raised hand could trigger a specific function.

Pre-defined Gestures: Out of the box, human can recognize a variety of gestures related to the face (e.g., "blink left/right eye", "mouth open"), body (e.g., "leaning left/right", "raise left/right hand"), and hands (e.g., "thumb up"). These can serve as a starting point for your application's control scheme.

Extensible Gesture Engine: Crucially for a custom gesture application, the library's gesture recognition logic is open and extensible. Developers can add their own custom gesture definitions by modifying the src/gesture.ts file. This allows for the creation of a unique gesture vocabulary tailored to your keyboard input needs.

Detailed Landmark Data: The API provides fine-grained data on the coordinates of facial landmarks, body joints, and hand knuckles. This detailed information is the foundation for the gesture recognizer and can be used to implement highly specific and custom gesture logic.

API Overview for Gesture Recognition:

The primary interaction with the library is through the Human class. Here’s a simplified overview of how you would use the API to detect gestures:

Initialization: First, you create an instance of the Human class. You can provide a configuration object to enable or disable specific models and fine-tune their parameters. For a gesture-to-keyboard app, you would ensure the gesture module is enabled, along with the necessary detection models (e.g., face, body, hand).

Detection: The main method for processing input is human.detect(). You pass it an input source, such as a video element from a webcam. This method returns a promise that resolves with a result object.

Result Object: The result object contains a wealth of information about the detected human features. For your purposes, the most important property is result.gesture, which is an array of detected gestures.

Gesture Data Structure: Each entry in the result.gesture array is an object that describes a single detected gesture. For example, a result for a raised hand might look like: { hand: '0', gesture: 'raise right hand' }. You can then parse this array to trigger the corresponding keyboard inputs in your application.

Extending Gestures: To create a custom gesture, you would edit the src/gesture.ts file. This file contains the logic that analyzes the landmark data to identify gestures. For example, to add a new "fist" gesture, you would write a function that checks the distances between the fingertips and the palm. If the distances are below a certain threshold, you would return a "fist" gesture string. After modifying the file, you would need to rebuild the library.

In summary, the vladmandic/human library provides the majority of the complex computer vision components needed for a gesture-to-keyboard input application. Its comprehensive detection capabilities, straightforward API, and, most importantly, its extensible gesture recognition engine, make it an excellent starting point for such a project. Instead of building the entire detection and tracking pipeline from scratch, you can focus on designing the user experience and the specific gesture-to-input mappings for your application.

Google Search Suggestions
Display of Search Suggestions is required when using Grounding with Google Search. Learn more
vladmandic/human gesture recognition wiki
vladmandic/human API usage
vladmandic/human library gesture detection example

Of course. Let's break down how to work with the vladmandic/human library for your gesture-to-keyboard input application. This guide is designed to be used alongside your AI coding assistant, providing you with the concepts and code structure to direct it effectively.

Understanding the Core API Structure

You don't need to create lots of new files to listen for events in the traditional sense. The human library's API is centered around a main Human object that you configure and then use to detect human features in a continuous loop.

Here's the fundamental workflow:

Instantiate Human: You create a single instance of the Human class, passing it a configuration object. This object tells the library which AI models to load and how to run them.

Start a Detection Loop: You'll have a function that continuously gets the latest frame from your webcam and passes it to the human.detect() method.

Process the Results: The detect() method returns a result object containing all the detected information. You'll check this object for any recognized gestures.

Trigger Keyboard Events: Based on the gestures found in the result object, you'll trigger your desired keyboard inputs.

Repeat: You'll use requestAnimationFrame() to create a smooth, continuous loop for real-time detection.

Step-by-Step Guide to Building Your Gesture Application

Here is a walkthrough of the code and concepts you'll need. You can provide these snippets and instructions to your AI coding assistant.

Step 1: Project Setup and Initialization

First, you'll need a basic HTML file and a JavaScript file.

index.html

code
Html
download
content_copy
expand_less

<!DOCTYPE html>
<html>
<head>
    <title>Gesture to Keyboard</title>
    <script src="https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.js"></script>
    <style>
        /* Basic styling for the video element */
        #video {
            width: 640px;
            height: 480px;
        }
    </style>
</head>
<body>
    <h1>Gesture to Keyboard</h1>
    <video id="video" playsinline autoplay muted></video>
    <script src="app.js"></script>
</body>
</html>

app.js (Your main application file)

code
JavaScript
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
// Step 2 will go here
Step 2: Configure and Instantiate the Human Library

In your app.js file, you'll start by defining the configuration. For a gesture-to-keyboard app, you'll want to enable the necessary models and disable those you don't need to maximize performance.

code
JavaScript
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
// Human library configuration
const config = {
    backend: 'webgl', // or 'wasm', 'cpu'
    modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
    face: {
        enabled: true, // Enable face detection, as some gestures rely on it
        detector: { enabled: true },
        mesh: { enabled: true },
        iris: { enabled: true },
        emotion: { enabled: false } // Disable if not needed
    },
    body: {
        enabled: true // Enable body detection for hand tracking
    },
    hand: {
        enabled: true // Crucial for hand gestures
    },
    gesture: {
        enabled: true // Enable gesture recognition
    },
};

// Create a new instance of Human
const human = new Human(config);

// Main function to run the application
async function main() {
    // Step 3 will go here
}

main(); // Start the application

Guidance for your AI assistant: "Using the vladmandic/human library, create a configuration object that is optimized for gesture recognition. It should enable face, body, and hand detection, and enable the gesture module. Disable the emotion model to save resources."

Step 3: Access the Webcam and Start the Detection Loop

Now, you need to get the user's webcam feed and create the continuous detection loop.

code
JavaScript
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
// Add this inside your main() function from Step 2

const video = document.getElementById('video');

// Access the webcam
try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
} catch (err) {
    console.error('Error accessing webcam:', err);
    return;
}

console.log('Human library starting...');
// Wait for the library and models to load
await human.load();
console.log('Human library loaded.');

// The main detection loop
async function detectionLoop() {
    // Get the latest detection results
    const result = await human.detect(video);

    // Step 4 will go here

    // Request the next frame to continue the loop
    requestAnimationFrame(detectionLoop);
}

// Start the detection loop
detectionLoop();

Guidance for your AI assistant: "Write the JavaScript code to access the user's webcam and display it in a video element with the ID 'video'. Then, create a detectionLoop function that uses requestAnimationFrame. Inside this loop, call the human.detect() method with the video element as the input."

Step 4: Process the Gesture Results

Inside the detectionLoop, you'll receive the result object. The gestures are conveniently located in result.gesture.

The result.gesture is an array of detected gestures.[1] Each element in the array is an object that looks something like this:

code
JSON
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
{
  "body": 0,
  "gesture": "raise right hand"
}

or

code
JSON
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
{
  "hand": 1,
  "gesture": "thumb up"
}```

Here's how you can process this in your code:

```javascript
// Add this inside your detectionLoop() function from Step 3

// The result object contains all the detected information
if (result.gesture && result.gesture.length > 0) {
    console.log('Detected gestures:', result.gesture);

    // Step 5 will go here
}
Step 5: Map Gestures to Keyboard Inputs (Your Core Logic)

This is where you implement the main functionality of your app. You'll iterate through the detected gestures and trigger the corresponding actions.

code
JavaScript
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
// Add this inside the if statement from Step 4

for (const gesture of result.gesture) {
    switch (gesture.gesture) {
        case 'raise right hand':
            console.log('Action: Triggering "Copy" (Ctrl+C)');
            // Here you would implement the logic to simulate a keypress.
            // This is a placeholder for your keyboard input logic.
            break;
        case 'thumb up':
            console.log('Action: Triggering "Paste" (Ctrl+V)');
            break;
        case 'facing center':
            // You might want to ignore some gestures
            break;
        // Add more cases for other gestures you want to support
    }
}

Guidance for your AI assistant: "Inside the detection loop, check if result.gesture has any entries. If it does, create a switch statement to handle different gesture strings like 'raise right hand' and 'thumb up'. For now, just log a message to the console for each detected gesture."

How to Create Custom Gestures

The real power for your application will come from defining your own gestures. The library is designed to be extensible.

Locate the Gesture Logic: The gesture recognition logic is entirely within the src/gesture.ts file in the library's source code.
[2]2. Understand the Structure: Inside this file, you'll find functions like body(), hand(), and face() that analyze the detected landmarks (the coordinates of body joints, facial features, and hand knuckles) to determine if a gesture has occurred.
[2]3. Add Your Logic: You can add new if conditions or new functions to define your gestures. For example, to create a "fist" gesture, you would:

Get the coordinates of the fingertips and the palm from the result.hand object.

Calculate the distance between each fingertip and the center of the palm.

If all distances are below a certain threshold, you've detected a fist.

You would then add { hand: person.id, gesture: 'fist' } to the array of gestures.

Rebuild the Library: After modifying src/gesture.ts, you need to rebuild the library by running npm run build from the root of the human project directory. [2]You would then use your custom-built human.js file in your project instead of the one from the CDN.

Guidance for your AI assistant: "Explain the process of adding a new gesture to the vladmandic/human library. I need to know which file to edit, what kind of logic I would add to detect a new hand gesture based on landmark coordinates, and the command to rebuild the library."

Sources
help
github.com
github.com
Google Search Suggestions
Display of Search Suggestions is required when using Grounding with Google Search. Learn more
vladmandic/human video processing loop example
vladmandic/human event listeners for gesture detection
vladmandic/human library configuration for gesture recognition
vladmandic/human tutorial gesture to keyboard
vladmandic/human modify src/gesture.ts