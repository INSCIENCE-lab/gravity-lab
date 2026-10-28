const L=(lang,uk,en)=>lang==='uk'?uk:en;
const nf=(n,lang,d=2)=>new Intl.NumberFormat(lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:d}).format(n);

// Fix the scale to the INITIAL height, so the object moves across the frame
// during a fall. Re-fitting to its current height would hide that motion.
export function surfaceHeightScale(initialHeight){
 const target=1.25*(initialHeight>0?initialHeight:1),power=10**Math.floor(Math.log10(target));
 return [1,2,5,10].find(n=>n*power>=target)*power;
}
function arrow(scene,x,y,dy,color,label){
 const c=scene.ctx,end=y+dy;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;
 c.beginPath();c.moveTo(x,y);c.lineTo(x,end);c.stroke();
 c.beginPath();c.moveTo(x,end);c.lineTo(x-4,end-Math.sign(dy)*7);c.lineTo(x+4,end-Math.sign(dy)*7);c.closePath();c.fill();
 scene.text(label,x+8,y+dy*.6,color,11);
}

export function drawSurfaceLocal(scene,p,s,lang){
 const top=surfaceHeightScale(p.height),height=s.height_m,fall=p.support==='fall',c=scene.ctx;
 scene.clear(1);scene.S=Math.min(scene.W*.46,scene.H*.65)*Math.min(scene.zoom,1.5);scene.cx=scene.W*.52;scene.cy=scene.H*.75;
 const extent=.52,corners=[[-extent,-extent,0],[extent,-extent,0],[extent,extent,0],[-extent,extent,0]].map(v=>scene.project(v));
 c.fillStyle='#152b2b';c.beginPath();corners.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
 for(let i=-3;i<=3;i++){const a=i*extent/3;scene.line([a,-extent,0],[a,extent,0],'#496f6b66',.8);scene.line([-extent,a,0],[extent,a,0],'#496f6b66',.8);}
 const body=[0,0,height/top],pos=scene.project(body),base=scene.project([0,0,0]),upper=scene.project([0,0,1]);
 c.fillStyle='#050d1688';c.beginPath();c.ellipse(base[0],base[1],17,6,0,0,Math.PI*2);c.fill();
 scene.line([0,0,0],body,'#a9c5d3aa',1,true);
 scene.text('h = 0',base[0]+22,base[1]+18,'#b7d2c7',10);
 const rulerX=48,unit=top>=1000?1000:1,unitLabel=L(lang,unit===1000?'км':'м',unit===1000?'km':'m');
 c.strokeStyle='#7d94a6';c.lineWidth=1;c.beginPath();c.moveTo(rulerX,base[1]);c.lineTo(rulerX,upper[1]);c.stroke();
 for(let i=0;i<=5;i++){
  const y=base[1]+(upper[1]-base[1])*i/5;
  c.strokeStyle='#8c9fae';c.beginPath();c.moveTo(rulerX-4,y);c.lineTo(rulerX+4,y);c.stroke();
  scene.text(nf(top*i/5/unit,lang,3),rulerX-8,y+3,'#adc0cc',10,'right');
 }
 scene.text('h ('+unitLabel+')',rulerX-20,upper[1]-14,'#c8d8df',11);
 c.setLineDash([3,5]);c.strokeStyle='#bfd29555';c.beginPath();c.moveTo(rulerX+6,pos[1]);c.lineTo(pos[0]-15,pos[1]);c.stroke();c.setLineDash([]);
 if(fall&&p.height>0){const start=scene.project([0,0,p.height/top]);c.setLineDash([3,4]);c.strokeStyle='#a1b17d88';c.beginPath();c.moveTo(start[0]-25,start[1]);c.lineTo(start[0]+25,start[1]);c.stroke();c.setLineDash([]);scene.text('h₀',start[0]-35,start[1]-6,'#a7b58e',10);}
 if(!fall){c.strokeStyle='#80caca';c.lineWidth=4;c.beginPath();c.moveTo(pos[0]-29,pos[1]+3);c.lineTo(pos[0]+29,pos[1]+3);c.stroke();scene.text(L(lang,'Опора','Support'),pos[0]-31,pos[1]+20,'#80caca',10);}
 scene.surfaceObject(p.object,pos);
 const names={person:['Людина','Person'],car:['Автомобіль','Car'],house:['Будинок','House'],block:['Брусок','Block']};
 scene.text(L(lang,...names[p.object]),pos[0],pos[1]-43,'#d5e997',12,'center');
 arrow(scene,pos[0]+35,pos[1]-15,46,'#eead77','F');
 if(!fall)arrow(scene,pos[0]+65,pos[1]-15,-46,'#80caca','N');
 if(fall&&s.speed_ms>0)arrow(scene,pos[0]-35,pos[1]-15,Math.min(60,25+s.speed_ms*.3),'#b4a1e4','v');
 const displayHeight=height>=1000?nf(height/1000,lang,3)+' '+L(lang,'км','km'):nf(height,lang,3)+' '+L(lang,'м','m');
 scene.text('h = '+displayHeight+' · |v| = '+nf(s.speed_ms,lang,2)+' m/s',18,55,'#d4e3c2',13);
 scene.text(fall?L(lang,'N = 0 · невагомість','N = 0 · weightlessness'):L(lang,'N = F · тіло на опорі','N = F · supported body'),18,77,fall?'#b4a1e4':'#80caca',11);
 scene.text(L(lang,'Поверхня Землі · h = 0','Earth’s surface · h = 0'),scene.W-18,scene.H-54,'#91b5a8',11,'right');
 scene.text(L(lang,'Масштаб висоти: 0–','Height scale: 0–')+nf(top/unit,lang,3)+' '+unitLabel,18,scene.H-34,'#9eb2c4',10);
 scene.text(L(lang,'Тіло та стрілки умовного розміру. F спрямована до центра Землі.','Body and arrow sizes are symbolic. F points towards Earth’s centre.'),18,scene.H-17,'#7c94ac',scene.W<550?8:9);
}

