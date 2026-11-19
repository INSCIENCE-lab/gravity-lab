const TAU = 2 * Math.PI;
const palettes = {
 mercury: ['#e2d8cd', '#908782', '#352f35'],
 venus: ['#fff1c6', '#bf8a51', '#50302d'],
 earth: ['#9fddfb', '#266194', '#081426'],
 mars: ['#ffd3a9', '#b86142', '#442832'],
 jupiter: ['#ffe8c5', '#be9375', '#5b413d'],
 saturn: ['#fff0bf', '#bf9e63', '#625041'],
 uranus: ['#cff7f2', '#75b9c0', '#294a63'],
 neptune: ['#a6d3ff', '#426fb9', '#202c67'],
};
const land = [
 [[-.73,-.43],[-.51,-.67],[-.18,-.72],[.03,-.60],[-.04,-.44],[-.28,-.26],[-.19,-.02],[-.41,-.06],[-.6,-.20]],
 [[-.16,-.01],[.09,.07],[.23,.29],[.09,.50],[-.04,.75],[-.14,.47],[-.26,.24]],
 [[.2,-.54],[.66,-.65],[.91,-.37],[.65,-.2],[.43,-.27],[.33,-.08],[.48,.06],[.29,.4],[.14,.24],[.05,-.02],[.15,-.24]],
];

function disc(ctx,x,y,r,color){
 ctx.beginPath();
 ctx.arc(x,y,r,0,TAU);
 ctx.fillStyle=color;
 ctx.fill();
}

function rings(ctx, start, end){
 for(const [rx,ry,color,width] of [[1.6,.43,'#b89d6fa0',.09],[1.53,.38,'#f1d39ad0',.10],[1.39,.33,'#bb9e71',.07]]){
  ctx.beginPath();
  ctx.ellipse(0,0,rx,ry,-.26,start,end);
  ctx.strokeStyle=color;
  ctx.lineWidth=width;
  ctx.stroke();
 }
}

function bands(ctx, tones){
 tones.forEach(([y,color,width])=>{
  ctx.beginPath();
  ctx.moveTo(-1,y+.22);
  ctx.bezierCurveTo(-.26,y-.09,.33,y+.2,1,y-.14);
  ctx.strokeStyle=color;
  ctx.lineWidth=width;
  ctx.stroke();
 });
}

export function drawPlanetIllustration(ctx,id,x,y,r){
 ctx.save();
 ctx.translate(x,y);
 ctx.scale(r,r);
 if(id==='saturn')rings(ctx,Math.PI,TAU);

 const [light,middle,dark]=palettes[id];
 const sphere=ctx.createRadialGradient(-.41,-.48,.035,0,0,1.04);
 sphere.addColorStop(0,light);
 sphere.addColorStop(.53,middle);
 sphere.addColorStop(1,dark);
 if(id==='earth'){
  ctx.shadowColor='#6597ee';ctx.shadowBlur=6;
  disc(ctx,0,0,1.025,'#6597ee');
  ctx.shadowBlur=0;
 }
 disc(ctx,0,0,1,sphere);

 ctx.save();
 ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.clip();
 if(id==='earth'){
  for(const shape of land){
   ctx.beginPath();
   shape.forEach(([u,v],i)=>i?ctx.lineTo(u,v):ctx.moveTo(u,v));
   ctx.closePath();ctx.fillStyle='#729e80';ctx.fill();
  }
  bands(ctx,[[-.28,'#d8eeff50',.06],[.45,'#d8eeff50',.065]]);
 }
 if(id==='mercury'){
  for(const [u,v,size] of [[-.40,-.16,.17],[.37,.12,.14],[-.1,.49,.20],[.28,-.48,.094]]){
   disc(ctx,u,v,size,'#58494f53');
   disc(ctx,u-.025,v-.04,size*.75,'#8476777f');
  }
 }
 if(id==='venus')bands(ctx,[[-.43,'#f3d69860',.14],[-.07,'#fff0b15e',.16],[.33,'#8f613942',.14]]);
 if(id==='mars'){
  bands(ctx,[[-.64,'#ffead480',.13],[.15,'#782e344b',.18],[.43,'#7f36374f',.14]]);
 }
 if(id==='jupiter'){
  bands(ctx,[[-.52,'#a46a5370',.15],[-.2,'#f5dbb98f',.19],[.08,'#8e524f83',.14],[.34,'#f0c998a0',.17],[.64,'#9e625381',.14]]);
  ctx.beginPath();ctx.ellipse(.34,.34,.23,.094,-.1,0,TAU);ctx.fillStyle='#a8564b';ctx.fill();
 }
 if(id==='saturn')bands(ctx,[[-.32,'#dfc08091',.11],[.04,'#94724687',.12],[.39,'#efca88a0',.11]]);
 if(id==='uranus')bands(ctx,[[-.13,'#b0e2dc57',.22],[.37,'#90d2d970',.12]]);
 if(id==='neptune')bands(ctx,[[-.28,'#88bcf072',.10],[.28,'#1d438474',.17],[.54,'#7fa7f077',.07]]);

 const shade=ctx.createLinearGradient(-.6,-.65,.92,.85);
 shade.addColorStop(0,'transparent');shade.addColorStop(.52,'#0a0f1d08');shade.addColorStop(1,'#080b20bb');
 disc(ctx,0,0,1,shade);
 ctx.restore();
 if(id==='saturn')rings(ctx,0,Math.PI);
 ctx.restore();
}
