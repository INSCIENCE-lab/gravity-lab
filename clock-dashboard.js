import {getLocale,getLanguage} from './locales.js?v=audit2';
import {AU,DAY} from './physics.js?v=palette2';

const L=(lang,uk,en)=>lang==='uk'?uk:en;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formats=new Map();
function number(value,lang,digits=6){
 const key=getLanguage()+':'+digits;
 if(!formats.has(key))formats.set(key,new Intl.NumberFormat(getLocale(),{maximumFractionDigits:digits}));
 return formats.get(key).format(value);
}
export function timeDifference(seconds,lang){
 if(!Number.isFinite(seconds))return '—';
 const magnitude=Math.abs(seconds);
 const [factor,unit]=magnitude>0&&magnitude<1e-6?[1e9,L(lang,'нс','ns')]:magnitude>0&&magnitude<.001?[1e6,L(lang,'мкс','μs')]:magnitude>0&&magnitude<1?[1000,L(lang,'мс','ms')]:[1,L(lang,'с','s')];
 const value=seconds*factor;
 return (value!==0&&Math.abs(value)<.000001?value.toExponential(3):number(value,lang,6))+' '+unit;
}
function distance(m,lang){
 const unit=Math.abs(m)>=AU?AU:1000;
 const value=m/unit;
 return (value!==0&&Math.abs(value)<.000001?value.toExponential(3):number(value,lang,6))+' '+L(lang,unit===AU?'а. о.':'км',unit===AU?'AU':'km');
}
function elapsed(seconds,lang){
 return Math.abs(seconds)<.001?timeDifference(seconds,lang):number(seconds,lang,6)+' '+L(lang,'с','s');
}
function reason(row,lang){
 const reasons={insideBody:['Годинник усередині тіла: зовнішня метрика тут не застосовується.','Clock inside the body: the exterior metric does not apply here.'],insideHorizon:['Нерухомий годинник на горизонті або всередині нього неможливий.','A stationary clock at or inside the horizon is impossible.'],unstableOrbit:['Стабільна кругова орбіта тут неможлива: потрібно r ≥ 3r_s.','No stable circular orbit here: r ≥ 3r_s is required.']};
 const text=reasons[row.reason]||['Цей годинник недоступний.','This clock is unavailable.'];return L(lang,...text);
}

// A radial profile of the exterior Flamm embedding. Both axes use the same
// pixels/metre; each body's frame spans ±3 times its own surface/horizon radius.
export function clockProfile(row){
 const boundary=row.reference_radius_m,outer=3*boundary,pxPerM=45/boundary;
 const z=r=>2*Math.sqrt(row.rs_m*(r-row.rs_m))-2*Math.sqrt(row.rs_m*(outer-row.rs_m));
 const point=(r,side=1)=>[170+side*r*pxPerM,30-z(r)*pxPerM];
 const paths=[-1,1].map(side=>Array.from({length:97},(_,i)=>point(boundary+(outer-boundary)*(i/96)**2,side)));
 const visible=row.valid&&row.radius_m>=boundary&&row.radius_m<=outer;
 return {boundary,outer,pxPerM,paths,visible,clock:visible?point(row.radius_m):null};
}

export function profileSVG(row,lang){
 const profile=clockProfile(row),boundary=L(lang,row.height_reference==='surface'?'Поверхня':'Горизонт',row.height_reference==='surface'?'Surface':'Horizon');
 const points=profile.paths.map(path=>path.map(p=>p.map(v=>v.toFixed(3)).join(',')).join(' '));
 const marker=profile.clock?`<circle cx="${profile.clock[0]}" cy="${profile.clock[1]}" r="4" fill="${row.color}" stroke="#f5f7fb" stroke-width="1.5"/>`:'';
 return `<svg class="clock-profile" viewBox="0 0 340 214" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="profile-title-${row.body} profile-desc-${row.body}">
 <title id="profile-title-${row.body}">${esc(row.label)}: ${L(lang,'радіальний профіль просторового зрізу','radial profile of a spatial slice')}</title>
 <desc id="profile-desc-${row.body}">${L(lang,'Власний масштаб; радіус і висота вкладення мають однакову шкалу. Внутрішня область вилучена.','Independent scale; radius and embedding height share one scale. The interior is omitted.')} B = ${distance(profile.boundary,lang)}.</desc>
 <g fill="none" stroke="#2b394d" stroke-width=".7"><path d="M35 30H305M35 75H305M35 120H305M35 165H305M35 30V165M80 30V165M125 30V165M170 30V165M215 30V165M260 30V165M305 30V165"/></g>
 <rect x="125" y="26" width="90" height="140" fill="#111829"/><path d="M125 26V166M215 26V166" stroke="${row.color}" stroke-opacity=".45" stroke-dasharray="3 4"/>
 <g fill="#8999ae" font-size="10" font-family="NAMU, sans-serif" text-anchor="middle"><text x="35" y="19">r = 3B</text><text x="305" y="19">r = 3B</text><text x="170" y="84">${L(lang,'Внутрішня','Interior')}</text><text x="170" y="99">${L(lang,'область вилучена','omitted')}</text><text x="170" y="146" fill="${row.color}">${boundary}: r = B</text></g>
 ${points.map(p=>`<polyline points="${p}" fill="none" stroke="${row.color}" stroke-width="2"/>`).join('')}${marker}
 <path d="M35 184V192M35 188H80M80 184V192" fill="none" stroke="#d0dbe9"/>
 <text x="35" y="207" fill="#bdcadb" font-size="11" font-family="NAMU, sans-serif">B = ${distance(profile.boundary,lang)}</text>
 </svg>`;
}

