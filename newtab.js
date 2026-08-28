document.body.style.backgroundImage='url(bg/'+(1+Math.floor(Math.random()*12))+'.jpg)';
const K='tiles',$=document.getElementById.bind(document);
let T=JSON.parse(localStorage.getItem(K)||'null')||[{n:'Claude',u:'https://claude.ai'},{n:'Gmail',u:'https://mail.google.com'},{n:'YouTube',u:'https://youtube.com'}];
let edit=0,di=null;
const save=()=>localStorage.setItem(K,JSON.stringify(T));
function draw(){
 const g=$('g');g.textContent='';
 T.forEach((t,i)=>{
  const a=document.createElement('a');a.href=t.u;a.draggable=true;
  const d=document.createElement('div');d.className='i';
  const im=new Image();
  const ck='ic:'+t.u, cached=localStorage.getItem(ck);
  const host=new URL(t.u).hostname.replace(/^www\./,'');
  let stage=0;
  if(cached){im.src=cached;stage=9}
  else{im.src=t.ic||('https://'+host+'/apple-touch-icon.png');stage=t.ic?1:2}
  const nx=()=>{
    if(stage<2){stage=2;im.src='https://'+host+'/apple-touch-icon.png';return}
    if(stage<2.5){stage=2.5;im.src='https://icons.duckduckgo.com/ip3/'+host+'.ico';return}
    if(stage<2.8){stage=2.8;im.src='https://icons.duckduckgo.com/ip3/'+host+'.ico';return}
    if(stage<3){stage=3;im.src='chrome-extension://'+chrome.runtime.id+'/_favicon/?pageUrl='+encodeURIComponent(t.u)+'&size=64';return}
    im.remove();d.textContent=(t.n[0]||'?').toUpperCase()};
  im.onload=()=>{
    if(stage===1&&im.naturalWidth<=1){nx();return}
    if(stage!==9&&im.naturalWidth>1){const u=im.src;
      fetch(u).then(r=>r.blob()).then(b=>{const fr=new FileReader();
        fr.onload=()=>{try{localStorage.setItem(ck,fr.result)}catch(e){}};
        fr.readAsDataURL(b)}).catch(()=>{})}};
  im.onerror=nx;
  d.append(im);
  const s=document.createElement('span');s.textContent=t.n;
  a.append(d,s);
  a.ondragstart=()=>{di=i;a.classList.add('drag')};
  a.ondragend=()=>{a.classList.remove('drag');save();draw()};
  a.ondragover=e=>{e.preventDefault();if(di!==null&&di!==i){T.splice(i,0,T.splice(di,1)[0]);di=i;draw()}};
  a.onclick=e=>{if(!edit)return;e.preventDefault();
   const n=prompt('Name (leave empty to delete)',t.n);
   if(n===null)return;
   if(!n){T.splice(i,1)}else{t.n=n;t.u=prompt('URL',t.u)||t.u;
    const ic=prompt('Icon image URL (blank = auto)',t.ic||'');if(ic!==null)t.ic=ic||undefined}
   save();draw()};
  g.append(a)})}
$('add').onclick=()=>{const n=prompt('Name');if(!n)return;let u=prompt('URL');if(!u)return;
 if(!/^https?:/.test(u))u='https://'+u;T.push({n,u});save();draw()};
$('ed').onclick=()=>{edit=!edit;$('ed').textContent=edit?'done':'edit';document.body.classList.toggle('e',!!edit)};
draw();
const ck=()=>clk.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});
ck();setInterval(ck,10000);
