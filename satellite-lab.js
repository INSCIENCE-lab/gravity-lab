import {circularSpeed, initialOptions, orbitalReadout, radius, simulateSatellite, testedDragLimit} from './satellite-physics.js';

const labels = {
 uk: {
  settings:'Початкові умови', height:'Висота над Землею, км', speed:'Дотична швидкість, км/с', mass:'Маса супутника, кг', area:'Площа поперечного перерізу, м²', drag:'Множник густини атмосфери, ×',
  play:'Почати рух', pause:'Пауза', reset:'На початок', timeline:'Час симуляції, хв', circular:'Встановити колову швидкість', sweep:'Перевірити межу опору', record:'Записати результат', journal:'Відкрити журнал',
  heading:'Що визначає орбіту?', orbit:'Початкова орбіта у вакуумі', circle:'Майже колова', ellipse:'Еліптична', open:'Незамкнена', low:'Еліпс із перигеєм нижче 100 км', reference:'Колова швидкість на старті, км/с', result:'Результат прогону', bound:'Зв’язана траєкторія після 6 годин', reentry:'Спуск до висоти 100 км', escape:'Вихід за межу сцени на незамкненій траєкторії', unbound:'Незамкнена траєкторія після 6 годин',
  peri:'Поточний перигей, км', apo:'Поточний апогей, км', altitude:'Поточна висота, км', instantSpeed:'Поточна швидкість, км/с', revolutions:'Оберти за весь прогін',
  range:'Перевірено множники 0, 5, …, 100. Найбільший перевірений, за якого є повний оберт і траєкторія лишається зв’язаною вище 100 км протягом 6 годин', none:'Жоден перевірений множник не дав повного оберту та зв’язаної траєкторії протягом 6 годин.',
  caption:'Вигляд згори на площину орбіти. Бліда лінія — прогноз для заданих умов, яскрава — пройдена ділянка. Пунктирне коло — початкова висота.',
  scope:'Рух починається на заданій висоті з дотичною швидкістю. Землю вважаємо сферичною та нерухомою. Інтегруємо до 6 годин або до спуску на висоту 100 км. Незамкнена траєкторія припиняється також на відстані шести радіусів Землі від центра.',
  gravity:'У вакуумі за маси супутника, малої порівняно з масою Землі, початкову орбіту визначають висота й швидкість. Коловій орбіті відповідає v = √(GM/r), а швидкість втечі у вакуумі дорівнює √2 від колової. Перигей і апогей — найнижча й найвища точки миттєвої орбіти, яку тіло мало б, якби опір вимкнути у цей момент. Від’ємний перигей означає перетин поверхні.',
  resistance:'Опір зменшує енергію руху. Модуль його прискорення дорівнює ρ Cᴅ A v²/(2m), де Cᴅ = 2,2, A — площа перерізу. Густина експоненційно зменшується з висотою зі шкалою 35 км. Початкове значення для порівняння — 2,8 × 10⁻¹⁰ кг/м³ на 200 км, помножене на повзунок. Значення 0 задає вакуум. Це навчальна модель. Реальна густина залежить від часу й сонячної активності.',
  task:'Спершу встанови колову швидкість у вакуумі. Зменш швидкість, щоб опустити перигей. Потім порівняй дві маси за однакових швидкості, площі та густини й перевір межу опору.',
  dragSource:'NOAA: атмосферний опір для супутників', image:'Фото Землі',
 },
 en: {
  settings:'Initial conditions', height:'Altitude above Earth, km', speed:'Tangential speed, km/s', mass:'Satellite mass, kg', area:'Cross-sectional area, m²', drag:'Atmospheric density multiplier, ×',
  play:'Start motion', pause:'Pause', reset:'Back to start', timeline:'Simulation time, min', circular:'Set circular speed', sweep:'Check the drag limit', record:'Record result', journal:'Open notebook',
  heading:'What determines the orbit?', orbit:'Initial vacuum orbit', circle:'Nearly circular', ellipse:'Elliptical', open:'Unbound', low:'Ellipse with perigee below 100 km', reference:'Circular speed at launch altitude, km/s', result:'Simulation result', bound:'Bound trajectory after 6 hours', reentry:'Descended to 100 km', escape:'Left the scene on an unbound trajectory', unbound:'Unbound trajectory after 6 hours',
  peri:'Current perigee, km', apo:'Current apogee, km', altitude:'Current altitude, km', instantSpeed:'Current speed, km/s', revolutions:'Revolutions over the run',
  range:'Multipliers tested: 0, 5, …, 100. Largest tested value with a full revolution and a bound trajectory above 100 km for 6 hours', none:'None of the tested multipliers gave a full revolution and a bound trajectory for 6 hours.',
  caption:'View perpendicular to the orbital plane. The faint line is the predicted trajectory, the bright line the part already travelled. The dashed circle marks the initial altitude.',
  scope:'Motion starts at the selected altitude with tangential velocity. Earth is spherical and stationary. The calculation runs for up to 6 hours or until the satellite reaches 100 km altitude. An unbound trajectory also stops at six Earth radii from the centre.',
  gravity:'In vacuum, for satellite masses small compared with Earth, altitude and speed determine the initial orbit. Circular speed is v = √(GM/r), and vacuum escape speed is √2 times larger. Perigee and apogee describe the instantaneous orbit if drag were switched off at that moment. A negative perigee intersects the surface.',
  resistance:'Drag dissipates mechanical energy. Its acceleration magnitude is ρ Cᴅ A v²/(2m), with Cᴅ = 2.2 and area A. Density decreases exponentially with altitude on a 35 km scale. The reference density at 200 km is 2.8 × 10⁻¹⁰ kg/m³ times the slider. Zero gives vacuum. This is a teaching model. Actual density varies with time and solar activity.',
  task:'Start at circular speed in vacuum. Reduce the speed and watch the perigee drop. Compare two masses at the same speed, area and density, then check the drag limit.',
  dragSource:'NOAA: satellite drag', image:'Earth photograph',
 },
 it: {
  settings:'Condizioni iniziali', height:'Quota, km', speed:'Velocità tangenziale, km/s', mass:'Massa, kg', area:'Sezione, m²', drag:'Moltiplicatore di densità, ×',
  play:'Avvia', pause:'Pausa', reset:'Torna all’inizio', timeline:'Tempo simulato, min', circular:'Usa velocità circolare', sweep:'Verifica il limite di resistenza', record:'Registra il risultato', journal:'Apri il registro',
  heading:'Che cosa determina l’orbita?', orbit:'Orbita iniziale nel vuoto', circle:'Quasi circolare', ellipse:'Ellittica', open:'Non legata', low:'Ellisse con perigeo sotto 100 km', reference:'Velocità circolare alla quota iniziale, km/s', result:'Esito della simulazione', bound:'Traiettoria legata dopo 6 ore', reentry:'Discesa fino a 100 km', escape:'Uscita dalla scena su traiettoria non legata', unbound:'Traiettoria non legata dopo 6 ore',
  peri:'Perigeo attuale, km', apo:'Apogeo attuale, km', altitude:'Quota attuale, km', instantSpeed:'Velocità attuale, km/s', revolutions:'Giri complessivi',
  range:'Valori provati: 0, 5, …, 100. Massimo valore provato con un giro completo e traiettoria legata sopra 100 km per 6 ore', none:'Nessun valore provato soddisfa entrambe le condizioni per 6 ore.',
  caption:'Vista perpendicolare al piano orbitale. La linea tenue mostra la traiettoria prevista, quella brillante il tratto percorso. Il cerchio tratteggiato indica la quota iniziale.',
  scope:'Il moto inizia alla quota scelta con velocità tangenziale. La Terra è sferica e ferma. Il calcolo dura al massimo 6 ore e si arresta a 100 km di quota o, in fuga, a sei raggi terrestri dal centro.',
  gravity:'Nel vuoto, per un satellite di massa trascurabile, quota e velocità fissano l’orbita. La velocità circolare è √(GM/r), quella di fuga è √2 volte maggiore. Perigeo e apogeo si riferiscono all’orbita istantanea senza resistenza. Un perigeo negativo implica un’intersezione con la superficie.',
  resistance:'La resistenza dissipa energia. L’accelerazione vale ρ Cᴅ A v²/(2m), con Cᴅ = 2,2. La densità diminuisce esponenzialmente su una scala di 35 km. A 200 km, la densità pari a 2,8 × 10⁻¹⁰ kg/m³ è moltiplicata per il valore scelto. Zero equivale al vuoto. La densità reale varia nel tempo e con l’attività solare.',
  task:'Inizia con velocità circolare nel vuoto. Riduci la velocità per abbassare il perigeo. Confronta due masse a parità di velocità, sezione e densità.',
  dragSource:'NOAA: resistenza atmosferica sui satelliti', image:'Foto della Terra',
 },
 es: {
  settings:'Condiciones iniciales', height:'Altitud, km', speed:'Velocidad tangencial, km/s', mass:'Masa, kg', area:'Área transversal, m²', drag:'Multiplicador de densidad, ×',
  play:'Iniciar', pause:'Pausa', reset:'Volver al inicio', timeline:'Tiempo simulado, min', circular:'Usar velocidad circular', sweep:'Comprobar el límite de resistencia', record:'Registrar resultado', journal:'Abrir cuaderno',
  heading:'¿Qué determina la órbita?', orbit:'Órbita inicial en el vacío', circle:'Casi circular', ellipse:'Elíptica', open:'No ligada', low:'Elipse con perigeo inferior a 100 km', reference:'Velocidad circular a la altitud inicial, km/s', result:'Resultado de la simulación', bound:'Trayectoria ligada tras 6 horas', reentry:'Descenso hasta 100 km', escape:'Salida de escena en trayectoria no ligada', unbound:'Trayectoria no ligada tras 6 horas',
  peri:'Perigeo actual, km', apo:'Apogeo actual, km', altitude:'Altitud actual, km', instantSpeed:'Velocidad actual, km/s', revolutions:'Vueltas totales',
  range:'Valores probados: 0, 5, …, 100. Mayor valor probado con una vuelta completa y trayectoria ligada por encima de 100 km durante 6 horas', none:'Ningún valor probado cumple ambas condiciones durante 6 horas.',
  caption:'Vista perpendicular al plano orbital. La línea tenue es la predicción y la brillante, el trecho recorrido. El círculo discontinuo indica la altitud inicial.',
  scope:'El movimiento comienza a la altitud elegida con velocidad tangencial. La Tierra se considera esférica e inmóvil. El cálculo dura hasta 6 horas o termina a 100 km de altitud. En una trayectoria de escape se detiene también a seis radios terrestres del centro.',
  gravity:'En el vacío, para una masa de satélite despreciable, la altitud y la velocidad determinan la órbita inicial. La velocidad circular es √(GM/r) y la de escape es √2 veces mayor. Perigeo y apogeo describen la órbita instantánea sin rozamiento. Un perigeo negativo cruza la superficie.',
  resistance:'La resistencia disipa energía. Su aceleración vale ρ Cᴅ A v²/(2m), con Cᴅ = 2,2. La densidad decrece exponencialmente en una escala de 35 km. A 200 km se usa una referencia de 2,8 × 10⁻¹⁰ kg/m³, multiplicada por el valor del control. Cero representa el vacío. La densidad real varía con el tiempo y con la actividad solar.',
  task:'Empieza con velocidad circular en el vacío. Reduce la velocidad para bajar el perigeo. Compara dos masas con la misma velocidad, área y densidad.',
  dragSource:'NOAA: arrastre atmosférico en satélites', image:'Fotografía de la Tierra',
 },
};

