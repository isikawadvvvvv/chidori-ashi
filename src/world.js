import * as THREE from 'three';
import { CONFIG, TIMEBANDS } from './config.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const NEON = ['#ff3e7f', '#5cffd0', '#ffb24d', '#7f9bff', '#ff7be0', '#ffe14d', '#4dd6ff', '#b46cff'];
// すべて架空の屋号（実在ブランド名は使わない）
const SIGNS = ['酒', '呑', 'BAR', '純', '月', '千鳥', '夜光', '酒場', 'スナック',
  'ホルモン', '居酒屋', 'ラーメン', '深夜', 'カクテル', '電氣酒場', '泡', '猫', '灯'];

const SEG = 8, NSEG = 12;

export class World {
  constructor() {
    const L = CONFIG.light;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(TIMEBANDS[0][1]);
    this.scene.fog = new THREE.Fog(TIMEBANDS[0][1], CONFIG.road.fogNear, CONFIG.road.fogFar);

    // --- 照明（動的ライトはプレイヤー追従の街灯1個のみ。残りは増やさない）---
    this.scene.add(new THREE.AmbientLight(L.ambientColor, L.ambient));
    this.scene.add(new THREE.HemisphereLight(L.hemiSky, L.hemiGround, L.hemi));
    const moon = new THREE.DirectionalLight(0x9fb0e0, L.moon);
    moon.position.set(-3, 10, -2);
    this.scene.add(moon);
    this.lamp = new THREE.PointLight(0xffce8a, L.lampIntensity, L.lampDistance, 2);
    this.lamp.position.set(0, 6, 4);
    this.scene.add(this.lamp);

    this._buildRoad();
    this._buildBuildings();
    this._buildLanterns();
    this._buildBeacon();

    this._skyTmp = new THREE.Color();
    this._haze = new THREE.Color(CONFIG.view.fogHaze);
  }

