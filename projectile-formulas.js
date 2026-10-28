// TeX is rendered locally to native MathML: no CDN or font request is needed.
export const theoryEquations = [
 [String.raw`\mathbf r_0=(0,h_0)`,String.raw`\mathbf v_0=v_0(\cos\alpha,\sin\alpha)`],
 [String.raw`\mathbf F_g=-mg\,\hat{\mathbf y}`,String.raw`m\frac{d^2x}{dt^2}=0\quad\Rightarrow\quad a_x=0`,String.raw`m\frac{d^2y}{dt^2}=-mg\quad\Rightarrow\quad a_y=-g`],
 [String.raw`\mathbf J=\int\mathbf F_{\mathrm{net}}\,dt=\Delta\mathbf p=m\mathbf v_0`,String.raw`J=\overline F\Delta t`,String.raw`v_0=\frac{\overline F\Delta t}{m}`],
 [String.raw`\overline F_{\mathrm{hand},x}=\frac{mv_0\cos\alpha}{\Delta t}`,String.raw`\overline F_{\mathrm{hand},y}=\frac{mv_0\sin\alpha}{\Delta t}+mg`,String.raw`\overline F_{\mathrm{hand}}=\sqrt{\overline F_{\mathrm{hand},x}^2+\overline F_{\mathrm{hand},y}^2}`],
 [String.raw`\alpha_{\mathrm{rad}}=\alpha_{\mathrm{deg}}\frac{\pi}{180}`,String.raw`v_{0x}=v_0\cos\alpha,\quad v_{0y}=v_0\sin\alpha`,String.raw`v_x(t)=v_{0x},\quad v_y(t)=v_{0y}-gt`,String.raw`x(t)=v_{0x}t`,String.raw`y(t)=h_0+v_{0y}t-\frac{gt^2}{2}`,String.raw`v(t)=\sqrt{v_x^2+v_y^2}`],
 [String.raw`t=\frac{x}{v_0\cos\alpha}`,String.raw`y(x)=h_0+x\tan\alpha-\frac{gx^2}{2v_0^2\cos^2\alpha}`,String.raw`\cos\alpha\ne0`],
 [String.raw`0=v_0\sin\alpha-gt_{\uparrow}`,String.raw`t_{\uparrow}=\frac{v_0\sin\alpha}{g}`,String.raw`H=h_0+\frac{v_0^2\sin^2\alpha}{2g}`],
 [String.raw`0=h_0+v_{0y}T-\frac{gT^2}{2}`,String.raw`T=\frac{v_{0y}+\sqrt{v_{0y}^2+2gh_0}}{g}`,String.raw`L=v_{0x}T`,String.raw`v_y(T)=-\sqrt{v_{0y}^2+2gh_0}`,String.raw`v(T)=\sqrt{v_0^2+2gh_0}`],
 [String.raw`h_0=0:\quad T=\frac{2v_0\sin\alpha}{g}`,String.raw`L=\frac{v_0^2\sin(2\alpha)}{g}`,String.raw`L_{\max}=\frac{v_0^2}{g},\quad\alpha_*=45^\circ`,String.raw`h_0\ge0:\quad\alpha_*=\arctan\frac{v_0}{\sqrt{v_0^2+2gh_0}}`],
 [String.raw`K(t)=\frac{mv^2(t)}2,\quad U(t)=mgy(t)`,String.raw`E_0=\frac{mv_0^2}2+mgh_0`,String.raw`K(t)+U(t)=E_0`,String.raw`v^2(t)=v_0^2+2g\bigl[h_0-y(t)\bigr]`],
 [],
 [String.raw`h_0,H,L\ll R_{\oplus}`,String.raw`R_{\oplus}\approx6.37\times10^6\,\mathrm m`]
];

