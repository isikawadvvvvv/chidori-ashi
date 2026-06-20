import * as THREE from 'three';
import vert from './shaders/fullscreen.vert.glsl?raw';
import frag from './shaders/drunk.frag.glsl?raw';
import { CONFIG } from './config.js';

// 酔いの二重視ポスト。素面のうちは render() がパスを丸ごと飛ばすので軽い。
export class DrunkPass {
  constructor(renderer) {
    this.renderer = renderer;
    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.scene = new THREE.Scene();
    this.cam = new THREE.Camera();
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.rt.texture },
        dir: { value: new THREE.Vector2() },
        amount: { value: 0 },
        blur: { value: 0 },
        res: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
  }

  setSize(w, h, pr) {
    this.rt.setSize(Math.floor(w * pr), Math.floor(h * pr));
    this.mat.uniforms.res.value.set(w * pr, h * pr);
  }

  // drunk: 0..1, phase: 揺れ位相
  render(scene, camera, drunk, phase) {
    const r = this.renderer;
    if (drunk < 0.2) {
      r.setRenderTarget(null);
      r.render(scene, camera);
      return;
    }
    const u = this.mat.uniforms;
    const V = CONFIG.view;
    u.amount.value = Math.min(1, (drunk - 0.2) / 0.8) * V.fxDoubleMax;
    u.blur.value = (drunk - 0.2) * V.fxBlurMax;
    u.dir.value.set(
      Math.sin(phase * 0.7) * 0.006 * (0.4 + drunk),
      Math.cos(phase * 0.5) * 0.004 * (0.4 + drunk)
    );
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }
}
