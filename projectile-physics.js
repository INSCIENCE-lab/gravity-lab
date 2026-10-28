// Local uniform gravity; launch begins on release, air resistance is excluded.
export function flight(v,a,h,g){
 const vx=Math.abs(Math.cos(a))<1e-12?0:v*Math.cos(a);
 const vy=Math.abs(Math.sin(a))<1e-12?0:v*Math.sin(a);
 const T=(vy+Math.sqrt(vy*vy+2*g*h))/g;
 return {vx,vy,T,L:vx*T,H:h+vy*vy/(2*g),up:vy/g,
  impact:Math.sqrt(v*v+2*g*h),optimal:Math.atan(v/Math.sqrt(v*v+2*g*h))*180/Math.PI};
}
export function stateAt(p,f,t){
 const x=f.vx*t,y=Math.max(0,p.h+f.vy*t-p.g*t*t/2),vy=f.vy-p.g*t;
 const v=Math.hypot(f.vx,vy),K=p.m*v*v/2,U=p.m*p.g*y;
 return {t,x,y,vx:f.vx,vy,v,K,U,E0:p.m*p.v*p.v/2+p.m*p.g*p.h,Fg:p.m*p.g};
}
