import {drawPlanetIllustration} from './planet-illustrations.js?v=1';
import {Binary, Schwarzschild, clock, clockBodies, earth, jump, planets, rg, sampleRay, stepSurfaceFall, traceRay} from './physics.js?v=fullaudit2';
import {flight, stateAt} from './projectile-physics.js';
import {circularSpeed, referenceEllipse} from './satellite-physics.js?v=editorial1';
import {circularRate, hohmannRatio, targets, transfer} from './transfer-physics.js?v=energy';

const W=360, H=174, TAU=2*Math.PI;
const lime='#e0e95b', blue='#8ee2ff', copper='#ffa978', violet='#c79dfa';
const sky=Array.from({length:51},(_,i)=>[(i*151.73+3)%W,(i*83.29+8)%H,i%11===0?1.2:.55,i%3===0?.6:.25]);

function line(ctx,points,color,width=1,dashes=[]){
 ctx.beginPath();
 points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle=color;
 ctx.lineWidth=width;
 ctx.setLineDash(dashes);
 ctx.stroke();
 ctx.setLineDash([]);
}
function ellipse(ctx,x,y,rx,ry,rotation,color,width=1){
 ctx.beginPath();
 ctx.ellipse(x,y,rx,ry,rotation,0,TAU);
 ctx.strokeStyle=color;
 ctx.lineWidth=width;
 ctx.stroke();
}
function disc(ctx,x,y,r,color){
 ctx.beginPath();
 ctx.arc(x,y,r,0,TAU);
 ctx.fillStyle=color;
 ctx.fill();
}
function glow(ctx,x,y,r,color){
 ctx.save();
 ctx.shadowColor=color;
 ctx.shadowBlur=12;
 disc(ctx,x,y,r,color);
 ctx.restore();
}
function blackHole(ctx,x,y,r){
 ellipse(ctx,x,y,r*1.68,r*1.68,0,'#9b68d548');
 ellipse(ctx,x,y,r*1.27,r*1.27,0,'#b88ee6a0',1.3);
 disc(ctx,x,y,r,'#020309');
}
function arrow(ctx,x,y,dx,dy,color){
 const a=Math.atan2(dy,dx);
 line(ctx,[[x,y],[x+dx,y+dy]],color,1.8);
 line(ctx,[[x+dx-5*Math.cos(a-.55),y+dy-5*Math.sin(a-.55)],[x+dx,y+dy],[x+dx-5*Math.cos(a+.55),y+dy-5*Math.sin(a+.55)]],color,1.8);
}
function backdrop(ctx,tint){
 const wash=ctx.createRadialGradient(W*.42,H*.53,5,W*.42,H*.53,210);
 wash.addColorStop(0,tint);wash.addColorStop(1,'#0a101d');
 ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
 for(const [x,y,r,alpha] of sky){
  ctx.globalAlpha=alpha;disc(ctx,x,y,r,'#bcd8fb');
 }
 ctx.globalAlpha=1;
}
function sample(fn,count=120){
 return Array.from({length:count+1},(_,i)=>fn(i/count));
}
function follow(ctx,points,t,color,r=4){
 const index=Math.min(points.length-1,Math.round(t*(points.length-1)));
 const trail=points.slice(Math.max(0,index-15),index+1);
 line(ctx,trail,color,2);
 glow(ctx,...points[index],r,color);
}
function fallPreview(){
 let state=[120,0], elapsed=0;
 const heights=[state[0]];
 while(state[0]>0&&elapsed<8){
  state=stepSurfaceFall(state,.035).state;elapsed+=.035;heights.push(state[0]);
 }
 return (ctx,t)=>{
  const height=heights[Math.round(Math.min(1,t*1.27)*(heights.length-1))];
  drawPlanetIllustration(ctx,'earth',180,305,181);
  const platform=114;
  line(ctx,[[89,platform],[151,platform]],'#93b0cd',2);
  line(ctx,[[102,platform+1],[96,141]],'#6684a5',1.7);
  line(ctx,[[138,platform+1],[144,141]],'#6684a5',1.7);
  glow(ctx,120,platform-6,5,lime);
  arrow(ctx,106,platform-8,0,-27,blue);
  arrow(ctx,134,platform-8,0,27,copper);
  line(ctx,[[237,25],[237,130]],'#a8cde768',1,[3,5]);
  const y=130-height*.82;
  glow(ctx,237,y,5,lime);
  arrow(ctx,252,y,0,26,copper);
 };
}
function binaryPreview(pn){
 const model=new Binary(pn?{speed:.86,separation:34,inc:0}:{m2:.68,inc:0},pn);
 const paths=[[],[]], refs=[];
 for(let i=0;i<=800;i++){
  const [a,b]=model.positions();
  paths[0].push([180+a[0]*(pn?112:111),88-a[1]*(pn?84:82)]);
  paths[1].push([180+b[0]*(pn?112:111),88-b[1]*(pn?84:82)]);
  const [ref]=model.positions(model.newton,false);
  refs.push([180+ref[0]*112,88-ref[1]*84]);
  for(let j=0;j<5;j++)model.step(pn?.007:.0016);
 }
 return (ctx,t)=>{
  line(ctx,paths[0],pn?'#c89ff490':'#97cff07a',1.1);
  line(ctx,paths[1],pn?'#7f62a86f':'#a579588f',1.1);
  if(pn)line(ctx,refs,'#a1b7d388',1,[4,4]);
  line(ctx,[[175,88],[185,88]],'#e8f2ff91');
  line(ctx,[[180,83],[180,93]],'#e8f2ff91');
  follow(ctx,paths[0],t,pn?violet:blue,pn?4:5);
  follow(ctx,paths[1],t,copper,7);
 };
}
function jumpPreview(){
 const mars=planets.find(body=>body.id==='mars');
 const measurements=[jump(earth),jump(mars)];
 const floor=130;
 return (ctx,t)=>{
  drawPlanetIllustration(ctx,'earth',91,153,18);
  drawPlanetIllustration(ctx,'mars',269,153,18);
  measurements.forEach((measurement,i)=>{
   const x=91+i*178, color=i?copper:blue;
   const peak=floor-measurement.height_m*70;
   const elapsed=Math.min(1,t*1.14*measurements[1].flight_s/measurement.flight_s);
   line(ctx,[[x-58,floor+5],[x+58,floor+5]],'#a2b8d84a');
   line(ctx,[[x,peak],[x,floor]],color+'70',1,[3,4]);
   line(ctx,[[x-10,peak],[x+10,peak]],color+'a0');
   glow(ctx,x,floor-(floor-peak)*4*elapsed*(1-elapsed),4.5,color);
  });
 };
}
function projectilePreview(){
 const paths=[.42,.77,1.12].map(angle=>{
  const parameters={v:20,h:0,g:earth.g,m:1};
  const f=flight(parameters.v,angle,parameters.h,parameters.g);
  return sample(t=>{const p=stateAt(parameters,f,t*f.T);return [35+p.x*7,137-p.y*5.4];});
 });
 return (ctx,t)=>{
  for(const y of [42,74,106,137])line(ctx,[[29,y],[335,y]],'#55769644');
  for(const x of [35,95,155,215,275,335])line(ctx,[[x,22],[x,146]],'#55769632');
  line(ctx,paths[0],'#9bb2d16f',1,[4,5]);
  line(ctx,paths[2],'#9bb2d16f',1,[4,5]);
  line(ctx,paths[1],'#c1d654b0',1.4);
  follow(ctx,paths[1],t,lime,5);
  arrow(ctx,35,137,25,-23,blue);
 };
}
function satellitePreview(){
 const radius=earth.radius+850000;
 const points=referenceEllipse([radius,0,0,circularSpeed(850)*1000]).map(([x,y])=>[
  180+(x+.31*y)/radius*90,86+(.48*y-.16*x)/radius*74
 ]);
 return (ctx,t)=>{
  line(ctx,points.slice(128,257),'#86baa96f',1.3,[3,4]);
  const index=Math.round(t*256);
  if(index>=128)follow(ctx,points,t,lime,4.5);
  drawPlanetIllustration(ctx,'earth',180,86,45);
  line(ctx,points.slice(0,129),'#acc9a5bd',1.3);
  if(index<128)follow(ctx,points,t,lime,4.5);
 };
}
function transferPreview(){
 const [radius]=targets.Mars, speed=hohmannRatio(radius);
 const phase=transfer(radius,speed,0).aim, route=transfer(radius,speed,phase);
 const project=(x,y)=>[180+72*x,95-43*y];
 const points=sample(t=>{const p=route.position(route.duration*t);return project(p.x,p.y);});
 return (ctx,t)=>{
  ellipse(ctx,180,95,72,43,0,'#78b6db7f');
  ellipse(ctx,180,95,72*radius,43*radius,0,'#d386737f');
  line(ctx,points,'#b0ba607e',1.4,[4,4]);
  glow(ctx,180,95,9,'#ffcb7a');
  const days=route.duration*t, start=circularRate(1)*days, end=phase+circularRate(radius)*days;
  glow(ctx,...project(Math.cos(start),Math.sin(start)),4,blue);
  glow(ctx,...project(radius*Math.cos(end),radius*Math.sin(end)),5,copper);
  follow(ctx,points,t,lime,3);
 };
}
function schwarzschildPreview(){
 const model=new Schwarzschild({r0:12,speed:.95,inc:0}), points=[];
 for(let i=0;i<=850;i++){
  const [x,y]=model.position();points.push([180+8*x,90-4.6*y]);
  for(let j=0;j<4;j++) model.step(.12);
 }
 return (ctx,t)=>{
  for(const r of [24,40,82,113]){
   ellipse(ctx,180,90,r,r*.59,0,'#9175b24b');
  }
  line(ctx,points,'#b199dca8',1.2);
  blackHole(ctx,180,90,14);
  follow(ctx,points,t,lime,4);
 };
}
function lensPreview(){
 const rays=[6.7,9.3,13].flatMap(impact=>{
  const ray=traceRay(impact,43);
  return [-1,1].map(sign=>sample(t=>{
   const [x,y]=sampleRay(ray,t).position;
   return [147+x*3.5,87+sign*y*3.15];
  },150));
 });
 return (ctx,t)=>{
  for(const ray of rays){
   line(ctx,ray,'#90b7d580',1.25);
   follow(ctx,ray,t,blue,2.2);
  }
  blackHole(ctx,147,87,8);
 };
}
function clocksPreview(){
 const compact=clockBodies[2], rate=clock(compact,4*rg(compact.mass),1).rate;
 const earthRate=clock(earth,earth.radius,1).rate;
 function clockFace(ctx,x,color,t){
  const y=75;
  ellipse(ctx,x,y,40,40,0,color,1.35);
  for(let i=0;i<12;i++){
   const a=i/12*TAU;
   line(ctx,[[x+33*Math.cos(a),y+33*Math.sin(a)],[x+37*Math.cos(a),y+37*Math.sin(a)]],color);
  }
  const angle=t*TAU-Math.PI/2;
  arrow(ctx,x,y,29*Math.cos(angle),29*Math.sin(angle),color);
  disc(ctx,x,y,2.8,color);
 }
 return (ctx,t)=>{
  clockFace(ctx,102,blue,t*earthRate);
  clockFace(ctx,258,violet,t*rate);
  drawPlanetIllustration(ctx,'earth',102,142,12);
  blackHole(ctx,258,142,9);
  line(ctx,[[153,75],[206,75]],'#a8bfde75',1,[3,4]);
 };
}

