# Tectangle Audio Gesture Studio - EARS Requirements Specification v2.0
time 8/18/2025 3:24pm

## Overview
This document specifies the functional requirements for the Tectangle Audio Gesture Studio using the EARS (Easy Approach to Requirements Syntax) format. The system provides hand gesture recognition capabilities with enhanced pinch detection, wrist orientation detection, and 3D skeletal hand modeling for audio control applications.

## System Context
The Tectangle Audio Gesture Studio is a browser-based application that uses MediaPipe for hand tracking and gesture recognition. It detects various pinch gestures, wrist orientations, and translates them into events that can be consumed by a universal output bridge for audio control and musical expression.

## Functional Requirements

### 1. Enhanced Pinch Detection

#### 1.1 Four Finger Combination Support
The system shall detect pinch gestures between the thumb and each of the four fingers:
- Thumb-index finger pinch (0-1)
- Thumb-middle finger pinch (0-2)
- Thumb-ring finger pinch (0-3)
- Thumb-pinky finger pinch (0-4)

#### 1.2 Pinch Detection Accuracy
The system shall accurately detect pinch gestures with a minimum confidence threshold of 0.7.

#### 1.3 Pinch Event Types
The system shall generate the following pinch event types:
- pinch_start: When a pinch gesture is initiated
- pinch_end: When a pinch gesture is released
- pinch_hold: When a pinch gesture is maintained for a specified duration

### 2. Wrist Orientation Detection

#### 2.1 Four Direction Wrist Orientation Detection
The system shall detect wrist orientation in 4 primary directions:
- Left orientation
- Up orientation
- Down orientation
- Right orientation

#### 2.2 Dynamic Key Mapping Based on Wrist Orientation
The system shall support mapping different keys based on the detected wrist orientation, enabling context-sensitive gesture controls.

#### 2.3 Wrist Orientation Threshold Configuration
The system shall allow configuration of wrist orientation detection thresholds:
- Orientation angle thresholds (default: 45 degrees from primary axis)
- Hysteresis values to prevent orientation flickering
- Confidence thresholds for orientation detection

### 3. Enhanced Gesture Recognition

#### 3.1 Multi-dimensional Gesture Recognition
The system shall recognize complex gestures combining pinch actions with wrist rotation for enhanced expressivity.

#### 3.2 Dynamic Key Mapping Based on Wrist Orientation
The system shall dynamically adjust key mappings based on current wrist orientation to provide context-aware controls.

#### 3.3 8-key Piano Genie Interface Support
The system shall support an 8-key Piano Genie interface with 4 keys per hand for musical expression capabilities.

### 4. 3D Skeletal Hand Model

#### 4.1 MediaPipe 21 Landmark Integration
The system shall integrate MediaPipe's 21 hand landmark model for accurate hand pose estimation.

#### 4.2 Realistic Bone Structure Visualization
The system shall render a realistic bone structure visualization based on detected hand landmarks.

#### 4.3 Hand Avatar Piloting Capabilities
The system shall support piloting a 3D hand avatar with detected hand poses for visualization and feedback.

### 5. Universal Output Bridge

#### 5.1 Keyboard Event Translation
The system shall translate detected gestures into keyboard events for application control.

#### 5.2 Configurable Key Mappings
The system shall support configurable key mappings for all gesture types including pinch gestures and wrist orientations.

#### 5.3 Multiple Output Protocol Support
The system shall support multiple output protocols including:
- Keyboard events
- MIDI events
- Custom event protocols

### 6. Piano Genie Integration

#### 6.1 8-key Interface Support
The system shall support the 8-key Piano Genie interface for musical expression with 4 keys per hand.

#### 6.2 Visual Overlay Integration
The system shall provide visual overlay integration for the Piano Genie interface to guide user interaction.

#### 6.3 Musical Expression Capabilities
The system shall support musical expression through velocity-sensitive key presses and gesture dynamics.

### 7. Signal Processing

#### 7.1 One Euro Filter Implementation
The system shall apply One Euro filtering to hand landmark coordinates to reduce jitter and improve gesture detection accuracy.

#### 7.2 Hysteresis for Pinch Detection
The system shall implement hysteresis in pinch detection to prevent false positives and improve gesture recognition stability.

### 8. Configuration Management

#### 8.1 Singleton Configuration
The system shall use a singleton configuration object to manage all system settings.

#### 8.2 Configurable Thresholds
The system shall allow configuration of the following pinch detection parameters:
- Pinch start threshold (default: 0.16)
- Pinch end threshold (default: 0.22)
- Minimum hold duration (default: 75ms)
- Release debounce duration (default: 30ms)

#### 8.3 One Euro Filter Parameters
The system shall allow configuration of One Euro filter parameters:
- minCutoff (default: 1.0)
- beta (default: 0.007)
- dCutoff (default: 1.0)

