import {MSUN,norm,scale,rg,sampleRay} from './physics.js?v=pause1';
import {flammHeight,schwarzField,weakField,orbitPlane,rateColor} from './geometry.js';

const L=(lang,uk,en)=>lang==='uk'?uk:en;
const short=n=>Math.abs(n)>=1e5||Math.abs(n)<.001?n.toExponential(2):n.toFixed(3);

function legend(scene,lang,min=0,max=1){
 const c=scene.ctx,x=18,y=scene.H-64,w=Math.min(190,scene.W*.43);
 scene.text(L(lang,'Колір: темп нерухомого годинника','Colour: stationary clock rate'),x,y-12,'#a8bbc8',9);
 for(let j=0;j<50;j++){c.fillStyle=rateColor(min+(max-min)*j/49,min,max);c.fillRect(x+j*w/50,y,w/50+1,5);}
 scene.text(min.toFixed(2),x,y+18,'#cda090',9);scene.text(max.toFixed(2)+' dτ/dt',x+w,y+18,'#92c9cb',9,'right');
}
function dial(scene,point,rate,label,annotation=null){
 const [x,y]=scene.project(point),c=scene.ctx;c.fillStyle='#0a1425e8';c.strokeStyle='#9cb9c3';c.lineWidth=1;
 c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle=rateColor(rate);c.lineWidth=2;
 c.beginPath();c.moveTo(x,y);c.lineTo(x+7*Math.sin(rate*Math.PI*2),y-7*Math.cos(rate*Math.PI*2));c.stroke();
 const [tx,ty]=annotation||[x+15,y-3];if(annotation){c.strokeStyle='#76949d88';c.lineWidth=.8;c.beginPath();c.moveTo(x,y+11);c.lineTo(tx+45,ty-8);c.stroke();}scene.text(label,tx,ty,'#b9cdd3',10);scene.text('dτ/dt = '+rate.toFixed(3),tx,ty+15,rateColor(rate),10);
}
function ring(scene,R,Z,color,width=1){scene.path(Array.from({length:97},(_,j)=>{const a=j/96*Math.PI*2;return[R*Math.cos(a),R*Math.sin(a),Z];}),color,width);}

function flammMesh(scene,s,outer,inner=s*1.001,compact=false){
 if(!(outer>s&&inner<outer))return false;
 const z=r=>flammHeight(r,s,outer),rmin=Math.max(inner,s*1.0001),nr=compact?16:30,na=compact?12:24;
 const radii=Array.from({length:nr+1},(_,j)=>rmin+(outer-rmin)*(j/nr)**1.65);
 // Radius and height use the same scale: this is the isometric spatial slice.
 for(const R of radii){ring(scene,R,z(R),rateColor(Math.sqrt(1-s/R),0,1,.62),compact?.7:.95);}
 for(let j=0;j<na;j++){const a=j/na*Math.PI*2;for(let k=1;k<radii.length;k++){const R=radii[k],Q=radii[k-1];scene.line([Q*Math.cos(a),Q*Math.sin(a),z(Q)],[R*Math.cos(a),R*Math.sin(a),z(R)],rateColor(Math.sqrt(1-s/((R+Q)/2)),0,1,.46),compact?.6:.85);}}
 if(inner<=s*1.01){ring(scene,s,z(s),'#e5ab7f',1.8);}
 return true;
}