const previews={
 surface:[fallPreview,'#142839',3.8,.39],
 binary:[()=>binaryPreview(false),'#192b3e',5.4,.24],
 jump:[jumpPreview,'#242738',3.9,.42],
 projectile:[projectilePreview,'#142b36',4.2,.48],
 satellite:[satellitePreview,'#172d45',5.8,.16],
 transfer:[transferPreview,'#223040',5.4,.49],
 pn:[()=>binaryPreview(true),'#251d40',6.2,.53],
 schwarzschild:[schwarzschildPreview,'#2a203c',6.1,.31],
 lens:[lensPreview,'#202945',4.8,.33],
 clocks:[clocksPreview,'#27203e',5.6,.54],
};

const motionText={
 uk:['Призупинити анімації','Відтворити анімації'],
 en:['Pause animations','Play animations'],
 it:['Metti in pausa le animazioni','Riproduci le animazioni'],
 es:['Pausar animaciones','Reproducir animaciones'],
};
let explicitMotion=null;
export function mountExperimentPreviews(grid,button,language){
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const labels=motionText[language]??motionText.en;
 const items=new Map();
 let frame=0,last=0,isPlaying=false;
 for(const canvas of grid.querySelectorAll('canvas[data-preview]')){
  const [create,tint,seconds,poster]=previews[canvas.dataset.preview];
  const ctx=canvas.getContext('2d');
  if(!ctx)continue;
  ctx.scale(2,2);
  const draw=create();
  const item={elapsed:0,visible:false,seconds,poster,paint(t){backdrop(ctx,tint);draw(ctx,t);}};
  items.set(canvas,item);
  item.paint(poster);
 }
 function schedule(){
  const active=isPlaying&&!document.hidden&&[...items.values()].some(item=>item.visible);
  if(!active){
   cancelAnimationFrame(frame);frame=0;last=0;
  }else if(!frame)frame=requestAnimationFrame(tick);
 }
 function tick(now){
  frame=0;
  const delta=last?Math.min(80,now-last):0;
  if(!last||now-last>=30){
   for(const item of items.values()){
    if(!item.visible)continue;
    item.elapsed+=delta;
    item.paint((item.elapsed/(item.seconds*1000)+item.poster)%1);
   }
   last=now;
  }
  schedule();
 }
 function sync(){
  isPlaying=explicitMotion??!preference.matches;
  button.textContent=labels[isPlaying?0:1];
  schedule();
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)items.get(entry.target).visible=entry.isIntersecting;
  schedule();
 });
 for(const canvas of items.keys())observer.observe(canvas);
 button.onclick=()=>{explicitMotion=!isPlaying;sync();};
 button.hidden=!items.size;
 document.addEventListener('visibilitychange',schedule);
 preference.addEventListener('change',sync);
 sync();
 return ()=>{
  isPlaying=false;
  observer.disconnect();
  cancelAnimationFrame(frame);
  button.onclick=null;
  button.hidden=true;
  document.removeEventListener('visibilitychange',schedule);
  preference.removeEventListener('change',sync);
 };
}
