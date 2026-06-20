import './styles.css';
import * as THREE from 'three';

import { CONFIG } from './config.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Spawner } from './spawner.js';
import { DrunkPass } from './postfx.js';
import { UI, timeband } from './ui.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

const STATE = { TITLE: 0, PLAY: 1, OVER: 2 };
let state = STATE.TITLE;

// ---- レンダラ ----
const canvas = document.getElementById('scene');
const titleEl = document.getElementById('title');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200);
camera.rotation.order = 'YXZ';

const world = new World();
const player = new Player();
const spawner = new Spawner(world.scene);
const drunkPass = new DrunkPass(renderer);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  drunkPass.setSize(w, h, renderer.getPixelRatio());
}
addEventListener('resize', resize);
resize();

// ---- ゲーム状態 ----
function loadBest() { try { return parseInt(localStorage.getItem('chidori3d_best') || '0', 10) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem('chidori3d_best', String(v)); } catch (e) {} }

const G = { dist: 0, drunk: 6, drinks: 0, near: 0, score: 0, combo: 0, mult: 1, best: loadBest(), time: 0, cause: '', stun: 0 };
let speed = CONFIG.run.speedStart;
let slowmo = 1, slowmoT = 0, shake = 0, stepT = 0;

function reset() {
  Object.assign(G, { dist: 0, drunk: CONFIG.drunk.start, drinks: 0, near: 0, score: 0, combo: 0, mult: 1, time: 0, cause: '', stun: 0 });
  speed = CONFIG.run.speedStart;
  slowmo = 1; slowmoT = 0; shake = 0; stepT = 0;
  player.reset();
  spawner.reset();
}
function gotoTitle() { reset(); state = STATE.TITLE; UI.showTitle(); }
function start() { reset(); UI.hideTitle(); UI.hideOver(); state = STATE.PLAY; G.time = 0; }
function retry() { start(); }

// ---- 入力 ----
const input = new Input(() => {
  Sound.resume();
  if (state === STATE.TITLE) { start(); return; }
  if (state === STATE.OVER && G.time > 0.6) { retry(); return; }
});
input.onToggleMute(() => Sound.toggle());

// ---- アイテム効果 ----
function take(kind) {
  const D = CONFIG.drunk;
  if (kind === 'drink') { G.drinks++; G.drunk = clamp(G.drunk + D.drinkUp, 0, 100); G.mult = clamp(G.mult + 0.5, 1, 6); Sound.drink(); }
  else if (kind === 'water') { G.drunk = clamp(G.drunk - D.waterDown, 0, 100); Sound.water(); }
  else if (kind === 'tequila') { G.drunk = clamp(G.drunk + D.tequilaUp, 0, 100); G.drinks++; Sound.drink(); shake = 0.3; }
  else if (kind === 'bile') { G.stun = 0.7; G.combo = 0; Sound.splash(); shake = 0.25; }
}

function die(cause) {
  if (state !== STATE.PLAY) return;
  G.cause = cause;
  const fin = Math.round(G.score);
  const isNew = fin > G.best;
  if (isNew) { G.best = fin; saveBest(fin); }
  Sound.crash();
  shake = 0.6; slowmoT = 0; slowmo = 1;
  player.dead = true;
  state = STATE.OVER; G.time = 0;
  UI.showOver(G, cause, fin, isNew);
}

const callbacks = {
  onHit: (type) => die(type === 'cop' ? 'cop' : 'crash'),
  onNear: () => {
    G.near++; G.combo++;
    G.score += CONFIG.score.nearMiss * G.mult * (1 + G.combo * 0.04);
    slowmoT = Math.max(slowmoT, 0.16);
    Sound.near();
  },
  onPick: take,
};

// ---- メインループ ----
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000; last = now;
  dt = Math.min(dt, 0.05);
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update(dt) {
  G.time += dt;
  slowmoT = Math.max(0, slowmoT - dt);
  slowmo = slowmoT > 0 ? lerp(slowmo, 0.4, 0.2) : lerp(slowmo, 1, 0.15);
  const d = dt * slowmo;
  shake = Math.max(0, shake - dt);

  if (state === STATE.PLAY) {
    speed = clamp(CONFIG.run.speedStart + G.dist * CONFIG.run.speedGain, CONFIG.run.speedStart, CONFIG.run.speedMax);
    G.drunk = clamp(G.drunk + (CONFIG.drunk.risePerSec + G.dist * CONFIG.drunk.riseByDist) * d, 0, 100);
    const drunk01 = G.drunk / 100;

    G.stun = Math.max(0, G.stun - d);
    const steer = G.stun > 0 ? 0 : input.steer;

    player.update(d, steer, drunk01, speed);
    G.dist = player.z;
    G.score += speed * d * 0.6 * G.mult;

    // 足音
    stepT -= d;
    if (stepT <= 0) { Sound.step(); stepT = 0.32; }

    // 側溝・昏倒
    const half = CONFIG.road.half;
    if (player.x < -half + 0.3) { player.x = -half + 0.3; die('gutter'); return; }
    if (player.x > half - 0.3) { player.x = half - 0.3; die('gutter'); return; }
    if (G.drunk >= 100) { die('drunk'); return; }

    spawner.spawn(player.z, G.dist);
    spawner.update(d, player.x, player.z, callbacks);
    if (state !== STATE.PLAY) return; // onHit内でdieした場合

    world.recycle(player.x, player.z);
  } else if (state === STATE.OVER) {
    player.updateDead(d, G.cause);
    world.recycle(player.x, player.z);
  }

  // 画面表示は状態から再構成（万一のズレ防止＝タイトルが残らない）
  titleEl.classList.toggle('hidden', state !== STATE.TITLE);

  // HUD
  const drunk01 = G.drunk / 100;
  const straight = 1 - Math.min(1, Math.abs(player.yaw) / 0.12);
  UI.syncHUD(G, drunk01, state === STATE.PLAY, straight);
}

function render() {
  player.applyCamera(camera, shake);
  const tb = timeband(G.dist);
  world.setSky(tb[1]);
  drunkPass.render(world.scene, camera, G.drunk / 100, player.phase);
}

gotoTitle();
requestAnimationFrame(loop);
