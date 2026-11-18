import {G, earth, rk4} from './physics.js?v=fullaudit2';

const mu = G * earth.mass;
export const radius = earth.radius;
export const reentryHeight = 100_000;
export const duration = 21_600;
export const initialOptions = {
 height: [120, 2000, 1, 250], speed: [3, 13, .001, 7.76],
 mass: [20, 2000, 1, 100], area: [.1, 4, .1, 1],
 drag: [0, 100, 1, 0],
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

export function orbitalReadout(state){
 const orbit=orbitalElements(state);
 return {altitude:(Math.hypot(state[0],state[1])-radius)/1000,speed:orbit.speed/1000,perigee:orbit.perigee/1000,apogee:orbit.apogee===null?null:orbit.apogee/1000};
}

export function simulateSatellite({height,speed,mass,area,drag},keepSamples=true){
 const startRadius=radius+height*1000, cutoff=radius+reentryHeight, outer=6*radius;
 const coefficient=0.5*2.2*area*drag/mass;
 // Deliberately simple, stationary exponential atmosphere. The multiplier
 // varies its density for comparison, rather than predicting any specific day.
 function derivative([x,y,vx,vy]){
  const r=Math.hypot(x,y), gravity=-mu/r**3;
  const density=2.8e-10*Math.exp(-(Math.max(r,cutoff)-radius-200_000)/35_000);
  const resistance=coefficient*density*Math.hypot(vx,vy);
  return [vx,vy,gravity*x-resistance*vx,gravity*y-resistance*vy];
 }
 let state=[startRadius,0,0,speed*1000], time=0, angle=0, widest=startRadius, outcome='bound';
 const initial=orbitalElements(state), points=keepSamples?[{time,state}]:[];
 while(time<duration){
  let step=Math.min(4,duration-time), next=rk4(state,step,derivative);
  const r=Math.hypot(next[0],next[1]);
  const boundary=r<=cutoff?cutoff:r>=outer&&orbitalElements(next).energy>=0?outer:0;
  if(boundary){
   let lo=0,hi=step;
   for(let i=0;i<20;i++){
    const mid=(lo+hi)/2;
    const [x,y]=rk4(state,mid,derivative);
    if((Math.hypot(x,y)<boundary)===(boundary===cutoff))hi=mid;else lo=mid;
   }
   step=(lo+hi)/2;next=rk4(state,step,derivative);
   outcome=boundary===cutoff?'reentry':'escape';
  }
  angle+=Math.atan2(state[0]*next[1]-state[1]*next[0],state[0]*next[0]+state[1]*next[1]);
  state=next;time+=step;widest=Math.max(widest,Math.hypot(state[0],state[1]));
  if(keepSamples)points.push({time,state});
  if(boundary)break;
 }
 const final=orbitalElements(state);
 if(outcome==='bound'&&final.energy>=0)outcome='unbound';
 return {points,time,widest,initial,final,outcome,turns:angle/(2*Math.PI)};
}

export function testedDragLimit(params){
 let largest=null;
 for(let drag=0;drag<=100;drag+=5){
  const run=simulateSatellite({...params,drag},false);
  if(run.outcome==='bound'&&run.turns>=1)largest=drag;
 }
 return largest;
}