export function mountSatellite(root,{language,query,onRecord,onJournal,onChange}){
 let params=Object.fromEntries(Object.entries(initialOptions).map(([key,[min,max,,value]])=>{
  const n=Number(query.get('sat_'+key));
  return [key,query.has('sat_'+key)&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):value];
 }));
 let run, position=0, frame=0, previous=0, trail, scan=null, renderedTrail=null;
 const $=id=>root.querySelector('#sat-'+id);
 const fmt=(n,d=1)=>n===null?'—':n.toLocaleString(language,{maximumFractionDigits:d});
 const render=()=>{
  const t=labels[language]??labels.uk;
  root.innerHTML=`<div class="sat-layout"><div class="sat-media"><svg id="sat-view" viewBox="0 0 560 440" role="img" aria-label="${t.caption}"></svg><p class="small muted">${t.caption}</p>
  <div class="sat-play"><button class="primary" id="sat-play">${t.play}</button><button class="secondary" id="sat-reset">${t.reset}</button><label>${t.timeline} <output id="sat-minutes"></output><input id="sat-timeline" type="range" min="0" step="1" value="0"></label></div>
  <div id="sat-metrics" class="metrics"></div></div>
  <section class="sat-settings" aria-labelledby="sat-settings"><h3 id="sat-settings">${t.settings}</h3>
  ${Object.entries(initialOptions).map(([key,[min,max,step]])=>`<label class="sat-control" for="sat-${key}"><span>${t[key]}</span><output id="sat-o-${key}"></output><input type="range" id="sat-${key}" min="${min}" max="${max}" step="${step}" value="${params[key]}"></label>`).join('')}
  <button class="secondary" id="sat-circle">${t.circular}</button><button class="secondary" id="sat-sweep">${t.sweep}</button><p id="sat-scan" role="status"></p>
  <button class="secondary" id="sat-record">${t.record}</button><button class="secondary" id="sat-journal">${t.journal}</button></section></div>
  <section id="satelliteTheory" class="black-hole-guide sat-theory"><h3>${t.heading}</h3><p>${t.scope}</p><p>${t.gravity}</p><p>${t.resistance}</p><p>${t.task}</p>
  <p><a href="https://www.spaceweather.gov/impacts/satellite-drag" target="_blank" rel="noopener">${t.dragSource}</a> · <a href="https://science.nasa.gov/resource/the-blue-marble/" target="_blank" rel="noopener">${t.image} · NASA Johnson Space Center, Apollo 17</a></p></section>`;
  for(const key of Object.keys(initialOptions))$(key).oninput=e=>{params[key]=Number(e.currentTarget.value);recompute();};
  $('circle').onclick=()=>{params.speed=Number(circularSpeed(params.height).toFixed(3));$('speed').value=params.speed;recompute();};
  $('play').onclick=()=>{if(frame){pause();return;}if(position>=run.time)position=0;frame=requestAnimationFrame(tick);$('play').textContent=t.pause;};
  $('reset').onclick=()=>{pause();position=0;draw();};
  $('timeline').oninput=e=>{pause();position=Math.min(run.time,Number(e.target.value));draw();};
  $('record').onclick=()=>onRecord({height_m:params.height*1000,mass_kg:params.mass,initial_speed_ms:params.speed*1000,satellite_area_m2:params.area,drag_multiplier:params.drag,orbit_turns:run.turns,satellite_outcome:run.outcome,perigee_m:run.final.perigee,apogee_m:run.final.apogee,satellite_duration_s:run.time},params);
  $('journal').onclick=onJournal;
  $('sweep').onclick=()=>{scan=testedDragLimit(params)??'none';drawScan();};
  renderedTrail=null;draw();
 };
 function drawScan(){
  const t=labels[language];
  const message=scan===null?'':scan==='none'?t.none:t.range+': '+fmt(scan,0)+'×.';
  if($('scan').textContent!==message)$('scan').textContent=message;
 }
 function pause(){cancelAnimationFrame(frame);frame=0;previous=0;if($('play'))$('play').textContent=labels[language].play;}
 function tick(now){
  if(previous)position=Math.min(run.time,position+Math.min(now-previous,50)/1000*1800);
  previous=now;
  draw();
  if(position<run.time)frame=requestAnimationFrame(tick);else pause();
 }
 function recompute(){
  pause();position=0;scan=null;run=simulateSatellite(params);
  const scale=194/run.widest;
  const point=([x,y])=>[280+x*scale,220-y*scale].map(v=>v.toFixed(2)).join(',');
  const stride=Math.max(1,Math.floor(run.points.length/750));
  trail={scale,point,preview:run.points.filter((_,i)=>i%stride===0||i===run.points.length-1).map(s=>point(s.state)).join(' '),stride};
  if($('view')){onChange(params);draw();}
 }
 function draw(){
  const t=labels[language];
  const {scale,point,preview,stride}=trail,r=radius*scale;
  const i=Math.min(run.points.length-1,Math.floor(position/4));
  const sample=position>=run.time?run.points.at(-1):run.points[i];
  const active=run.points.slice(0,i+1).filter((_,j)=>j%stride===0).map(s=>point(s.state));
  active.push(point(sample.state));
  const [x,y]=point(sample.state).split(',');
  const start=(radius+params.height*1000)*scale;
  if(renderedTrail!==trail){
   $('view').innerHTML=`<defs><clipPath id="sat-earth-clip"><circle cx="280" cy="220" r="${r}"/></clipPath></defs>
  <circle cx="280" cy="220" r="${r}" fill="#3b6b96"/><image href="assets/earth-apollo17.webp" x="${280-r}" y="${220-r}" width="${2*r}" height="${2*r}" clip-path="url(#sat-earth-clip)"/>
  <circle cx="280" cy="220" r="${start}" fill="none" stroke="#9db3c7" stroke-opacity=".62" stroke-dasharray="4 5"/>
  <polyline points="${preview}" fill="none" stroke="#96bcd3" stroke-opacity=".55" stroke-width="1.5"/>
  <polyline id="sat-active" fill="none" stroke="#d6df49" stroke-width="2.3"/>
  <circle id="sat-probe" r="5" fill="#d6df49" stroke="#111" stroke-width="1.2"/>`;
   renderedTrail=trail;
  }
  $('active').setAttribute('points',active.join(' '));$('probe').setAttribute('cx',x);$('probe').setAttribute('cy',y);
  $('timeline').max=Math.ceil(run.time);$('timeline').value=position;
  $('minutes').textContent=fmt(sample.time/60,1);
  const initialOrbit=run.initial.energy>=0?t.open:run.initial.perigee<100_000?t.low:run.initial.eccentricity<.01?t.circle:t.ellipse;
  const current=orbitalReadout(sample.state);
  const pairs=[[t.orbit,initialOrbit],[t.result,t[run.outcome]],[t.reference,fmt(circularSpeed(params.height),3)],[t.altitude,fmt(current.altitude)],[t.instantSpeed,fmt(current.speed,3)],[t.peri,fmt(current.perigee)],[t.apo,fmt(current.apogee)],[t.revolutions,fmt(run.turns,2)]];
  $('metrics').innerHTML=pairs.map(([name,value])=>`<div class="metric"><label>${name}</label><strong>${value}</strong></div>`).join('');
  for(const key of Object.keys(initialOptions))$('o-'+key).textContent=fmt(params[key],3);
  drawScan();
 }
 recompute();render();
 return {pause,setLanguage(value){if(language!==value){pause();language=value;render();}},destroy(){pause();root.replaceChildren();}};
}
