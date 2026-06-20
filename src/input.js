// 入力を一元管理。steer は -1(左)〜+1(右)。
// キーボード(A/D, ←/→)、画面左右タップ／ドラッグに対応。
export class Input {
  constructor(onPress) {
    this.left = false;
    this.right = false;
    this.pointerSteer = 0;
    this.onPress = onPress || (() => {});
    this._bind();
  }

  get steer() {
    let s = 0;
    if (this.left) s -= 1;
    if (this.right) s += 1;
    if (s === 0) s = this.pointerSteer;
    return Math.max(-1, Math.min(1, s));
  }

  _bind() {
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': this.left = true; break;
        case 'ArrowRight': case 'KeyD': this.right = true; break;
        case 'Space': case 'ArrowUp': e.preventDefault(); this.onPress(); break;
        case 'KeyM': this._toggleMute && this._toggleMute(); break;
      }
    });
    addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.right = false;
    });

    const setFromPointer = (x) => {
      const mid = innerWidth / 2;
      const dz = innerWidth * 0.06; // 中央デッドゾーン
      if (x < mid - dz) this.pointerSteer = -1;
      else if (x > mid + dz) this.pointerSteer = 1;
      else this.pointerSteer = 0;
    };

    let down = false;
    addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onPress();
      down = true;
      setFromPointer(e.clientX);
    });
    addEventListener('pointermove', (e) => { if (down) setFromPointer(e.clientX); });
    const release = () => { down = false; this.pointerSteer = 0; };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);
  }

  onToggleMute(fn) { this._toggleMute = fn; }
}
