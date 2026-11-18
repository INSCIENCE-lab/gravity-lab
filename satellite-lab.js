import {atmosphericDensity,circularSpeed,initialOptions,orbitFrame,orbitalReadout,referenceEllipse,simulateSatellite} from './satellite-physics.js?v=editorial1';
import {createOrbitView,defaultCamera} from './satellite-view.js?v=editorial1';
import {densityText,satelliteTheory} from './satellite-theory.js?v=editorial1';

const words={
 uk:['Початкові умови','Висота на старті, км','Дотична швидкість, км/с','Маса, кг','Площа перерізу, м²','Нахил орбіти i, °','Довгота висхідного вузла Ω, °',
 'Модель середовища','Стандартна атмосфера 1976','Вакуум','Встановити колову швидкість','Час симуляції, хв','Почати рух','Пауза','На початок','Масштаб кадру','Повернути вигляд','Записати результат','Журнал',
 'Початкова орбіта у вакуумі','Майже колова','Еліптична','Еліпс із перигеєм нижче 100 км','Незамкнена','Результат прогону','Зв’язана траєкторія після 6 годин','Спуск до 100 км','Траєкторія втечі','Поточна висота, км','Поточна швидкість, км/с','Поточний перигей, км','Поточний апогей, км','Колова швидкість на старті, км/с','Густина, кг/м³','Зміна висоти перигею, км','Північ','Екватор Землі — пунктир','Супутник продовжує рух поза кадром','Перетягуй Землю, щоб повернути камеру. Сіра лінія — розрахована траєкторія, жовта — вже пройдена ділянка. Масштаб кадру можна змінювати вручну.'],
 en:['Initial conditions','Initial altitude, km','Tangential speed, km/s','Mass, kg','Cross-sectional area, m²','Inclination i, °','Longitude of ascending node Ω, °',
 'Environment','1976 Standard Atmosphere','Vacuum','Set circular speed','Simulation time, min','Start motion','Pause','Back to start','View scale','Reset camera','Record result','Notebook',
 'Initial vacuum orbit','Nearly circular','Elliptical','Ellipse with perigee below 100 km','Unbound','Simulation result','Bound trajectory after 6 hours','Descended to 100 km','Escape trajectory','Current altitude, km','Current speed, km/s','Current perigee, km','Current apogee, km','Initial circular speed, km/s','Density, kg/m³','Change in perigee altitude, km','North','Dashed: Earth’s equator','The satellite continues outside the view','Drag Earth to rotate the camera. Grey shows the computed trajectory, and yellow marks the part already travelled. Adjust the framing with the zoom slider.'],
 it:['Condizioni iniziali','Quota iniziale, km','Velocità tangenziale, km/s','Massa, kg','Sezione, m²','Inclinazione i, °','Longitudine del nodo ascendente Ω, °',
 'Ambiente','Atmosfera standard 1976','Vuoto','Usa la velocità circolare','Tempo simulato, min','Avvia','Pausa','Torna all’inizio','Scala della vista','Ripristina la vista','Registra il risultato','Registro',
 'Orbita iniziale nel vuoto','Quasi circolare','Ellittica','Ellisse con perigeo sotto 100 km','Non legata','Esito della simulazione','Traiettoria legata dopo 6 ore','Discesa fino a 100 km','Traiettoria di fuga','Quota attuale, km','Velocità attuale, km/s','Perigeo attuale, km','Apogeo attuale, km','Velocità circolare iniziale, km/s','Densità, kg/m³','Variazione della quota del perigeo, km','Nord','Tratteggio: equatore terrestre','Il satellite prosegue fuori dall’inquadratura','Trascina la Terra per ruotare la vista. In grigio il percorso previsto, in giallo quello percorso. Puoi regolare l’inquadratura con il cursore.'],
 es:['Condiciones iniciales','Altitud inicial, km','Velocidad tangencial, km/s','Masa, kg','Área de sección transversal, m²','Inclinación i, °','Longitud del nodo ascendente Ω, °',
 'Entorno','Atmósfera estándar de 1976','Vacío','Usar la velocidad circular','Tiempo simulado, min','Iniciar','Pausa','Volver al inicio','Escala de la vista','Restablecer la vista','Registrar resultado','Cuaderno',
 'Órbita inicial en el vacío','Casi circular','Elíptica','Elipse con perigeo por debajo de 100 km','No ligada','Resultado de la simulación','Trayectoria ligada tras 6 horas','Descenso hasta 100 km','Trayectoria de escape','Altitud actual, km','Velocidad actual, km/s','Perigeo actual, km','Apogeo actual, km','Velocidad circular inicial, km/s','Densidad, kg/m³','Cambio en la altitud del perigeo, km','Norte','Línea discontinua: ecuador terrestre','El satélite sigue fuera del encuadre','Arrastra la Tierra para girar la vista. En gris se muestra la trayectoria prevista y en amarillo, la recorrida. Puedes ajustar el encuadre con el control de escala.'],
};
const keys=['settings','height','speed','mass','area','inclination','node','environment','standard','vacuum','circular','timeline','play','pause','reset','zoom','camera','record','journal','orbit','circle','ellipse','low','open','result','bound','reentry','unbound','altitude','instantSpeed','peri','apo','reference','density','shift','axis','eq','clipLabel','caption'];
const framing={
 uk:['Умістити всю орбіту','Короткий пунктир — початкова орбіта у вакуумі. Повний еліпс може виходити за межі шести годин розрахунку.'],
 en:['Fit the whole orbit','Short dashes show the initial orbit in vacuum. The full ellipse can extend beyond the six-hour simulation.'],
 it:['Inquadra tutta l’orbita','I trattini corti indicano l’orbita iniziale nel vuoto. L’ellisse completa può estendersi oltre le sei ore di simulazione.'],
 es:['Encuadrar toda la órbita','Los trazos cortos indican la órbita inicial en el vacío. La elipse completa puede abarcar más de seis horas de simulación.'],
};
const locales={uk:'uk-UA',en:'en-GB',it:'it-IT',es:'es-ES'};
const getWords=language=>Object.fromEntries(keys.map((key,i)=>[key,words[language][i]]));
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

