export const G=6.67430e-11,C=299792458,AU=149597870700,DAY=86400,MSUN=1.32712440041279419e20/G,RSUN=695700000;
export const planets=[
 ['mercury','Меркурій','Mercury',3.30103e23,2439400,'#b9ad9c',false],['venus','Венера','Venus',4.86731e24,6051800,'#dec29a',false],['earth','Земля','Earth',5.97217e24,6371008.4,'#6da9e8',false],['mars','Марс','Mars',6.41691e23,3389500,'#d47c61',false],['jupiter','Юпітер','Jupiter',1.898125e27,69911000,'#d6b897',true],['saturn','Сатурн','Saturn',5.68317e26,58232000,'#ddce9d',true],['uranus','Уран','Uranus',8.68099e25,25362000,'#99d4db',true],['neptune','Нептун','Neptune',1.024092e26,24622000,'#658cd8',true]
].map(([id,uk,en,mass,radius,color,gas])=>({id,uk,en,mass,radius,color,gas,g:G*mass/radius**2}));
export const earth=planets[2];
export const clockBodies=[earth,{id:'sun',uk:'Сонце',en:'Sun',mass:MSUN,radius:RSUN,color:'#f3bf73'}, {id:'sgr',uk:'Стрілець A*',en:'Sagittarius A*',mass:4.297e6*MSUN,radius:0,color:'#cf9dea'},{id:'ton',uk:'TON 618',en:'TON 618',mass:10**10.82*MSUN,radius:0,color:'#ef936e'}];
export const norm=v=>Math.hypot(...v),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),scale=(v,k)=>v.map(x=>x*k),add=(a,b)=>a.map((v,i)=>v+b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=v=>scale(v,1/norm(v));
export const rg=m=>G*m/C**2,rs=m=>2*rg(m);
export function rk4(y,h,f){const a=f(y),b=f(y.map((v,i)=>v+h*a[i]/2)),c=f(y.map((v,i)=>v+h*b[i]/2)),d=f(y.map((v,i)=>v+h*c[i]));return y.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);}
export function rotateOrbit(v,inc=0,node=0){const i=inc*Math.PI/180,o=node*Math.PI/180;const x=v[0],y=v[1]*Math.cos(i)-v[2]*Math.sin(i),z=v[1]*Math.sin(i)+v[2]*Math.cos(i);return[x*Math.cos(o)-y*Math.sin(o),x*Math.sin(o)+y*Math.cos(o),z];}
export function surface(mass=50,height=0){const r=earth.radius+height,g=G*earth.mass/r**2;return {mass_kg:mass,height_m:height,radius_m:r,g_ms2:g,force_N:mass*g,barycenter_shift_m:mass*r/(earth.mass+mass),escape_ms:Math.sqrt(2*G*earth.mass/r)};}
export function jump(planet,mass=50,earthHeight=.5){const v0=Math.sqrt(2*earth.g*earthHeight),g=planet.g,vEsc=Math.sqrt(2*G*planet.mass/planet.radius),h=v0*v0/(2*g),hExact=planet.radius*v0*v0/(vEsc*vEsc-v0*v0);return {mass_kg:mass,planet:planet.id,g_ms2:g,weight_N:mass*g,v0_ms:v0,height_m:h,exact_height_m:hExact,flight_s:2*v0/g,energy_J:.5*mass*v0*v0,escape_ms:vEsc};}
export const clockReference=body=>body.radius||rs(body.mass);
export function clock(body,r,T=DAY,observer='static'){
 return clockReading(body,r,T,observer,r-clockReference(body));
}
export function clockAtHeight(body,h,T=DAY,observer='static'){
 return clockReading(body,clockReference(body)+h,T,observer,h);
}
function clockReading(body,r,T,observer,h){
 const Rg=rg(body.mass),s=2*Rg;let invalid='';if(r<body.radius)invalid='insideBody';else if(r<=s)invalid='insideHorizon';else if(observer==='orbit'&&r<6*Rg)invalid='unstableOrbit';
 const base={body:body.id,mass_kg:body.mass,radius_m:r,rs_m:s,height_m:h,reference_radius_m:clockReference(body),height_reference:body.radius?'surface':'event_horizon',observer};
 if(invalid)return {...base,valid:false,reason:invalid};
 // h/r preserves the lapse close to a large horizon; the rational deficit
 // preserves tiny time differences in weak fields without cancellation.
 const lapse=body.radius?(r-s)/r:h/r,x=(observer==='orbit'?3:2)*Rg/r;
 const alpha=Math.sqrt(observer==='orbit'?1-x:lapse),deficit=x/(1+alpha);
 return {...base,valid:true,r_over_rs:r/s,rate:alpha,rate_deficit:deficit,reference_s:T,proper_s:T*alpha,lost_s:T*deficit,hover_acceleration_ms2:G*body.mass/r**2/Math.sqrt(lapse),curvature_m4:48*Rg*Rg/r**6};
}
export class Binary {
 constructor({m1=1,m2=.5,distance=1,speed=1,inc=20,node=0,separation=100}={},pn=false){this.p={m1,m2,distance,speed,inc,node,separation};this.pn=pn;this.M=(m1+m2)*MSUN;this.nu=m1*m2/(m1+m2)**2;this.length=pn?separation*rg(this.M):distance*AU;this.time=Math.sqrt(this.length**3/(G*this.M));this.eps=pn?1/separation:0;this.y=[1,0,0,0,speed,0];this.newton=[...this.y];this.t=0;this.done=false;this.reason='';this.initial=this.invariants(this.y);this.history=[];this.record();}
 derivative(y,eps=this.eps){const x=y.slice(0,3),v=y.slice(3),r=norm(x),n=scale(x,1/r),v2=dot(v,v),q=dot(n,v),nu=this.nu;let a=scale(n,-1/(r*r));if(eps){const A=(4+2*nu)/r-(1+3*nu)*v2+1.5*nu*q*q;a=add(a,scale(add(scale(n,A),scale(v,(4-2*nu)*q)),eps/(r*r)));}return [...v,...a];}
 invariants(y){const x=y.slice(0,3),v=y.slice(3),r=norm(x),v2=dot(v,v),q=dot(x,v)/r,n=this.nu,e=this.eps;const energy=v2/2-1/r+e*(3*(1-3*n)*v2*v2/8+((3+n)*v2+n*q*q+1/r)/(2*r));const angular=norm(cross(x,v))*(1+e*((1-3*n)*v2/2+(3+n)/r));return {energy,angular};}
 step(h=.004){if(this.done)return;const r=norm(this.y.slice(0,3));h=Math.min(h,.012*r**1.5);const next=rk4(this.y,h,y=>this.derivative(y)),nr=norm(next.slice(0,3)),v2=dot(next.slice(3),next.slice(3));if(nr<.006){this.done=true;this.reason='closeEncounter';return;}if(this.pn&&Math.max(this.eps/nr,this.eps*v2)>.05){this.done=true;this.reason='pnLimit';return;}this.y=next;this.newton=rk4(this.newton,h,y=>this.derivative(y,0));this.t+=h;if(this.t>70){this.done=true;this.reason='complete';}if(this.history.length===0||this.t-this.history.at(-1).t>.025)this.record();}
 positions(y=this.y,includePN=this.pn){const {m1,m2,inc,node}=this.p,X1=m1/(m1+m2),X2=1-X1,x=y.slice(0,3),v=y.slice(3);const delta=includePN?this.nu*(X1-X2)*(dot(v,v)-1/norm(x))*this.eps/2:0;return [rotateOrbit(scale(x,X2+delta),inc,node),rotateOrbit(scale(x,-X1+delta),inc,node)];}
 record(){this.history.push({t:this.t,positions:this.positions(),reference:this.positions(this.newton,false)});if(this.history.length>1600)this.history.shift();}
 snapshot(){const r=norm(this.y.slice(0,3)),v=norm(this.y.slice(3)),[a,b]=this.positions(),invariants=this.invariants(this.y);return {time_s:this.t*this.time,m1_solar:this.p.m1,m2_solar:this.p.m2,radius_m:r*this.length,speed_ms:v*this.length/this.time,force_N:G*this.p.m1*this.p.m2*MSUN**2/(r*this.length)**2,x_m:a[0]*this.length,y_m:a[1]*this.length,z_m:a[2]*this.length,barycenter_x_m:(this.p.m1*a[0]+this.p.m2*b[0])/(this.p.m1+this.p.m2)*this.length,energy_specific_Jkg:invariants.energy*G*this.M/this.length,energy_residual:(invariants.energy-this.initial.energy)/Math.max(Math.abs(this.initial.energy),1e-10),angular_residual:(invariants.angular-this.initial.angular)/Math.max(this.initial.angular,1e-10),pn_parameter:Math.max(this.eps/r,this.eps*v*v),period_circular_s:2*Math.PI*this.time,positions:[a,b],scale_m:this.length};}
}
export class Schwarzschild {
 constructor({mass=4.297e6,r0=12,speed=1,radial=0,inc=25,node=0}={}){this.p={mass,r0,speed,radial,inc,node};this.length=rg(mass*MSUN);this.time=this.length/C;const betaT=speed/Math.sqrt(r0-2),betaR=radial,beta2=betaT**2+betaR**2;if(beta2>=1)throw new Error('superluminal');const gamma=1/Math.sqrt(1-beta2),A=1-2/r0;this.E=gamma*Math.sqrt(A);this.L=gamma*r0*betaT;this.y=[r0,gamma*betaR*Math.sqrt(A),0,0];this.tau=0;this.done=false;this.reason='';this.history=[];this.record();}
 derivative([r,w,phi,T]){return[w,-1/r**2+this.L**2/r**3-3*this.L**2/r**4,this.L/r**2,this.E/(1-2/r)];}
 step(h=.1){if(this.done)return;const r=this.y[0];h=Math.min(h,.015*r**1.5,.1*(r-2)/Math.max(.1,Math.abs(this.y[1])));const next=rk4(this.y,h,y=>this.derivative(y));if(next[0]<=2.002){this.done=true;this.reason='horizon';return;}if(next[0]>500){this.done=true;this.reason='escape';return;}this.y=next;this.tau+=h;if(this.tau>7000){this.done=true;this.reason='complete';}if(!this.history.length||this.tau-this.history.at(-1).tau>.5)this.record();}
 position(){return rotateOrbit([this.y[0]*Math.cos(this.y[2]),this.y[0]*Math.sin(this.y[2]),0],this.p.inc,this.p.node);}
 record(){this.history.push({tau:this.tau,t:this.y[3],phi:this.y[2],position:this.position()});if(this.history.length>2600)this.history.shift();}
 snapshot(){const [r,w,phi,T]=this.y,A=1-2/r,invariant=w*w+A*(1+this.L*this.L/r**2),pos=this.position(),alpha=A/this.E;return {mass_solar:this.p.mass,radius_m:r*this.length,r_rg:r,time_s:T*this.time,proper_s:this.tau*this.time,rate:alpha,speed_c:Math.sqrt(Math.max(0,1-A/this.E**2)),x_m:pos[0]*this.length,y_m:pos[1]*this.length,z_m:pos[2]*this.length,energy_invariant:this.E,angular_invariant:this.L,constraint_error:(invariant-this.E**2)/(this.E**2),curvature_m4:48/(r**6*this.length**4),position:pos};}
}
export function flamm(R){return R>=2?2*Math.sqrt(2*(R-2)):NaN;}
export function nullInitial(camera,direction){const r=norm(camera),n=scale(camera,1/r),d=unit(direction),dr=dot(d,n),p=add(scale(n,dr),scale(add(d,scale(n,-dr)),1/Math.sqrt(1-2/r)));const L=cross(camera,p);return {y:[...camera,...p],L,b:norm(L),b2:dot(L,L)};}
export function nullStep(y,h,b2){return rk4(y,h,a=>{const r=norm(a.slice(0,3)),f=-3*b2/r**5;const dy=[a[3],a[4],a[5],a[0]*f,a[1]*f,a[2]*f];if(a.length>6)dy.push(1/(1-2/r));return dy;});}
export function nullConstraint(y,b2){const r=norm(y.slice(0,3));return dot(y.slice(3,6),y.slice(3,6))-1-2*b2/r**3;}
export function traceRay(b=7,maxR=150,step=.025){
 const R=maxR,x=-Math.sqrt(R*R-b*b),pos=[x,b,0],n=scale(pos,1/R),tangent=[-n[1],n[0],0],w=-Math.sqrt(1-(1-2/R)*b*b/(R*R)),p=add(scale(n,w),scale(tangent,-b/R));
 let y=[...pos,...p,0],path=[pos],pathTimes=[0],pathAffine=[0],affine=0,error=0,minR=R;const b2=b*b;let status='limit';
 for(let i=0;i<22000;i++){
  const r=norm(y.slice(0,3));let h=Math.min(step*r,.08*r**1.5/Math.max(b,1));if(r<2.5)h=Math.min(h,.15*(r-2)/Math.max(1,norm(y.slice(3,6))));
  y=nullStep(y,h,b2);affine+=h;const nr=norm(y.slice(0,3));minR=Math.min(minR,nr);error=Math.max(error,Math.abs(nullConstraint(y,b2)));
  if(i%2===0){path.push(y.slice(0,3));pathTimes.push(y[6]);pathAffine.push(affine);}
  if(nr<=2.002){status='captured';break;}if(nr>R&&dot(y.slice(0,3),y.slice(3,6))>0){status='escaped';break;}
 }
 if(pathAffine.at(-1)!==affine){path.push(y.slice(0,3));pathTimes.push(y[6]);pathAffine.push(affine);}
 return {path,pathTimes,pathAffine,y,status,impact_rg:b,closest_rg:minR,constraint_error:error,deflection_rad:status==='escaped'?Math.atan2(y[4],y[3]):null,affine};
}
export function sampleRay(ray,fraction){const target=Math.max(0,Math.min(1,fraction))*ray.affine;let a=0,b=ray.pathAffine.length-1;while(b-a>1){const m=Math.floor((a+b)/2);if(ray.pathAffine[m]<target)a=m;else b=m;}const u=(target-ray.pathAffine[a])/(ray.pathAffine[b]-ray.pathAffine[a]||1);return {position:ray.path[a].map((v,i)=>v+u*(ray.path[b][i]-v)),time_rg:ray.pathTimes[a]+u*(ray.pathTimes[b]-ray.pathTimes[a]),affine:target};}
export function ntFlux(R){if(R<=6)return 0;const u=Math.sqrt(R),a=Math.sqrt(3),b=Math.sqrt(6);return Math.max(0,(u-b-a/2*Math.log((u-a)/(u+a)*(b+a)/(b-a)))/(R**2.5*(R-3)));}
export function frequencyShift(R,Lz,observerR){return Math.sqrt(1-3/R)/(Math.sqrt(1-2/observerR)*(1+Lz/R**1.5));}
