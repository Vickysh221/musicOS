import { useEffect, useRef } from 'react';
import {
  DEFAULT_FX,
  FRAG_SRC,
  PERSONA_ENERGY,
  PERSONA_TENSION,
  VERT_SRC,
  type ShaderFx,
} from './holographic-shader.js';
import './background-shader.css';

interface Props {
  /** 0=submerged, 1=aching, 2=aching-bright, 3=surging-aching, 4=surging, 5=drifting-aching */
  persona?: number;
  bpm?: number;
  dynamics?: number;
  fx?: Partial<ShaderFx>;
}

export function BackgroundShader({ persona = 1, bpm = 78, dynamics = 0.7, fx }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string): WebGLShader | null => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('shader compile error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, 'iResolution'),
      time: gl.getUniformLocation(prog, 'iTime'),
      persona: gl.getUniformLocation(prog, 'uPersona'),
      energy: gl.getUniformLocation(prog, 'uEnergy'),
      tension: gl.getUniformLocation(prog, 'uTension'),
      bpm: gl.getUniformLocation(prog, 'uBPM'),
      dynamics: gl.getUniformLocation(prog, 'uDynamics'),
      pixel: gl.getUniformLocation(prog, 'fxPixel'),
      pixelSize: gl.getUniformLocation(prog, 'fxPixelSize'),
      particles: gl.getUniformLocation(prog, 'fxParticles'),
      prism: gl.getUniformLocation(prog, 'fxPrism'),
      desat: gl.getUniformLocation(prog, 'fxDesat'),
      contrast: gl.getUniformLocation(prog, 'fxContrast'),
      drift: gl.getUniformLocation(prog, 'fxDrift'),
    };

    const fxResolved: ShaderFx = { ...DEFAULT_FX, ...fx };
    const energy = PERSONA_ENERGY[persona] ?? 0.5;
    const tension = PERSONA_TENSION[persona] ?? 0.5;

    let raf = 0;
    let cancelled = false;

    const render = (tMs: number) => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.time, tMs / 1000);
      gl.uniform1i(u.persona, persona);
      gl.uniform1f(u.energy, energy);
      gl.uniform1f(u.tension, tension);
      gl.uniform1f(u.bpm, bpm);
      gl.uniform1f(u.dynamics, dynamics);
      gl.uniform1f(u.pixel, fxResolved.pixel);
      gl.uniform1f(u.pixelSize, fxResolved.pixelSize);
      gl.uniform1f(u.particles, fxResolved.particles);
      gl.uniform1f(u.prism, fxResolved.prism);
      gl.uniform1f(u.desat, fxResolved.desat);
      gl.uniform1f(u.contrast, fxResolved.contrast);
      gl.uniform1f(u.drift, fxResolved.drift);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    raf = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [persona, bpm, dynamics, fx]);

  return (
    <div className="bg-shader" aria-hidden="true">
      <canvas ref={canvasRef} className="bg-shader__canvas" />
      <div className="bg-shader__veil" />
    </div>
  );
}
