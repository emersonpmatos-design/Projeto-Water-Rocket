/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Zap, Beaker, Play, RotateCcw } from 'lucide-react';

// Constants & Physics Parameters
const G = 9.80665;
const RHO_W = 998; // Water density at 20C (kg/m^3)
const RHO_A = 1.225; // Air density (kg/m^3)
const V_B = 0.002; // 2L bottle (m^3)
const D_N = 0.0215; // Standard PET opening is ~21.5mm
const A_N = Math.PI * Math.pow(D_N / 2, 2);
const D_B = 0.105; // Standard bottle diameter ~10.5cm
const A_B = Math.PI * Math.pow(D_B / 2, 2);
const CD = 0.35; // Refined drag coefficient for PET bottle shape
const P_ATM = 101325; // Atmospheric pressure (Pa)
const M_BOTTLE = 0.048; // Standard 2L PET bottle mass ~48g
const GAMMA = 1.4; // Adiabatic index for air
const C_V = 0.97; // Nozzle discharge coefficient (velocity)

interface State {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vw: number;
  m: number;
  pa: number;
  ta: number;
}

function simulateRocket(waterMl: number, pressurePsi: number, angleDeg: number) {
  const theta = (angleDeg * Math.PI) / 180;
  const p0_abs = (pressurePsi || 0) * 6894.76 + P_ATM;
  const v_w0 = (waterMl || 0) / 1000000;
  const v_a0 = V_B - v_w0;

  let state: State = {
    x: 0,
    y: 0.2, // Launch height ~20cm
    vx: 0,
    vy: 0,
    vw: v_w0,
    m: M_BOTTLE + v_w0 * RHO_W,
    pa: p0_abs,
    ta: 293.15,
  };

  let t = 0;
  const dt = 0.002; // Very fine time step for stability
  const trajectory: { x: number; y: number }[] = [{ x: state.x, y: state.y }];

  const getDerivatives = (s: State, time: number) => {
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    const fd = 0.5 * RHO_A * speed * speed * CD * A_B;
    const cur_theta = time < 0.1 ? theta : Math.atan2(s.vy, s.vx) || theta;

    let thrust = 0;
    let m_dot = 0;
    let p_dot = 0;

    if (s.vw > 0) {
      // Phase 1: Water Thrust
      const va = V_B - s.vw;
      const pa_curr = p0_abs * Math.pow(v_a0 / Math.max(0.0001, va), GAMMA);
      const p_diff = Math.max(0, pa_curr - P_ATM);
      const ve = C_V * Math.sqrt((2 * p_diff) / RHO_W);
      m_dot = RHO_W * A_N * ve;
      thrust = 2 * A_N * p_diff * C_V; // Refined thrust formula
    } else if (s.pa > P_ATM) {
      // Phase 2: Air Thrust
      const critical_p = P_ATM * Math.pow((GAMMA + 1) / 2, GAMMA / (GAMMA - 1));
      let ve_air = 0;
      let m_dot_air = 0;
      if (s.pa > critical_p) {
        const T_exit = s.ta * (2 / (GAMMA + 1));
        ve_air = Math.sqrt(GAMMA * 287 * T_exit);
        const rho_exit = (s.pa / (287 * s.ta)) * Math.pow(2 / (GAMMA + 1), 1 / (GAMMA - 1));
        m_dot_air = rho_exit * A_N * ve_air;
      } else {
        const p_ratio = s.pa / P_ATM;
        ve_air = Math.sqrt(2 * (GAMMA / (GAMMA - 1)) * (s.pa / (s.pa / (287 * s.ta))) * (1 - Math.pow(1 / p_ratio, (GAMMA - 1) / GAMMA)));
        m_dot_air = (s.pa / (287 * s.ta) * A_N * ve_air) / Math.pow(p_ratio, 1 / GAMMA);
      }
      thrust = m_dot_air * ve_air;
      m_dot = m_dot_air;
      // Isentropic pressure drop rate simplified for RK4 integration
      p_dot = - (s.pa * GAMMA * m_dot_air) / Math.max(0.0001, (s.pa * V_B / (287 * s.ta)));
    }

    const ax = (thrust * Math.cos(cur_theta) - (speed > 0 ? (s.vx / speed) * fd : 0)) / Math.max(0.01, s.m);
    const ay = (thrust * Math.sin(cur_theta) - (speed > 0 ? (s.vy / speed) * fd : 0) - s.m * G) / Math.max(0.01, s.m);

    return {
      dx: s.vx,
      dy: s.vy,
      dvx: ax,
      dvy: ay,
      dvw: - (s.vw > 0 ? A_N * C_V * Math.sqrt(Math.max(0, 2 * (s.pa - P_ATM) / RHO_W)) : 0),
      dm: -m_dot,
      dpa: p_dot,
    };
  };

  // Runge-Kutta 4th Order Integration
  while (state.y >= 0 && t < 20) {
    const k1 = getDerivatives(state, t);
    
    const s2 = {
      ...state,
      x: state.x + k1.dx * dt / 2,
      y: state.y + k1.dy * dt / 2,
      vx: state.vx + k1.dvx * dt / 2,
      vy: state.vy + k1.dvy * dt / 2,
      vw: state.vw + k1.dvw * dt / 2,
      m: state.m + k1.dm * dt / 2,
      pa: state.pa + k1.dpa * dt / 2,
    };
    const k2 = getDerivatives(s2, t + dt / 2);

    const s3 = {
      ...state,
      x: state.x + k2.dx * dt / 2,
      y: state.y + k2.dy * dt / 2,
      vx: state.vx + k2.dvx * dt / 2,
      vy: state.vy + k2.dvy * dt / 2,
      vw: state.vw + k2.dvw * dt / 2,
      m: state.m + k2.dm * dt / 2,
      pa: state.pa + k2.dpa * dt / 2,
    };
    const k3 = getDerivatives(s3, t + dt / 2);

    const s4 = {
      ...state,
      x: state.x + k3.dx * dt,
      y: state.y + k3.dy * dt,
      vx: state.vx + k3.dvx * dt,
      vy: state.vy + k3.dvy * dt,
      vw: state.vw + k3.dvw * dt,
      m: state.m + k3.dm * dt,
      pa: state.pa + k3.dpa * dt,
    };
    const k4 = getDerivatives(s4, t + dt);

    state = {
      x: state.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
      y: state.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
      vx: state.vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx),
      vy: state.vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy),
      vw: state.vw + (dt / 6) * (k1.dvw + 2 * k2.dvw + 2 * k3.dvw + k4.dvw),
      m: state.m + (dt / 6) * (k1.dm + 2 * k2.dm + 2 * k3.dm + k4.dm),
      pa: state.pa + (dt / 6) * (k1.dpa + 2 * k2.dpa + 2 * k3.dpa + k4.dpa),
      ta: state.ta,
    };

    t += dt;
    if (Math.round(t * 1000) % 20 === 0 || state.y < 0) {
      trajectory.push({ x: state.x, y: Math.max(0, state.y) });
    }
  }

  // Ensure last point is exactly on ground
  if (trajectory[trajectory.length - 1].y > 0) {
    trajectory.push({ x: state.x, y: 0 });
  }

  return { range: state.x, trajectory };
}

