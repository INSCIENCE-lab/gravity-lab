import {radius} from './satellite-physics.js?v=editorial1';

const W=720,H=540,D=320,HALF=D/2;
const textureURL=new URL('./assets/earth-global.webp',import.meta.url);
let texturePromise;
function loadTexture(){
 return texturePromise??=new Promise(resolve=>{
  const image=new Image();
  image.onload=()=>{
   const canvas=document.createElement('canvas');
   canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
   resolve(c.getImageData(0,0,canvas.width,canvas.height));
  };
  image.onerror=()=>resolve(null);
  image.src=textureURL;
 });
}

export const defaultCamera = () => ({yaw:-1.15,pitch:.55,zoom:1,fit:true});
export function cameraBasis(yaw,pitch){
 const cs=Math.cos(yaw),sn=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 return [[-sn,cs,0],[-sp*cs,-sp*sn,cp],[cp*cs,cp*sn,sp]];
}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const equator=Array.from({length:121},(_,i)=>{
 const a=i*Math.PI/60;return [radius*Math.cos(a),radius*Math.sin(a),0];
});

export function frameProjection(basis,points,zoom){
 let left=-1.25*radius,right=1.25*radius,bottom=-1.25*radius,top=1.25*radius;
 for(const p of points){
  const x=dot(basis[0],p),y=dot(basis[1],p);
  left=Math.min(left,x);right=Math.max(right,x);
  bottom=Math.min(bottom,y);top=Math.max(top,y);
 }
 const scale=points.length?Math.min((W-72)/(right-left),(H-90)/(top-bottom)):H*.46/(2.3*radius);
 const px=scale*zoom, midX=(left+right)/2,midY=(bottom+top)/2;
 const project=p=>[W/2+px*(dot(basis[0],p)-midX),H/2-px*(dot(basis[1],p)-midY),dot(basis[2],p)];
 return {px,project};
}

export function createOrbitView(canvas,refresh){
 const c=canvas.getContext('2d');
 const globe=document.createElement('canvas');
 globe.width=globe.height=D;
 const g=globe.getContext('2d');
 const buffer=g.createImageData(D,D), data=buffer.data;
 let texture,globeKey='';

 function paintGlobe(basis,cam){
  const key=cam.yaw+','+cam.pitch;
  if(!texture||key===globeKey)return;
  const [right,up,near]=basis;
  for(let row=0;row<D;row++)for(let col=0;col<D;col++){
   const u=(col+.5-HALF)/HALF,v=(HALF-row-.5)/HALF;
   const w2=1-u*u-v*v;
   const k=4*(row*D+col);
   if(w2<0){data[k+3]=0;continue;}
   const w=Math.sqrt(w2);
   const x=u*right[0]+v*up[0]+w*near[0];
   const y=u*right[1]+v*up[1]+w*near[1];
   const z=v*up[2]+w*near[2];
   const tx=Math.floor((.5+Math.atan2(y,x)/(2*Math.PI))*texture.width)%texture.width;
   const ty=Math.min(texture.height-1,Math.floor((.5-Math.asin(Math.max(-1,Math.min(1,z)))/Math.PI)*texture.height));
   const j=4*(ty*texture.width+tx),light=.57+.43*w;
   data[k]=texture.data[j]*light;data[k+1]=texture.data[j+1]*light;data[k+2]=texture.data[j+2]*light;data[k+3]=255;
  }
  g.putImageData(buffer,0,0);globeKey=key;
 }

 function draw({camera,frame,preview,active,reference,state,axis,eq,clipLabel,unbound}){
  const basis=cameraBasis(camera.yaw,camera.pitch);
  const track=preview.map(frame),visited=active.map(frame),ellipse=reference.map(frame);
  const {px,project}=frameProjection(basis,camera.fit&&ellipse.length?track.concat(ellipse):[],camera.zoom);
  const [earthX,earthY]=project([0,0,0]),r=radius*px;
  c.clearRect(0,0,W,H);
  function path(points,front,color,width,dash=[]){
   const points2=points.map(project);c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);
   let connected=false;
   for(let j=1;j<points2.length;j++){
    const a=points2[j-1],b=points2[j];
    if((a[2]>=0)!==front&&(b[2]>=0)!==front){connected=false;continue;}
    const mix=(a[2]>=0)!==(b[2]>=0)?a[2]/(a[2]-b[2]):null;
    const edge=mix===null?null:[a[0]+mix*(b[0]-a[0]),a[1]+mix*(b[1]-a[1])];
    const start=(a[2]>=0)===front?a:edge, end=(b[2]>=0)===front?b:edge;
    if(!connected)c.moveTo(start[0],start[1]);
    c.lineTo(end[0],end[1]);connected=(b[2]>=0)===front;
   }
   c.stroke();c.setLineDash([]);
  }
  const projected=project(frame(state));
  const outside=projected[0]<-7||projected[0]>W+7||projected[1]<-7||projected[1]>H+7||
   (unbound&&Math.hypot(state[0],state[1])*px>W);
  const dotProbe=()=>{
   if(outside)return;
   c.beginPath();c.arc(projected[0],projected[1],5,0,Math.PI*2);
   c.fillStyle='#e0eb54';c.fill();c.strokeStyle='#080e1c';c.lineWidth=1.4;c.stroke();
  };
  const spin=[[0,0,-radius*1.22],[0,0,radius*1.22]];
  const drawHalf=front=>{
   path(equator,front,'#8ab6db',1,[5,4]);
   path(spin,front,'#79a3bd',1);
   path(ellipse,front,'#72849d',1,[3,4]);
   path(track,front,'#93b2ceaa',1.45);
   path(visited,front,'#dee945',2.4);
  };
  drawHalf(false);
  if(projected[2]<0)dotProbe();
  paintGlobe(basis,camera);
  if(texture)c.drawImage(globe,earthX-r,earthY-r,2*r,2*r);
  else {
   const fill=c.createRadialGradient(earthX-r*.25,earthY-r*.28,r*.12,earthX,earthY,r);
   fill.addColorStop(0,'#84b4d9');fill.addColorStop(1,'#163e69');
   c.fillStyle=fill;c.beginPath();c.arc(earthX,earthY,r,0,Math.PI*2);c.fill();
  }
  // Only the part of the spin axis outside the Earth is visible.
  const visibleAxis=[[0,0,radius],[0,0,radius*1.22]];
  path(visibleAxis,true,'#a3c8e3',1);
  path(equator,true,'#c5daec',1,[5,4]);
  path(ellipse,true,'#72849d',1,[3,4]);
  path(track,true,'#93b2ceaa',1.45);path(visited,true,'#dee945',2.4);
  if(projected[2]>=0)dotProbe();
  const pos=project(spin[1]);c.fillStyle='#b2cde3';c.font='15px system-ui,sans-serif';
  c.fillText(axis,pos[0]+7,pos[1]-4);
  c.fillText(eq,18,29);
  if(outside&&unbound){c.fillStyle='#d9e66a';c.fillText(clipLabel,18,H-20);}
  return outside;
 }
 let closed=false;
 loadTexture().then(value=>{if(!closed){texture=value;refresh();}});
 return {draw,close(){closed=true;}};
}
