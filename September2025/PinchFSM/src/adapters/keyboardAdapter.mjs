// KeyboardAdapter: output port for sending key events (and optional DOM viz hooks)
export class KeyboardAdapter {
  constructor({ target = document } = {}){
    this.target = target;
  }
  keydown(key){
    const ev = new KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : undefined, bubbles:true, cancelable:true });
    this.target.dispatchEvent(ev);
  }
  keyup(key){
    const ev = new KeyboardEvent('keyup', { key, code: key === ' ' ? 'Space' : undefined, bubbles:true, cancelable:true });
    this.target.dispatchEvent(ev);
  }
}
