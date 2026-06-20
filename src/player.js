import * as THREE from 'three';
import { CONFIG } from './config.js';

const lerp = (a, b, t) => a + (b - a) * t;

export class Player {
  constructor() {
    this.reset();
    this._target = new THREE.Vector3();
  }

  reset() {
    this.x = 0;
    this.z = 0;
    this.vx = 0;
    this.phase = 0;
    this.yaw = 0;     // 視界の揺れ角
    this.roll = 0;    // 首の傾き
    this.bob = 0;     // 上下動
    this.walk = 0;
    this.fall = 0;    // ゲームオーバー時の沈み込み
    this.dead = false;
  }

  // dt: 実時間*スローモー, steer: -1..1, drunk: 0..1, speed: m/s
  update(dt, steer, drunk, speed) {
    const D = CONFIG.drunk, S = CONFIG.steer;

    // 千鳥足：揺れ位相
    const freq = lerp(D.swayFreqMin, D.swayFreqMax, drunk);
    this.phase += freq * dt;
    this.yaw = Math.sin(this.phase) * lerp(D.yawMin, D.yawMax, drunk);
    this.roll = Math.sin(this.phase * 0.9 + 0.4) * lerp(D.rollMin, D.rollMax, drunk) + this.yaw * 0.15;

    // 左右移動：入力に追従しつつ、酔いドリフトで勝手に流される
    const targetVx = steer * S.maxVx;
    this.vx = lerp(this.vx, targetVx, steer !== 0 ? S.accel : S.damp);
    const drift = Math.sin(this.phase) * lerp(D.driftMin, D.driftMax, drunk);
    this.x += (this.vx + drift) * dt;

    // 自動前進
    this.z += speed * dt;

    // 歩行の上下動（滑らかな波形）
    this.walk += dt * 8;
    this.bob = Math.sin(this.walk * 2) * 0.045;
  }

  // 倒れる演出
  updateDead(dt, cause) {
    this.fall = lerp(this.fall, cause === 'gutter' ? -1.6 : -1.1, 0.05);
    this.roll = lerp(this.roll, cause === 'gutter' ? 0.0 : 0.9, 0.05);
  }

  applyCamera(camera, shake) {
    const eye = 1.6 + this.bob + this.fall;
    let sx = 0, sy = 0;
    if (shake > 0) { const s = shake * 0.25; sx = (Math.random() * 2 - 1) * s; sy = (Math.random() * 2 - 1) * s; }
    camera.position.set(this.x + sx, eye + sy, this.z);
    camera.up.set(Math.sin(this.roll), Math.cos(this.roll), 0);
    this._target.set(
      this.x + Math.sin(this.yaw) * 10,
      eye + (this.dead ? -0.6 : 0),
      this.z + Math.cos(this.yaw) * 10
    );
    camera.lookAt(this._target);
  }
}
