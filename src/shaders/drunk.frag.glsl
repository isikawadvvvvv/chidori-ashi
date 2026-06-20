// 酔いのポストエフェクト：二重視・赤シアンの色ずれ・簡易ブラー
uniform sampler2D tDiffuse;
uniform vec2 dir;     // 二重視のずれ方向
uniform float amount; // 二重視＋色ずれの強さ 0..1
uniform float blur;   // ブラー量(px)
uniform vec2 res;     // 解像度
varying vec2 vUv;

void main() {
  vec2 px = 1.0 / res;
  vec4 base = texture2D(tDiffuse, vUv);

  if (blur > 0.001) {
    vec4 b = vec4(0.0);
    float o = blur;
    b += texture2D(tDiffuse, vUv + vec2( o, 0.0) * px);
    b += texture2D(tDiffuse, vUv + vec2(-o, 0.0) * px);
    b += texture2D(tDiffuse, vUv + vec2(0.0,  o) * px);
    b += texture2D(tDiffuse, vUv + vec2(0.0, -o) * px);
    base = mix(base, b * 0.25, 0.6);
  }

  vec4 ghost = texture2D(tDiffuse, vUv + dir);
  vec4 col = mix(base, (base + ghost) * 0.5, amount);

  float r  = texture2D(tDiffuse, vUv - dir * 0.6).r;
  float bl = texture2D(tDiffuse, vUv + dir * 0.6).b;
  col.rgb = mix(col.rgb, vec3(r, col.g, bl), amount * 0.6);

  gl_FragColor = col;
}
