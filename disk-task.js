import {renderDisk} from './disk-renderer.js?v=disk3';

// A module worker is an optimization, never a requirement for seeing the disk.
export function startDiskRender(options,{signal,onProgress=()=>{},onFallback=()=>{},workerFactory=()=>new Worker(new URL('./disk-worker.js?v=disk3',import.meta.url),{type:'module'}),timeoutMs=5000,yieldControl}={}){
 return new Promise((resolve,reject)=>{
  let worker=null,timer=null,fallback=false,settled=false;
  const stopWorker=()=>{clearTimeout(timer);if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();worker=null;}};
  const finish=(error,result)=>{if(settled)return;settled=true;stopWorker();signal?.removeEventListener('abort',abort);if(error)reject(error);else resolve(result);};
  const abort=()=>finish(new DOMException('Rendering cancelled','AbortError'));
  const useFallback=error=>{
   if(settled||fallback)return;fallback=true;stopWorker();onFallback(error);
   renderDisk(options,{signal,onProgress:progress=>{if(!settled)onProgress(progress);},yieldControl}).then(result=>finish(null,result),error=>finish(error));
  };
  const armTimeout=()=>{clearTimeout(timer);timer=setTimeout(()=>useFallback(new Error('Worker did not respond')),timeoutMs);};
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
  try{
   worker=workerFactory();
   worker.onmessage=({data})=>{if(settled||fallback)return;if(data?.error){useFallback(new Error(data.error));return;}if(data?.pixels){finish(null,data);return;}if(Number.isFinite(data?.progress)){onProgress(data.progress);armTimeout();}};
   worker.onerror=event=>{event.preventDefault?.();useFallback(new Error(event.message||'Module worker could not load'));};
   worker.onmessageerror=()=>useFallback(new Error('Worker result could not be decoded'));
   armTimeout();worker.postMessage(options);
  }catch(error){useFallback(error);}
 });
}
