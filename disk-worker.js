import {renderDisk} from './disk-renderer.js?v=disk3';
self.onmessage=async({data})=>{
 try{
  const result=await renderDisk(data,{onProgress:progress=>self.postMessage({job:data.job,progress})});
  self.postMessage(result,[result.pixels]);
 }catch(error){self.postMessage({job:data.job,error:String(error?.message||error)});}
};