  _asphaltTex() {
    const s = 256, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const g = cv.getContext('2d');
    // ベースを明るめにして道がはっきり見える
    const base = g.createLinearGradient(0, 0, s, s);
    base.addColorStop(0, '#2e2a48');
    base.addColorStop(1, '#3a3560');
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    // ざらつき
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${rnd(30, 55) | 0},${rnd(28, 50) | 0},${rnd(40, 70) | 0},.5)`;
      g.fillRect(Math.random() * s, Math.random() * s, rnd(1, 3), rnd(1, 3));
    }
    // 水たまり（ネオンを反射する明るい滲み）
    const puddleCols = ['rgba(120,90,200,.18)', 'rgba(90,200,210,.16)', 'rgba(255,120,170,.14)'];
    for (let i = 0; i < 8; i++) {
      const px = Math.random() * s, py = Math.random() * s, pr = rnd(10, 28);
      const rg = g.createRadialGradient(px, py, 0, px, py, pr);
      rg.addColorStop(0, pick(puddleCols));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.beginPath(); g.ellipse(px, py, pr, pr * 0.6, 0, 0, 7); g.fill();
    }
    // 縦に流れる淡いネオンの映り込み
    g.globalAlpha = 0.10;
    for (let i = 0; i < 5; i++) {
      g.fillStyle = pick(['#ff3e7f', '#5cffd0', '#ffb24d', '#7f9bff']);
      g.fillRect(rnd(0, s), 0, rnd(2, 5), s);
    }
    g.globalAlpha = 1;
    // 中央の破線
    g.fillStyle = 'rgba(255,190,90,.7)';
    for (let y = 10; y < s; y += 64) g.fillRect(s / 2 - 4, y, 8, 34);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 18);
    return t;
  }

  _signTex(text, bg, fg) {
    const w = 128, h = 256, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.font = 'bold 60px "Hiragino Mincho ProN",serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const chars = text.split('');
    chars.forEach((c, i) => g.fillText(c, w / 2, h * ((i + 0.6) / chars.length)));
    return new THREE.CanvasTexture(cv);
  }

  _buildRoad() {
    const half = CONFIG.road.half;
    this.roadTex = this._asphaltTex();
    this.road = new THREE.Mesh(
      new THREE.PlaneGeometry(half * 2, 400),
      new THREE.MeshBasicMaterial({ map: this.roadTex })
    );
    this.road.rotation.x = -Math.PI / 2;
    this.scene.add(this.road);

    // ガター＝赤い警告ライン（太くして一目でわかるように）
    const gutterMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
    this.gutters = [];
    this.gutterWalls = [];
    for (const sgn of [-1, 1]) {
      // 太い赤ライン
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 400), gutterMat);
      gm.rotation.x = -Math.PI / 2;
      gm.position.set(sgn * half, 0.03, 0);
      this.scene.add(gm);
      this.gutters.push(gm);

      // 道端の赤い壁（高さのある壁で視覚的に「ここから出るな」を演出）
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.55, 400),
        new THREE.MeshBasicMaterial({ color: 0xff2244 })
      );
      wall.position.set(sgn * (half + 0.09), 0.28, 0);
      this.scene.add(wall);
      this.gutterWalls.push(wall);

      // 赤の発光にじみ
      const wallGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 400),
        new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      wallGlow.rotation.x = -Math.PI / 2;
      wallGlow.position.set(sgn * (half + 0.2), 0.04, 0);
      this.scene.add(wallGlow);
      this.gutterWalls.push(wallGlow);
    }
  }

  _buildBuildings() {
    const half = CONFIG.road.half;
    const facadeGeo = new THREE.BoxGeometry(3, 12, SEG - 0.6);
    this.buildings = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < NSEG; i++) {
        const grp = new THREE.Group();
        const col = new THREE.Color().setHSL(rnd(0.58, 0.92), 0.45, rnd(0.10, 0.18));
        const fac = new THREE.Mesh(facadeGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }));
        fac.position.set(side * (half + 1.6), 6, 0);
        grp.add(fac);
        const nc = pick(NEON);
        const y = rnd(3.5, 7.2), zoff = rnd(-2.2, 2.2);
        const ry = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        // ネオンのにじみ（加算合成の大きめ板＝光って見える、ライト不使用で軽い）
        const glow = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 3.8),
          new THREE.MeshBasicMaterial({ color: nc, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        glow.position.set(side * (half + 0.04), y, zoff);
        glow.rotation.y = ry;
        grp.add(glow);
        // 看板本体
        const sg = new THREE.Mesh(
          new THREE.PlaneGeometry(1.4, 2.6),
          new THREE.MeshBasicMaterial({ map: this._signTex(pick(SIGNS), '#120a18', nc), transparent: true })
        );
        sg.position.set(side * (half + 0.06), y, zoff);
        sg.rotation.y = ry;
        grp.add(sg);
        grp.position.z = i * SEG;
        this.scene.add(grp);
        this.buildings.push(grp);
      }
    }
  }

  _buildLanterns() {
    const half = CONFIG.road.half;
    const geo = new THREE.SphereGeometry(0.3, 12, 10);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6a40 });
    const strMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff7a44, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
    this.lanterns = [];
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1;
      const grp = new THREE.Group();
      const lan = new THREE.Mesh(geo, mat);
      lan.scale.y = 1.3; lan.position.y = 4;
      grp.add(lan);
      const glow = new THREE.Mesh(geo, glowMat);
      glow.scale.set(2.2, 2.6, 2.2); glow.position.y = 4;
      grp.add(glow);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.4), strMat);
      str.position.y = 5;
      grp.add(str);
      grp.position.set(side * (half - 0.4), 0, i * 12);
      this.scene.add(grp);
      this.lanterns.push(grp);
    }
  }

  _buildBeacon() {
    this.beacon = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.1),
      new THREE.MeshBasicMaterial({ map: this._signTex('家', '#1a0e10', '#ffd9a0'), transparent: true })
    );
    this.beacon.position.set(0, 3.2, 40);
    this.scene.add(this.beacon);
  }

  // 無限路地：プレイヤーの前後でモジュールを再配置
  recycle(px, pz) {
    const span = NSEG * SEG;
    for (const b of this.buildings) {
      if (b.position.z < pz - SEG) b.position.z += span;
      else if (b.position.z > pz + span - SEG) b.position.z -= span;
    }
    const lspan = this.lanterns.length * 12;
    for (const l of this.lanterns) {
      if (l.position.z < pz - 6) l.position.z += lspan;
    }
    this.road.position.z = pz;
    this.roadTex.offset.y = -pz * 0.05;
    for (const g of this.gutters) g.position.z = pz;
    for (const w of this.gutterWalls) w.position.z = pz;
    this.lamp.position.set(px, 6, pz + 4);
    this.beacon.position.z = pz + 40;
  }

  setSky(hex) {
    this._skyTmp.set(hex);
    this.scene.background.copy(this._skyTmp);
    // 霧は空より少し明るいかすみ色へ寄せる＝遠景が持ち上がり障害物が見える
    this._skyTmp.lerp(this._haze, CONFIG.view.fogHazeMix);
    this.scene.fog.color.copy(this._skyTmp);
  }
}
