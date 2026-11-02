// Keep detailed reading notes after the controls/results on narrow screens.
// Restore the original desktop position without replacing any experiment nodes.
const notes=document.getElementById('geometryLearning');
const theory=document.getElementById('theory');
if(notes&&theory){
 const home=document.createComment('desktop geometry notes');notes.before(home);
 const mobile=matchMedia('(max-width:760px)');
 const arrange=()=>{if(mobile.matches)theory.before(notes);else home.after(notes);};
 mobile.addEventListener('change',arrange);arrange();
}
