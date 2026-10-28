import {warpedCube,latticeValues,latticeColor} from './cube-warp.js';
import {buildCube,cubeField,seedValues} from './cube-physics.js?v=warp1';
import {rateColor} from './geometry.js';
const L=(lang,uk,en)=>lang==='uk'?uk:en;
const cache=new Map();
function curvesFor(spec,extent,density){
 const key=JSON.stringify([spec,extent,density]);if(cache.has(key))return cache.get(key);
 const curves=buildCube(spec,extent,density);cache.set(key,curves);if(cache.size>8)cache.delete(cache.keys().next().value);return curves;
}
function visible(p,extent,cut){return p.every(v=>Math.abs(v)<=extent*1.005)&&!(cut&&p.every(v=>v>0));}
function frame(scene,e,flat,density){
 for(let axis=0;axis<3;axis++)for(const a of [-e,e])for(const b of [-e,e]){
  const ij=[0,1,2].filter(j=>j!==axis),p=[0,0,0],q=[0,0,0];p[axis]=-e;q[axis]=e;p[ij[0]]=q[ij[0]]=a;p[ij[1]]=q[ij[1]]=b;scene.line(p,q,'#6e87917a',1);
 }
 if(flat)for(let axis=0;axis<3;axis++)for(const a of seedValues(density,e))for(const b of seedValues(density,e)){
  const ij=[0,1,2].filter(j=>j!==axis),p=[0,0,0],q=[0,0,0];p[axis]=-e;q[axis]=e;p[ij[0]]=q[ij[0]]=a;p[ij[1]]=q[ij[1]]=b;scene.line(p,q,'#7891ae24',.6,true);
 }
 const origin=[-e,-e,-e];for(let j=0;j<3;j++){const end=origin.slice();end[j]=e*1.12;const colour=['#e4948c','#a4d593','#95b8ee'][j];scene.arrow(origin,end,colour);const q=scene.project(end);scene.text(['x','y','z'][j],q[0]+(j===0?18:9),q[1]+(j===0?17:-6),colour,10);}
}
function wireSphere(scene,centre,r,color){
 for(let axis=0;axis<3;axis++)scene.path(Array.from({length:65},(_,j)=>{const a=j*Math.PI/32,p=centre.slice(),ij=[0,1,2].filter(k=>k!==axis);p[ij[0]]+=r*Math.cos(a);p[ij[1]]+=r*Math.sin(a);return p;}),color,1.2);
}
function metricBall(scene,point,spec,r,display=p=>p){
 const f=cubeField(point,spec);if(!f.valid)return;
 // Inverse square root of the spatial metric: equal proper radii in a chart.
 const map=v=>{let q;if(spec.kind==='schwarzschild'){const d=v.reduce((s,x,i)=>s+x*f.n[i],0);q=v.map((x,i)=>x+(Math.sqrt(f.f)-1)*d*f.n[i]);}else q=v.map(x=>x/Math.sqrt(1+2*f.u));return display(q.map((x,i)=>point[i]+r*x));};
 for(let axis=0;axis<3;axis++)scene.path(Array.from({length:49},(_,j)=>{const a=j*Math.PI/24,v=[0,0,0],ij=[0,1,2].filter(k=>k!==axis);v[ij[0]]=Math.cos(a);v[ij[1]]=Math.sin(a);return map(v);}), '#f0d894',1.2);
 scene.sphere(display(point),3,'#ffe6a4');
}
function drawGeodesicCube(scene,{spec,extent,unit,probe,options,objects=[],tracks=[],selectedPoint=null,title=''},lang){
 scene.clear(extent);scene.S=Math.min(scene.W*.29,(scene.H-155)*.31)/extent*scene.zoom;scene.cy=(scene.H-110)*.5+15;
 frame(scene,extent,options.reference,options.density);
 const curves=curvesFor(spec,extent,options.density),groups=Array.from({length:24},()=>[]),min=spec.kind==='pn'?.95:0;
 for(const curve of curves)for(let j=1;j<curve.points.length;j++){
  const a=curve.points[j-1],b=curve.points[j];if(!visible(a.p,extent,options.cutaway)||!visible(b.p,extent,options.cutaway))continue;
  const index=Math.max(0,Math.min(23,Math.floor(((a.rate+b.rate)/2-min)/(1-min)*24)));
  groups[index].push([scene.project(a.p),scene.project(b.p)]);
 }
 const c=scene.ctx;for(let i=0;i<groups.length;i++){
  c.strokeStyle=rateColor(min+(1-min)*(i+.5)/24,min,1,.22);c.lineWidth=.8;c.beginPath();
  for(const [a,b] of groups[i]){c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}c.stroke();
 }
 // Physical overlays stay in simulation coordinates. Never re-warp history
 // with the current moving mass field: that makes old orbits wobble.
 for(const t of tracks){let segment=[];for(const p of t.points){if(visible(p,extent,false))segment.push(p);else{scene.path(segment,t.color,t.width||1.7);segment=[];}}scene.path(segment,t.color,t.width||1.7);}
 // Highlight an existing integrated curve. The dashed segment shares its
 // coordinate start and direction; it is only a Euclidean visual reference.
 const candidates=curves.filter(curve=>curve.axis===0&&curve.points.length>1);
 const selected=candidates.reduce((best,curve)=>{
  const score=q=>Math.hypot(q.start[1]-.27*extent,q.start[2]-.27*extent);
  return !best||score(curve)<score(best)?curve:best;
 },null);
 if(selected){
  const end=selected.start.slice();end[0]=extent;
   let segment=[];
  for(const point of selected.points){
   if(visible(point.p,extent,options.cutaway))segment.push(point.p);
   else{scene.path(segment,'#49e8ff',2.8);segment=[];}
  }
  scene.path(segment,'#49e8ff',2.8);
  // Draw the reference last so nearly coincident curves cannot hide it.
  scene.line(selected.start,end,'#ffffff',1.3,true);
  scene.sphere(selected.start,3,'#49e8ff');
 }
 if(spec.kind==='schwarzschild'){
  const radius=Math.max(spec.rs,spec.bodyRadius||0);
  if(radius<extent*1.65){wireSphere(scene,[0,0,0],radius,'#ddae858e');scene.label(spec.bodyRadius>spec.rs?L(lang,'Поверхня тіла','Body surface'):L(lang,'Горизонт','Horizon'),[0,0,radius],'#d7b395',-18);}
 }
 for(const o of objects){if(visible(o.position,extent,false)){scene.sphere(o.position,o.size||8,o.color,true);scene.label(o.label,o.position,o.color,-16);}}
 if(selectedPoint&&visible(selectedPoint,extent,false))scene.sphere(selectedPoint,4,'#f9e39e',true);
 if(options.probeVisible!==false){metricBall(scene,probe,spec,extent*.075);scene.label('P',probe,'#f2d597',-12);}
 const y=scene.H-94,x=18,w=Math.min(180,scene.W*.42);
 scene.text(L(lang,'Колір: dτ/dt нерухомого годинника','Colour: stationary-clock dτ/dt'),x,y-12,'#a8bbc8',9);
 for(let j=0;j<48;j++){c.fillStyle=rateColor(min+(1-min)*j/47,min,1);c.fillRect(x+j*w/48,y,w/48+1,5);}
 scene.text(min.toFixed(2),x,y+18,'#cda090',9);scene.text('1.00',x+w,y+18,'#92c9cb',9,'right');
 scene.text('x, y, z ∈ [−'+extent.toPrecision(3)+', +'+extent.toPrecision(3)+']',18,scene.H-48,'#8fa8b9',9);
 scene.text('1 '+L(lang,'од.','unit')+' = '+(unit/1000).toExponential(3)+' km',18,scene.H-33,'#8fa8b9',9);
 if(title)scene.text(title,18,54,'#c6d5e2',11);
 if(spec.kind==='schwarzschild'&&spec.rs>=extent*Math.sqrt(3))scene.text(L(lang,'Куб усередині горизонту: збільш масштаб.','Cube inside horizon: fit a larger scale.'),scene.W/2,scene.H*.45,'#e6aa88',11,'center');
 if(!selected)return null;
 const samples=selected.points.filter(point=>visible(point.p,extent,false));
 let deviation=0,pixels=0;
 for(const {p} of samples){
  deviation=Math.max(deviation,Math.hypot(p[1]-selected.start[1],p[2]-selected.start[2]));
  const a=scene.project(p),b=scene.project([p[0],selected.start[1],selected.start[2]]);
  pixels=Math.max(pixels,Math.hypot(a[0]-b[0],a[1]-b[1]));
 }
 return {deviation_m:deviation*unit,width_percent:100*deviation/(2*extent),screen_pixels:pixels};
}

