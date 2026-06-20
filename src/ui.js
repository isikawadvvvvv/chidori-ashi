import { TIMEBANDS, OVER_LINES, CONFIG } from './config.js';

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function timeband(dist) {
  return TIMEBANDS[clamp(Math.floor(dist / 200), 0, TIMEBANDS.length - 1)];
}

export const UI = {
  syncHUD(G, drunk01, playing, straight) {
    $('dist').textContent = Math.round(G.dist);
    $('pts').textContent = Math.round(G.score).toLocaleString();
    $('best').textContent = G.best.toLocaleString();
    const m = $('mult');
    m.textContent = '× ' + G.mult.toFixed(1);
    m.classList.toggle('on', G.mult > 1);
    $('band').textContent = timeband(G.dist)[0];
    const c = $('combo');
    c.style.opacity = G.combo > 1 ? 1 : 0;
    c.textContent = G.combo + ' COMBO';

    const f = $('meterfill');
    f.style.width = (drunk01 * 100) + '%';
    f.style.background = drunk01 < 0.5 ? '#5cffd0' : drunk01 < 0.8 ? '#ffd24d' : '#ff4d6a';
    $('warn').style.opacity = drunk01 > 0.85 ? 1 : 0;

    const V = CONFIG.view;
    $('tint').style.opacity = clamp(drunk01 * V.tintMax, 0, V.tintMax).toFixed(3);
    $('vig').style.opacity = (V.vigBase + drunk01 * V.vigGain).toFixed(3);

    $('reticle').style.opacity = playing ? (0.3 + straight * 0.6).toFixed(2) : 0;
  },

  showTitle() {
    $('title').classList.remove('hidden');
    $('over').classList.add('hidden');
    $('over').style.opacity = 0;
    $('card').style.opacity = 0;
  },

  hideTitle() { $('title').classList.add('hidden'); },

  hideOver() {
    const ov = $('over');
    ov.classList.add('hidden');
    ov.style.opacity = 0;
    $('card').style.opacity = 0;
  },

  showOver(G, cause, fin, isNew) {
    const ov = $('over');
    ov.classList.remove('hidden');
    $('overline').textContent = pick(OVER_LINES[cause] || OVER_LINES.crash);
    $('r-dist').textContent = Math.round(G.dist);
    $('r-drinks').textContent = G.drinks;
    $('r-near').textContent = G.near;
    $('r-mult').textContent = G.mult.toFixed(1);
    $('r-mem').textContent = Math.max(0, Math.round(100 - G.drunk));
    $('r-score').textContent = fin.toLocaleString();
    const b = $('r-best');
    b.textContent = isNew ? '★ 自己ベスト更新！' : ('BEST ' + G.best.toLocaleString());
    b.classList.toggle('new', isNew);
    requestAnimationFrame(() => {
      ov.style.opacity = 1;
      setTimeout(() => { $('card').style.opacity = 1; }, 350);
    });
  },
};
