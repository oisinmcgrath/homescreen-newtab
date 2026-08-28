document.body.style.backgroundImage='url(bg/'+BG[Math.floor(Math.random()*BG.length)]+')';
const K='tiles',$=document.getElementById.bind(document);
let T=JSON.parse(localStorage.getItem(K)||'null')||[{n:'Claude',u:'https://claude.ai'}];
let edit=0,di=null,cur=null;
const save=()=>localStorage.setItem(K,JSON.stringify(T));
const list=()=>cur===null?T:T[cur].f;
const isIP=h=>/^\d+\.\d+\.\d+\.\d+$/.test(h)||h==='localhost';

const feat=()=>JSON.parse(localStorage.getItem('feat')||'{}');
function applyFeat(){const f=feat();
 cb.style.display=f.llm===0?'none':'';
 wx.style.display=f.wx===0?'none':'';
 sol.style.display=f.sol===0?'none':''}

function idb(fn){return new Promise((res,rej)=>{const r=indexedDB.open('hs',1);
 r.onupgradeneeded=()=>r.result.createObjectStore('kv');
 r.onerror=()=>rej(r.error);
 r.onsuccess=()=>{const q=fn(r.result.transaction('kv','readwrite').objectStore('kv'));
  q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}})}
const PK='prof:';
// a profile is the whole configuration, not just the grid. v1 files hold tiles only.
const snapshot=()=>({v:2,tiles:T,engine:SE,llm:LM,feat:feat(),wxloc:WX});
function applyProfile(d){
 const t=Array.isArray(d)?d:d.tiles;
 if(!Array.isArray(t))return false;
 T=t;cur=null;save();
 if(d.engine){SE=d.engine;localStorage.setItem('engine',JSON.stringify(SE));paintSE()}
 if(d.llm){LM=d.llm;localStorage.setItem('llm',JSON.stringify(LM));paintLM()}
 if(d.feat){localStorage.setItem('feat',JSON.stringify(d.feat));applyFeat();paintWp()}
 if(d.wxloc){WX=d.wxloc;localStorage.setItem('wxloc',JSON.stringify(WX));
  localStorage.removeItem('wx')}
 draw();weather();solar();return true}
const readProf=n=>idb(st=>st.get(PK+n));
const delProf=n=>idb(st=>st.delete(PK+n));
const listProfiles=()=>idb(st=>st.getAllKeys())
 .then(k=>k.filter(x=>typeof x==='string'&&x.startsWith(PK)).map(x=>x.slice(PK.length)).sort())
 .catch(()=>[]);

async function writeProfile(name){
 try{await idb(st=>st.put(snapshot(),PK+name))}
 catch(e){await dlg('Could not save the profile.',['OK']);return false}
 return true}

let tt=null;
function toast(m){const e=$('tst');e.textContent=m;e.classList.add('on');
 clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),1600)}

async function saveCurrent(rename){
 let n=localStorage.getItem('profname');
 if(rename||!n){
  n=await ask('What would you like to call this profile?',
   (n||'homescreen-profile').replace(/\.json$/i,''));
  if(!n)return false}
 if(!await writeProfile(n))return false;
 localStorage.setItem('profname',n);toast('Saved to '+n);return true}

async function loadProfile(n){
 const d=await readProf(n).catch(()=>null);
 if(!d||!applyProfile(d)){await dlg('Could not read that profile.',['OK']);return}
 localStorage.setItem('profname',n)}

async function customUrl(msg,ph){
 const u=await ask(msg,ph,'Use');
 if(!u)return null;
 let h;try{h=new URL(u).hostname.replace(/^www\./,'')}
 catch(e){await dlg('That is not a valid web address.',['OK']);return null}
 return {n:h,u,h}}

function srow(t,sub,btn,fn){
 const w=document.createElement('div');w.className='srow';
 const c=document.createElement('div');
 const a=document.createElement('div');a.className='st';a.textContent=t;
 const b=document.createElement('div');b.className='ss';b.textContent=sub;
 c.append(a,b);
 const k=document.createElement('button');k.textContent=btn;
 if(fn)k.onclick=fn;else k.disabled=true;
 w.append(c,k);return w}