export function workedEquations(p,f,format) {
 const n=(x,d=3)=>format(x,d).replace(',', '{,}'), a=n(p.angle,0)+String.raw`^\circ`;
 const unit=(s)=>String.raw`\,\mathrm{${s}}`;
 const m=unit('m'),sec=unit('s'),v=unit('m/s'),acc=unit('m/s^2'),N=unit('N'),J=unit('J');
 const E0=p.m*p.v*p.v/2+p.m*p.g*p.h;
 const initial=[`m=${n(p.m)}${unit('kg')}`,`h_0=${n(p.h)}${m}`,String.raw`\alpha=${a}=${n(p.a,6)}${unit('rad')}`,`g=${n(p.g)}${acc}`];
 if(p.impulse) initial.push(String.raw`J=\overline F\Delta t`,String.raw`J=${n(p.F)}\times${n(p.dt)}`,String.raw`J=${n(p.F*p.dt)}\,\mathrm{N\,s}`,String.raw`v_0=\frac Jm=\frac{${n(p.F*p.dt)}}{${n(p.m)}}=${n(p.v)}${v}`);
 else initial.push(`v_0=${n(p.v)}${v}`);
 const rows=[initial,
  [String.raw`v_{0x}=${n(p.v)}\cos(${a})=${n(f.vx)}${v}`,String.raw`v_{0y}=${n(p.v)}\sin(${a})=${n(f.vy)}${v}`],
  [String.raw`t_{\uparrow}=\frac{${n(f.vy)}}{${n(p.g)}}=${n(f.up)}${sec}`,String.raw`H=${n(p.h)}+\frac{${n(f.vy)}^2}{2\times${n(p.g)}}`,String.raw`H=${n(f.H)}${m}`],
  [String.raw`\begin{aligned}D_y&=v_{0y}^2+2gh_0\\&=${n(f.vy)}^2\\&\quad+2\times${n(p.g)}\times${n(p.h)}\\&=${n(f.vy*f.vy+2*p.g*p.h)}\end{aligned}`,String.raw`T=\frac{${n(f.vy)}+\sqrt{${n(f.vy*f.vy+2*p.g*p.h)}}}{${n(p.g)}}`,String.raw`T=${n(f.T)}${sec}`,String.raw`L=${n(f.vx)}\times${n(f.T)}`,String.raw`L=${n(f.L)}${m}`,String.raw`\begin{aligned}D_v&=v_0^2+2gh_0\\&=${n(p.v)}^2\\&\quad+2\times${n(p.g)}\times${n(p.h)}\\&=${n(p.v*p.v+2*p.g*p.h)}\end{aligned}`,String.raw`v(T)=\sqrt{D_v}=${n(f.impact)}${v}`],
  [String.raw`|\mathbf F_g|=mg=${n(p.m)}\times${n(p.g)}`,String.raw`|\mathbf F_g|=${n(p.m*p.g)}${N}`,String.raw`\begin{aligned}E_0&=\frac{${n(p.m)}\times${n(p.v)}^2}{2}\\&\quad+${n(p.m)}\times${n(p.g)}\times${n(p.h)}\end{aligned}`,String.raw`E_0=${n(E0)}${J}`],
  [String.raw`\alpha_*=\arctan\frac{v_0}{\sqrt{D_v}}`,String.raw`\alpha_*=\arctan\frac{${n(p.v)}}{\sqrt{${n(p.v*p.v+2*p.g*p.h)}}}`,String.raw`\alpha_*=${n(f.optimal,2)}^\circ`]
 ];
 if(p.impulse){const x=p.m*f.vx/p.dt,y=p.m*f.vy/p.dt+p.m*p.g;
  rows.push([String.raw`\overline F_{\mathrm{hand},x}=\frac{${n(p.m)}\times${n(f.vx)}}{${n(p.dt)}}=${n(x)}${N}`,String.raw`\overline F_{\mathrm{hand},y}=\frac{${n(p.m)}\times${n(f.vy)}}{${n(p.dt)}}+${n(p.m*p.g)}`,String.raw`\overline F_{\mathrm{hand},y}=${n(y)}${N}`,String.raw`|\overline{\mathbf F}_{\mathrm{hand}}|=\sqrt{${n(x)}^2+${n(y)}^2}`,String.raw`|\overline{\mathbf F}_{\mathrm{hand}}|=${n(Math.hypot(x,y))}${N}`]);
 }
 return rows;
}

export function currentEquations(p,f,s,format){
 const n=(x,d=3)=>format(x,d).replace(',', '{,}');
 const residual=(s.K+s.U-s.E0).toExponential(2).split('e');
 return [String.raw`t=${n(s.t)}\,\mathrm s`,String.raw`x=${n(f.vx)}\times${n(s.t)}=${n(s.x)}\,\mathrm m`,String.raw`\begin{aligned}y&=${n(p.h)}+${n(f.vy)}\times${n(s.t)}\\&\quad-\frac{${n(p.g)}\times${n(s.t)}^2}{2}\end{aligned}`,String.raw`y=${n(s.y)}\,\mathrm m`,String.raw`v_x=${n(s.vx)}\,\mathrm{m/s}`,String.raw`v_y=${n(f.vy)}-${n(p.g)}\times${n(s.t)}`,String.raw`v_y=${n(s.vy)}\,\mathrm{m/s}`,String.raw`v=\sqrt{v_x^2+v_y^2}=${n(s.v)}\,\mathrm{m/s}`,String.raw`K=${n(s.K)}\,\mathrm J`,String.raw`U=${n(s.U)}\,\mathrm J`,String.raw`K+U=${n(s.K+s.U)}\,\mathrm J`,String.raw`E_0=${n(s.E0)}\,\mathrm J`,String.raw`(K+U)-E_0=${residual[0]}\times10^{${Number(residual[1])}}\,\mathrm J`];
}