// A common logarithmic radius axis, in km. Dot position encodes radius, not area.
export function radiusScaleX(radiusM){return 162+Math.log10(radiusM/1e6)*45;}
export function radiusComparisonSVG(rows,lang){
 return `<svg class="clock-radius-chart" viewBox="0 0 760 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="radius-chart-title radius-chart-desc">
 <title id="radius-chart-title">${L(lang,'Радіуси на спільній логарифмічній шкалі','Radii on a shared logarithmic scale')}</title>
 <desc id="radius-chart-desc">${L(lang,'Радіуси поверхонь Землі й Сонця та горизонтів двох чорних дір. Кожен крок праворуч означає збільшення радіуса вдесятеро.','Surface radii of Earth and the Sun and horizon radii of two black holes. Each step to the right means a tenfold increase in radius.')}</desc>
 <g font-family="NAMU, sans-serif" font-size="11" fill="#aebcd0">${Array.from({length:10},(_,i)=>`<path d="M${162+i*45} 20V196" stroke="#28364b"/><text x="${162+i*45}" y="219" text-anchor="middle">10<tspan baseline-shift="super" font-size="8">${i+3}</tspan></text>`).join('')}<text x="584" y="236">${L(lang,'км','km')}</text></g>
 ${rows.map((row,i)=>{const y=42+i*45,x=radiusScaleX(row.reference_radius_m);return `<g font-family="NAMU, sans-serif"><text x="10" y="${y}" fill="${row.color}" font-size="13">${esc(row.label)}</text><text x="10" y="${y+15}" fill="#8999ae" font-size="10">${L(lang,row.height_reference==='surface'?'поверхня':'горизонт',row.height_reference==='surface'?'surface':'horizon')}</text><path d="M162 ${y}H567" stroke="#344359" stroke-width="1"/><circle data-radius-body="${row.body}" cx="${x}" cy="${y}" r="5" fill="${row.color}"><title>${esc(row.label)}: ${distance(row.reference_radius_m,lang)}</title></circle><text x="594" y="${y}" fill="#dbe4ee" font-size="12">${number(row.reference_radius_m/1000,lang,0)} ${L(lang,'км','km')}</text><text x="594" y="${y+16}" fill="#8999ae" font-size="10">${number(row.reference_radius_m/AU,lang,8)} ${L(lang,'а. о.','AU')}</text></g>`;}).join('')}
 </svg>`;
}

function dial(row,lang){
 return `<svg class="comparison-dial" viewBox="0 0 100 100" role="img" aria-label="${esc(row.label)}: ${L(lang,'порівняння темпу годинника з еталоном','clock rate compared with the reference')}"><circle cx="50" cy="50" r="44" fill="#0b1424" stroke="${row.color}" stroke-opacity=".65"/>${Array.from({length:12},(_,i)=>`<path d="M50 9V14" stroke="#7a8ca6" transform="rotate(${i*30} 50 50)"/>`).join('')}<path id="clock-reference-${row.body}" d="M50 50V19" stroke="#b9c1cf" stroke-width="2" stroke-dasharray="3 3"/>${row.valid?`<path id="clock-local-${row.body}" d="M50 54V24" stroke="${row.color}" stroke-width="3" stroke-linecap="round"/>`:'<path d="M38 38L62 62M38 62L62 38" stroke="#eea26c" stroke-width="2"/>'}<circle cx="50" cy="50" r="3" fill="#e5e9ed"/></svg>`;
}