export function surfaceViewTheory(lang){
 return lang==='uk'?`<h3>Як читати масштаб і запускати падіння</h3><p>«Біля поверхні» показує збільшену локальну ділянку зі шкалою висоти в метрах або кілометрах. Шкала підбирається за початковою висотою h₀ та залишається незмінною під час падіння. Тому рух видно і з 1 м, і зі 100 км. Пунктир позначає початкову висоту. Плоска ділянка є локальною схемою; прискорення обчислюється за сферичною моделлю g(h) = GM/(R + h)². Розміри значків тіл і довжини стрілок умовні. У вкладці «Земля цілком» відстань R + h показано у масштабі радіуса Землі, тому малі висоти майже непомітні.</p><p>Встанови h₀ &gt; 0, обери «Вільне падіння» та натисни «Почати дослід». Опора зникає, N = 0, а сила тяжіння залишається. Тіло починає рух зі стану спокою; змінюються h, швидкість і час. «Пауза» зупиняє дослід, а «Скинути» повертає тіло на h₀. При h₀ = 0 тіло вже на поверхні: спочатку задай додатну висоту. У режимі «На опорі» тіло залишається нерухомим на заданій висоті.</p><p>Графік світової лінії для цього досліду показує висоту h відносно поверхні та ct; координати події у CSV залишаються геоцентричними, з z = R + h. Падіння завершується в момент контакту; удар і подальший рух не моделюються.</p>`:
 `<h3>Reading the scale and starting a fall</h3><p>“Near the surface” shows an enlarged local patch with a height ruler in metres or kilometres. Its scale follows initial height h₀ and stays fixed during a fall, making motion visible from both 1 m and 100 km. A dashed line marks the initial height. The flat patch is a local diagram; acceleration uses the spherical model g(h) = GM/(R + h)². Body glyphs and force arrows have symbolic sizes. “Whole Earth” uses Earth's radius as its scale, so small heights are barely visible.</p><p>Set h₀ &gt; 0, choose “Free fall” and select “Start experiment”. The support disappears, N = 0, while gravity remains. The body starts from rest and its height, speed and time change. “Pause” freezes the experiment and “Reset” returns to h₀. At h₀ = 0 the body is already on the surface: first set a positive height. In “Supported” mode it stays at the selected height.</p><p>The worldline plot shows surface-relative height h and ct. CSV event coordinates remain geocentric, with z = R + h. The fall ends at contact; the collision and subsequent motion are not modelled.</p>`;
}
