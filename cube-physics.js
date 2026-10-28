// Coordinate lengths are in a fixed grid unit. Spatial geodesics belong to a
// frozen t=const slice; they are distinct from photon/worldline geodesics.
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.hypot(...a);
export function cubeField(x,spec){
 const r=norm(x);
 if(spec.kind==='schwarzschild'){
  const s=spec.rs,cut=Math.max(s*(1+1e-10),spec.bodyRadius||0);
  if(s===0&&cut===0)return {valid:true,r,f:1,n:r?x.map(v=>v/r):[0,0,0],metric:[[1,0,0],[0,1,0],[0,0,1]],rate:1,volumeFactor:1};
  if(r<=cut)return {valid:false};
  const f=1-s/r,n=x.map(v=>v/r),A=s/(r-s);
  const metric=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>(i===j?1:0)+A*n[i]*n[j]));
  return {valid:true,r,f,n,metric,rate:Math.sqrt(f),volumeFactor:1/Math.sqrt(f)};
 }
 let u=0;const grad=[0,0,0];
 for(const b of spec.bodies){const d=x.map((v,i)=>v-b.position[i]),R=norm(d);if(R<1e-12)return {valid:false};u+=b.rg/R;for(let i=0;i<3;i++)grad[i]-=b.rg*d[i]/R**3;}
 if(u>.05)return {valid:false,u};const q=1+2*u;
 return {valid:true,u,grad,metric:[[q,0,0],[0,q,0],[0,0,q]],rate:1-u,volumeFactor:q**1.5};
}
export function metricNorm(v,field){return dot(v,field.metric.map(row=>dot(row,v)));}
export function spatialAcceleration(x,v,spec){
 const r=Math.hypot(x[0],x[1],x[2]),v2=v[0]*v[0]+v[1]*v[1]+v[2]*v[2];
 if(spec.kind==='schwarzschild'){
  if(spec.rs===0&&!(spec.bodyRadius>0))return [0,0,0];
  if(r<=Math.max(spec.rs*(1+1e-10),spec.bodyRadius||0))return null;
  const f=1-spec.rs/r,vr=(v[0]*x[0]+v[1]*x[1]+v[2]*x[2])/r,a=spec.rs/(r*r*r)*(vr*vr/(2*f)-(v2-vr*vr));
  return [x[0]*a,x[1]*a,x[2]*a];
 }
 let u=0,gx=0,gy=0,gz=0;
 for(const b of spec.bodies){const dx=x[0]-b.position[0],dy=x[1]-b.position[1],dz=x[2]-b.position[2],R=Math.hypot(dx,dy,dz);if(R<1e-12)return null;u+=b.rg/R;const q=-b.rg/(R*R*R);gx+=q*dx;gy+=q*dy;gz+=q*dz;}
 if(u>.05)return null;const vg=v[0]*gx+v[1]*gy+v[2]*gz,q=1+2*u;
 return [(v2*gx-2*v[0]*vg)/q,(v2*gy-2*v[1]*vg)/q,(v2*gz-2*v[2]*vg)/q];
}
function step(y,h,spec){
 const d=y=>{const a=spatialAcceleration(y.slice(0,3),y.slice(3),spec);return a?[...y.slice(3),...a]:null;};
 const add=(a,b,k)=>a.map((v,i)=>v+k*b[i]);
 const a=d(y);if(!a)return null;const b=d(add(y,a,h/2));if(!b)return null;
 const c=d(add(y,b,h/2));if(!c)return null;const e=d(add(y,c,h));if(!e)return null;
 return y.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+e[i])/6);
}
function sample(x,spec){
 const r=Math.hypot(x[0],x[1],x[2]);
 if(spec.kind==='schwarzschild'){const valid=spec.rs===0&&!(spec.bodyRadius>0)||r>Math.max(spec.rs*(1+1e-10),spec.bodyRadius||0);return {r,valid,rate:valid?Math.sqrt(spec.rs===0?1:1-spec.rs/r):0};}
 let u=0,nearest=Infinity;for(const b of spec.bodies){const d=Math.hypot(x[0]-b.position[0],x[1]-b.position[1],x[2]-b.position[2]);u+=b.rg/d;nearest=Math.min(nearest,d);}return {u,nearest,valid:u<=.05,rate:1-u};
}
export function spatialCurve(start,direction,spec,{extent=1,stepSize=extent/48,maxLength=extent*5}={}){
 const field=cubeField(start,spec);if(!field.valid)return [];
 const speed=Math.sqrt(metricNorm(direction,field));let y=[...start,...direction.map(v=>v/speed)],length=0;
 const points=[{p:start.slice(),v:y.slice(3),rate:field.rate,length:0}];
 for(let i=0;i<1300&&length<maxLength;i++){
  const f=sample(y,spec);if(!f.valid)break;
  let h=stepSize;
  if(spec.kind==='schwarzschild'&&(spec.rs>0||spec.bodyRadius>0)){
   const cut=Math.max(spec.rs*1.02,spec.bodyRadius||0),gap=f.r-cut;if(gap<extent*1e-5)break;
   h=Math.min(h,.18*gap/Math.max(.05,norm(y.slice(3))));
  }else if(spec.kind==='pn')h=Math.min(h,.08*f.nearest);
  let next=step(y,h,spec);for(let retry=0;!next&&retry<6;retry++){h/=2;next=step(y,h,spec);}
  if(!next||h<stepSize*1e-6||next.some(v=>!Number.isFinite(v)))break;
  const nf=sample(next,spec);if(!nf.valid)break;
  length+=h;y=next;points.push({p:y.slice(0,3),v:y.slice(3),rate:nf.rate,length});
  if(y.slice(0,3).some(v=>Math.abs(v)>extent*1.002))break;
 }
 return points;
}
export function seedValues(density,extent){return (density===3?[-.5,0,.5]:density===4?[-.8,-.27,.27,.8]:density===7?[-.86,-.5,-.2,0,.2,.5,.86]:[-.82,-.25,0,.25,.82]).map(x=>x*extent);}
export function buildCube(spec,extent,density=5){
 const values=seedValues(density,extent),curves=[];
 for(let axis=0;axis<3;axis++)for(const a of values)for(const b of values){
  const indices=[0,1,2].filter(i=>i!==axis),start=[0,0,0],v=[0,0,0];start[axis]=-extent;start[indices[0]]=a;start[indices[1]]=b;v[axis]=1;
  curves.push({axis,start,points:spatialCurve(start,v,spec,{extent})});
 }
 return curves;
}
export function cubeProbeValues(point,spec,unit){
 const f=cubeField(point,spec),base={cube_probe_x_m:point[0]*unit,cube_probe_y_m:point[1]*unit,cube_probe_z_m:point[2]*unit,cube_probe_valid:f.valid};
 if(!f.valid)return base;
 return {...base,cube_probe_static_rate:f.rate,cube_volume_factor:f.volumeFactor,
  cube_length_x_factor:Math.sqrt(f.metric[0][0]),cube_length_y_factor:Math.sqrt(f.metric[1][1]),cube_length_z_factor:Math.sqrt(f.metric[2][2]),
  cube_gamma_xx:f.metric[0][0],cube_gamma_yy:f.metric[1][1],cube_gamma_zz:f.metric[2][2],cube_gamma_xy:f.metric[0][1],cube_gamma_xz:f.metric[0][2],cube_gamma_yz:f.metric[1][2]};
}
