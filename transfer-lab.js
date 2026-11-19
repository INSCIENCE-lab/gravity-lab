import {assistBodies, circularRate, earthSpeed, flyby, hohmannRatio, targets, transfer} from './transfer-physics.js?v=1';
import {transferText} from './transfer-text.js?v=1';

const PI = Math.PI;
const RAD = PI / 180;
const ORBIT = '#577899', ROUTE = '#d8e632', TARGET = '#f9a975', EARTH = '#6bd2ef';
const localeIndex = {uk:0, en:1, it:2, es:3};
const solutions = { hohmann: 1, closest: 1, faster: 1.35 };

export function mountTransfer(host, {language, onRecord, onJournal}) {
 const state = {target:'Mars', speed:1, phase:0, fraction:0, zoom:1, body:'Earth', altitude:500, excess:6, side:1, frame:'sun'};
 let model, languageIndex, number, frame = 0, previous = null;
 const el = id => host.querySelector('#transfer-' + id);
 const t = key => transferText[key][languageIndex];
 const targetName = key => targets[key][languageIndex + 1];
 const bodyName = key => key === 'Earth' ? t('earth') : targetName(key);
 const format = (value, digits = 2) => number(value, digits);
 const timeLabel = days => days >= 730 ? format(days / 365.25, 2) + ' ' + t('years') : format(days, 1) + ' ' + t('days');
 const options = (keys, label) => keys.map(key => `<option value="${key}">${label(key)}</option>`).join('');
 const select = (id, label, content) => `<label>${t(label)}<select id="transfer-${id}">${content}</select></label>`;
 const range = (id, label, min, max, step) => `<label><span>${t(label)} · <output id="transfer-${id}-value"></output></span><input id="transfer-${id}" type="range" min="${min}" max="${max}" step="${step}"></label>`;
 const button = (id, label, style = 'secondary') => `<button id="transfer-${id}" type="button" class="${style}">${t(label)}</button>`;
 const initialDistance = () => Math.hypot(1 - targets[state.target][0] * Math.cos(state.phase), targets[state.target][0] * Math.sin(state.phase));
 const hit = () => model.reaches && model.miss < 1e-6;

 function recalculate() {
  model = transfer(targets[state.target][0], state.speed, state.phase);
 }
 function preset(key) {
  const reference = hohmannRatio(targets[state.target][0]);
  state.speed = Math.min(1.405, Math.max(.54, 1 + (reference - 1) * solutions[key]));
  state.phase = key === 'closest' ? 0 : transfer(targets[state.target][0], state.speed, 0).aim;
  recalculate();
 }
 function pause() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  previous = null;
  if (el('play')) el('play').textContent = t('play');
 }
 function animate(now) {
  if (previous !== null) state.fraction = Math.min(1, state.fraction + (now - previous) / 9500);
  previous = now;
  updateTime();
  if (state.fraction >= 1) pause();
  else frame = requestAnimationFrame(animate);
 }
 function start() {
  if (frame) {pause(); return;}
  if (state.fraction >= 1) state.fraction = 0;
  el('play').textContent = t('pause');
  frame = requestAnimationFrame(animate);
 }
 function frameCanvas(canvas) {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const scale = Math.min(2, devicePixelRatio || 1);
  const bitmapWidth = Math.round(width * scale), bitmapHeight = Math.round(height * scale);
  if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
   canvas.width = bitmapWidth;
   canvas.height = bitmapHeight;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.font = '12px sans-serif';
  return {ctx, width, height};
 }
 function path(ctx, points, color, width = 1) {
  ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
 }
 function circle(ctx, x, y, r, color, fill = false) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * PI);
  if (fill) {ctx.fillStyle = color;ctx.fill();}
  else {ctx.strokeStyle = color;ctx.lineWidth = 1;ctx.stroke();}
 }
 function dot(ctx,x,y,r,color,label,width) {
  circle(ctx,x,y,r,color,true);
  ctx.fillStyle=color;
  ctx.textAlign=x>width-80?'right':'left';
  ctx.fillText(label,x>width-80?x-r-4:x+r+4,y-8);
  ctx.textAlign='left';
 }
 function drawTransfer() {
  const {ctx,width,height} = frameCanvas(el('map'));
  if (!width || !height) return;
  const radius = targets[state.target][0];
  const orbitExtent = Math.max(1, radius, model.oppositeRadius);
  const scale = Math.min(width,height) * .414 * state.zoom / orbitExtent;
  const x = value => width / 2 + value * scale;
  const y = value => height / 2 - value * scale;
  circle(ctx,x(0),y(0),scale,ORBIT);
  circle(ctx,x(0),y(0),scale*radius,'#9e6a53');
  const point = (progress, end) => {
   const p = model.atAnomaly(model.start + progress * (end - model.start));
   return [x(p.x),y(p.y)];
  };
  const points = (end, count) => Array.from({length:count + 1},(_,i)=>point(i / count,end));
  ctx.setLineDash([4,5]);
  path(ctx,points(model.start + 2*PI,200),'#737954');
  ctx.setLineDash([]);
  path(ctx,points(model.end,100),ROUTE,2);
  const days = state.fraction * model.duration;
  const ship = model.position(days);
  const earth = circularRate(1) * days;
  const target = state.phase + circularRate(radius) * days;
  const [ex,ey] = [x(Math.cos(earth)), y(Math.sin(earth))];
  const [tx,ty] = [x(radius*Math.cos(target)), y(radius*Math.sin(target))];
  if(state.fraction===0 || state.fraction===1) {
   ctx.setLineDash([3,4]);
   path(ctx,[[state.fraction===0?ex:x(ship.x),state.fraction===0?ey:y(ship.y)],[tx,ty]],'#a7b0c1');
   ctx.setLineDash([]);
  }
  dot(ctx,x(0),y(0),5,'#ffce69',t('sun'),width);
  dot(ctx,ex,ey,4,EARTH,t('earth'),width);
  dot(ctx,tx,ty,5,TARGET,targetName(state.target),width);
  dot(ctx,x(ship.x),y(ship.y),3.2,ROUTE,'',width);
 }
 function arrow(ctx,origin,vector,k,color) {
  const end=[origin[0]+vector[0]*k,origin[1]-vector[1]*k];
  const a=Math.atan2(end[1]-origin[1],end[0]-origin[0]);
  path(ctx,[origin,end],color,2);
  path(ctx,[[end[0]-8*Math.cos(a-.5),end[1]-8*Math.sin(a-.5)],end,[end[0]-8*Math.cos(a+.5),end[1]-8*Math.sin(a+.5)]],color,2);
 }

 function drawAssist() {
  const body=assistBodies[state.body], data=flyby(body,state.altitude,state.excess,state.side);
  const vectors=state.frame==='sun'?[data.incoming,data.outgoing]:
   [[state.excess,0],[state.excess*Math.cos(data.turn),state.side*state.excess*Math.sin(data.turn)]];
  const speeds=vectors.map(vector=>Math.hypot(...vector));
  const {ctx,width,height}=frameCanvas(el('flyby-map'));
  if (!width || !height) return;
  const center=[width/2,height*.63], length=Math.min(width,height)*.29;
  const k=length/(data.periapsis*5);
  const hyperbola=[];
  const edge=Math.acos(((1+data.eccentricity)/5-1)/data.eccentricity);
  for(let i=0;i<=160;i++){
   const theta=(i/80-1)*edge;
   const r=data.periapsis*(1+data.eccentricity)/(1+data.eccentricity*Math.cos(theta));
   const direction=PI+state.side*(theta+data.limit);
   hyperbola.push([center[0]+k*r*Math.cos(direction),center[1]-k*r*Math.sin(direction)]);
  }
  circle(ctx,...center,body.radius*k,TARGET,true);
  path(ctx,hyperbola,ROUTE,2);
  const arrowScale=Math.min(width*.13,height*.15)/Math.max(...speeds);
  arrow(ctx,[width*.26,height*.22],vectors[0],arrowScale,EARTH);
  arrow(ctx,[width*.69,height*.22],vectors[1],arrowScale,ROUTE);
  circle(ctx,width*.26,height*.22,2.5,EARTH,true);
  circle(ctx,width*.69,height*.22,2.5,ROUTE,true);
  el('assist-result').textContent=`${t('before')} ${format(speeds[0])} ${t('kms')}  →  ${t('after')} ${format(speeds[1])} ${t('kms')}. ${t('bend')} ${format(data.turn/RAD,1)}°.`;
 }
 function updateTime() {
  el('timeline').value = state.fraction;
  el('timeline-value').textContent = timeLabel(state.fraction * model.duration);
  drawTransfer();
 }
 function field(id,value,display) {
  el(id).value = value;
  el(id+'-value').textContent = display;
  el(id).setAttribute('aria-valuetext',display);
 }
 function refresh(resetTime = true) {
  if (resetTime) {pause();state.fraction=0;}
  field('phase',state.phase/RAD,format(state.phase/RAD,1)+'°');
  field('speed',state.speed*earthSpeed,format(state.speed*earthSpeed,3)+' '+t('kms'));
  field('zoom',state.zoom,format(state.zoom,1)+'×');
  el('aim').disabled=!model.reaches;
  el('outcome').textContent=t(hit()?'hit':model.reaches?'miss':'short');
  const reading = (key,value) => `<p>${t(key)} <b>${value}</b></p>`;
  el('metrics').innerHTML =
   reading('launchDistance',format(initialDistance(),3)+' '+t('au'))+
   reading('delta',format(model.deltaV,3)+' '+t('kms'))+
   reading('flight',timeLabel(model.duration))+
   reading('separation',format(model.miss,3)+' '+t('au'))+
   (hit()?reading('arrival',format(model.relativeSpeed,3)+' '+t('kms')):'');
  updateTime();
 }
 function refreshAssist() {
  field('altitude',state.altitude,format(state.altitude,0)+' '+t('km'));
  field('excess',state.excess,format(state.excess,1)+' '+t('kms'));
  drawAssist();
 }
 function render(nextLanguage) {
  pause();
  languageIndex = localeIndex[nextLanguage] ?? 1;
  number = (value,digits) => new Intl.NumberFormat(nextLanguage,{maximumFractionDigits:digits}).format(value);
  const swatch=(color,label)=>`<span><i style="background:${color}"></i>${label}</span>`;
  host.innerHTML=`
   <div class="transfer-layout">
    <div>
     <canvas class="transfer-map" id="transfer-map" role="img" aria-label="${t('route')}"></canvas>
     <div class="transfer-legend">${swatch(EARTH,t('earth'))}${swatch(TARGET,targetName(state.target))}${swatch(ROUTE,t('route'))}${swatch('#737954',t('ellipse'))}</div>
     <div class="transfer-play">${button('play','play','primary')}${button('reset','reset')}${range('timeline','time',0,1,.001)}</div>
     <div class="transfer-readout"><strong id="transfer-outcome" role="status"></strong><div id="transfer-metrics"></div></div>
     <div class="transfer-actions">${button('record','record')}${button('journal','journal')}</div>
    </div>
    <div class="transfer-controls">
     ${select('target','target',options(Object.keys(targets),targetName))}
     ${range('phase','phase',-180,180,.1)}
     ${range('speed','speed',.54*earthSpeed,1.405*earthSpeed,.001)}
     ${range('zoom','zoom',.6,4,.1)}
     ${button('closest','closest')}${button('hohmann','hohmann')}${button('faster','faster')}${button('aim','aim')}
     <p class="small muted">${t('guide')}</p>
    </div>
   </div>
   <section aria-labelledby="transfer-assist-heading" class="transfer-theory">
    <h3 id="transfer-assist-heading">${t('assist')}</h3>
    <div class="transfer-layout">
     <div><canvas class="transfer-map" id="transfer-flyby-map" role="img" aria-label="${t('assist')}"></canvas><p id="transfer-assist-result"></p></div>
     <div class="transfer-controls">
      ${select('body','body',options(Object.keys(assistBodies),bodyName))}
      ${range('altitude','altitude',300,100000,100)}
      ${range('excess','excess',2,20,.1)}
      ${select('side','side',`<option value="1">${t('increase')}</option><option value="-1">${t('decrease')}</option>`)}
      ${select('frame','frame',`<option value="sun">${t('sunFrame')}</option><option value="planet">${t('planetFrame')}</option>`)}
     </div>
    </div>
    <p>${t('assistHelp')}</p>
   </section>
   <section id="transferTheory" class="transfer-theory">
    <h3>${t('theory')}</h3><p>${t('orbitTheory')}</p>
    <span class="transfer-formula">a = (r₁ + r₂) / 2 &nbsp; · &nbsp; t = π√(a³ / μ☉)</span>
    <span class="transfer-formula">v(r) = √[μ☉ (2 / r − 1 / a)] &nbsp; · &nbsp; Δv = |v(r₁) − √(μ☉ / r₁)|</span>
    <p>${t('equationHelp')}</p>
    <h3>${t('assist')}</h3><p>${t('assistTheory')}</p>
    <h3>${t('sources')}</h3>
    <ul>
     <li><a href="https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/">NASA · Hohmann transfer</a></li>
     <li><a href="https://ssd.jpl.nasa.gov/planets/approx_pos.html">JPL · Planetary orbital elements</a></li>
     <li><a href="https://science.nasa.gov/learn/basics-of-space-flight/primer/">NASA · Gravity assists and Galileo</a></li>
     <li><a href="https://science.nasa.gov/mission/new-horizons/">NASA · New Horizons (Jupiter → Pluto)</a></li>
    </ul>
   </section>`;
  el('target').value=state.target;
  el('target').onchange=event=>{state.target=event.target.value;state.zoom=1;preset('hohmann');state.fraction=0;render(nextLanguage);el('target').focus();};
  for(const key of Object.keys(solutions)) el(key).onclick=()=>{preset(key);refresh();};
  el('aim').onclick=()=>{state.phase=model.aim;recalculate();refresh();};
  for(const key of ['phase','speed']) el(key).oninput=event=>{
   state[key]=Number(event.target.value)*(key==='phase'?RAD:1/earthSpeed);
   recalculate();refresh();
  };
  el('zoom').oninput=event=>{state.zoom=Number(event.target.value);refresh(false);};
  el('play').onclick=start;
  el('reset').onclick=()=>{pause();state.fraction=0;updateTime();};
  el('timeline').oninput=event=>{pause();state.fraction=Number(event.target.value);updateTime();};
  el('record').onclick=()=>onRecord({
   transfer_time_d:model.duration, transfer_delta_v_kms:model.deltaV,
   launch_distance_au:initialDistance(), arrival_distance_au:model.miss,
   arrival_speed_kms:hit()?model.relativeSpeed:null
  },{target:targetName(state.target), phase:state.phase/RAD, speed:state.speed*earthSpeed});
  el('journal').onclick=onJournal;
  for(const key of ['body','altitude','excess','side','frame']){
   el(key).value=state[key];
   el(key).oninput=event=>{
    state[key]=['altitude','excess','side'].includes(key)?Number(event.target.value):event.target.value;
    refreshAssist();
   };
  }
  refresh(false);
  refreshAssist();
 }
 const resize = new ResizeObserver(()=>{drawTransfer();drawAssist();});
 preset('hohmann');
 render(language);
 resize.observe(host);
 return {setLanguage:render,pause,destroy(){pause();resize.disconnect();host.replaceChildren();}};
}
