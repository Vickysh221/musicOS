export const VERT_SRC = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

// Holographic pixel-matter shader (ported from six_persona_holographic_pixel_matter.html).
// Method A tone-tame is baked into the final block of main():
//   exposure ×0.62, saturation ×0.72, soft highlight rolloff, contrast +6%.
export const FRAG_SRC = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform int uPersona;
uniform float uEnergy;
uniform float uTension;
uniform float uBPM;
uniform float uDynamics;
uniform float fxPixel;
uniform float fxPixelSize;
uniform float fxParticles;
uniform float fxPrism;
uniform float fxDesat;
uniform float fxContrast;
uniform float fxDrift;

#define PI 3.14159265

vec2 c_sub(vec2 a, vec2 b) { return a - b; }
vec2 c_div(vec2 a, vec2 b) {
    float d = b.x*b.x + b.y*b.y + 1e-6;
    return vec2((a.x*b.x + a.y*b.y)/d, (a.y*b.x - a.x*b.y)/d);
}
float c_mag(vec2 z) { return length(z); }
float c_arg(vec2 z) { return atan(z.y, z.x); }

void getParams(int p, out int nZ, out int nP, out float spread, out float drift,
               out float hueA, out float hueB, out float iso, out float vig,
               out float shim, out float dual) {
    nZ=1; nP=1; spread=0.5; drift=0.5; hueA=220.0; hueB=220.0; iso=4.0; vig=0.3; shim=1.0; dual=0.0;
    if (p == 0) { nZ=1; nP=2; spread=0.85; drift=0.1; hueA=220.0; hueB=220.0; iso=4.0; vig=0.85; shim=0.3; dual=0.0; }
    else if (p == 1) { nZ=1; nP=1; spread=0.55; drift=0.4; hueA=260.0; hueB=260.0; iso=3.5; vig=0.5; shim=0.6; dual=0.0; }
    else if (p == 2) { nZ=2; nP=2; spread=0.55; drift=0.6; hueA=30.0; hueB=220.0; iso=4.0; vig=0.25; shim=0.8; dual=1.0; }
    else if (p == 3) { nZ=2; nP=4; spread=0.35; drift=1.4; hueA=0.0; hueB=220.0; iso=7.0; vig=0.4; shim=2.2; dual=1.0; }
    else if (p == 4) { nZ=1; nP=1; spread=0.50; drift=1.0; hueA=30.0; hueB=30.0; iso=2.5; vig=0.15; shim=1.6; dual=0.0; }
    else if (p == 5) { nZ=1; nP=1; spread=0.95; drift=0.25; hueA=280.0; hueB=280.0; iso=1.8; vig=-0.4; shim=0.4; dual=0.0; }
}

vec3 hsl2rgb(float h, float s, float l) {
    h = mod(h, 360.0) / 360.0;
    float c = (1.0 - abs(2.0*l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h*6.0, 2.0) - 1.0));
    float m = l - c*0.5;
    vec3 rgb;
    if (h < 0.16667) rgb = vec3(c, x, 0.0);
    else if (h < 0.33333) rgb = vec3(x, c, 0.0);
    else if (h < 0.5) rgb = vec3(0.0, c, x);
    else if (h < 0.66667) rgb = vec3(0.0, x, c);
    else if (h < 0.83333) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
}

vec2 orbitPoint(float idx, float r, float speed, float t) {
    float phase = idx * 1.7;
    float fa = 0.7 + idx * 0.13;
    float fb = 0.6 + idx * 0.17;
    return r * vec2(sin(t * speed * fa + phase), cos(t * speed * fb + phase * 0.5));
}

vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

vec2 fieldMagPhase(vec2 z) {
    int nZ, nP;
    float spread, drift, hueA, hueB, iso, vig, shim, dual;
    getParams(uPersona, nZ, nP, spread, drift, hueA, hueB, iso, vig, shim, dual);
    drift *= (0.5 + uDynamics * 1.0);
    float t = iTime;
    vec2 zeros0 = orbitPoint(0.0, spread, drift, t);
    vec2 zeros1 = orbitPoint(1.0, spread * 0.9, drift * 1.1, t + 1.5);
    vec2 poles0 = orbitPoint(3.0, spread, drift, t + 0.8);
    vec2 poles1 = orbitPoint(4.0, spread * 1.1, drift * 1.2, t + 2.3);
    vec2 poles2 = orbitPoint(5.0, spread * 0.95, drift * 0.9, t + 4.1);
    vec2 poles3 = orbitPoint(6.0, spread * 1.05, drift * 1.3, t + 5.7);
    vec2 S = vec2(0.0);
    if (nZ >= 1) S += c_div(vec2(1.0, 0.0), c_sub(z, zeros0));
    if (nZ >= 2) S += c_div(vec2(1.0, 0.0), c_sub(z, zeros1));
    if (nP >= 1) S -= c_div(vec2(1.0, 0.0), c_sub(z, poles0));
    if (nP >= 2) S -= c_div(vec2(1.0, 0.0), c_sub(z, poles1));
    if (nP >= 3) S -= c_div(vec2(1.0, 0.0), c_sub(z, poles2));
    if (nP >= 4) S -= c_div(vec2(1.0, 0.0), c_sub(z, poles3));
    return vec2(c_mag(S), c_arg(S));
}