async function settings(page){
 const o=document.createElement('div');o.className='ov';
 const d=document.createElement('div');d.className='dlg set';
 d.innerHTML='<div class=tabs></div><div class=spane></div>'+
  '<div class=row><button id=sx class=p>Done</button></div>';
 const tabs=d.querySelector('.tabs'),pane=d.querySelector('.spane');
 o.append(d);document.body.append(o);
 o.onclick=e=>{if(e.target===o)o.remove()};
 d.querySelector('#sx').onclick=()=>o.remove();
 const show=async n=>{
  [...tabs.children].forEach(b=>b.classList.toggle('on',b.textContent===n));
  pane.textContent='';
  if(n==='Profiles'){
   const ps=await listProfiles();
   pane.append(srow('Saved profiles',ps.length?ps.join(', '):'None yet','Select',
    ()=>{o.remove();pickProfile()}));
   pane.append(srow('Save as\u2026','Store the current layout under a different name','Save as',
    ()=>{o.remove();saveCurrent(1)}));
   pane.append(srow('Export profile','Write a copy anywhere \u2014 external drive, another machine','Export',
    ()=>{o.remove();dl('homescreen-'+stamp()+'.json',1)}))}
  if(n==='Weather'){
   pane.append(srow('Location',WX?WX.name:'Not set yet','Change',
    ()=>{o.remove();setLoc()}));
   pane.append(srow('Forecast','Cached for 30 minutes','Refresh',
    ()=>{localStorage.removeItem('wx');weather();solar()}))}
  if(n==='General'){
   pane.append(srow('Site icons',
    hostOK?'Allowed \u2014 icons are fetched from the sites you add'
     :'Not allowed \u2014 tiles fall back to a letter',
    hostOK?'Allowed':'Allow',
    hostOK?null:()=>grantHosts(v=>{if(v){show('General');draw()}})));
   pane.append(srow('Icon cache','Site icons stored after their first fetch','Clear',
    ()=>{Object.keys(localStorage).filter(x=>x.startsWith('ic:')).forEach(x=>localStorage.removeItem(x));draw()}))}};
 ['Profiles','Weather','General'].forEach(n=>{
  const b=document.createElement('button');b.textContent=n;
  b.onclick=()=>show(n);tabs.append(b)});
 show(page||'Profiles')}

async function pickProfile(){
 const fs=await listProfiles();
 const o=document.createElement('div');o.className='ov';
 const d=document.createElement('div');d.className='dlg loc prof';
 d.innerHTML='<p>Select profile</p><select id=ps></select>'+
  '<div class=row><button id=pc>Cancel</button><button id=pdl>Delete</button>'+
  '<button id=pb>Browse\u2026</button><button id=po class=p>Open</button></div>';
 const sel=d.querySelector('#ps');
 fs.forEach(f=>{const op=document.createElement('option');
  op.value=f;op.textContent=f;sel.append(op)});
 if(!fs.length){const op=document.createElement('option');
  op.textContent='No saved profiles yet';op.value='';sel.append(op);
  sel.disabled=d.querySelector('#po').disabled=d.querySelector('#pdl').disabled=true}
 o.append(d);document.body.append(o);
 o.onclick=e=>{if(e.target===o)o.remove()};
 d.querySelector('#pc').onclick=()=>o.remove();
 d.querySelector('#pb').onclick=()=>{o.remove();imp()};
 d.querySelector('#po').onclick=()=>{const v=sel.value;o.remove();if(v)loadProfile(v)};
 d.querySelector('#pdl').onclick=async()=>{const v=sel.value;if(!v)return;
  if(await dlg('Delete the profile "'+v+'"?',['Cancel','Delete'])!==1)return;
  await delProf(v).catch(()=>{});o.remove();pickProfile()};
 setTimeout(()=>sel.focus(),30)}

function ask(msg,val,ok){return new Promise(r=>{
  const o=document.createElement('div');o.className='ov';
  const d=document.createElement('div');d.className='dlg loc';
  d.innerHTML='<p></p><input id=aq autocomplete=off>'+
   '<div class=row><button id=ac>Cancel</button><button id=ao class=p></button></div>';
  d.querySelector('p').textContent=msg;
  d.querySelector('#ao').textContent=ok||'Save';
  const i=d.querySelector('#aq');i.value=val||'';
  o.append(d);document.body.append(o);
  const done=v=>{o.remove();r(v)};
  o.onclick=e=>{if(e.target===o)done(null)};
  d.querySelector('#ac').onclick=()=>done(null);
  d.querySelector('#ao').onclick=()=>done(i.value.trim());
  i.onkeydown=e=>{if(e.key==='Enter')done(i.value.trim());
   if(e.key==='Escape')done(null)};
  setTimeout(()=>{i.focus();i.select()},30)})}