function TrajectoryChart({ points }: { points: { x: number; y: number }[] }) {
  if (points.length === 0) return null;
  const maxX = Math.max(...points.map((p) => p.x), 20) * 1.1; // 10% padding
  const maxY = Math.max(...points.map((p) => p.y), 15) * 1.1; // 10% padding
  const scaleX = 300 / maxX;
  const scaleY = 100 / maxY;
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scaleX} ${100 - p.y * scaleY}`)
    .join(' ');

  return (
    <div className="w-full h-[140px] bg-[#fdfdfd] rounded-3xl border border-border/60 p-6 relative overflow-visible flex items-end shadow-inner">
      <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <motion.path
          key={pathData}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          d={pathData}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="4 2"
        />
        <line x1="0" y1="100" x2="300" y2="100" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx={points[points.length-1].x * scaleX} cy={100 - points[points.length-1].y * scaleY} r="4" fill="var(--color-accent)" />
      </svg>
      <div className="absolute top-2 right-4 text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Profile Voo</div>
    </div>
  );
}

export default function App() {
  const [waterMl, setWaterMl] = useState<number>(660);
  const [pressurePsi, setPressurePsi] = useState<number>(65);
  const [angleDeg, setAngleDeg] = useState<number>(45);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const result = useMemo(() => simulateRocket(waterMl, pressurePsi, angleDeg), [waterMl, pressurePsi, angleDeg]);

  const explanations: Record<string, string> = {
    water: "Massa de reação. O ponto ideal para 2L é entre 600ml e 700ml (33% do volume).",
    pressure: "Energia potencial. Garrafas comuns suportam ~90psi, mas segurança em primeiro lugar!",
    angle: "Direção vetorial. 45° maximiza o alcance ignorando o arrasto excessivo em voos altos."
  };

  const applyPreset = (w: number, p: number, a: number) => {
    setWaterMl(w);
    setPressurePsi(p);
    setAngleDeg(a);
  };

  return (
    <div className="w-[400px] h-[820px] bg-[#ffffff] rounded-[60px] border-[12px] border-[#000000] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative flex flex-col p-[48px_36px] overflow-hidden">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-black tracking-tighter text-text-main mb-1">AeroPET <span className="text-accent">Pro</span></h1>
        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-[3px] opacity-60">High Precision Simulation</p>
      </header>

      <div className="space-y-8 flex-1">
        {/* Presets */}
        <div className="flex justify-between gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
          <button onClick={() => applyPreset(660, 65, 45)} className="px-4 py-2 bg-bg border border-border rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-accent hover:text-white transition-all">Balanced</button>
          <button onClick={() => applyPreset(500, 90, 42)} className="px-4 py-2 bg-bg border border-border rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-accent hover:text-white transition-all">High Velocity</button>
          <button onClick={() => applyPreset(750, 40, 50)} className="px-4 py-2 bg-bg border border-border rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-accent hover:text-white transition-all">Heavy Lift</button>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Beaker size={14} className="text-text-secondary" />
                <label className="text-[10px] font-black uppercase tracking-[1.5px] text-text-main">Volume (ml)</label>
              </div>
              <input 
                type="number" 
                value={waterMl} 
                onChange={(e) => setWaterMl(Number(e.target.value))}
                className="w-16 text-right font-bold text-accent text-sm outline-none bg-transparent"
              />
            </div>
            <input 
              type="range" min="0" max="1500" step="10" value={waterMl} 
              onChange={(e) => setWaterMl(Number(e.target.value))}
              className="w-full accent-accent h-1"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-text-secondary" />
                <label className="text-[10px] font-black uppercase tracking-[1.5px] text-text-main">Pressão (psi)</label>
              </div>
              <input 
                type="number" 
                value={pressurePsi} 
                onChange={(e) => setPressurePsi(Number(e.target.value))}
                className="w-16 text-right font-bold text-accent text-sm outline-none bg-transparent"
              />
            </div>
            <input 
              type="range" min="0" max="120" step="1" value={pressurePsi} 
              onChange={(e) => setPressurePsi(Number(e.target.value))}
              className="w-full accent-accent h-1"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Play size={14} className="text-text-secondary rotate-[-45deg]" />
                <label className="text-[10px] font-black uppercase tracking-[1.5px] text-text-main">Ângulo (°)</label>
              </div>
              <input 
                type="number" 
                value={angleDeg} 
                onChange={(e) => setAngleDeg(Number(e.target.value))}
                className="w-16 text-right font-bold text-accent text-sm outline-none bg-transparent"
              />
            </div>
            <input 
              type="range" min="0" max="90" step="1" value={angleDeg} 
              onChange={(e) => setAngleDeg(Number(e.target.value))}
              className="w-full accent-accent h-1"
            />
          </div>
        </div>

        <div className="relative">
          <TrajectoryChart points={result.trajectory} />
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border flex flex-col items-center gap-1">
        <span className="text-[10px] font-black text-text-secondary uppercase tracking-[3px] mb-2">Distance Engine</span>
        <motion.div key={result.range} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <div className="text-7xl font-black tracking-[-5px] leading-none text-text-main">
            {result.range.toFixed(2)}
          </div>
          <span className="text-xs text-text-secondary font-bold uppercase tracking-[4px] mt-2">METERS WALK</span>
        </motion.div>
      </div>
      
      <div className="absolute bottom-8 self-center h-1.5 w-32 bg-border/20 rounded-full" />
    </div>
  );
}
