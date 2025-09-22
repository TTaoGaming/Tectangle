/**
 * Mock EventBusManager for tests
 */
export default class EventBusManager {
  constructor() {
    this.started = false;
  }
  async start() {
    this.started = true;
    return true;
  }
}