// Viewing geometry is independent of launch parameters and physical dynamics.
export const minViewSpan=.05,maxViewSpan=1e6;
export const clampSpan=span=>Math.max(minViewSpan,Math.min(maxViewSpan,span));
export function viewport(width,height,span=50){
 const left=58,right=23,top=62,bottom=47;
 const plotWidth=Math.max(1,width-left-right),plotHeight=Math.max(1,height-top-bottom);
 const xMax=clampSpan(span),scale=plotWidth/xMax,yMax=plotHeight/scale;
 return{left,right,top,bottom,plotWidth,plotHeight,xMax,yMax,scale,
  x:x=>left+x*scale,y:y=>height-bottom-y*scale};
}
export function niceStep(value){
 const power=10**Math.floor(Math.log10(Math.max(1e-12,value))),fraction=value/power;
 return (fraction<=1?1:fraction<=2?2:fraction<=5?5:10)*power;
}
export function gridStep(view,width){return niceStep(Math.max(view.xMax,view.yMax)/(width<420?3:6));}
export function fitSpan(width,height,flights){
 const view=viewport(width,height,50);
 const extent=Math.max(.1,...flights.map(f=>Math.max(1.1*f.L,1.15*f.H*view.plotWidth/view.plotHeight)));
 const step=niceStep(extent/6);
 return clampSpan(Math.ceil(extent/step)*step);
}

// Expand on parameter changes, without erasing size comparisons by shrinking.
// Explicit zoom and fit remain separate user actions.
export function expandedSpan(width,height,currentSpan,flights){
 const view=viewport(width,height,currentSpan);
 const needsSpace=flights.some(f=>1.1*f.L>view.xMax||1.15*f.H>view.yMax);
 return needsSpace?Math.max(currentSpan,fitSpan(width,height,flights)):currentSpan;
}
