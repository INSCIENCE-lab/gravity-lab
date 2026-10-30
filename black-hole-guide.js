import {MSUN,rg} from './physics.js?v=fullaudit2';

// Relative mode follows the physical gravitational radius; fixed mode retains
// the last physical grid. Neither changes the geodesic calculation.
export function schwarzReference(mass,r0,mode='relative',previous=null){
 if(mode==='fixed'&&previous)return previous;
 return {unit:rg(mass*MSUN),outer:Math.max(24,r0*1.45)};
}

export function lensReference(mass,mode='relative',previous=null){
 if(mode==='fixed'&&previous)return previous;
 return {unit:rg(mass*MSUN),outer:45};
}

export function lensScaleTheory(lang){
 return lang==='uk'?`<h3>Чому при зміні маси лінзування залишається видимим?</h3>
<p>Модель працює для зоряних і надмасивних чорних дір у доступному діапазоні мас. Автоматичний масштаб задає 1 одиницю сітки = r_g = GM/c² поточної чорної діри. Горизонт має радіус 2r_g, фотонна сфера — 3r_g. Тому при зміні маси поблизу горизонту залишаються видимими і деформація сітки, і вигнуті траєкторії світла. Фізичні розміри сітки й променів у кілометрах змінюються пропорційно M.</p>
<div class="eq">r_g = GM/c², &nbsp; r_s = 2r_g, &nbsp; t_g = GM/c³<br>R = r/r_g, &nbsp; β = b/r_g, &nbsp; T = ct/r_g<br>b = βr_g, &nbsp; b_crit = 3√3r_g<br>α_weak ≈ 4r_g/b = 4/β при β ≫ 1</div>
<p>Повзунок задає β = b/r_g, а не b у кілометрах. За незмінного β форма геодезичної в одиницях r_g та кут відхилення однакові для різних мас; фізичний прицільний параметр b і часовий масштаб t_g пропорційні M. Щоб побачити зміну відхилення, змінюй b/r_g. Для порівняння за незмінного фізичного b потрібно змінювати β обернено пропорційно масі в межах доступного діапазону.</p>
<p>Наприклад, для 10 M☉ маємо r_s ≈ 29,53 км та b ≈ 103,36 км при β = 7. Режим «Фіксовано · у метрах» зберігає фізичний масштаб 3D-куба й 2D-сітки. Після значного зменшення маси область сильного викривлення тоді може стати меншою за піксель; попередження підкаже натиснути «Підібрати масштаб» або повернути автоматичний режим. Цей вибір змінює лише сітку, не значення β. Вкладка «3D-сцена» завжди використовує r_g; осі світової лінії мають власні масштаби.</p>`:
`<h3>Why does lensing remain visible when mass changes?</h3>
<p>The model supports stellar-mass and supermassive black holes within the available mass range. Automatic scale sets 1 grid unit = the current black hole's r_g = GM/c². The horizon radius is 2r_g and the photon-sphere radius is 3r_g. Grid deformation and bent light paths therefore remain resolved near the horizon when mass changes. Physical grid and ray sizes in kilometres scale with M.</p>
<div class="eq">r_g = GM/c², &nbsp; r_s = 2r_g, &nbsp; t_g = GM/c³<br>R = r/r_g, &nbsp; β = b/r_g, &nbsp; T = ct/r_g<br>b = βr_g, &nbsp; b_crit = 3√3r_g<br>α_weak ≈ 4r_g/b = 4/β for β ≫ 1</div>
<p>The slider sets β = b/r_g, not b in kilometres. At fixed β, the geodesic shape in r_g units and deflection angle are the same for different masses; physical impact parameter b and time unit t_g scale with M. Change b/r_g to see a different deflection. To compare at fixed physical b, change β inversely with mass within the available range.</p>
<p>For example, 10 M☉ gives r_s ≈ 29.53 km and b ≈ 103.36 km at β = 7. “Fixed · in metres” retains the physical grid scale of the 3D cube and 2D grid. After a large mass decrease, the strongly curved region can become smaller than a pixel; a warning suggests “Fit scale” or automatic mode. This choice affects the grid only, not β. The “3D scene” view always uses r_g; the worldline axes have independent scales.</p>`;
}

