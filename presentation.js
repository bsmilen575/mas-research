'use strict';
(()=>{
 const button=document.getElementById('fullscreen-toggle');
 if(!document.fullscreenEnabled){button.hidden=true;return;}
 const sync=()=>{button.textContent=document.fullscreenElement?'Exit fullscreen ⛶':'Fullscreen ⛶';button.setAttribute('aria-pressed',String(!!document.fullscreenElement));};
 button.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{button.textContent='Use browser fullscreen';}});
 document.addEventListener('fullscreenchange',sync);sync();
})();
