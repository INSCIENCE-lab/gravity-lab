// One grid unit follows the new initial separation whenever a run is reset.
// Estimate a bound orbit's size for a stable initial frame, then expand only
// when needed. Distances used by the integrator are never changed here.
export function binaryGridReference(model,previous=null){
 const {m1,m2,speed}=model.p;
 const apo=speed<=1?1:speed*speed/Math.max(.1,2-speed*speed);
 const initialOuter=Math.max(2,1.35*apo*Math.max(m1,m2)/(m1+m2)/.65);
 let outer=previous?.unit===model.length?Math.max(initialOuter,previous.outer):initialOuter;
 const radius=Math.max(...model.positions().map(p=>Math.hypot(...p)));
 // The cube's half-width is 0.65 of the 2D grid radius. A sphere enclosing
 // both centres also fits all inclinations, including an edge-on orbit.
 if(radius>outer*.65/1.15)outer=Math.max(outer*1.2,radius*1.35/.65);
 return {unit:model.length,outer};
}