export function dashboardHTML(rows,lang,T=rows.find(row=>row.reference_s)?.reference_s||DAY){
 const days=T/DAY,dayWord=lang==='en'?(days===1?'day':'days'):days%10===1&&days%100!==11?'доба':[2,3,4].includes(days%10)&&![12,13,14].includes(days%100)?'доби':'діб';
 return `<div class="clock-dashboard-heading"><span class="clock-eyebrow">${L(lang,'ОДИН ЕТАЛОН · ЧОТИРИ ГОДИННИКИ','ONE REFERENCE · FOUR CLOCKS')}</span><h3>${L(lang,'Скільки часу мине тут?','How much time passes here?')}</h3><p>${L(lang,'Еталонний інтервал','Reference interval')}: <strong>T = ${number(days,lang)} ${dayWord} = ${number(T,lang)} ${L(lang,'с','s')}</strong>. ${L(lang,'Еталон розташований далеко від кожного об’єкта.','The reference is far from each object.')}</p></div>
 <div class="clock-hand-key"><span><i class="reference-key"></i>${L(lang,'сірий пунктир — еталон','grey dashed hand — reference')}</span><span><i class="local-key"></i>${L(lang,'кольорова — місцевий годинник','coloured hand — local clock')}</span></div>
 <p class="clock-help">${L(lang,'Натисни «Почати дослід»: один оберт еталона — 10 секунд демонстрації. Числа нижче — результат за весь обраний інтервал T. Для Землі та Сонця дивись насамперед числове відставання.','Select “Start experiment”: one reference revolution represents 10 demonstration seconds. Numbers below give the result for the full selected interval T. For Earth and the Sun, focus on the numerical deficit.')}</p>
 <div class="clock-card-grid">${rows.map(row=>{
 const profile=clockProfile(row),source=L(lang,row.height_reference==='surface'?'Поверхня':'Горизонт подій',row.height_reference==='surface'?'Surface':'Event horizon');
 return `<article class="clock-card" style="--body-color:${row.color}"><header><h4>${esc(row.label)}</h4><span>${source}</span></header><div class="clock-rate-row">${dial(row,lang)}<div><span>${L(lang,'Темп місцевого часу','Local clock rate')}</span><strong>dτ/dt = ${row.valid?number(row.rate,lang,12):'—'}</strong><small>${L(lang,row.observer==='static'?'Нерухомий годинник':'На круговій орбіті',row.observer==='static'?'Stationary clock':'Circular orbit')}</small></div></div>
 <div class="clock-reading"><span>${L(lang,'Тут минуло, τ','Time elapsed here, τ')}</span><strong>${row.valid?'≈ '+elapsed(row.proper_s,lang):'—'}</strong></div>
 <div class="clock-deficit"><span>${L(lang,'Відставання від еталона, T − τ','Behind the reference, T − τ')}</span><strong>${row.valid?'≈ '+timeDifference(row.lost_s,lang):'—'}</strong></div>
 ${!row.valid?`<p class="clock-warning">${reason(row,lang)}</p>`:''}
 <dl class="clock-distances"><div><dt>${source}, B</dt><dd>${distance(row.reference_radius_m,lang)}</dd></div><div><dt>${L(lang,'Висота годинника, h','Clock height, h')}</dt><dd>${distance(row.height_m,lang)}</dd></div><div><dt>${L(lang,'Від центра, r','From the centre, r')}</dt><dd>${distance(row.radius_m,lang)}</dd></div></dl>
 <div class="clock-local-heading"><span>2D · ${L(lang,'просторовий зріз','spatial slice')}</span><strong>${L(lang,'ВЛАСНИЙ МАСШТАБ','INDEPENDENT SCALE')}</strong></div>${profileSVG(row,lang)}
 <p class="clock-profile-note">${row.valid?profile.visible?L(lang,'Кольорова точка — положення годинника.','Coloured point — clock location.'):L(lang,'Годинник за межами схеми (r > 3B); його покази обчислено на заданій відстані.','Clock outside this diagram (r > 3B); its readings use the selected distance.'):L(lang,'Для вибраного положення або типу спостерігача допустимого годинника немає.','No valid clock for this position or observer type.')}</p></article>`;
 }).join('')}</div>
 <p class="clock-help">${L(lang,'Кожна схема охоплює r від B до 3B та має власну лінійку. Вертикаль — допоміжна висота вкладення z, а не час. Біля Землі й Сонця профіль майже плоский: викривлення тут не підсилюється штучно. Однакова форма двох чорних дір у цих масштабах не означає однаковий розмір.','Each diagram spans r from B to 3B and has its own ruler. The vertical coordinate is an auxiliary embedding height z, not time. Earth and Sun profiles are almost flat: curvature is not artificially amplified. The similar black-hole profiles at these scales do not mean equal physical sizes.')}</p>
 <section class="clock-size-comparison"><h4>${L(lang,'А які їхні справжні розміри?','How large are they in reality?')}</h4><p>${L(lang,'Спільна логарифмічна шкала радіусів: один крок праворуч = ×10. Порівнюємо поверхні Землі й Сонця з горизонтами чорних дір. Розмір кружечка умовний; радіус задає його положення.','Shared logarithmic radius scale: one step to the right = ×10. Earth and Sun surfaces are compared with black-hole horizons. Dot sizes are symbolic; position encodes radius.')}</p><div class="clock-chart-scroll" tabindex="0" role="region" aria-label="${L(lang,'Порівняння радіусів, горизонтальне прокручування','Radius comparison, horizontally scrollable')}">${radiusComparisonSVG(rows,lang)}</div></section>`;
}

export function updateClockHands(rows,time,getElement){
 const angle=seconds=>((seconds/10*360)%360).toFixed(6);
 for(const row of rows){
  getElement('clock-reference-'+row.body)?.setAttribute('transform',`rotate(${angle(time)} 50 50)`);
  if(row.valid)getElement('clock-local-'+row.body)?.setAttribute('transform',`rotate(${angle(time*row.rate)} 50 50)`);
 }
}
