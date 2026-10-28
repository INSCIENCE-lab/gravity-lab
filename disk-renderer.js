import {nullInitial,unit,cross,add,scale,frequencyShift,ntFlux,nullConstraint} from './physics.js';
import {traceDiskRay} from './disk-ray.js?v=disk3';

export function diskCamera({inclination=82,observer=90,outer=30,width=512,height=320,zoom=1}={}){
 const i=inclination*Math.PI/180,origin=[0,observer*Math.sin(i),observer*Math.cos(i)],forward=scale(unit(origin),-1);
 // North (+z) is up: the old camera was rolled by 180 degrees.
 const right=[-1,0,0],up=unit(cross(right,forward)),aspect=width/height;
 const span=Math.max(outer*1.14,aspect*(outer*Math.cos(i)+6))/observer/zoom;
 return {origin,forward,right,up,span,aspect,width,height};
}
export function diskPixelRay(camera,x,y){
 const {origin,forward,right,up,span,aspect,width,height}=camera;
 return nullInitial(origin,add(forward,add(scale(right,(2*x/width-1)*span),scale(up,(1-2*y/height)*span/aspect))));
}
// Identical solver in a worker or cooperative UI-thread slices. Display mapping
// follows geodesic intersection and g^4 weighting; no painted lensing arcs.
export async function renderDisk(data,{signal,onProgress=()=>{},yieldControl=()=>new Promise(resolve=>setTimeout(resolve,0)),timeBudgetMs=12}={}){
 const checkAbort=()=>{if(signal?.aborted)throw new DOMException('Rendering cancelled','AbortError');};
 checkAbort();onProgress(0);await yieldControl();checkAbort();let sliceStart=performance.now();
 const {width=512,height=320,observer=90,outer=30,exposure=1,map='intensity',job=0,antialias=true,stepScale=1}=data;
 const camera=diskCamera({...data,width,height}),image=new Uint8ClampedArray(width*height*4),kinds=new Uint8Array(width*height);
 let maxError=0,hits=0,captured=0,limits=0,rays=0,secondaryHits=0;
 const sample=(x,y,count=false)=>{
  const init=diskPixelRay(camera,x,y),hit=traceDiskRay(init,{observer,outer,stepScale});rays++;
  let rgb=[7,11,21],kind=0;
  if(hit.status==='disk'){
   kind=1;if(count){hits++;if(hit.crossings>1)secondaryHits++;}
   maxError=Math.max(maxError,Math.abs(nullConstraint(hit.state,init.b2)));
   const g=frequencyShift(hit.R,init.L[2],observer),intensity=ntFlux(hit.R)/.00011458947*g**4;
   if(map==='shift'){const z=Math.min(1,Math.max(0,(g-.45)/1.15));rgb=[230*(1-z)+60*z,95+100*(1-Math.abs(z-.5)*2),65*(1-z)+245*z];}
   else {const b=1-Math.exp(-exposure*intensity);rgb=[255*b**.65,240*b**.95,205*b**1.7];}
  }else if(hit.status==='captured'){kind=2;if(count)captured++;rgb=[1,2,5];}
  else if(hit.status==='escaped'){
   const d=unit(Array.from(hit.state.slice(3))),u=Math.atan2(d[1],d[0]),v=Math.acos(d[2]),grid=Math.abs(Math.sin(22*u))*Math.abs(Math.sin(22*v)),stars=Math.sin(317*u+911*v)*Math.sin(821*u-223*v);
   rgb=grid<.018?[12,21,35]:[7,11,21];if(stars>.997)rgb=[100,114,139];
  }else if(count)limits++;
  return {rgb,kind};
 };
 const cooperate=async progress=>{checkAbort();if(performance.now()-sliceStart>=timeBudgetMs){onProgress(progress);await yieldControl();checkAbort();sliceStart=performance.now();}};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(x%16===0)await cooperate(.8*(y*width+x)/(width*height));
  const {rgb,kind}=sample(x+.5,y+.5,true),p=y*width+x;kinds[p]=kind;image.set([...rgb.map(Math.round),255],4*p);
 }
 // Supersample silhouettes and sharp image features; smooth regions keep one ray.
 // Average display colours; measurement fields use the centre ray only.
 if(antialias){const base=image.slice();for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  if(x%32===0)await cooperate(.8+.2*(y*width+x)/(width*height));
  const p=y*width+x,edge=[p-1,p+1,p-width,p+width].some(q=>kinds[p]!==kinds[q]||Math.abs(base[4*p]-base[4*q])>40);
  if(!edge)continue;
  const avg=[0,0,0];for(const dx of [.25,.75])for(const dy of [.25,.75]){const {rgb}=sample(x+dx,y+dy);for(let c=0;c<3;c++)avg[c]+=rgb[c]/4;}image.set([...avg.map(Math.round),255],4*p);
 }}
 checkAbort();onProgress(1);return {job,progress:1,width,height,pixels:image.buffer,hits,captured,maxError,limits,rays,secondaryHits};
}
