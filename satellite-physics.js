import {G, earth, rk4} from './physics.js?v=fullaudit2';

export const mu = G * earth.mass;
export const radius = earth.radius;
export const reentryHeight = 100_000;
export const duration = 21_600;
export const initialOptions = {
 height: [120, 2000, 1, 250], speed: [3, 13, .001, 7.76],
 mass: [20, 2000, 1, 100], area: [.1, 4, .1, 1],
 inclination: [0, 180, 1, 42], node: [0, 360, 1, 0],
};
export const circularSpeed = heightKm => Math.sqrt(mu / (radius + heightKm * 1000)) / 1000;

export function orbitalElements([x,y,vx,vy]){
 const r = Math.hypot(x,y), speed = Math.hypot(vx,vy);
 const energy = speed**2 / 2 - mu/r, momentum = x*vy-y*vx;
 const eccentricity = Math.sqrt(Math.max(0,1 + 2*energy*momentum**2/mu**2));
 const perigee = momentum**2 / (mu*(1+eccentricity)) - radius;
 const apogee = energy < 0 ? -mu/(2*energy)*(1+eccentricity)-radius : null;
 return {speed, energy, eccentricity, perigee, apogee};
}

// For tangential initial velocity the start is an apsis. The sign of e
// places the focus on the correct side when starting at apogee.
export function referenceEllipse(initialState){
 const [x,y,vx,vy]=initialState;
 const r=Math.hypot(x,y), speed=Math.hypot(vx,vy);
 const signedEccentricity=r*speed**2/mu-1;
 if(Math.abs(signedEccentricity)>=1)return [];
 const a=r/(1-signedEccentricity);
 const b=a*Math.sqrt(1-signedEccentricity**2);
 const phase=Math.atan2(y,x), c=Math.cos(phase), s=Math.sin(phase);
 return Array.from({length:257},(_,index)=>{
  const anomaly=2*Math.PI*index/256;
  const u=a*(Math.cos(anomaly)-signedEccentricity), v=b*Math.sin(anomaly);
  return [u*c-v*s,u*s+v*c];
 });
}

export function orbitalReadout(state){
 const orbit=orbitalElements(state);
 return {altitude:(Math.hypot(state[0],state[1])-radius)/1000,speed:orbit.speed/1000,perigee:orbit.perigee/1000,apogee:orbit.apogee===null?null:orbit.apogee/1000};
}

// U.S. Standard Atmosphere (1976), NASA-HDBK-1001 Table A-6-3.
export const atmosphereTable=[
 [100,5.6040e-7],[120,2.2220e-8],[140,3.8310e-9],[160,1.2330e-9],
 [180,5.1940e-10],[200,2.5410e-10],[300,1.9160e-11],[400,2.8030e-12],
 [500,5.2150e-13],[600,1.1370e-13],[800,1.1360e-14],[1000,3.5610e-15],
];
export const dragCoefficient=2.2;
export function atmosphericDensity(altitudeKm){
 const h=Math.max(atmosphereTable[0][0],altitudeKm);
 let i=1;
 while(i<atmosphereTable.length-1&&h>atmosphereTable[i][0])i++;
 const [h0,r0]=atmosphereTable[i-1], [h1,r1]=atmosphereTable[i];
 return r0*(r1/r0)**((h-h0)/(h1-h0));
}

export function orbitFrame(inclination,node){
 const rad=Math.PI/180, i=inclination*rad, n=node*rad;
 const p=[Math.cos(n),Math.sin(n),0];
 const q=[-Math.sin(n)*Math.cos(i),Math.cos(n)*Math.cos(i),Math.sin(i)];
 return ([x,y])=>p.map((v,k)=>x*v+y*q[k]);
}

export function simulateSatellite({height,speed,mass,area,atmosphere}){
 const startRadius=radius+height*1000, cutoff=radius+reentryHeight;
 const coefficient=atmosphere==='standard'?0.5*dragCoefficient*area/mass:0;
 // A spherical gravity field and isotropic drag keep the orbit planar.
 // The viewer rotates that exact solution into Earth-centred 3D axes.
 function derivative([x,y,vx,vy]){
  const r=Math.hypot(x,y), gravity=-mu/r**3;
  const resistance=coefficient?coefficient*atmosphericDensity((r-radius)/1000)*Math.hypot(vx,vy):0;
  return [vx,vy,gravity*x-resistance*vx,gravity*y-resistance*vy];
 }
 let state=[startRadius,0,0,speed*1000], time=0, angle=0, outcome='bound';
 const initial=orbitalElements(state), points=[{time,state}];
 while(time<duration){
  let step=Math.min(4,duration-time), next=rk4(state,step,derivative);
  const r=Math.hypot(next[0],next[1]);
  const boundary=r<=cutoff;
  if(boundary){
   let lo=0,hi=step;
   for(let i=0;i<20;i++){
    const mid=(lo+hi)/2;
    const [x,y]=rk4(state,mid,derivative);
    if(Math.hypot(x,y)<cutoff)hi=mid;else lo=mid;
   }
   step=(lo+hi)/2;next=rk4(state,step,derivative);
   outcome='reentry';
  }
  angle+=Math.atan2(state[0]*next[1]-state[1]*next[0],state[0]*next[0]+state[1]*next[1]);
  state=next;time+=step;points.push({time,state});
  if(boundary)break;
 }
 const final=orbitalElements(state);
 if(outcome==='bound'&&final.energy>=0)outcome='unbound';
 return {points,time,initial,final,outcome,turns:angle/(2*Math.PI)};
}