export function drawSchwarzGeometry(scene,{mass,unit,outer,model=null,ray=null,others=[],fraction=0},lang){
 const length=rg(mass*MSUN),factor=length/unit,s=2*factor;
 scene.clear(outer*.87);scene.cy=scene.H*.38;
 if(!flammMesh(scene,s,outer)){
  scene.text(L(lang,'Горизонт виходить за межі цієї сітки.','The horizon exceeds this grid.'),scene.W/2,scene.H*.45,'#e1b69c',13,'center');
  scene.text(L(lang,'Натисни «Підібрати масштаб».','Select “Fit scale”.'),scene.W/2,scene.H*.45+25,'#9bb6c2',12,'center');return;
 }
 const z=R=>flammHeight(R,s,outer),map=p=>{const R=norm(p)*factor;return[p[0]*factor,p[1]*factor,z(R)];};
 if(s<outer)scene.text(L(lang,'Горизонт: ','Horizon: ')+'r_s = '+short(s*unit/1000)+' km',18,55,'#d8a788',10);
 for(const [r,color,label] of [[3,'#d9a17a','3r_g'],[6,'#abb5d8','ISCO · 6r_g']])if(r*factor<outer){ring(scene,r*factor,z(r*factor),color+'99',1.1);scene.text(label,18,r===3?74:92,color,10);}
 if(model){
  const projected=model.history.map(h=>{const R=norm(h.position);return[R*Math.cos(h.phi),R*Math.sin(h.phi),0];}).filter(p=>norm(p)*factor<=outer);
  scene.path(projected.map(map),'#e5ed9c',2.1);
  const R=model.y[0],phi=model.y[2];if(R*factor<=outer){const p=map([R*Math.cos(phi),R*Math.sin(phi),0]);scene.sphere(p,6,'#BDC71E',true);scene.label(L(lang,'Пробне тіло','Test body'),p,'#e6edb1',-15);}
 }else if(ray){
  for(const r of others){const pts=r.path.filter(p=>norm(p)*factor>s&&norm(p)*factor<=outer);scene.path(pts.map(map),'#84b8c475',1);}
  scene.path(ray.path.filter(p=>norm(p)*factor>s&&norm(p)*factor<=outer).map(map),'#f3d58e',2.2);
  const p=sampleRay(ray,fraction).position;if(norm(p)*factor<=outer&&norm(p)*factor>s)scene.sphere(map(p),4,'#ffedb3',true);
 }
 for(const [ratio,angle] of [[1.5,.7],[5,2.1]]){const R=s*ratio;if(R<outer*.9){const a=Math.sqrt(1-s/R);dial(scene,[R*Math.cos(angle),R*Math.sin(angle),z(R)],a,'r = '+(ratio*2)+'r_g',ratio===1.5?[20,scene.H-145]:[scene.W-155,scene.H-145]);}}
 legend(scene,lang);scene.text(L(lang,'Висота: вкладення просторового зрізу','Height: embedding of a spatial slice'),scene.W<600?18:scene.W-18,scene.H-(scene.W<600?108:54),'#8eaab7',9,scene.W<600?'left':'right');
 scene.text('1 '+L(lang,'од.','unit')+' = '+short(unit/1000)+' km',scene.W<600?18:scene.W-18,scene.H-(scene.W<600?92:39),'#8eaab7',9,scene.W<600?'left':'right');
}

export function drawBinaryGeometry(scene,model,reference,lang){
 const {unit,outer}=reference,factor=model.length/unit,positions=model.positions().map(v=>scale(orbitPlane(v,model.p.inc,model.p.node),factor));
 const bodies=positions.map((v,i)=>({mass:(i?model.p.m2:model.p.m1)*MSUN,position:scale(v,unit)}));
 const field=(x,y)=>weakField([x*unit,y*unit,0],bodies),height=f=>-30*f.u;
 scene.clear(outer*.92);scene.cy=scene.H*(scene.W<600?.35:.41);
 // This weak-field height map is explicitly schematic, not an isometric embedding.
 const extent=outer,n=36;
 for(let j=0;j<=n;j++)for(let direction=0;direction<2;direction++){
  let previous=null;
  for(let k=0;k<=n*2;k++){const a=-extent+2*extent*j/n,b=-extent+extent*k/n,x=direction?a:b,y=direction?b:a,f=field(x,y);
   if(!f.valid){previous=null;continue;}const point=[x,y,height(f)];if(previous)scene.line(previous,point,rateColor(f.rate,.95,1,.65),.85);previous=point;
  }
 }
 const colours=['#BDC71E','#b3a1e0'];
 for(let i=0;i<2;i++){
  const trail=model.history.map(h=>scale(orbitPlane(h.positions[i],model.p.inc,model.p.node),factor)).filter(v=>Math.abs(v[0])<extent&&Math.abs(v[1])<extent);
  scene.path(trail.map(v=>[v[0],v[1],.025]),colours[i]+'bb',1.6);
  const p=positions[i];if(Math.abs(p[0])<=extent&&Math.abs(p[1])<=extent){scene.line([p[0],p[1],0],[p[0],p[1],-1.35],'#bdc4b766',1,true);scene.sphere([p[0],p[1],.06],11,colours[i],true);scene.label('m'+(i+1)+' = '+(i?model.p.m2:model.p.m1)+' M☉',[p[0],p[1],.06],colours[i],-18);}
 }
 scene.barycenter([0,0,.025],'CM (1PN)');
 for(const p of [[0,-extent*.6],[extent*.65,extent*.4]]){const f=field(...p);if(f.valid)dial(scene,[...p,height(f)],f.rate,L(lang,'Координатний спокій','Coordinate rest'),p[0]===0?[20,scene.H-145]:[scene.W-155,scene.H-145]);}
 legend(scene,lang,.95,1);scene.text(L(lang,'Висота: −30 U/c² · схема поля','Height: −30 U/c² · field diagram'),scene.W<600?18:scene.W-18,scene.H-(scene.W<600?108:54),'#8eaab7',9,scene.W<600?'left':'right');
 scene.text('1 '+L(lang,'од.','unit')+' = '+short(unit/1000)+' km',scene.W<600?18:scene.W-18,scene.H-(scene.W<600?92:39),'#8eaab7',9,scene.W<600?'left':'right');
}
