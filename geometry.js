import {G,C,rg,norm} from './physics.js?v=fullaudit2';

// All arguments are physical SI values. Exterior Schwarzschild, static observers.
export function schwarzField(mass,r){
 const s=2*rg(mass);if(!(r>s))return {valid:false,rs:s};
 const f=1-s/r;return {valid:true,rs:s,rate:Math.sqrt(f),radialStretch:1/Math.sqrt(f),curvature:12*s*s/r**6};
}
// Positive branch, translated to z(outer)=0. Rationalization retains weak fields.
export function flammHeight(r,s,outer){
 if(r<s||outer<s||s<0)return NaN;
 return 2*Math.sqrt(s)*(r-outer)/(Math.sqrt(r-s)+Math.sqrt(outer-s)||1);
}
export function weakField(point,bodies){
 let u=0;for(const body of bodies){const d=norm(point.map((v,i)=>v-body.position[i]));if(d===0)return {valid:false,u:Infinity};u+=G*body.mass/(C*C*d);}
 return {valid:Number.isFinite(u)&&u<=.05,u,rate:1-u,spatialFactor:1+2*u};
}
export function orbitPlane(v,inc=0,node=0){const i=inc*Math.PI/180,o=node*Math.PI/180,x=v[0]*Math.cos(o)+v[1]*Math.sin(o),y=-v[0]*Math.sin(o)+v[1]*Math.cos(o);return [x,y*Math.cos(i)+v[2]*Math.sin(i),-y*Math.sin(i)+v[2]*Math.cos(i)];}
export function rateColor(rate,min=0,max=1,alpha=1){const f=Math.max(0,Math.min(1,(rate-min)/(max-min)));const a=[235,143,104],b=[113,211,211];return `rgba(${a.map((v,i)=>Math.round(v+(b[i]-v)*f)).join(',')},${alpha})`;}
