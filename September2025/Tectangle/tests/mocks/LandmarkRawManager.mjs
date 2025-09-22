/**
 * Mock LandmarkRawManager for tests
 * Accepts an EventBusManager instance as the first constructor arg.
 */
export default class LandmarkRawManager {
  constructor(eventBus) {
    this.eventBus = eventBus || null;
    this.started = false;
  }
  async start() {
    this.started = true;
    return true;
  }
}