export function mountSatellite(root,{language,query,onRecord,onJournal,onChange}){
 const params=Object.fromEntries(Object.entries(initialOptions).map(([key,[min,max,,value]])=>{
  const n=Number(query.get('sat_'+key));
  return [key,query.has('sat_'+key)&&Number.isFinite(n)?clamp(n,min,max):value];
 }));
 const environment=query.get('sat_atmosphere');
 params.atmosphere=environment==='vacuum'||environment==='standard'?environment:query.get('sat_drag')==='0'?'vacuum':'standard';
 let t=getWords(language),run, preview,reference,frame3d,viewer,position=0,animation=0,previous=0,drag=null;
 let changed=0,renderPending=0;
 let camera=defaultCamera();
 const $=id=>root.querySelector('#sat-'+id);
 const fmt=(n,d=1)=>n===null?'—':(Math.abs(n)<0.5*10**-d?0:n).toLocaleString(locales[language],{maximumFractionDigits:d});
 const inputValue=n=>n.toLocaleString(locales[language],{useGrouping:false,maximumFractionDigits:3});
 const parseInput=input=>{
  const value=input.value.trim().replace(',','.');
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)?Number(value):NaN;
 };
 const notify=()=>onChange(params);

 function render(){
  viewer?.close();
  root.innerHTML=`<div class="sat-layout"><div class="sat-media"><canvas id="sat-view" width="720" height="540" tabindex="0" role="img" aria-label="${t.caption}"></canvas><p class="small muted">${t.caption}</p>
  <div class="sat-play"><button type="button" class="primary" id="sat-play">${t.play}</button><button type="button" class="secondary" id="sat-reset">${t.reset}</button>
  <label for="sat-timeline">${t.timeline} <output id="sat-minutes"></output></label><input id="sat-timeline" aria-label="${t.timeline}" type="range" min="0" step="1" value="0"></div>
  <div class="sat-camera"><label for="sat-zoom">${t.zoom}</label><input id="sat-zoom" type="range" min="0.2" max="4" step=".01" value="${camera.zoom}" aria-label="${t.zoom}"><button class="secondary" id="sat-camera">${t.camera}</button></div><label class="sat-fit"><input type="checkbox" id="sat-fit" ${camera.fit?'checked':''}> ${framing[language][0]}</label><p class="small muted" id="sat-reference-note" hidden>${framing[language][1]}</p>
  <div id="sat-metrics" class="metrics"></div></div>
  <section class="sat-settings" aria-labelledby="sat-settings"><h3 id="sat-settings">${t.settings}</h3>
  ${Object.entries(initialOptions).map(([key,[min,max,step]])=>`<div class="sat-control"><label for="sat-${key}">${t[key]}</label><input class="sat-number" type="text" inputmode="decimal" id="sat-value-${key}" value="${inputValue(params[key])}" aria-label="${t[key]}"><input type="range" id="sat-${key}" min="${min}" max="${max}" step="${step}" value="${params[key]}"></div>`).join('')}
  <label for="sat-mode">${t.environment}</label><select id="sat-mode"><option value="standard">${t.standard}</option><option value="vacuum">${t.vacuum}</option></select>
  <button class="secondary" id="sat-circle">${t.circular}</button>
  <button class="secondary" id="sat-record">${t.record}</button><button class="secondary" id="sat-journal">${t.journal}</button></section></div>${satelliteTheory(language)}`;
  $('mode').value=params.atmosphere;
  viewer=createOrbitView($('view'),draw);
  for(const [key,[min,max]] of Object.entries(initialOptions)){
   const slider=$(key),number=$('value-'+key);
   slider.oninput=()=>{const value=Number(slider.value);number.value=inputValue(value);update(key,value);};
   number.oninput=()=>{
    const n=parseInput(number);
    if(Number.isFinite(n)&&n>=min&&n<=max){slider.value=n;update(key,Number(slider.value));}
   };
   number.onchange=()=>{
    const n=parseInput(number);
    slider.value=Number.isFinite(n)?clamp(n,min,max):params[key];
    const value=Number(slider.value);
    number.value=inputValue(value);update(key,value);
   };
   number.onkeydown=e=>{if(e.key==='Enter'){number.onchange();number.blur();}};
  }
  $('mode').onchange=e=>update('atmosphere',e.target.value);
  $('circle').onclick=()=>{const value=Number(circularSpeed(params.height).toFixed(3));$('speed').value=value;$('value-speed').value=inputValue(value);update('speed',value);};
  $('play').onclick=()=>{if(animation){pause();return;}if(position>=run.time)position=0;animation=requestAnimationFrame(tick);$('play').textContent=t.pause;};
  $('reset').onclick=()=>{pause();position=0;draw();};
  $('timeline').oninput=e=>{pause();position=Math.min(run.time,Number(e.currentTarget.value));draw();};
  $('zoom').oninput=e=>{camera.zoom=Number(e.currentTarget.value);draw();};
  $('fit').onchange=e=>{camera.fit=e.currentTarget.checked;camera.zoom=1;$('zoom').value=1;draw();};
  $('camera').onclick=()=>{camera=defaultCamera();$('zoom').value=camera.zoom;$('fit').checked=camera.fit;draw();};
  const view=$('view');
  view.onpointerdown=e=>{drag=[e.clientX,e.clientY];view.setPointerCapture(e.pointerId);};
  view.onpointermove=e=>{if(!drag)return;rotate(e.clientX-drag[0],e.clientY-drag[1]);drag=[e.clientX,e.clientY];};
  view.onpointerup=view.onpointercancel=view.onlostpointercapture=()=>{drag=null;};
  view.onkeydown=e=>{
   const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[e.key];
   if(delta){e.preventDefault();rotate(...delta);}
  };
  $('record').onclick=()=>{
   refresh();
   onRecord({height_m:params.height*1000,mass_kg:params.mass,initial_speed_ms:params.speed*1000,satellite_area_m2:params.area,
    inclination_deg:params.inclination,ascending_node_deg:params.node,atmosphere_model:params.atmosphere,orbit_turns:run.turns,satellite_outcome:run.outcome,perigee_m:run.final.perigee,apogee_m:run.final.apogee,satellite_duration_s:run.time},params);
  };
  $('journal').onclick=onJournal;
  draw();
 }
 function rotate(x,y){
  camera.yaw-=x*.009;
  camera.pitch=clamp(camera.pitch+y*.009,-1.56,1.56);
  draw();
 }
 function pause(){cancelAnimationFrame(animation);animation=0;previous=0;if($('play'))$('play').textContent=t.play;}
 function tick(now){
  if(previous)position=Math.min(run.time,position+Math.min(now-previous,50)/1000*1800);
  previous=now;draw();
  if(position<run.time)animation=requestAnimationFrame(tick);else pause();
 }
 function update(key,value){
  if(params[key]===value)return;
  params[key]=value;
  if(key==='inclination'||key==='node')frame3d=orbitFrame(params.inclination,params.node);
  else changed=1;
  if(!renderPending)renderPending=requestAnimationFrame(()=>{renderPending=0;refresh();});
 }
 function recompute(){
  run=simulateSatellite(params);
  reference=run.outcome==='bound'&&run.initial.energy<0?referenceEllipse(run.points[0].state):[];
  if(run.outcome==='unbound'){
   camera.zoom=1;
   if($('zoom'))$('zoom').value=1;
  }
  const stride=Math.max(1,Math.ceil(run.points.length/850));
  preview=run.points.filter((_,i)=>i%stride===0||i===run.points.length-1);
  position=Math.min(position,run.time);
 }
 function refresh(){
  if(changed){changed=0;recompute();}
  notify();draw();
 }
 function draw(){
  const index=Math.min(run.points.length-1,Math.floor(position/4));
  const sample=position>=run.time?run.points.at(-1):run.points[index];
  const active=preview.filter(p=>p.time<=sample.time).map(p=>p.state);
  active.push(sample.state);
  viewer.draw({camera,frame:frame3d,reference,preview:preview.map(p=>p.state),active,state:sample.state,axis:t.axis,eq:t.eq,clipLabel:t.clipLabel,unbound:run.outcome==='unbound'});
  $('fit').disabled=!reference.length;
  $('reference-note').hidden=!reference.length;
  $('zoom').setAttribute('aria-valuetext',fmt(100*camera.zoom,0)+' %');
  $('timeline').max=Math.ceil(run.time);$('timeline').value=position;
  $('minutes').textContent=fmt(sample.time/60);
  $('timeline').setAttribute('aria-valuetext',fmt(sample.time/60));
  const initialOrbit=run.initial.energy>=0?t.open:run.initial.perigee<100_000?t.low:run.initial.eccentricity<.01?t.circle:t.ellipse;
  const current=orbitalReadout(sample.state);
  const pairs=[[t.orbit,initialOrbit],[t.result,t[run.outcome]],[t.reference,fmt(circularSpeed(params.height),3)],[t.altitude,fmt(current.altitude)],[t.instantSpeed,fmt(current.speed,3)],[t.peri,fmt(current.perigee)],[t.apo,fmt(current.apogee)],[t.density,params.atmosphere==='vacuum'?'0':densityText(atmosphericDensity(current.altitude),locales[language])],[t.shift,fmt((run.final.perigee-run.initial.perigee)/1000,3)]];
  $('metrics').innerHTML=pairs.map(([name,value])=>`<div class="metric"><span>${name}</span><strong>${value}</strong></div>`).join('');
 }
 frame3d=orbitFrame(params.inclination,params.node);
 recompute();render();
 return {pause,setLanguage(value){if(language!==value){pause();language=value;t=getWords(language);render();}},destroy(){pause();cancelAnimationFrame(renderPending);viewer.close();root.replaceChildren();}};
}
