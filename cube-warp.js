// A shared, explicitly illustrative display map. It never enters metric,
// orbit, light-ray or clock calculations. All lengths use fixed grid units.
import {cubeField} from './cube-physics.js?v=palette2';
export function warpPoint(q,spec,extent,gain){
 const sources=spec.kind==='pn'?spec.bodies:[{rg:spec.rs/2,position:[0,0,0]}];
 let total=0;const vector=[0,0,0],soft=.08*extent,range=1.2*extent;
 for(const b of sources){
  const d=q.map((v,i)=>v-b.position[i]),r2=d.reduce((sum,v)=>sum+v*v,0);
  const w=Math.max(0,gain)*b.rg/Math.sqrt(r2+soft*soft)*Math.exp(-r2/(range*range));
  total+=w;for(let i=0;i<3;i++)vector[i]+=w*d[i];
 }
 if(total===0)return q.slice();
 const factor=.82*(-Math.expm1(-total))/total;
 return q.map((v,i)=>v-factor*vector[i]);
}
export function latticeValues(density,extent){return Array.from({length:density},(_,i)=>-extent+2*extent*i/(density-1));}
export function warpedCube(spec,extent,density,gain){
 const values=latticeValues(density,extent),curves=[],steps=(density-1)*16;
 for(let axis=0;axis<3;axis++)for(const a of values)for(const b of values){
  const indices=[0,1,2].filter(i=>i!==axis),points=[];
  for(let k=0;k<=steps;k++){
   const q=[0,0,0];q[axis]=-extent+2*extent*k/steps;q[indices[0]]=a;q[indices[1]]=b;
   const field=cubeField(q,spec);points.push({source:q,p:warpPoint(q,spec,extent,gain),valid:field.valid,rate:field.rate});
  }
  curves.push({axis,points});
 }
 return curves;
}
export function latticeColor(rate,min,alpha=1){
 const t=Math.max(0,Math.min(1,(1-rate)/(1-min)));
 return `rgba(${Math.round(43-9*t)},${Math.round(102+135*t)},${Math.round(232-110*t)},${alpha})`;
}