vec2 fieldGradient(vec2 z) {
    float h = 0.005;
    float mx1 = fieldMagPhase(z + vec2(h, 0.0)).x;
    float mx2 = fieldMagPhase(z - vec2(h, 0.0)).x;
    float my1 = fieldMagPhase(z + vec2(0.0, h)).x;
    float my2 = fieldMagPhase(z - vec2(0.0, h)).x;
    return vec2(mx1 - mx2, my1 - my2);
}

vec3 fieldColor(vec2 z) {
    int nZ, nP;
    float spread, drift, hueA, hueB, iso, vig, shim, dual;
    getParams(uPersona, nZ, nP, spread, drift, hueA, hueB, iso, vig, shim, dual);
    drift *= (0.5 + uDynamics * 1.0);
    iso *= (0.5 + uTension * 1.2);
    float shimFreq = uBPM / 60.0 * shim * 0.5;
    vec2 mp = fieldMagPhase(z);
    float mag = mp.x;
    float arg = mp.y;
    float t = iTime;
    float m = log(mag + 1.0);
    float inv = log(1.0/(mag + 1e-4) + 1.0);
    float balance = 0.4 * (m + inv);
    float bright = pow(balance, 2.0);
    float hue;
    if (dual > 0.5) {
        float blend = 0.5 + 0.5 * cos(arg + t * 0.2);
        hue = mix(hueA, hueB, blend);
    } else {
        hue = hueA + 20.0 * sin(arg + t * 0.15);
    }
    float sat = 0.40 + uEnergy * 0.20;
    float lum = 0.18 + bright * 0.32 + uEnergy * 0.10;
    vec3 base = hsl2rgb(hue, sat, lum);
    float shimmer = 0.5 + 0.5 * sin(t * shimFreq + mag * 3.0);
    float lineWave = abs(sin(arg * iso + shimmer));
    float lines = smoothstep(0.18, 0.0, lineWave);
    base = mix(base, hsl2rgb(hue, 0.10, 0.92), lines * 0.40);
    vec2 zeros0 = orbitPoint(0.0, spread, drift, t);
    vec2 zeros1 = orbitPoint(1.0, spread * 0.9, drift * 1.1, t + 1.5);
    vec2 poles0 = orbitPoint(3.0, spread, drift, t + 0.8);
    vec2 poles1 = orbitPoint(4.0, spread * 1.1, drift * 1.2, t + 2.3);
    vec2 poles2 = orbitPoint(5.0, spread * 0.95, drift * 0.9, t + 4.1);
    vec2 poles3 = orbitPoint(6.0, spread * 1.05, drift * 1.3, t + 5.7);
    float halo = 0.0;
    if (nZ >= 1) halo += exp(-6.0 * length(z - zeros0)) * 1.2;
    if (nZ >= 2) halo += exp(-6.0 * length(z - zeros1)) * 1.2;
    if (nP >= 1) halo += exp(-7.0 * length(z - poles0)) * 0.8;
    if (nP >= 2) halo += exp(-7.0 * length(z - poles1)) * 0.8;
    if (nP >= 3) halo += exp(-7.0 * length(z - poles2)) * 0.8;
    if (nP >= 4) halo += exp(-7.0 * length(z - poles3)) * 0.8;
    bright += halo * (0.15 + uEnergy * 0.25);
    vec3 color = base * bright;
    float vd = length(z);
    if (vig > 0.0) {
        color *= 1.0 - vig * smoothstep(0.3, 1.2, vd);
    } else {
        color += abs(vig) * smoothstep(0.4, 1.1, vd) * vec3(0.85, 0.82, 0.88);
    }
    return color;
}