function dlg(msg,btns,sel,spot){return new Promise(r=>{
  const o=document.createElement('div');o.className='ov';
  let hole=null,place=null;
  if(spot){
   hole=document.createElement('div');hole.className='hole';
   // measured in a frame callback: the first wizard dialog is built during initial
   // script execution, before layout has settled, and read a stale rect
   place=()=>{const el=document.querySelector(spot);
    const rc=el&&el.getBoundingClientRect();
    if(!rc||!rc.width||!rc.height){o.classList.remove('spot');hole.remove();return}
    o.classList.add('spot');const q=7;
    hole.style.cssText='left:'+(rc.left-q)+'px;top:'+(rc.top-q)+'px;'+
     'width:'+(rc.width+q*2)+'px;height:'+(rc.height+q*2)+'px'};
   o.append(hole);addEventListener('resize',place)}
  const done=v=>{if(place)removeEventListener('resize',place);o.remove();r(v)};
  o.onclick=e=>{if(e.target===o)done(-1)};
  const d=document.createElement('div');d.className='dlg';
  const p=document.createElement('p');p.textContent=msg;
  const row=document.createElement('div');row.className='row';
  const hi=sel===undefined?0:sel;
  btns.forEach((b,i)=>{const el=document.createElement('button');
    el.textContent=b;if(i===hi)el.className='p';
    el.onclick=()=>done(i);row.append(el)});
  d.append(p,row);o.append(d);document.body.append(o);
  if(place)requestAnimationFrame(place);
  (row.children[hi]||row.firstChild).focus()})}

function autotrim(src){return new Promise(res=>{
 const im=new Image();
 im.onload=()=>{
  const S=512,c=document.createElement('canvas');
  const w=im.naturalWidth,h=im.naturalHeight;
  c.width=w;c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(im,0,0);
  let d;try{d=x.getImageData(0,0,w,h).data}catch(e){return res(src)}
  const rows=new Int32Array(h),cols=new Int32Array(w);
  for(let y=0;y<h;y++)for(let px=0;px<w;px++){
    if(d[(y*w+px)*4+3]>200){rows[y]++;cols[px]++}}
  const minR=Math.max(3,Math.round(w*0.01)),minC=Math.max(3,Math.round(h*0.01));
  let t=0,b=h-1,l=0,r=w-1;
  while(t<h&&rows[t]<minR)t++;
  while(b>t&&rows[b]<minR)b--;
  while(l<w&&cols[l]<minC)l++;
  while(r>l&&cols[r]<minC)r--;
  if(b<=t||r<=l)return res(src);
  const cw=r-l+1,chh=b-t+1;
  const pad=0.01,box=S*(1-pad*2);
  const k=Math.min(box/cw,box/chh);
  const o=document.createElement('canvas');o.width=o.height=S;
  const ox=o.getContext('2d');
  ox.imageSmoothingQuality='high';
  ox.drawImage(im,l,t,cw,chh,(S-cw*k)/2,(S-chh*k)/2,cw*k,chh*k);
  res(o.toDataURL('image/png'))};
 im.onerror=()=>res(src);
 im.src=src})}

function pick(item){const f=document.createElement('input');f.type='file';f.accept='image/*';
 f.onchange=()=>{const fr=new FileReader();fr.onload=async()=>{
   item.ic=await autotrim(fr.result);localStorage.removeItem('ic:'+item.u);save();draw()};
  fr.readAsDataURL(f.files[0])};f.click()}

const toData=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b)});

const HOSTS={origins:['https://*/*','http://*/*']};
let hostOK=false;
chrome.permissions.contains(HOSTS,v=>{hostOK=v});
// must be called directly from a click: an await beforehand loses the user gesture
const grantHosts=cb=>chrome.permissions.request(HOSTS,v=>{hostOK=v;if(cb)cb(v)});

async function resolve(t){
  const ck='ic:'+t.u;
  if(t.ic)return t.ic;
  const c=localStorage.getItem(ck);if(c)return c;
  const o=new URL(t.u),h=o.hostname;
  const cand=[];
  if(hostOK){cand.push(o.origin+'/apple-touch-icon.png',o.origin+'/favicon.ico');
   if(!isIP(h))cand.push('https://icons.duckduckgo.com/ip3/'+h.replace(/^www\./,'')+'.ico')}
  for(const u of cand){try{
    const r=await fetch(u);if(!r.ok)continue;
    const b=await r.blob();if(!b.type.startsWith('image')||b.size<100)continue;
    const d=await toData(b);try{localStorage.setItem(ck,d)}catch(e){}
    return d}catch(e){}}
  return 'chrome-extension://'+chrome.runtime.id+'/_favicon/?pageUrl='+encodeURIComponent(t.u)+'&size=64'}

function icon(d,t){
  if(t.f){d.classList.add('fold');
    t.f.slice(0,4).forEach(c=>{const m=document.createElement('img');
      resolve(c).then(s=>m.src=s);d.append(m)});return}
  const im=new Image();
  im.onerror=()=>{im.remove();d.textContent=(t.n[0]||'?').toUpperCase()};
  const fit=()=>{const r=im.naturalWidth/im.naturalHeight;
    if(r>1.2||r<0.85)im.dataset.wide=1};
  im.onload=fit;
  resolve(t).then(s=>{im.src=s;if(im.complete&&im.naturalWidth)fit()});
  d.append(im)}

