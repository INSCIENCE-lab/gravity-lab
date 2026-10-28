// Only a running experiment owns an animation frame. A generation token also
// rejects callbacks that were already queued when pause/reset was pressed.
export class AnimationLoop {
 // Browser animation methods require Window as their receiver. Wrappers keep
 // that receiver when the scheduler invokes this.request()/this.cancel().
 constructor(tick,{request=callback=>globalThis.requestAnimationFrame(callback),cancel=id=>globalThis.cancelAnimationFrame(id),interval=45,maxDelta=.06}={}){
  this.tick=tick;this.request=request;this.cancel=cancel;this.interval=interval;this.maxDelta=maxDelta;
  this.active=false;this.frameId=null;this.generation=0;this.last=null;
 }
 start(){
  if(this.active)return;
  this.active=true;this.last=null;this.schedule(++this.generation);
 }
 stop(){
  this.active=false;this.generation++;
  if(this.frameId!==null)this.cancel(this.frameId);
  this.frameId=null;this.last=null;
 }
 schedule(generation){
  this.frameId=this.request(now=>{
   if(!this.active||generation!==this.generation)return;
   this.frameId=null;
   if(this.last===null)this.last=now;
   else if(now-this.last>=this.interval){
    const dt=Math.min(this.maxDelta,Math.max(0,(now-this.last)/1000));
    this.last=now;this.tick(dt);
   }
   if(this.active&&generation===this.generation)this.schedule(generation);
  });
 }
}
