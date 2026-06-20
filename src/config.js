// ゲームの手触りを決める数値はここに集約（調整しやすいように）
export const CONFIG = {
  road: {
    half: 4.2,          // 道幅の半分（これを超えると側溝へドボン）
    fogNear: 3,
    fogFar: 65,
  },
  // 明るさ・視認性（ここを上げると見やすくなる）
  light: {
    ambient: 1.8, ambientColor: 0x6a6a90,
    hemiSky: 0xa08ac0, hemiGround: 0x2a2440, hemi: 1.45,
    moon: 0.85,
    lampIntensity: 2.8, lampDistance: 50,
  },
  // 画面オーバーレイ・霧のかすみ（演出は残しつつ「見えない」を防ぐ）
  view: {
    vigBase: 0.14, vigGain: 0.22,   // ビネット（端の暗さ）
    tintMax: 0.15,                  // 酔いの色かぶり上限
    fxDoubleMax: 0.30,              // 二重視の強さ上限
    fxBlurMax: 0.95,                // 酔いブラー上限
    fogHaze: 0x5a5a7a,              // 霧をこの色へ寄せて遠景を持ち上げる
    fogHazeMix: 0.80,
  },
  run: {
    speedStart: 7.0,    // 自動前進の初速 (m/s)
    speedGain: 0.018,   // 距離に応じた加速
    speedMax: 16,
  },
  steer: {
    maxVx: 6.5,         // 左右移動の最大速度
    accel: 0.18,        // 入力への追従（0..1, 大きいほどキビキビ）
    damp: 0.12,         // 入力なしのときの減衰
  },
  drunk: {
    start: 6,
    risePerSec: 1.6,    // 時間でじわじわ酔う
    riseByDist: 0.0016, // 進むほど酔いやすく
    drinkUp: 16,
    tequilaUp: 26,
    waterDown: 22,
    // 千鳥足ドリフト（酔い度0→1で補間）
    swayFreqMin: 1.4, swayFreqMax: 3.0,
    driftMin: 0.6, driftMax: 3.4,   // 横方向に勝手に流される強さ (m/s)
    yawMin: 0.05, yawMax: 0.22,     // 視界が振れる角度
    rollMin: 0.03, rollMax: 0.16,
  },
  spawn: {
    minGap: 3.2, maxGap: 6.5,
    gapTighten: 0.010,  // 距離に応じて間隔が詰まる
    ahead: 50,          // どこまで先に生成するか
    slots: [-3, -1, 1, 3], // 障害物の横レーン（必ず1つは空ける＝通れる道が残る）
  },
  score: {
    forwardPerM: 10,
    nearMiss: 60,
    straightPerSec: 0,  // ドッジ主体なので“まっすぐ加点”はオフ
  },
};

export const TIMEBANDS = [
  ['深夜2:00', 0x171232],
  ['深夜3:30', 0x1d1740],
  ['終電後',   0x281d4c],
  ['夜明け前', 0x3a2c5e],
  ['始発',     0x6a5680],
];

export const OVER_LINES = {
  crash: ['— 見知らぬ天井だった。', '記憶は、池袋で途切れている。', 'ここはどこ。私はだれ。靴は、片方。', '電柱は、優しくなかった。'],
  gutter: ['ドボン。側溝は、深かった。', '水の音で、目が覚めた。', '翌朝、片足だけが濡れていた。'],
  drunk: ['記憶の残量、ゼロ。', 'その夜のことは、誰も知らない。', '— 見知らぬ天井だった。'],
  cop: ['「ちょっと署まで」', '公務執行妨害で、夜が明けた。', '警官の目は、笑っていなかった。'],
};