export function blackHoleTheory(lang){
 return lang==='uk'?`<h3>Що таке пробне тіло?</h3>
<p>Пробне тіло — малий масивний об’єкт, рух якого показує, як діє задана геометрія простору-часу. Тут можна уявити невеликий космічний апарат із вимкненими двигунами та годинником на борту. Його маса m набагато менша за масу чорної діри M, тобто m/M ≪ 1. Власним гравітаційним полем, впливом на чорну діру, обертанням і протяжністю апарата нехтуємо. На екрані його розмір умовно збільшено.</p>
<p>Тіло перебуває у вільному падінні: рухається часоподібною геодезичною, а його годинник відлічує власний час τ. Ненульова маса відрізняє його від фотона. За однакових початкових положення й локальної швидкості траєкторія в цьому наближенні не залежить від m; тому окремого повзунка маси пробного тіла немає. Взаємодія з газом, робота двигунів, припливне руйнування та втрата орбітальної енергії через гравітаційні хвилі тут не розраховуються. Модель не описує пару тіл зі співмірними масами.</p>
<div class="eq">d²x<sup>μ</sup>/dτ² + Γ<sup>μ</sup><sub>αβ</sub>(dx<sup>α</sup>/dτ)(dx<sup>β</sup>/dτ) = 0<br>g<sub>μν</sub>u<sup>μ</sup>u<sup>ν</sup> = −c², &nbsp; m/M ≪ 1</div>
<h3>Зоряна чи надмасивна чорна діра: як змінюється масштаб?</h3>
<p>Ця реалізація метрики Шварцшильда працює для зоряних і надмасивних чорних дір у доступному діапазоні мас. Припущення ті самі: сферична, незаряджена чорна діра без обертання, пробне тіло та зовнішня область r &gt; 2r_g. Реальні чорні діри можуть обертатися; обертання ця модель не враховує.</p>
<div class="eq">r_g = GM/c² ≈ 1,477(M/M☉) km<br>r_s = 2r_g ≈ 2,953(M/M☉) km<br>t_g = GM/c³ ≈ 4,926(M/M☉) μs<br>R = r/r_g, &nbsp; T = ct/r_g<br>ds²/r_g² = −(1 − 2/R)dT² + dR²/(1 − 2/R) + R²dΩ²</div>
<p>Для M = 10 M☉ горизонт має радіус близько 29,53 км, а початкова орбіта R₀ = 12 — радіус 177,2 км від центра. Якщо залишити сітку, підібрану для мільйонів сонячних мас, ці області стають надто малими на екрані. Це наслідок масштабу зображення.</p>
<p><strong>«Автоматично · у r_g»</strong> підлаштовує фізичну одиницю сітки під поточну масу. За однакових R та початкових безрозмірних швидкостей форма орбіти й геометрії в цих одиницях збігається; фізичні довжини й часи пропорційні M. <strong>«Фіксовано · у метрах»</strong> зберігає фізичну сітку для порівняння поля в тих самих координатних точках. Кнопка «Підібрати масштаб» встановлює новий масштаб для поточної маси. Ці режими керують 3D-кубом і 2D-сіткою; камера акреційного диска має власні налаштування.</p>
<div class="eq">K = 48r_g²/r⁶ = 48/(r_g⁴R⁶)</div>
<p>Однакова форма в одиницях r_g не означає однакову фізичну кривину: за сталого R інваріант K ∝ M⁻⁴. Для меншої чорної діри він більший. За сталої фізичної координати r натомість K ∝ M², доки точка лишається зовні горизонту. Деформація 3D-куба є наочною схемою, а K та часові фактори обчислюються з метрики.</p>`:
`<h3>What is a test body?</h3>
<p>A test body is a small massive object whose motion probes a prescribed spacetime geometry. Imagine a small spacecraft with its engines off and a clock on board. Its mass m is much smaller than the black-hole mass M: m/M ≪ 1. We neglect its gravitational field, backreaction on the black hole, spin and spatial extent. Its marker is enlarged for visibility.</p>
<p>The body is freely falling along a timelike geodesic; its clock records proper time τ. It has nonzero mass, unlike a photon. Given the same initial position and local velocity, its trajectory is independent of m in this approximation, so there is no test-mass slider. Gas interactions, thrust, tidal disruption and orbital energy loss to gravitational waves are not calculated. This model does not describe a comparable-mass binary.</p>
<div class="eq">d²x<sup>μ</sup>/dτ² + Γ<sup>μ</sup><sub>αβ</sub>(dx<sup>α</sup>/dτ)(dx<sup>β</sup>/dτ) = 0<br>g<sub>μν</sub>u<sup>μ</sup>u<sup>ν</sup> = −c², &nbsp; m/M ≪ 1</div>
<h3>Stellar or supermassive: how does the scale change?</h3>
<p>This Schwarzschild implementation supports both stellar-mass and supermassive black holes within the available mass range. It assumes a spherical, uncharged, nonrotating black hole, a test body and the exterior region r &gt; 2r_g. Real black holes may rotate; spin is not included here.</p>
<div class="eq">r_g = GM/c² ≈ 1.477(M/M☉) km<br>r_s = 2r_g ≈ 2.953(M/M☉) km<br>t_g = GM/c³ ≈ 4.926(M/M☉) μs<br>R = r/r_g, &nbsp; T = ct/r_g<br>ds²/r_g² = −(1 − 2/R)dT² + dR²/(1 − 2/R) + R²dΩ²</div>
<p>For M = 10 M☉, the horizon radius is about 29.53 km and an initial orbit at R₀ = 12 lies 177.2 km from the centre. On a grid fitted to millions of solar masses these regions become too small to see. This is an image-scale effect.</p>
<p><strong>“Automatic · in r_g”</strong> follows the current gravitational radius. At equal R and dimensionless initial velocities, orbit and geometry shapes match in these units; physical lengths and times scale with M. <strong>“Fixed · in metres”</strong> preserves the physical grid to compare the field at the same coordinate points. “Fit scale” sets a fresh scale for the current mass. These modes control the 3D cube and 2D grid; the accretion-disk camera has independent settings.</p>
<div class="eq">K = 48r_g²/r⁶ = 48/(r_g⁴R⁶)</div>
<p>Equal shapes in r_g units do not imply equal physical curvature: at fixed R, the invariant K ∝ M⁻⁴ and is larger for a smaller black hole. At fixed physical r instead, K ∝ M² while the point remains outside the horizon. The deformed 3D cube is an illustrative diagram; K and clock factors are calculated from the metric.</p>`;
}