// take a tile out of the open folder and put it back on the grid, dropping the
// folder if that empties it
function unfolder(L,i){
  const t=L[i];if(cur===null||!t)return;
  L.splice(i,1);T.push(t);
  if(!L.length){T.splice(cur,1);cur=null}
  save();draw()}

async function menu(t,L,i){
  const opts=['Close','Rename'];
  if(!t.f)opts.push('Change URL','Change icon');
  if(cur!==null)opts.push('Move out of folder');
  const c=await dlg(t.n,opts);
  const k=opts[c];
  if(k==='Rename'){const n=await ask('Name for this shortcut',t.n,'Rename');if(n)t.n=n}
  if(k==='Change URL'){const u=await ask('Web address for '+t.n,t.u,'Change');
   if(u){localStorage.removeItem('ic:'+t.u);t.u=u}}
  if(k==='Change icon'){const j=await dlg('Icon for '+t.n,['Default','Custom']);
    if(j===1){pick(t);return}
    if(j===0){t.ic=undefined;localStorage.removeItem('ic:'+t.u)}}
  if(k==='Move out of folder'){unfolder(L,i);return}
  save();draw()}

function draw(){
 const g=$('g');g.textContent='';
 $('back').style.display=cur===null?'none':'flex';
 document.body.classList.toggle('e',!!edit);
 const L=list();
 L.forEach((t,i)=>{
  const a=document.createElement(t.f?'div':'a');
  if(!t.f)a.href=t.u;
  a.draggable=true;a.className='tile';
  const d=document.createElement('div');d.className='i';
  icon(d,t);
  const s=document.createElement('span');s.textContent=t.n;
  const x=document.createElement('b');x.className='del';x.textContent='\u2212';
  x.onclick=e=>{e.preventDefault();e.stopPropagation();L.splice(i,1);save();draw()};
  a.append(d,s,x);
  a.ondragstart=e=>{di=i;a.classList.add('drag');e.dataTransfer.effectAllowed='move'};
  a.ondragend=()=>{a.classList.remove('drag');di=null;save();draw()};
  a.ondragover=e=>e.preventDefault();
  a.ondrop=e=>{e.preventDefault();e.stopPropagation();
    if(di===null||di===i)return;
    const src=L[di];
    if(t.f&&!src.f){t.f.push(src);L.splice(di,1)}
    else if(!t.f&&!src.f){const nf={n:'Folder',f:[t,src]};
      L.splice(i,1,nf);L.splice(di,1)}
    else L.splice(di<i?i-1:i,0,L.splice(di,1)[0]);
    di=null;save();draw()};
  a.onclick=e=>{
    if(edit){e.preventDefault();e.stopPropagation();menu(t,L,i);return}
    if(t.f){e.preventDefault();cur=T.indexOf(t);draw()}};
  g.append(a)})}

const WNAME={wx:'Weather',sol:'Sunrise/sunset',llm:'AI search bar'};
function paintWp(){const f=feat();
 $('wp').querySelectorAll('div').forEach(d=>{const k=d.dataset.w,on=f[k]!==0;
  d.textContent=(on?'\u2713 ':'+ ')+WNAME[k];d.classList.toggle('on',on)})}
$('wp').onclick=e=>{e.stopPropagation();const k=e.target.dataset.w;if(!k)return;
 const f=feat();f[k]=f[k]===0?1:0;
 localStorage.setItem('feat',JSON.stringify(f));
 applyFeat();paintWp();
 if(k==='wx'||k==='sol'){weather();solar()}};

document.body.onclick=e=>{$('mp').classList.remove('open');
 if(edit&&!e.target.closest('.tile,#b,#wp,.dlg')){edit=0;draw()}};
$('back').onclick=()=>{cur=null;draw()};
$('back').ondragover=e=>{if(cur!==null&&di!==null)e.preventDefault()};
$('back').ondrop=e=>{e.preventDefault();e.stopPropagation();
  if(cur===null||di===null)return;
  const j=di;di=null;unfolder(list(),j)};
$('add').onclick=async()=>{
  const n=await ask('Add a website shortcut to your home page. What should it be called?','','Next');
  if(!n)return;
  let u=await ask('Web address for '+n+'. Leave it blank to make a folder instead.','','Add');
  if(u===null)return;
  if(!u){list().push({n,f:[]});save();draw();return}
  if(!/^https?:/.test(u))u='https://'+u;
  const t={n,u};list().push(t);save();draw();
  if(await dlg('Icon for '+n,['Default','Custom'])===1)pick(t)};