function drawDeformedCube(scene,{spec,extent,unit,probe,options,objects=[],tracks=[],selectedPoint=null,title=''},lang){
 const gain=options.gain??(spec.kind==='pn'?160:8),density=options.density||5;
 scene.clear(extent);scene.S=Math.min(scene.W*.31,(scene.H-155)*.32)/extent*scene.zoom;scene.cy=(scene.H-110)*.5+15;
 frame(scene,extent,false,density);
 if(options.reference)for(let axis=0;axis<3;axis++)for(const a of latticeValues(density,extent))for(const b of latticeValues(density,extent)){
  const ij=[0,1,2].filter(j=>j!==axis),p=[0,0,0],q=[0,0,0];p[axis]=-extent;q[axis]=extent;p[ij[0]]=q[ij[0]]=a;p[ij[1]]=q[ij[1]]=b;scene.line(p,q,'#99abb66b',.9,true);
 }
 const key=JSON.stringify(['warp',spec,extent,density,gain]);let curves=cache.get(key);
 if(!curves){curves=warpedCube(spec,extent,density,gain);cache.set(key,curves);if(cache.size>8)cache.delete(cache.keys().next().value);}
 const min=spec.kind==='pn'?.99:.8,groups=Array.from({length:48},()=>[]);
 for(const curve of curves)for(let j=1;j<curve.points.length;j++){
  const a=curve.points[j-1],b=curve.points[j];if(!a.valid||!b.valid||!visible(a.source,extent,options.cutaway)||!visible(b.source,extent,options.cutaway))continue;
  const A=scene.project(a.p),B=scene.project(b.p),band=Math.max(0,Math.min(23,Math.floor(((a.rate+b.rate)/2-min)/(1-min)*24))),front=(A[2]+B[2])/2>0;
  groups[band+(front?24:0)].push([A,B]);
 }
 const c=scene.ctx;c.setLineDash([]);for(let depth=0;depth<2;depth++)for(let i=0;i<24;i++){
  c.strokeStyle=latticeColor(min+(1-min)*(i+.5)/24,min,depth?.9:.42);c.lineWidth=depth?1.65:1.05;c.beginPath();
  for(const [a,b] of groups[i+depth*24]){c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);}c.stroke();
 }
 // Physical overlays stay in simulation coordinates. Never re-warp history
 // with the current moving mass field: that makes old orbits wobble.
 for(const t of tracks){let segment=[];for(const p of t.points){if(visible(p,extent,false))segment.push(p);else{scene.path(segment,t.color,t.width||1.7);segment=[];}}scene.path(segment,t.color,t.width||1.7);}
 if(spec.kind==='schwarzschild'&&spec.rs<extent){
  for(let axis=0;axis<3;axis++){const ij=[0,1,2].filter(k=>k!==axis),pts=Array.from({length:65},(_,j)=>{const q=[0,0,0];q[ij[0]]=spec.rs*Math.cos(j*Math.PI/32);q[ij[1]]=spec.rs*Math.sin(j*Math.PI/32);return q;});scene.path(pts,'#e0b089',1.1);}
  scene.sphere([0,0,0],5,'#dbeaf1',true);scene.label(L(lang,'Чорна діра','Black hole'),[0,0,0],'#c4d7e6',-40);
 }
 for(const o of objects)if(visible(o.position,extent,false)){scene.sphere(o.position,o.size||8,o.color,true);scene.label(o.label,o.position,o.color,-16);}
 if(selectedPoint&&visible(selectedPoint,extent,false))scene.sphere(selectedPoint,4,'#f9e39e',true);
 if(options.probeVisible!==false){metricBall(scene,probe,spec,extent*.075);scene.label('P',probe,'#f2d597',-12);}
 const y=scene.H-94,x=18,w=Math.min(180,scene.W*.42);
 scene.text(L(lang,'Колір: dτ/dt нерухомого годинника','Colour: stationary-clock dτ/dt'),x,y-12,'#a8bbc8',9);
 for(let j=0;j<48;j++){c.fillStyle=latticeColor(min+(1-min)*j/47,min);c.fillRect(x+j*w/48,y,w/48+1,5);}
 scene.text('≤ '+min.toFixed(2),x,y+18,'#6eeeb0',9);scene.text('1.00',x+w,y+18,'#6e9ef0',9,'right');
 scene.text(L(lang,'Схема · фіксоване підсилення ×','Diagram · fixed amplification ×')+gain,18,scene.H-48,'#c3d5dc',9);
 scene.text('1 '+L(lang,'од.','unit')+' = '+(unit/1000).toExponential(3)+' km',18,scene.H-33,'#8fa8b9',9);
 if(title)scene.text(title,18,54,'#c6d5e2',11);
 if(spec.kind==='schwarzschild'&&spec.rs>=extent*Math.sqrt(3))scene.text(L(lang,'Куб усередині горизонту: збільш масштаб.','Cube inside horizon: fit a larger scale.'),scene.W/2,scene.H*.45,'#e6aa88',11,'center');
}
export function drawCube(scene,data,lang){
 if(data.options.mode==='geodesic')return drawGeodesicCube(scene,data,lang);
 drawDeformedCube(scene,data,lang);return null;
}
