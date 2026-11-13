'use strict';
const $=s=>document.querySelector(s),C=window.SMH_CONFIG||{},R=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},W=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const S=Object.assign({theme:'auto',units:'km',labels:true,start:'standard',scale:true,motion:true,track:false,hist:false},R('smh.s',{}));
const sv=()=>W('smh.s',S);let map,base,lab,radar,mk,acc,me,route,watch,tok=0,pts=[],mLine,mMode='d',meas=false,places=R('smh.p',[]),LL;
const toast=(t,ms=3500)=>{const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),ms)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const modal=h=>{$('#mb').innerHTML=h;$('#md').hidden=false};$('#mx').onclick=()=>$('#md').hidden=true;
const nope=(t,need)=>modal(`<h2>${t}</h2><p><b>Not available yet.</b> ${need}</p><p class="mu">No fake data is shown while a feature is unconfigured.</p>`);
function theme(){const d=S.theme=='auto'?(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'):S.theme;document.documentElement.dataset.theme=d;document.documentElement.classList.toggle('calm',!S.motion)}theme();
// ---- splash + stars
for(const id of['#stars','#stars2'])$(id).innerHTML=Array.from({length:45},()=>`<i style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*3}s"></i>`).join('');
setTimeout(()=>{$('#splash').classList.add('out');setTimeout(()=>$('#splash').remove(),700);R('smh.guest',0)?enter():$('#auth').hidden=false;restore()},3000);
// ---- auth (Firebase, loaded only when configured)
const msg=t=>$('#a_msg').textContent=t||'';let signup=false;
async function fb(){if(!C.firebase)throw Error('NOCONF');if(!fb.m){const u='https://www.gstatic.com/firebasejs/10.12.2/',[a,au]=await Promise.all([import(u+'firebase-app.js'),import(u+'firebase-auth.js')]);fb.m={au,auth:au.getAuth(a.initializeApp(C.firebase))}}return fb.m}
const aerr=e=>msg(e.message=='NOCONF'?'Sign-in is not set up yet. Add your Firebase keys in config.js (see README). Guest mode works now.':(e.code||e.message).replace('auth/','').replace(/-/g,' '));
async function restore(){if(!C.firebase)return;try{const m=await fb();m.au.onAuthStateChanged(m.auth,u=>{if(u)enter(u)})}catch{}}
$('#b_login').onclick=()=>{$('#a_home').hidden=true;$('#a_form').hidden=false;msg()};$('#a_back').onclick=()=>{$('#a_home').hidden=false;$('#a_form').hidden=true;msg()};
$('#a_new').onclick=()=>{signup=!signup;$('#a_go').textContent=signup?'Create account':'Log in';$('#a_new').textContent=signup?'I have an account':'Create account'};
$('#a_form').onsubmit=async e=>{e.preventDefault();msg('Please wait…');try{const m=await fb(),f=signup?m.au.createUserWithEmailAndPassword:m.au.signInWithEmailAndPassword;enter((await f(m.auth,$('#a_mail').value,$('#a_pass').value)).user)}catch(x){aerr(x)}};
$('#a_rst').onclick=async()=>{const v=$('#a_mail').value;if(!v)return msg('Type your email first.');try{const m=await fb();await m.au.sendPasswordResetEmail(m.auth,v);msg('Password reset email sent.')}catch(x){aerr(x)}};
$('#b_google').onclick=async()=>{try{const m=await fb();enter((await m.au.signInWithPopup(m.auth,new m.au.GoogleAuthProvider())).user)}catch(x){aerr(x)}};
$('#b_guest').onclick=()=>{W('smh.guest',1);enter()};
let user=null;
function enter(u){if(!$('#app').hidden)return;user=u||null;$('#auth').hidden=true;$('#app').hidden=false;load()}
// ---- lazy-load Leaflet
function load(){const l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l);
 const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=init;s.onerror=()=>{$('#map').innerHTML='<p style="padding:90px 20px;text-align:center;color:#8fa3c4">The map engine could not load (are you offline?). Saved places and settings still work from the menu.</p>'};document.head.appendChild(s)}
const T={standard:['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',19,'© OpenStreetMap contributors'],satellite:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',19,'Imagery © Esri, Maxar, Earthstar Geographics'],terrain:['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',17,'© OpenTopoMap (CC-BY-SA), OpenStreetMap']};
function layer(){if(!map)return;base&&map.removeLayer(base);lab&&map.removeLayer(lab);lab=null;const k=S.start=='hybrid'?'satellite':S.start,t=T[k];
 base=L.tileLayer(t[0],{maxZoom:t[1],attribution:t[2],subdomains:'abc',crossOrigin:true}).addTo(map);
 if(S.start=='hybrid'&&S.labels)lab=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
 document.querySelectorAll('#lg [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m==S.start))}
function init(){LL=L;const h=location.hash.match(/^#(-?[\d.]+),(-?[\d.]+),(\d+)/);
 map=L.map('map',{zoomControl:false,worldCopyJump:true,minZoom:2,zoomSnap:.5,center:h?[+h[1],+h[2]]:[20,10],zoom:h?+h[3]:3});
 L.control.attribution({prefix:false}).addTo(map);$('.leaflet-control-attribution').style.cssText='display:block;font-size:10px';
 L.control.scale({imperial:S.units=='mi',metric:S.units!='mi'}).addTo(map);map.on('zoomend',()=>$('#zl').textContent='Zoom '+map.getZoom());
 map.on('mousemove',e=>$('#co').textContent=cs(e.latlng));map.on('moveend',()=>$('#co').textContent=cs(map.getCenter()));
 map.on('click',e=>meas?mpt(e.latlng):pick(e.latlng));layer();$('#zl').textContent='Zoom '+map.getZoom();applyScale();if(h)pick(L.latLng(+h[1],+h[2]));
 if(S.track)track(true)}
const cs=p=>p.lat.toFixed(5)+'°, '+p.lng.toFixed(5)+'°';const applyScale=()=>{const e=document.querySelector('.leaflet-control-scale');if(e)e.style.display=S.scale?'':'none'};
// ---- panels
const open=id=>{document.querySelectorAll('.sheet').forEach(s=>s!=$(id)&&s.classList.remove('open'));$(id).classList.toggle('open')};
document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>b.closest('.sheet').classList.remove('open'));
$('#ly').onclick=()=>open('#lp');$('#menu').onclick=()=>{renderSet();open('#sp')};
$('#zi').onclick=()=>map&&map.zoomIn();$('#zo').onclick=()=>map&&map.zoomOut();
$('#fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():(document.documentElement.requestFullscreen?.()||toast('Fullscreen not supported here'));
function net(){const o=!navigator.onLine;$('#net').className='card'+(o?' off':'');$('#net').textContent=o?'● Offline':'● Online';o&&toast('Offline: live maps, search, weather and routes need internet.')}addEventListener('online',net);addEventListener('offline',net);net();
if('serviceWorker'in navigator&&location.protocol!='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
// ---- layers + tools sheet
[['standard','Standard'],['satellite','Satellite'],['hybrid','Hybrid'],['terrain','Terrain + contours']].forEach(([m,n])=>{const b=document.createElement('button');b.dataset.m=m;b.textContent=n;b.onclick=()=>{S.start=m;sv();layer()};$('#lg').appendChild(b)});
const TOOLS=[['Rain radar (live)',()=>toggleRadar(),'Works'],['Traffic',()=>nope('Live traffic','Needs a traffic data provider key (TomTom or HERE have free tiers). Add it as trafficKey in config.js. Planned for Phase 2.'),'Needs key'],['Street-level imagery',()=>nope('Street view','Needs a street-imagery provider such as Mapillary (free token) set as mapillaryToken in config.js. Phase 2.'),'Needs key'],['Historical imagery & compare',()=>nope('Historical imagery','Needs a provider that supplies dated imagery with usage rights. Phase 2 will check Esri Wayback and Sentinel Hub terms before enabling.'),'Phase 2'],['3D Earth globe',()=>nope('3D Earth explorer','Planned for Phase 2 with CesiumJS or Three.js. It needs a downloaded Earth texture and is loaded only when opened, to protect phone performance.'),'Phase 2'],['Country information',()=>nope('Country information','Phase 2 will use the free REST Countries data. Not built in this phase.'),'Phase 2']];
TOOLS.forEach(([n,f,t])=>{const b=document.createElement('button');b.innerHTML=`<span>${n}</span><span class="tag">${t}</span>`;b.onclick=f;$('#tl').appendChild(b)});
async function toggleRadar(){if(!map)return;if(radar){map.removeLayer(radar);radar=null;return toast('Rain radar off')}
 try{const j=await(await fetch('https://api.rainviewer.com/public/weather-maps.json')).json(),f=j.radar.past.at(-1);radar=L.tileLayer(j.host+f.path+'/256/{z}/{x}/{y}/2/1_1.png',{opacity:.65,maxNativeZoom:7,maxZoom:19,attribution:'Radar © RainViewer'}).addTo(map);toast('Rain radar: '+new Date(f.time*1e3).toLocaleTimeString())}catch{toast('Rain radar is unavailable right now.')}}
// ---- search
const hist=()=>R('smh.h',[]);const sug=$('#sug');
function showHist(){const h=hist();if(!h.length){sug.hidden=true;return}sug.innerHTML='';h.forEach(q=>{const b=document.createElement('button');b.textContent='🕘 '+q;b.onclick=()=>{$('#q').value=q;search(q)};sug.appendChild(b)});const c=document.createElement('button');c.innerHTML='<small>Clear search history</small>';c.onclick=()=>{W('smh.h',[]);sug.hidden=true;toast('History cleared')};sug.appendChild(c);sug.hidden=false}
$('#q').onfocus=showHist;$('#map').addEventListener('pointerdown',()=>sug.hidden=true);
$('#sf').onsubmit=e=>{e.preventDefault();search($('#q').value.trim());$('#q').blur()};
const go=(lat,lng,n,bb)=>{sug.hidden=true;bb?map.fitBounds([[bb[0],bb[2]],[bb[1],bb[3]]],{maxZoom:16}):map.setView([lat,lng],14);pick(L.latLng(lat,lng),n)};
async function search(q,near){if(!q)return;if(!map)return toast('Map not ready');
 const m=q.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);if(m&&Math.abs(m[1])<=90&&Math.abs(m[2])<=180){go(+m[1],+m[2],'Coordinates');return}
 if(!navigator.onLine)return toast('Search needs internet');if(!near)W('smh.h',[q,...hist().filter(x=>x!=q)].slice(0,8));
 const b=map.getBounds(),vb=near?`&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}&bounded=1`:'';
 try{const r=await(await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}${vb}`)).json();if(!r.length)return toast('No results found');
  if(r.length==1&&!near)return go(+r[0].lat,+r[0].lon,r[0].display_name.split(',')[0],r[0].boundingbox.map(Number));
  sug.innerHTML='';r.forEach(x=>{const b=document.createElement('button');b.innerHTML=`${esc(x.display_name.split(',')[0])}<br><small>${esc(x.display_name.split(',').slice(1,4).join(','))}</small>`;b.onclick=()=>go(+x.lat,+x.lon,x.display_name.split(',')[0],x.boundingbox.map(Number));sug.appendChild(b)});sug.hidden=false}catch{toast('Search failed. Try again.')}}
// ---- voice
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec;
['Where am I?','Restaurants near me','Nearest hospital','Nearest gas station','Show traffic'].forEach(t=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>cmd(t);$('#vc').appendChild(b)});
function cmd(t){$('#vo').hidden=true;rec&&rec.abort();const l=t.toLowerCase();$('#q').value=t;
 if(/where am i/.test(l))return locate(true);if(/traffic/.test(l))return TOOLS[1][1]();
 const n=l.match(/(restaurant|hospital|gas station|fuel|hotel|school|airport)s?/);if(/near|nearest/.test(l)&&n)return search(n[1]=='gas station'?'fuel':n[1],true);search(t)}
$('#mic').onclick=()=>{if(!SR)return toast('Voice search is not supported in this browser. Use the text box instead.');$('#vo').hidden=false;$('#vs').textContent='Listening…';rec=new SR();rec.lang=navigator.language;
 rec.onresult=e=>{$('#vs').textContent='“'+e.results[0][0].transcript+'”';cmd(e.results[0][0].transcript)};rec.onerror=e=>{$('#vs').textContent=e.error=='not-allowed'?'Microphone permission was denied.':'Could not hear you. Tap a suggestion or cancel.'};rec.start()};
$('#vx').onclick=()=>{$('#vo').hidden=true;rec&&rec.abort()};
// ---- place info
const WX={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Drizzle',61:'Rain',63:'Rain',65:'Heavy rain',71:'Snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};
let sel;async function pick(l,n){sel={l,n};const my=++tok;mk?mk.setLatLng(l):mk=L.marker(l).addTo(map);if(!mk._map)mk.addTo(map);
 $('#it').textContent=n||'Dropped pin';$('#ic').textContent=cs(l);$('#ie').textContent='⛰ Elevation: …';$('#iw').textContent='☁ Weather: …';$('#ir').textContent='';open('#info');$('#info').classList.add('open');
 if(!navigator.onLine){$('#ie').textContent='⛰ Needs internet';$('#iw').textContent='☁ Needs internet';return}
 fetch(`https://api.open-meteo.com/v1/elevation?latitude=${l.lat}&longitude=${l.lng}`).then(r=>r.json()).then(j=>{if(my==tok)$('#ie').textContent='⛰ Elevation: '+(S.units=='mi'?Math.round(j.elevation[0]*3.281)+' ft':Math.round(j.elevation[0])+' m')}).catch(()=>my==tok&&($('#ie').textContent='⛰ Elevation unavailable'));
 fetch(`https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation,cloud_cover`).then(r=>r.json()).then(j=>{const c=j.current;if(my==tok)$('#iw').textContent=`☁ ${WX[c.weather_code]||'Conditions'} · ${S.units=='mi'?Math.round(c.temperature_2m*9/5+32)+'°F':Math.round(c.temperature_2m)+'°C'} · wind ${S.units=='mi'?Math.round(c.wind_speed_10m*.621)+' mph':Math.round(c.wind_speed_10m)+' km/h'} · clouds ${c.cloud_cover}%`}).catch(()=>my==tok&&($('#iw').textContent='☁ Weather unavailable'))}
$('#info [data-x]').onclick=()=>{$('#info').classList.remove('open');mk&&mk.remove();route&&route.remove();route=null};
$('#isv').onclick=()=>{if(!sel)return;places.push({n:$('#it').textContent,lat:sel.l.lat,lng:sel.l.lng,note:''});W('smh.p',places);toast('Saved to favorites (stored on this device)')};
$('#ish').onclick=async()=>{if(!sel)return;const u=location.origin+location.pathname+`#${sel.l.lat.toFixed(5)},${sel.l.lng.toFixed(5)},${Math.round(map.getZoom())}`;try{navigator.share?await navigator.share({title:'SMH WORLD MAP',url:u}):(await navigator.clipboard.writeText(u),toast('Link copied'))}catch{}};
$('#idr').onclick=()=>{if(!sel)return;if(!navigator.onLine)return toast('Routing needs internet');locate(false,async p=>{try{const j=await(await fetch(`https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${sel.l.lng},${sel.l.lat}?overview=full&geometries=geojson`)).json();if(!j.routes?.[0])return toast('No driving route found');const r=j.routes[0];route&&route.remove();route=L.geoJSON(r.geometry,{style:{color:'#e6b84a',weight:5}}).addTo(map);map.fitBounds(route.getBounds(),{padding:[40,40]});$('#ir').textContent=`🚗 ${fd(r.distance)} · ${Math.round(r.duration/60)} min (free demo server, driving only)`}catch{toast('Routing service unavailable')}})};
// ---- GPS
const fd=m=>S.units=='mi'?(m<1609?Math.round(m*3.281)+' ft':(m/1609.34).toFixed(2)+' mi'):(m<1e3?Math.round(m)+' m':(m/1e3).toFixed(2)+' km');
function show(p){const l=L.latLng(p.coords.latitude,p.coords.longitude);me?me.setLatLng(l):me=L.circleMarker(l,{radius:8,color:'#fff',weight:3,fillColor:'#3b8cff',fillOpacity:1}).addTo(map);acc?(acc.setLatLng(l),acc.setRadius(p.coords.accuracy)):acc=L.circle(l,{radius:p.coords.accuracy,color:'#3b8cff',weight:1,fillOpacity:.1}).addTo(map);return l}
function locate(info,cb){if(!map)return;if(!navigator.geolocation)return toast('Location is not supported on this device');navigator.geolocation.getCurrentPosition(p=>{const l=show(p);if(cb)return cb(l);map.setView(l,Math.max(map.getZoom(),15));if(info){pick(l,'You are here');$('#ir').textContent=`Accuracy ±${Math.round(p.coords.accuracy)} m`}},e=>toast(e.code==1?'Location permission denied. Allow it in your browser/site settings.':'Could not get your location'),{enableHighAccuracy:true,timeout:12000})}
$('#loc').onclick=()=>locate(true);
function track(on){if(!navigator.geolocation)return toast('Location is not supported');if(on){watch=navigator.geolocation.watchPosition(p=>{show(p);if(S.hist){const h=R('smh.lh',[]);h.push([p.coords.latitude,p.coords.longitude,Date.now()]);W('smh.lh',h.slice(-500))}},()=>toast('Live tracking error'),{enableHighAccuracy:true,maximumAge:5000})}else{watch!=null&&navigator.geolocation.clearWatch(watch);watch=null}}
// ---- measure (distance, perimeter, area)
const R_=6371008.8,rad=Math.PI/180;const hv=(a,b)=>{const x=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;return 2*R_*Math.asin(Math.sqrt(x))};
const plen=(p,c)=>p.reduce((s,x,i)=>i?s+hv(p[i-1],x):0,0)+(c&&p.length>2?hv(p.at(-1),p[0]):0);
const parea=p=>{let s=0;p.forEach((a,i)=>{const b=p[(i+1)%p.length];s+=(b.lng-a.lng)*rad*(2+Math.sin(a.lat*rad)+Math.sin(b.lat*rad))});return Math.abs(s*R_*R_/2)};
const fa=a=>S.units=='mi'?(a<2.59e6?(a*10.7639).toFixed(0)+' ft²':(a/2.59e6).toFixed(2)+' mi²'):(a<1e6?Math.round(a)+' m²':(a/1e6).toFixed(3)+' km²');
function mdraw(){mLine&&mLine.remove();if(!pts.length){$('#mv').textContent='Tap the map to add points';return}mLine=(mMode=='a'&&pts.length>2?L.polygon:L.polyline)(pts,{color:'#e6b84a',weight:3}).addTo(map);
 $('#mv').textContent=mMode=='a'&&pts.length>2?`Area ${fa(parea(pts))} · Perimeter ${fd(plen(pts,1))}`:`Distance ${fd(plen(pts))} · ${pts.length} pts`}
function mpt(l){pts.push(l);mdraw()}
$('#ms').onclick=()=>{meas=!meas;$('#ms').classList.toggle('on',meas);$('#mt').hidden=!meas;if(meas)mdraw();else{pts=[];mLine&&mLine.remove()}};
$('#mmode').onclick=()=>{mMode=mMode=='a'?'d':'a';$('#mmode').textContent=mMode=='a'?'Distance':'Area';mdraw()};$('#mun').onclick=()=>{pts.pop();mdraw()};$('#mcl').onclick=()=>{pts=[];mdraw()};
// ---- settings
const seg=(k,o)=>`<div class="seg">${o.map(([v,n])=>`<button data-k="${k}" data-v="${v}" class="${S[k]==v?'on':''}">${n}</button>`).join('')}</div>`,tgl=k=>`<div class="tg ${S[k]?'on':''}" data-t="${k}"></div>`,row=(a,b,c)=>`<div class="row"><div>${a}${b?`<small>${b}</small>`:''}</div>${c}</div>`;
function renderSet(){const lh=R('smh.lh',[]).length;$('#sb').innerHTML=`<h3>Account</h3>${row(user?esc(user.email||user.displayName||'Signed in'):'Guest','Favorites stay on this device',user?'<button class="btn" id="so">Sign out</button>':'<button class="btn" id="si">Log in</button>')}
<h3>App &amp; display</h3>${row('Theme','',seg('theme',[['auto','Auto'],['light','Light'],['dark','Dark']]))}${row('Start map','Used when the app opens',seg('start',[['standard','Map'],['satellite','Sat'],['hybrid','Hybrid'],['terrain','Terrain']]))}${row('Map labels','On hybrid view',tgl('labels'))}${row('Scale bar','',tgl('scale'))}${row('Animations','Off = calmer and faster',tgl('motion'))}${row('Units','',seg('units',[['km','km'],['mi','miles']]))}
<h3>Location &amp; privacy</h3>${row('Live tracking','Follows you while open',tgl('track'))}${row('Save location history','Stored only here, with your consent ('+lh+' points)',tgl('hist'))}${row('Clear history','Searches and location history','<button class="btn" id="ch">Clear</button>')}${row('Permission','Managed by your browser','<button class="btn" id="pm">Check</button>')}
<h3>Saved places</h3><div id="fl"></div>
<h3>Offline maps</h3>${row('Download regions','Not possible legally with free tile servers (OpenStreetMap/Esri forbid bulk saving).','<button class="btn" id="od">Why?</button>')}
<h3>Coming in later phases</h3><p class="mu">Navigation voice/vehicle settings, notifications (needs a push backend), live location sharing (needs a backend), cloud-synced favorites, collections.</p>
<h3>About</h3><div class="rw"><button class="btn" data-l="about">About</button><button class="btn" data-l="terms">Terms</button><button class="btn" data-l="priv">Privacy</button><button class="btn" data-l="lic">Licences &amp; data</button></div><p class="mu">SMH WORLD MAP v1.0 (Phase 1)</p>`;
 fav()}
function fav(){const f=$('#fl');if(!f)return;f.innerHTML=places.length?'':'<p class="mu">No saved places yet. Tap the map, then ★ Save.</p>';places.forEach((p,i)=>{const d=document.createElement('div');d.className='row';d.innerHTML=`<div><b></b><small></small></div><div class="rw"><button class="btn" data-a="g">Go</button><button class="btn" data-a="r">Rename</button><button class="btn" data-a="n">Note</button><button class="btn" data-a="d">✕</button></div>`;d.querySelector('b').textContent=p.n;d.querySelector('small').textContent=p.note||p.lat.toFixed(4)+', '+p.lng.toFixed(4);
 d.onclick=e=>{const a=e.target.dataset.a;if(a=='g'){if(!map)return toast('Map not loaded');$('#sp').classList.remove('open');map.setView([p.lat,p.lng],15);pick(L.latLng(p.lat,p.lng),p.n)}if(a=='r'){const v=prompt('Rename',p.n);if(v){p.n=v}}if(a=='n'){const v=prompt('Note',p.note||'');if(v!==null)p.note=v}if(a=='d')places.splice(i,1);if(a){W('smh.p',places);fav()}};f.appendChild(d)})}
$('#sb').onclick=e=>{const t=e.target,k=t.dataset.k,g=t.dataset.t,l=t.dataset.l;
 if(k){S[k]=t.dataset.v;sv();theme();if(k=='start')layer();if(k=='units'){toast('Units applied. Reload to update the map scale bar.')}renderSet()}
 if(g){S[g]=!S[g];sv();theme();applyScale();if(g=='labels')layer();if(g=='track')track(S.track);renderSet()}
 if(t.id=='ch'){W('smh.h',[]);W('smh.lh',[]);toast('History cleared');renderSet()}
 if(t.id=='pm')navigator.permissions?.query({name:'geolocation'}).then(r=>modal(`<h2>Location permission</h2><p>Current status: <b>${r.state}</b>.</p><p>SMH asks for your location only when you tap ◎, start tracking, or ask for a route. It is never uploaded. To change it, use your browser's site settings.</p>`)).catch(()=>toast('Your browser cannot report this'));
 if(t.id=='od')modal('<h2>Offline maps</h2><p>Free map servers (OpenStreetMap, Esri) do not allow bulk downloading of their tiles, so SMH does not do it. Offline today: the app itself, your settings and saved places.</p><p>Phase 2 option: your own licensed offline map pack (vector tiles) that you host.</p>');
 if(t.id=='so')fb().then(m=>m.au.signOut(m.auth)).finally(()=>{W('smh.guest',0);location.reload()});if(t.id=='si'){W('smh.guest',0);location.reload()}
 if(l)modal(LEG[l])};
const LEG={about:'<h2>About</h2><p>SMH WORLD MAP is an independent mapping app built on open data. It is not affiliated with Google or any other map company.</p>',
terms:'<h2>Terms of Service</h2><ul><li>Use the app lawfully and at your own risk.</li><li>Maps, routes and weather are informational and may be wrong or outdated. Never rely on them alone for safety-critical decisions or while driving.</li><li>Third-party data is subject to its providers\' terms (see Licences).</li><li>The service is provided "as is" without warranties.</li></ul><p class="mu">Template text: have it reviewed before public launch.</p>',
priv:'<h2>Privacy Policy</h2><ul><li>Favorites, history and settings are stored only on your device (localStorage).</li><li>Your location is used only when you request it and is sent to no server of ours. Routing sends start/end points to the OSRM server; weather and elevation send the tapped coordinates to Open-Meteo; search sends your query to Nominatim.</li><li>If you sign in, your email is handled by Firebase Authentication (Google).</li><li>Clear everything any time in Settings.</li></ul><p class="mu">Template text: update it if you add analytics, sync or sharing.</p>',
lic:'<h2>Licences &amp; data</h2><ul><li>Leaflet — BSD-2</li><li>Map data © OpenStreetMap contributors (ODbL); search by Nominatim; routing by OSRM demo server</li><li>Satellite imagery © Esri, Maxar, Earthstar Geographics</li><li>Terrain © OpenTopoMap (CC-BY-SA)</li><li>Weather &amp; elevation: Open-Meteo (CC-BY 4.0); radar: RainViewer</li><li>Sign-in: Firebase Authentication</li></ul>'};