$('ed').onclick=e=>{e.stopPropagation();edit=!edit;paintWp();draw()};
draw();
const pad=n=>String(n).padStart(2,'0');
const tick=()=>{const d=new Date();
  clk.textContent=pad(d.getHours())+':'+pad(d.getMinutes());
  dt.textContent=d.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'})};
tick();setInterval(tick,10000);

function dl(name,browse){
 const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 chrome.downloads.download({url,filename:name,saveAs:!!browse},
  ()=>setTimeout(()=>URL.revokeObjectURL(url),2000))}

function imp(){const f=document.createElement('input');f.type='file';f.accept='application/json,.json';
 f.onchange=()=>{const nm=f.files[0].name.replace(/\.json$/i,'');
  const fr=new FileReader();fr.onload=()=>{try{
   if(!applyProfile(JSON.parse(fr.result)))throw 0;
   localStorage.setItem('profname',nm)}
   catch(e){dlg('That is not a valid profile file.',['OK'])}};
  fr.readAsText(f.files[0])};f.click()}

const stamp=()=>new Date().toISOString().slice(0,10);
$('menu').onclick=e=>{e.stopPropagation();$('mp').classList.toggle('open')};
$('mp').onclick=async e=>{e.stopPropagation();const k=e.target.dataset.a;if(!k)return;
 $('mp').classList.remove('open');
 if(k==='save')saveCurrent();
 if(k==='select')pickProfile();
 if(k==='newprof')newProfile();
 if(k==='settings')settings()};

let WX=JSON.parse(localStorage.getItem('wxloc')||'null');
const SV={
 sun:'<circle cx="24" cy="24" r="9" fill="#ffd166"/><g stroke="#ffd166" stroke-width="3" stroke-linecap="round"><path d="M24 5v5M24 38v5M5 24h5M38 24h5M11 11l3.5 3.5M33.5 33.5L37 37M37 11l-3.5 3.5M14.5 33.5L11 37"/></g>',
 partly:'<circle cx="18" cy="18" r="7.5" fill="#ffd166"/><g stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"><path d="M18 4v3.5M4 18h3.5M8 8l2.5 2.5M28 8l-2.5 2.5"/></g><path d="M17 38h17a6.5 6.5 0 0 0 .6-12.9A9 9 0 0 0 17 27a5.5 5.5 0 0 0 0 11z" fill="#e8eef6"/>',
 cloud:'<path d="M15 38h19a7 7 0 0 0 .7-14A10 10 0 0 0 15 26a6 6 0 0 0 0 12z" fill="#e8eef6"/>',
 rain:'<path d="M15 30h19a7 7 0 0 0 .7-14A10 10 0 0 0 15 18a6 6 0 0 0 0 12z" fill="#dbe4ee"/><g stroke="#6db3f2" stroke-width="3" stroke-linecap="round"><path d="M18 35l-2 6M26 35l-2 6M34 35l-2 6"/></g>',
 snow:'<path d="M15 30h19a7 7 0 0 0 .7-14A10 10 0 0 0 15 18a6 6 0 0 0 0 12z" fill="#dbe4ee"/><g stroke="#bfe2ff" stroke-width="2.6" stroke-linecap="round"><path d="M18 35v6M15 38h6M30 35v6M27 38h6"/></g>',
 storm:'<path d="M15 28h19a7 7 0 0 0 .7-14A10 10 0 0 0 15 16a6 6 0 0 0 0 12z" fill="#cfd8e3"/><path d="M25 30l-6 8h5l-2 7 8-10h-5l3-5z" fill="#ffd166"/>',
 fog:'<path d="M15 26h19a7 7 0 0 0 .7-14A10 10 0 0 0 15 14a6 6 0 0 0 0 12z" fill="#e0e6ee"/><g stroke="#cdd6e0" stroke-width="3" stroke-linecap="round"><path d="M12 33h24M15 40h20"/></g>'};
const kind=c=>c===0?'sun':c<=2?'partly':c===3?'cloud':(c===45||c===48)?'fog':
 (c>=71&&c<=77)||c===85||c===86?'snow':c>=95?'storm':'rain';
const label=c=>c===0?'Clear':c<=2?'Partly cloudy':c===3?'Overcast':(c===45||c===48)?'Fog':
 (c>=71&&c<=77)?'Snow':c>=95?'Thunderstorm':(c>=80?'Showers':(c>=51&&c<=57?'Drizzle':'Rain'));
const svg=(c,s)=>'<svg viewBox="0 0 48 48" width="'+s+'" height="'+s+'">'+SV[kind(c)]+'</svg>';

function paintWx(d){
 wx.innerHTML=
  '<div class=wnow>'+svg(d.code,44)+
   '<div class=wcol><span class=wt>'+Math.round(d.t)+'\u00B0</span>'+
   '<span class=wd>'+label(d.code)+'</span></div></div>'+
  '<div class=wr>'+Math.round(d.lo)+'\u00B0 / '+Math.round(d.hi)+'\u00B0'+
   (d.pp!=null?'  \u00B7  '+d.pp+'% rain':'')+'</div>'+
  '<div class=wf>'+d.f.map(h=>
   '<div class=wfi><span class=wh>'+h.hr+'</span>'+svg(h.code,26)+
   '<span class=wtm>'+Math.round(h.t)+'\u00B0</span>'+
   '<span class=wpp><svg viewBox="0 0 12 14" width="9" height="11" aria-hidden="true">'+
   '<path d="M6 1C6 1 1.5 6.2 1.5 8.9A4.5 4.5 0 0 0 10.5 8.9C10.5 6.2 6 1 6 1z" fill="#bcdcff"/>'+
   '</svg>'+h.p+'%</span></div>').join('')+'</div>'}

function setLoc(){
 const o=document.createElement('div');o.className='ov';
 const d=document.createElement('div');d.className='dlg loc';
 d.innerHTML='<p>Weather location</p><input id=lq placeholder="Type a town or city" autocomplete=off>'+
  '<div id=lr class=lres></div><div class=row><button id=lc>Cancel</button></div>';
 o.append(d);document.body.append(o);
 o.onclick=e=>{if(e.target===o)o.remove()};
 d.querySelector('#lc').onclick=()=>o.remove();
 const q=d.querySelector('#lq'),res=d.querySelector('#lr');
 let tm=null;
 const run=async()=>{
  const v=q.value.trim();res.textContent='';
  if(v.length<2)return;
  res.textContent='Searching...';
  try{
   const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&name='+encodeURIComponent(v));
   const j=await r.json();res.textContent='';
   if(!j.results||!j.results.length){res.textContent='No matches';return}
   j.results.forEach(g=>{
    const it=document.createElement('div');it.className='lit';
    it.textContent=[g.name,g.admin1,g.country].filter(Boolean).join(', ');
    it.onclick=()=>{
     WX={lat:g.latitude,lon:g.longitude,name:g.name};
     localStorage.setItem('wxloc',JSON.stringify(WX));
     localStorage.removeItem('wx');o.remove();weather()};
    res.append(it)})}
  catch(e){res.textContent='Lookup failed'}};
 q.oninput=()=>{clearTimeout(tm);tm=setTimeout(run,350)};
 q.onkeydown=e=>{if(e.key==='Enter'){clearTimeout(tm);run()}};
 setTimeout(()=>q.focus(),30)}

async function weather(){
 const ft=feat();if(ft.wx===0&&ft.sol===0)return;
 if(!WX){wx.innerHTML='<div class=wset>Set location for weather</div>';
  wx.querySelector('.wset').onclick=setLoc;return}
 const c=JSON.parse(localStorage.getItem('wx')||'null');
 if(c&&c.f&&Date.now()-c.ts<1800000){paintWx(c);return}
 try{
  const u='https://api.open-meteo.com/v1/forecast?latitude='+WX.lat+'&longitude='+WX.lon+
   '&current=temperature_2m,weather_code,precipitation_probability'+
   '&hourly=temperature_2m,weather_code,precipitation_probability'+
   '&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=2';
  const r=await fetch(u);const j=await r.json();
  const now=new Date(j.current.time);
  let i=j.hourly.time.findIndex(t=>new Date(t)>now);
  if(i<0)i=0;
  const f=[3,6,9].map(o=>{const k=i+o-1;
   const dt=new Date(j.hourly.time[k]);
   return{hr:String(dt.getHours()).padStart(2,'0')+':00',
    t:j.hourly.temperature_2m[k],code:j.hourly.weather_code[k],
    p:j.hourly.precipitation_probability[k]??0}});
  const sun=[];
  for(let n=0;n<2;n++){sun.push(['rise',j.daily.sunrise[n]],['set',j.daily.sunset[n]])}
  const d={sun,t:j.current.temperature_2m,code:j.current.weather_code,
   pp:j.current.precipitation_probability,
   hi:j.daily.temperature_2m_max[0],lo:j.daily.temperature_2m_min[0],f,ts:Date.now()};
  localStorage.setItem('wx',JSON.stringify(d));paintWx(d);solar()}
 catch(e){}}
weather();setInterval(weather,1800000);
const ENGINES=[
 {n:'DuckDuckGo',u:'https://duckduckgo.com/?q=',h:'duckduckgo.com',c:'#e2913f'},
 {n:'Google',u:'https://www.google.com/search?q=',h:'google.com',c:'#4285f4'},
 {n:'Brave',u:'https://search.brave.com/search?q=',h:'search.brave.com',c:'#fb542b'},
 {n:'Bing',u:'https://www.bing.com/search?q=',h:'bing.com',c:'#008373'},
 {n:'Startpage',u:'https://www.startpage.com/sp/search?query=',h:'startpage.com',c:'#5c4bc4'},
 {n:'Wikipedia',u:'https://en.wikipedia.org/w/index.php?search=',h:'wikipedia.org',c:'#3366cc'}];
let SE=JSON.parse(localStorage.getItem('engine')||'null')||ENGINES[0];
function paintSE(){
 ddg.src='https://icons.duckduckgo.com/ip3/'+SE.h+'.ico';
 ddg.title=SE.n;sq.placeholder='Search '+SE.n;
 const e=ENGINES.find(x=>x.h===SE.h);
 sb.style.setProperty('--tint',e?e.c:'#8b93a1')}
paintSE();
ddg.onclick=async e=>{e.preventDefault();e.stopPropagation();
 const k=await dlg('Search engine',ENGINES.map(x=>x.n).concat('Custom\u2026'),
  ENGINES.findIndex(x=>x.h===SE.h));
 if(k<0)return;
 const c=k===ENGINES.length?
  await customUrl('Search address, with the query at the end','https://example.com/search?q='):
  ENGINES[k];
 if(!c)return;
 SE=c;localStorage.setItem('engine',JSON.stringify(SE));paintSE()};
sb.onsubmit=e=>{e.preventDefault();const v=sq.value.trim();
 if(v)location.href=SE.u+encodeURIComponent(v)};
const LLMS=[
 {n:'Claude',u:'https://claude.ai/new?q=',h:'claude.ai',c:'#9b8b74',b:'#f6f4edee'},
 {n:'ChatGPT',u:'https://chatgpt.com/?q=',h:'chatgpt.com',c:'#6e6e80'},
 {n:'Google AI Mode',u:'https://www.google.com/search?udm=50&q=',h:'google.com',c:'#8b7cf0'},
 {n:'Grok',u:'https://grok.com/?q=',h:'grok.com',c:'#4a4a4a'},
 {n:'Perplexity',u:'https://www.perplexity.ai/search?q=',h:'perplexity.ai',c:'#20808d'}];
let LM=JSON.parse(localStorage.getItem('llm')||'null')||LLMS[0];
function paintLM(){
 resolve({u:'https://'+LM.h}).then(s=>cim.src=s);
 cim.title=LM.n;cq.placeholder='Ask '+LM.n;
 const e=LLMS.find(x=>x.h===LM.h);
 cb.style.setProperty('--tint',e?e.c:'#8b93a1');
 cb.style.background=e&&e.b?e.b:''}
paintLM();
cim.onclick=async e=>{e.preventDefault();e.stopPropagation();
 const k=await dlg('Which AI assistant?',LLMS.map(x=>x.n).concat('Custom\u2026'),
  LLMS.findIndex(x=>x.h===LM.h));
 if(k<0)return;
 const c=k===LLMS.length?
  await customUrl('Chat address, with the question at the end','https://example.com/?q='):
  LLMS[k];
 if(!c)return;
 LM=c;localStorage.setItem('llm',JSON.stringify(LM));paintLM()};
cb.onsubmit=e=>{e.preventDefault();const v=cq.value.trim();
 if(v)location.href=LM.u+encodeURIComponent(v)};

// plausible readings so the widget questions have something to point at on a fresh profile
function demoWx(){
 const n=Date.now(),hr=o=>String(new Date(n+o*3600000).getHours()).padStart(2,'0')+':00';
 return{sun:[['rise',new Date(n+3*3600000).toISOString()],
   ['set',new Date(n+9*3600000).toISOString()]],
  t:11,code:0,pp:0,hi:17,lo:8,ts:0,
  f:[{hr:hr(3),t:11,code:0,p:0},{hr:hr(6),t:9,code:1,p:10},{hr:hr(9),t:9,code:2,p:20}]}}

async function wizard(){
 const f={};
 let k=await dlg('Search engine',ENGINES.map(x=>x.n).concat('Custom\u2026'),0,'#sb');
 if(k>=0){const c=k===ENGINES.length?
   await customUrl('Search address, with the query at the end','https://example.com/search?q='):
   ENGINES[k];
  if(c){SE=c;localStorage.setItem('engine',JSON.stringify(SE));paintSE()}}
 f.llm=await dlg('Include a search bar for your favourite AI assistant?',['Yes','No'],0,'#cb')===1?0:1;
 if(f.llm){k=await dlg('Which AI assistant?',LLMS.map(x=>x.n).concat('Custom\u2026'),0,'#cb');
  if(k>=0){const c=k===LLMS.length?
    await customUrl('Chat address, with the question at the end','https://example.com/?q='):
    LLMS[k];
   if(c){LM=c;localStorage.setItem('llm',JSON.stringify(LM));paintLM()}}}
 const real=localStorage.getItem('wx');
 if(!real){const dm=demoWx();localStorage.setItem('wx',JSON.stringify(dm));paintWx(dm);solar()}
 f.wx=await dlg('Would you like the weather widget on your home page?',['Yes','No'],0,'#wx')===1?0:1;
 f.sol=await dlg('Would you like the countdown to sunset/sunrise on your home page?',['Yes','No'],0,'#sol .solbox')===1?0:1;
 if(!real){localStorage.removeItem('wx');weather();solar()}
 if(!hostOK&&await dlg('Fetch icons from the sites you add? Without this, tiles show a letter instead.',
  ['Allow','Not now'])===0)grantHosts(()=>draw());
 localStorage.setItem('feat',JSON.stringify(f));applyFeat();
 if(f.wx||f.sol){if(!WX)setLoc();else weather()}}

// unsaved work is the only reason to interrupt: compare against the stored copy
async function dirty(){
 const n=localStorage.getItem('profname');if(!n)return T.length>0;
 const d=await readProf(n).catch(()=>null);
 return !d||JSON.stringify(d)!==JSON.stringify(snapshot())}

async function newProfile(){
 const nm=await ask('What will you name your profile?','','Create');
 if(!nm)return;
 if(await dirty()){
  const k=await dlg('The profile in use now has unsaved changes.',
   ['Cancel','Save current first','Discard them']);
  if(k<=0)return;
  if(k===1&&!await saveCurrent())return}
 T=[];cur=null;edit=0;save();
 ['feat','wxloc','wx'].forEach(x=>localStorage.removeItem(x));
 WX=null;localStorage.setItem('profname',nm);draw();
 await wizard();
 if(await writeProfile(nm))toast('Created '+nm)}

applyFeat();paintWp();
if(!localStorage.getItem('feat'))wizard();

const SUNSVG={
 rise:'<defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">'+
  '<stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ffb64d"/></linearGradient></defs>'+
  '<g stroke="url(#gr)" stroke-width="2.6" stroke-linecap="round">'+
  '<path d="M20 5v5M8.5 10.5l3 3M31.5 10.5l-3 3"/></g>'+
  '<path d="M12 25a8 8 0 0 1 16 0z" fill="url(#gr)"/>'+
  '<path d="M4 27h32" stroke="#ffd8a0" stroke-width="2.6" stroke-linecap="round"/>',
 set:'<defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">'+
  '<stop offset="0" stop-color="#ffb36b"/><stop offset="1" stop-color="#f2683c"/></linearGradient></defs>'+
  '<g stroke="url(#gs)" stroke-width="2.6" stroke-linecap="round">'+
  '<path d="M20 5v5M8.5 10.5l3 3M31.5 10.5l-3 3"/></g>'+
  '<path d="M12 25a8 8 0 0 1 16 0z" fill="url(#gs)"/>'+
  '<path d="M4 27h32" stroke="#ffc39a" stroke-width="2.6" stroke-linecap="round"/>'};

function solar(){
 const d=JSON.parse(localStorage.getItem('wx')||'null');
 if(!d||!d.sun){sol.innerHTML='';return}
 const now=Date.now();
 const nxt=d.sun.map(([k,t])=>[k,new Date(t).getTime()])
   .filter(x=>x[1]>now).sort((a,b)=>a[1]-b[1])[0];
 if(!nxt){sol.innerHTML='';return}
 const mins=Math.round((nxt[1]-now)/60000);
 const hh=Math.floor(mins/60),mm=mins%60;
 const at=new Date(nxt[1]).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});
 sol.innerHTML='<div class=solbox><svg viewBox="0 0 40 38" width="38" height="38">'+SUNSVG[nxt[0]]+'</svg>'+
  '<div class=scol><span class=sl>'+(nxt[0]==='rise'?'Sunrise':'Sunset')+' '+at+'</span>'+
  '<span class=sc>in '+(hh?hh+'h ':'')+mm+'m</span></div></div>'}
