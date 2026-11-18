import {atmosphericDensity,circularSpeed,initialOptions,orbitFrame,orbitalReadout,simulateSatellite} from './satellite-physics.js?v=orbit3d1';
import {createOrbitView,defaultCamera} from './satellite-view.js?v=orbit3d1';
import {densityText,satelliteTheory} from './satellite-theory.js?v=orbit3d1';

const words={
 uk:['Початкові умови','Висота на старті, км','Дотична швидкість, км/с','Маса, кг','Площа перерізу, м²','Нахил орбіти i, °','Довгота висхідного вузла Ω, °',
 'Модель середовища','Стандартна атмосфера 1976','Вакуум','Встановити колову швидкість','Час симуляції, хв','Почати рух','Пауза','На початок','Масштаб кадру','Повернути вигляд','Записати результат','Журнал',
 'Початкова орбіта у вакуумі','Майже колова','Еліптична','Еліпс із перигеєм нижче 100 км','Незамкнена','Результат прогону','Зв’язана траєкторія після 6 годин','Спуск до 100 км','Траєкторія втечі','Поточна висота, км','Поточна швидкість, км/с','Поточний перигей, км','Поточний апогей, км','Колова швидкість на старті, км/с','Густина, кг/м³','Зміна висоти перигею, км','Північ','Екватор Землі — пунктир','Супутник продовжує рух поза кадром','Перетягуй Землю, щоб повернути камеру. Сіра лінія — розрахована траєкторія, жовта — вже пройдена ділянка. Масштаб зберігається, коли змінюєш початкові умови.'],
 en:['Initial conditions','Initial altitude, km','Tangential speed, km/s','Mass, kg','Cross-sectional area, m²','Inclination i, °','Longitude of ascending node Ω, °',
 'Environment','1976 Standard Atmosphere','Vacuum','Set circular speed','Simulation time, min','Start motion','Pause','Back to start','View scale','Reset camera','Record result','Notebook',
 'Initial vacuum orbit','Nearly circular','Elliptical','Ellipse with perigee below 100 km','Unbound','Simulation result','Bound trajectory after 6 hours','Descended to 100 km','Escape trajectory','Current altitude, km','Current speed, km/s','Current perigee, km','Current apogee, km','Initial circular speed, km/s','Density, kg/m³','Change in perigee altitude, km','North','Dashed: Earth’s equator','The satellite continues outside the view','Drag Earth to rotate the camera. Grey is the predicted path and yellow is the distance travelled. The scale stays fixed when you change initial conditions.'],
 it:['Condizioni iniziali','Quota iniziale, km','Velocità tangenziale, km/s','Massa, kg','Sezione, m²','Inclinazione i, °','Longitudine del nodo ascendente Ω, °',
 'Ambiente','Atmosfera standard 1976','Vuoto','Usa la velocità circolare','Tempo simulato, min','Avvia','Pausa','Torna all’inizio','Scala della vista','Ripristina la vista','Registra il risultato','Registro',
 'Orbita iniziale nel vuoto','Quasi circolare','Ellittica','Ellisse con perigeo sotto 100 km','Non legata','Esito della simulazione','Traiettoria legata dopo 6 ore','Discesa fino a 100 km','Traiettoria di fuga','Quota attuale, km','Velocità attuale, km/s','Perigeo attuale, km','Apogeo attuale, km','Velocità circolare iniziale, km/s','Densità, kg/m³','Variazione della quota del perigeo, km','Nord','Tratteggio: equatore terrestre','Il satellite prosegue fuori dall’inquadratura','Trascina la Terra per ruotare la vista. In grigio il percorso previsto, in giallo quello percorso. La scala resta fissa al cambiare delle condizioni iniziali.'],
 es:['Condiciones iniciales','Altitud inicial, km','Velocidad tangencial, km/s','Masa, kg','Área de sección transversal, m²','Inclinación i, °','Longitud del nodo ascendente Ω, °',
 'Entorno','Atmósfera estándar de 1976','Vacío','Usar la velocidad circular','Tiempo simulado, min','Iniciar','Pausa','Volver al inicio','Escala de la vista','Restablecer la vista','Registrar resultado','Cuaderno',
 'Órbita inicial en el vacío','Casi circular','Elíptica','Elipse con perigeo por debajo de 100 km','No ligada','Resultado de la simulación','Trayectoria ligada tras 6 horas','Descenso hasta 100 km','Trayectoria de escape','Altitud actual, km','Velocidad actual, km/s','Perigeo actual, km','Apogeo actual, km','Velocidad circular inicial, km/s','Densidad, kg/m³','Cambio en la altitud del perigeo, km','Norte','Línea discontinua: ecuador terrestre','El satélite sigue fuera del encuadre','Arrastra la Tierra para girar la vista. En gris se muestra la trayectoria prevista y en amarillo, la recorrida. La escala se mantiene al cambiar las condiciones iniciales.'],
};
const keys=['settings','height','speed','mass','area','inclination','node','environment','standard','vacuum','circular','timeline','play','pause','reset','zoom','camera','record','journal','orbit','circle','ellipse','low','open','result','bound','reentry','unbound','altitude','instantSpeed','peri','apo','reference','density','shift','axis','eq','clipLabel','caption'];
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
 let t=getWords(language),run, preview,frame3d,viewer,position=0,animation=0,previous=0,drag=null;
 let changed=0,renderPending=0;
 let camera=defaultCamera();
 const $=id=>root.querySelector('#sat-'+id);
 const fmt=(n,d=1)=>n===null?'—':n.toLocaleString(locales[language],{maximumFractionDigits:d});
 const notify=()=>onChange(params);

 function render(){
  viewer?.close();
  root.innerHTML=`<div class="sat-layout"><div class="sat-media"><canvas id="sat-view" width="720" height="540" tabindex="0" role="img" aria-label="${t.caption}"></canvas><p class="small muted">${t.caption}</p>
  <div class="sat-play"><button type="button" class="primary" id="sat-play">${t.play}</button><button type="button" class="secondary" id="sat-reset">${t.reset}</button>
  <label for="sat-timeline">${t.timeline} <output id="sat-minutes"></output></label><input id="sat-timeline" aria-label="${t.timeline}" type="range" min="0" step="1" value="0"></div>
  <div class="sat-camera"><label for="sat-zoom">${t.zoom}</label><input id="sat-zoom" type="range" min="1.12" max="12" step=".01" value="${camera.zoom}" aria-label="${t.zoom}"><button class="secondary" id="sat-camera">${t.camera}</button></div>
  <div id="sat-metrics" class="metrics"></div></div>
  <section class="sat-settings" aria-labelledby="sat-settings"><h3 id="sat-settings">${t.settings}</h3>
  ${Object.entries(initialOptions).map(([key,[min,max,step]])=>`<div class="sat-control"><label for="sat-${key}">${t[key]}</label><input class="sat-number" type="number" id="sat-value-${key}" min="${min}" max="${max}" step="${step}" value="${params[key]}" aria-label="${t[key]}"><input type="range" id="sat-${key}" min="${min}" max="${max}" step="${step}" value="${params[key]}"></div>`).join('')}
  <label for="sat-mode">${t.environment}</label><select id="sat-mode"><option value="standard">${t.standard}</option><option value="vacuum">${t.vacuum}</option></select>
  <button class="secondary" id="sat-circle">${t.circular}</button>
  <button class="secondary" id="sat-record">${t.record}</button><button class="secondary" id="sat-journal">${t.journal}</button></section></div>${satelliteTheory(language)}`;
  $('mode').value=params.atmosphere;
  viewer=createOrbitView($('view'),draw);
  for(const [key,[min,max]] of Object.entries(initialOptions)){
   const slider=$(key),number=$('value-'+key);
   slider.oninput=()=>{number.value=slider.value;update(key,Number(slider.value));};
   number.oninput=()=>{
    const n=number.valueAsNumber;
    if(Number.isFinite(n)&&n>=min&&n<=max){slider.value=n;update(key,n);}
   };
   number.onchange=()=>{
    const n=Number.isFinite(number.valueAsNumber)?clamp(number.valueAsNumber,min,max):params[key];
    slider.value=n;number.value=n;update(key,n);
   };
  }
  $('mode').onchange=e=>update('atmosphere',e.target.value);
  $('circle').onclick=()=>{const value=Number(circularSpeed(params.height).toFixed(3));$('speed').value=$('value-speed').value=value;update('speed',value);};
  $('play').onclick=()=>{if(animation){pause();return;}if(position>=run.time)position=0;animation=requestAnimationFrame(tick);$('play').textContent=t.pause;};
  $('reset').onclick=()=>{pause();position=0;draw();};
  $('timeline').oninput=e=>{pause();position=Math.min(run.time,Number(e.currentTarget.value));draw();};
  $('zoom').oninput=e=>{camera.zoom=Number(e.currentTarget.value);draw();};
  $('camera').onclick=()=>{camera=defaultCamera();$('zoom').value=camera.zoom;draw();};
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
  viewer.draw({camera,frame:frame3d,preview:preview.map(p=>p.state),active,state:sample.state,axis:t.axis,eq:t.eq,clipLabel:t.clipLabel,unbound:run.outcome==='unbound'});
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