vec3 floatingParticles(vec2 uv, float t) {
    vec3 acc = vec3(0.0);
    for (float gy = -2.0; gy < 2.0; gy += 1.0) {
        for (float gx = -2.0; gx < 2.0; gx += 1.0) {
            vec2 cell = vec2(gx, gy);
            vec2 seed = hash22(cell + 17.3);
            vec2 basePos = (cell + seed - 0.5) * 0.5;
            vec2 grad = fieldGradient(basePos);
            vec2 driftDir = vec2(-grad.y, grad.x) * fxDrift * 0.5;
            float driftPhase = seed.x * 6.28 + t * (0.2 + seed.y * 0.6);
            vec2 driftOffset = driftDir + 0.15 * vec2(sin(driftPhase), cos(driftPhase));
            vec2 partPos = basePos + driftOffset;
            float d = length(uv - partPos);
            float partSize = 0.003 + seed.x * 0.008;
            float br = exp(-d * d / (partSize * partSize)) * 0.6;
            vec3 partColor = fieldColor(partPos);
            float partLum = dot(partColor, vec3(0.299, 0.587, 0.114));
            acc += mix(partColor, vec3(0.95, 0.95, 1.0), 0.4) * br * (0.5 + partLum * 1.5);
        }
    }
    return acc * fxParticles;
}

vec3 pixelMatrix(vec2 fragPx, vec3 srcColor) {
    if (fxPixel < 0.01) return srcColor;
    float gridSize = fxPixelSize;
    vec2 cellLocal = fract(fragPx / gridSize);
    float subX = cellLocal.x;
    float subY = cellLocal.y;
    float pad = 0.15;
    float subBrightX = smoothstep(0.0, pad, subY) * smoothstep(1.0, 1.0 - pad, subY);
    vec3 subPixel = vec3(0.0);
    if (subX < 0.333) {
        float r = smoothstep(0.0, pad, subX) * smoothstep(0.333, 0.333 - pad, subX);
        subPixel = vec3(srcColor.r, 0.0, 0.0) * r * subBrightX;
    } else if (subX < 0.666) {
        float g = smoothstep(0.333, 0.333 + pad, subX) * smoothstep(0.666, 0.666 - pad, subX);
        subPixel = vec3(0.0, srcColor.g, 0.0) * g * subBrightX;
    } else {
        float b = smoothstep(0.666, 0.666 + pad, subX) * smoothstep(1.0, 1.0 - pad, subX);
        subPixel = vec3(0.0, 0.0, srcColor.b) * b * subBrightX;
    }
    return mix(srcColor, subPixel * 2.8, fxPixel);
}

vec3 prismatic(vec2 uv) {
    if (fxPrism < 0.01) return fieldColor(uv);
    vec2 grad = fieldGradient(uv);
    float gradLen = length(grad);
    vec2 dir = gradLen > 0.0001 ? grad / gradLen : vec2(1.0, 0.0);
    float disp = fxPrism * 0.018 * (0.5 + gradLen * 0.5);
    vec3 r = fieldColor(uv + dir * disp * 1.5);
    vec3 g = fieldColor(uv);
    vec3 b = fieldColor(uv - dir * disp * 1.2);
    return vec3(r.r, g.g, b.b);
}

vec3 adjustColor(vec3 c) {
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, vec3(lum), fxDesat * 0.7);
    c = (c - 0.5) * (1.0 + fxContrast * 0.8) + 0.5;
    c = c + (1.0 - c) * 0.04;
    c = pow(max(c, 0.0), vec3(0.94));
    return c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    if (iResolution.y > iResolution.x) {
        uv.x *= iResolution.x / iResolution.y;
    } else {
        uv.y *= iResolution.y / iResolution.x;
    }
    vec3 col = prismatic(uv);
    col += floatingParticles(uv, iTime);
    col = adjustColor(col);
    col = pixelMatrix(gl_FragCoord.xy, col);

    // === Background tone-tame (Method A) ===
    col *= 0.62;                                            // exposure -38%
    float Lb = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(Lb), col, 0.72);                         // saturation x0.72
    col = col / (1.0 + col * 0.55);                         // soft highlight rolloff
    col = (col - 0.5) * 1.06 + 0.5;                         // contrast +6%

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
}
`;

export interface ShaderFx {
  pixel: number;
  pixelSize: number;
  particles: number;
  prism: number;
  desat: number;
  contrast: number;
  drift: number;
}

export const DEFAULT_FX: ShaderFx = {
  pixel: 0.65,
  pixelSize: 60,
  particles: 0.55,
  prism: 0.5,
  desat: 0.55,
  contrast: 0.65,
  drift: 0.6,
};

export const PERSONA_ENERGY = [0.2, 0.45, 0.55, 0.85, 0.78, 0.4];
export const PERSONA_TENSION = [0.65, 0.45, 0.7, 0.85, 0.55, 0.45];