solar();setInterval(solar,60000);

async function batt(){
 if(!navigator.getBattery){bat.innerHTML='';return}
 try{const b=await navigator.getBattery();
  const paint=()=>{const p=Math.round(b.level*100);
   const fill=p>20?'#7ddc8a':'#ff6b5a';
   bat.innerHTML='<svg viewBox="0 0 40 20" width="34" height="17">'+
    '<rect x="1" y="2.5" width="32" height="15" rx="4" fill="none" stroke="#ffffffcc" stroke-width="2"/>'+
    '<rect x="35" y="7" width="3.5" height="6" rx="1.5" fill="#ffffffcc"/>'+
    '<rect x="4" y="5.5" width="'+(26*p/100)+'" height="9" rx="2" fill="'+fill+'"/>'+
    (b.charging?'<path d="M19 4.5l-5 6.5h3.5l-1.5 5 5-6.5h-3.5z" fill="#12331a"/>':'')+
    '</svg><span class=bl>'+p+'%</span>'};
  paint();
  b.addEventListener('levelchange',paint);
  b.addEventListener('chargingchange',paint);
  setInterval(async()=>{try{const nb=await navigator.getBattery();
   if(nb!==b){batt();return}paint()}catch(e){}},20000)}
 catch(e){bat.innerHTML=''}}
batt();
