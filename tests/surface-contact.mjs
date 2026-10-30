import assert from 'node:assert/strict';
import {stepSurfaceFall,G,earth} from '../physics.js';
for(const initialHeight of [1,10,100,100000]){
 const exactSpeed=Math.sqrt(2*G*earth.mass*initialHeight/(earth.radius*(earth.radius+initialHeight)));
 const times=[];
 for(const step of [.02,.007]){let state=[initialHeight,0],time=0,last;
 while(state[0]>0){last=stepSurfaceFall(state,step);state=last.state;time+=last.dt;}
 assert(last.impact);assert.equal(state[0],0);assert(last.dt<=step);
 assert(Math.abs(Math.abs(state[1])/exactSpeed-1)<1e-10);
 times.push(time);
 }
 assert(Math.abs(times[0]-times[1])<1e-8);
}
assert.equal(stepSurfaceFall([0,0],.02).dt,0);
console.log('Surface contact: energy-consistent impact speed and partition-independent contact time at 1m,10m,100m,100km.');
