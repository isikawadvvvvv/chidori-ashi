import * as THREE from 'three';
import { CONFIG } from './config.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// 共有ジオメトリ（使い回してGCを避ける）
const GEO = {
  pole: new THREE.CylinderGeometry(0.12, 0.14, 4, 8),
  vending: new THREE.BoxGeometry(1.3, 2.4, 0.8),
  body: new THREE.CylinderGeometry(0.28, 0.28, 1.1, 8),
  head: new THREE.SphereGeometry(0.22, 10, 8),
  cat: new THREE.BoxGeometry(0.5, 0.3, 0.9),
  wheel: new THREE.TorusGeometry(0.32, 0.05, 6, 16),
  glass: new THREE.CylinderGeometry(0.12, 0.08, 0.3, 8),
  bottle: new THREE.CylinderGeometry(0.1, 0.1, 0.36, 8),
  bile: new THREE.CircleGeometry(0.5, 10),
  shadow: new THREE.CircleGeometry(0.7, 16),
  glowDisc: new THREE.CircleGeometry(0.18, 12),
};

// 接地影＝障害物が浮いて見えず、距離も読みやすくなる
const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false });
function addShadow(group, r) {
  const sh = new THREE.Mesh(GEO.shadow, SHADOW_MAT);
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.02;
  sh.scale.setScalar(r * 1.4);
  group.add(sh);
}

