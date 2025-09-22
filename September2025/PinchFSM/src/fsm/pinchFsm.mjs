export class PinchFSM {
  constructor({ tEnter = 0.15, tExit = 0.24, debounceMs = 50, anchorHoldMs = 300 } = {}) {
    this.tEnter = tEnter;
    this.tExit = tExit;
    this.debounceMs = debounceMs;
    this.anchorHoldMs = anchorHoldMs;
    this.state = 'Open';
    this._possibleStart = 0;
    this._pinchStart = 0;
    this._keyDown = false;
  }

  /**
   * Update FSM with current metric and gate.
   * @param {number} tMs - timestamp in ms
   * @param {number|null} P - normalized pinch metric (lower is closer)
   * @param {boolean} gated - palm gate boolean
   * @returns {{state:string,keyDown:boolean,keyUp:boolean}}
   */
  update(tMs, P, gated) {
    let keyDown = false;
    let keyUp = false;
    switch (this.state) {
      case 'Open':
        if (gated && P !== null && P < this.tEnter) {
          this.state = 'Possible';
          this._possibleStart = tMs;
        }
        break;
      case 'Possible':
        if (!gated || P === null || P > this.tExit) {
          this.state = 'Open';
        } else if (tMs - this._possibleStart >= this.debounceMs) {
          this.state = 'Pinch';
          this._pinchStart = tMs;
          if (!this._keyDown) { keyDown = true; this._keyDown = true; }
        }
        break;
      case 'Pinch':
        if (!gated || P === null || P > this.tExit) {
          this.state = 'Open';
          if (this._keyDown) { keyUp = true; this._keyDown = false; }
        } else if (tMs - this._pinchStart >= this.anchorHoldMs) {
          this.state = 'Anchored';
        }
        break;
      case 'Anchored':
        if (!gated || P === null || P > this.tExit) {
          this.state = 'Open';
          if (this._keyDown) { keyUp = true; this._keyDown = false; }
        }
        break;
      default:
        this.state = 'Open';
        this._keyDown = false;
        break;
    }
    return { state: this.state, keyDown, keyUp };
  }
}