#### 8.4 Wrist Orientation Thresholds
The system shall allow configuration of wrist orientation detection parameters:
- Orientation angle thresholds (default: 45 degrees)
- Hysteresis values (default: 10 degrees)
- Confidence thresholds (default: 0.7)

### 9. Event Emission

#### 9.1 Enhanced Event Structure
The system shall emit events with the following structure:
- type: Event type (pinch_start, pinch_end, pinch_hold, wrist_orientation_change)
- hand: Hand identifier (Left or Right)
- fingers: Finger combination (thumb-index, thumb-middle, thumb-ring, thumb-pinky)
- timestampMs: Event timestamp in milliseconds
- worldPos: 3D world coordinates [x, y, z] of the pinch point
- normalizedDistance: Normalized distance between fingers
- confidence: Detection confidence score (0-1)
- durationMs: Duration of pinch for pinch_end and pinch_hold events
- wristOrientation: Current wrist orientation (left, up, down, right)
- quaternion: 3D orientation as quaternion [x, y, z, w]

#### 9.2 Universal Output Bridge Integration
The system shall emit events that can be consumed by a universal output bridge to translate gestures into various output protocols.

### 10. Gesture Timing

#### 10.1 Short Tap Detection
The system shall detect and emit events for short tap gestures (pinch duration < 200ms).

#### 10.2 Long Hold Detection
The system shall detect and emit events for long hold gestures (pinch duration >= 200ms).

#### 10.3 Hold Periodic Events
The system shall emit periodic pinch_hold events every 150ms while a pinch gesture is maintained.

### 11. Integration

#### 11.1 MediaPipe Integration
The system shall integrate with the existing MediaPipe hand tracking framework.

#### 11.2 Hand Tracking Persistence
The system shall maintain persistent hand tracking across frames and short occlusions.

#### 11.3 Piano Genie Integration
The system shall integrate with the Piano Genie model for musical expression capabilities.

## Non-Functional Requirements

### 1. Performance
The system shall process hand tracking data at a minimum of 30 FPS.

### 2. Compatibility
The system shall be compatible with modern web browsers supporting WebAssembly and WebGL.

### 3. Latency
The system shall maintain end-to-end latency of less than 100ms for gesture detection and event emission.

## Modular Architecture Principles

### 1. Core Functionality Separation
The system shall maintain clear separation between core functionality and pluggable enhancements:
- Core: Hand tracking, gesture detection, event emission
- Pluggable: Output protocols, visualization modules, specialized gesture recognizers

### 2. Event-Driven Communication
The system shall use event-driven communication patterns between modules to ensure loose coupling and extensibility.

### 3. Plugin Interface Definitions
The system shall define clear plugin interface specifications for:
- Output protocol adapters
- Visualization modules
- Gesture recognizer extensions

## Implementation Details

### 1. Architecture
The system follows a modular architecture with the following components:
- HandProcessor: Core gesture detection logic
- OneEuroFilter: Signal smoothing implementation
- EventBridge: Event emission and protocol mapping
- Configuration: Singleton configuration management
- WristOrientationDetector: Wrist orientation detection module
- SkeletalHandRenderer: 3D hand visualization component
- PianoGenieAdapter: Musical expression interface

### 2. Data Flow
1. MediaPipe provides hand landmark data
2. HandProcessor applies filtering and detects pinch gestures
3. WristOrientationDetector determines wrist orientation
4. Events are emitted through the EventBridge
5. Events are consumed by the universal output bridge
6. Piano Genie interface translates gestures to musical expressions

### 3. Coordinate System
The system uses a 3D world coordinate system for pinch event positions, with coordinates normalized based on camera space.

## Configuration Parameters
All configuration parameters are managed through a singleton configuration object with the following default values:
- START_THRESHOLD: 0.16
- END_THRESHOLD: 0.22
- MIN_HOLD_MS: 75
- RELEASE_DEBOUNCE_MS: 30
- ONE_EURO_MIN_CUTOFF: 1.0
- ONE_EURO_BETA: 0.007
- ONE_EURO_D_CUTOFF: 1.0
- WRIST_ORIENTATION_THRESHOLD: 45 (degrees)
- WRIST_ORIENTATION_HYSTERESIS: 10 (degrees)
- WRIST_ORIENTATION_CONFIDENCE: 0.7

## Event Schema
Events follow the enhanced schema:
```javascript
{
  type: 'pinch_start' | 'pinch_end' | 'pinch_hold' | 'wrist_orientation_change',
  hand: 'Left' | 'Right',
  fingers: 'thumb-index' | 'thumb-middle' | 'thumb-ring' | 'thumb-pinky',
  timestampMs: number,
  worldPos: [x, y, z],
  normalizedDistance: number,
  confidence: number,
  durationMs: number (optional),
  wristOrientation: 'left' | 'up' | 'down' | 'right' (optional),
  quaternion: [x, y, z, w] (optional)
}