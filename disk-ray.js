// Exact Schwarzschild null equation in areal Cartesian drawing coordinates,
// E = 1, rg = 1. Scalar RK4 avoids allocating vectors at every substep.
export function diskRayStep(y,h,b2,out=new Float64Array(6)){
 const [x,z,w,vx,vz,vw]=y,hh=h/2,k=-3*b2;
 const f1=k/Math.hypot(x,z,w)**5,ax=x*f1,az=z*f1,aw=w*f1;
 const x2=x+hh*vx,z2=z+hh*vz,w2=w+hh*vw,vx2=vx+hh*ax,vz2=vz+hh*az,vw2=vw+hh*aw;
 const f2=k/Math.hypot(x2,z2,w2)**5,ax2=x2*f2,az2=z2*f2,aw2=w2*f2;
 const x3=x+hh*vx2,z3=z+hh*vz2,w3=w+hh*vw2,vx3=vx+hh*ax2,vz3=vz+hh*az2,vw3=vw+hh*aw2;
 const f3=k/Math.hypot(x3,z3,w3)**5,ax3=x3*f3,az3=z3*f3,aw3=w3*f3;
 const x4=x+h*vx3,z4=z+h*vz3,w4=w+h*vw3,vx4=vx+h*ax3,vz4=vz+h*az3,vw4=vw+h*aw3;
 const f4=k/Math.hypot(x4,z4,w4)**5;
 out[0]=x+h*(vx+2*vx2+2*vx3+vx4)/6;out[1]=z+h*(vz+2*vz2+2*vz3+vz4)/6;out[2]=w+h*(vw+2*vw2+2*vw3+vw4)/6;
 out[3]=vx+h*(ax+2*ax2+2*ax3+x4*f4)/6;out[4]=vz+h*(az+2*az2+2*az3+z4*f4)/6;out[5]=vw+h*(aw+2*aw2+2*aw3+w4*f4)/6;
 return out;
}
export function traceDiskRay(init,{observer=90,outer=30,stepScale=1}={}){
 let state=new Float64Array(init.y),next=new Float64Array(6),crossings=0;
 for(let k=0;k<Math.ceil(2200/stepScale);k++){
  const r=Math.hypot(state[0],state[1],state[2]);
  if(r<2.005)return {status:'captured',state,crossings};
  if(r>observer*1.4&&state[0]*state[3]+state[1]*state[4]+state[2]*state[5]>0)return {status:'escaped',state,crossings};
  const h=stepScale*Math.min(.055*r,.1*r**1.5/Math.max(1,init.b));
  diskRayStep(state,h,init.b2,next);
  if(state[2]*next[2]<0){
   crossings++;
   // Locate the disk-plane event on the curved ray, rather than its chord.
   let lo=0,hi=h;const hit=new Float64Array(6);
   for(let j=0;j<20;j++){const mid=(lo+hi)/2;diskRayStep(state,mid,init.b2,hit);if(state[2]*hit[2]>0)lo=mid;else hi=mid;}
   diskRayStep(state,(lo+hi)/2,init.b2,hit);
   const R=Math.hypot(hit[0],hit[1]);
   if(R>=6&&R<=outer)return {status:'disk',state:hit,R,crossings};
  }
  const swap=state;state=next;next=swap;
 }
 return {status:'limit',state,crossings};
}