const EARLY = ['pole', 'pedestrian', 'vending', 'pedestrian'];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.items = [];
    this.pool = {};
    this.nextZ = 8;
  }

  reset() {
    for (const o of this.obstacles) { this.scene.remove(o.mesh); this._toPool(o.mesh); }
    for (const it of this.items) { this.scene.remove(it.mesh); this._toPool(it.mesh); }
    this.obstacles.length = 0;
    this.items.length = 0;
    this.nextZ = 8;
  }

  _fromPool(type, build) {
    const a = this.pool[type] || (this.pool[type] = []);
    let m = a.pop();
    if (!m) { m = build(); m.userData.type = type; }
    m.visible = true;
    return m;
  }
  _toPool(m) {
    m.visible = false;
    (this.pool[m.userData.type] || (this.pool[m.userData.type] = [])).push(m);
  }

  _buildObstacle(type) {
    const g = new THREE.Group();
    g.userData.type = type;
    if (type === 'pole') {
      // 電柱＝黄色い警告カラー
      const p = new THREE.Mesh(GEO.pole, new THREE.MeshBasicMaterial({ color: 0xffee44 }));
      p.position.y = 2; g.add(p);
      // 黒い警告ストライプ
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.15, 0.3, 8),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
      );
      for (const y of [1.2, 2.0, 2.8]) {
        const s = stripe.clone(); s.position.y = y; g.add(s);
      }
      const cap = new THREE.Mesh(GEO.glowDisc, new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      cap.position.y = 4.0; g.add(cap);
      g.userData.r = 0.5;

    } else if (type === 'vending') {
      // 自販機＝明るい赤
      const m = new THREE.Mesh(GEO.vending, new THREE.MeshBasicMaterial({ color: 0xff3355 }));
      m.position.y = 1.2; g.add(m);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      win.position.set(0, 2.0, 0.41); g.add(win);
      // ロゴっぽい帯
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.31, 0.25, 0.82), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      band.position.y = 0.7; g.add(band);
      g.userData.r = 0.9;

    } else if (type === 'pedestrian' || type === 'cop') {
      // 通行人＝明るいオレンジ、警官＝明るい青
      const bodyCol = type === 'cop' ? 0x44aaff : 0xff8822;
      const b = new THREE.Mesh(GEO.body, new THREE.MeshBasicMaterial({ color: bodyCol }));
      b.position.y = 1.0; g.add(b);
      const h = new THREE.Mesh(GEO.head, new THREE.MeshBasicMaterial({ color: 0xffddbb }));
      h.position.y = 1.75; g.add(h);
      if (type === 'cop') {
        const cap = new THREE.Mesh(GEO.head, new THREE.MeshBasicMaterial({ color: 0xffee22 }));
        cap.scale.set(1.2, 0.45, 1.2); cap.position.y = 2.0; g.add(cap);
      }
      g.userData.r = 0.6;

    } else if (type === 'cat') {
      // 猫＝白＋光る緑の目
      const c = new THREE.Mesh(GEO.cat, new THREE.MeshBasicMaterial({ color: 0xe8e8f0 }));
      c.position.y = 0.25; g.add(c);
      const ey = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.1), new THREE.MeshBasicMaterial({ color: 0x88ff44 }));
      ey.position.set(0, 0.32, 0.46); g.add(ey);
      g.userData.r = 0.45;

    } else if (type === 'bike') {
      // 自転車＝明るいシアン
      const wm = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const w1 = new THREE.Mesh(GEO.wheel, wm); const w2 = w1.clone();
      w1.position.set(0, 0.32, -0.5); w2.position.set(0, 0.32, 0.5);
      w1.rotation.y = Math.PI / 2; w2.rotation.y = Math.PI / 2;
      g.add(w1, w2);
      const b = new THREE.Mesh(GEO.body, new THREE.MeshBasicMaterial({ color: 0x00ddff }));
      b.scale.set(0.7, 1.2, 0.7); b.position.y = 1.0; g.add(b);
      // ヘッドライト
      const head = new THREE.Mesh(GEO.glowDisc, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      head.scale.setScalar(2.0); head.position.set(0, 0.7, -0.55); g.add(head);
      g.userData.r = 0.7;
    }
    addShadow(g, g.userData.r);
    return g;
  }

  _buildItem(kind) {
    const g = new THREE.Group();
    g.userData.kind = kind;
    if (kind === 'drink' || kind === 'tequila') {
      g.add(new THREE.Mesh(GEO.glass, new THREE.MeshBasicMaterial({ color: kind === 'tequila' ? 0xffe24d : 0xe89a3c })));
      const halo = new THREE.Mesh(GEO.glowDisc, new THREE.MeshBasicMaterial({ color: kind === 'tequila' ? 0xffe24d : 0xffb24d, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(3.2); g.add(halo);
    } else if (kind === 'water') {
      g.add(new THREE.Mesh(GEO.bottle, new THREE.MeshBasicMaterial({ color: 0x8af0ff })));
      const halo = new THREE.Mesh(GEO.glowDisc, new THREE.MeshBasicMaterial({ color: 0x8af0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(3.0); g.add(halo);
    } else if (kind === 'bile') {
      const m = new THREE.Mesh(GEO.bile, new THREE.MeshBasicMaterial({ color: 0x9bd146 }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.03; g.add(m);
    }
    return g;
  }

  _addObstacle(type, x, z) {
    const m = this._fromPool(type, () => this._buildObstacle(type));
    this.scene.add(m);
    m.position.set(x, 0, z);
    const o = { mesh: m, type, x, z, r: m.userData.r, vx: 0, vz: 0, passed: false };
    if (type === 'pedestrian' || type === 'cop') { o.vx = rnd(-0.6, 0.6); o.vz = -rnd(0.9, 1.9); }
    else if (type === 'bike') { o.vx = (Math.random() < 0.5 ? -1 : 1) * rnd(1.2, 2.2); o.vz = -rnd(2.6, 4.4); o.x = -Math.sign(o.vx) * (CONFIG.road.half - 0.6); m.position.x = o.x; }
    else if (type === 'cat') { o.vx = (Math.random() < 0.5 ? -1 : 1) * rnd(3.5, 5); o.vz = -rnd(0.4, 1.2); o.x = -Math.sign(o.vx) * (CONFIG.road.half - 0.4); m.position.x = o.x; }
    this.obstacles.push(o);
  }

  _addItem(kind, x, z) {
    const m = this._fromPool('item_' + kind, () => this._buildItem(kind));
    this.scene.add(m);
    m.position.set(x, kind === 'bile' ? 0 : 1.0, z);
    this.items.push({ mesh: m, kind, x, z, t: 0 });
  }

  _randX() {
    const half = CONFIG.road.half;
    return rnd(-half + 0.7, half - 0.7);
  }

  _pickType(dist) {
    if (dist < 60) return pick(EARLY);
    const r = Math.random();
    return r < 0.30 ? 'pole' : r < 0.48 ? 'vending' : r < 0.66 ? 'pedestrian' : r < 0.78 ? 'bike' : r < 0.90 ? 'cat' : 'cop';
  }

  spawn(pz, dist) {
    const S = CONFIG.spawn;
    const far = pz + S.ahead;
    const slots = S.slots;
    const maxObstacles = slots.length - 1; // 最低でも1レーンは空ける
    while (this.nextZ < far) {
      const gap = Math.max(2.0, rnd(S.minGap, S.maxGap) - Math.min(dist * S.gapTighten, S.maxGap - 2.0));
      this.nextZ += gap;
      const z = this.nextZ;

      const roll = Math.random();
      if (roll < 0.12) { this._addItem('drink', this._randX(), z); continue; }
      if (roll < 0.18) { this._addItem(Math.random() < 0.2 ? 'tequila' : 'water', this._randX(), z); continue; }
      if (roll < 0.21) { this._addItem('bile', this._randX(), z); continue; }

      // 障害物の「行」。距離が伸びるほど同時に並ぶ数が増える
      let count = 1;
      if (dist >= 50) {
        const r = Math.random();
        count = r < 0.40 ? 1 : r < 0.80 ? 2 : 3;
        const cap = dist < 250 ? 2 : maxObstacles; // 中盤までは最大2、後半で最大3
        count = Math.min(count, cap, maxObstacles);
      }
      const lanes = shuffle(slots.slice());
      for (let k = 0; k < count; k++) {
        const x = lanes[k] + rnd(-0.35, 0.35);
        this._addObstacle(this._pickType(dist), x, z);
      }
    }
  }

  // cb: { onHit(type), onNear(), onPick(kind) }
  update(dt, px, pz, cb) {
    const half = CONFIG.road.half;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (o.vx) {
        o.x += o.vx * dt;
        if ((o.type === 'pedestrian' || o.type === 'cop') && (o.x < -half + 0.6 || o.x > half - 0.6)) o.vx *= -1;
      }
      if (o.vz) o.z += o.vz * dt;
      if (o.vx || o.vz) o.mesh.position.set(o.x, o.mesh.position.y, o.z);

      const ddz = o.z - pz, ddx = o.x - px;
      const hitR = o.r + 0.35;
      if (Math.abs(ddz) < o.r + 0.4 && Math.abs(ddx) < hitR) { cb.onHit(o.type); return; }

      if (!o.passed && o.z < pz) {
        o.passed = true;
        if (Math.abs(ddx) < hitR + 1.0) cb.onNear();
      }
      if (o.z < pz - 5) { this.scene.remove(o.mesh); this._toPool(o.mesh); this.obstacles.splice(i, 1); }
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      if (it.kind !== 'bile') {
        it.mesh.position.y = 1.0 + Math.sin(it.t * 4) * 0.12;
        it.mesh.rotation.y += dt * 2;
      }
      if (Math.abs(it.z - pz) < 0.7 && Math.abs(it.x - px) < 0.7) {
        this.scene.remove(it.mesh); this._toPool(it.mesh); this.items.splice(i, 1);
        cb.onPick(it.kind); continue;
      }
      if (it.z < pz - 5) { this.scene.remove(it.mesh); this._toPool(it.mesh); this.items.splice(i, 1); }
    }
  }
}
