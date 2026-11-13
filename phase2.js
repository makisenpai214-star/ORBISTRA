'use strict';
/* SMH WORLD MAP — Phase 2 modules. Loaded after app.js; extends it without removing Phase 1 features. */
const A={},J=u=>fetch(u).then(r=>{if(!r.ok)throw 0;return r.json()}),loadJS=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
const P=document.createElement('section');P.id='p2';P.className='sheet';P.innerHTML='<h2><span id="p2t"></span><button class="ib" id="p2x" aria-label="Close">✕</button></h2><div id="p2b"></div>';$('#app').appendChild(P);
const panel=(t,h)=>{$('#p2t').textContent=t;$('#p2b').innerHTML=h;document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('open'));P.classList.add('open')};
$('#p2x').onclick=()=>P.classList.remove('open');$('#p2b').onclick=e=>{const b=e.target.closest('[data-a]');b&&A[b.dataset.a]&&A[b.dataset.a](b.dataset.v,b)};
const need=()=>map?true:(toast('The map is not loaded yet'),false);

// ===== Tools list (replaces Phase 1 list; radar/traffic/etc. now real) =====
const TL=[['🌍 3D Earth globe','Works',()=>globe()],['🌧 Weather layers','Works',()=>wxPanel()],['⛰ Terrain & peaks','Works',()=>terPanel()],['🚦 Live traffic','Needs key',()=>traffic()],['🕰 Historical imagery','Works',()=>histPanel()],['🏳 Countries','Works',()=>ctryPanel()],['🧭 Route planner','Works',()=>navPanel()],['📍 GPS & history','Works',()=>gpsPanel()],['📐 Measurements','Works',()=>mPanel()]];
$('#tl').innerHTML='';TL.forEach(([n,t,f])=>{const b=document.createElement('button');b.innerHTML=`<span>${n}</span><span class="tag">${t}</span>`;b.onclick=()=>{$('#lp').classList.remove('open');f()};$('#tl').appendChild(b)});

// ===== Weather =====
function wxShow(j){const c=j.current,d=j.daily,u=S.units=='mi',t=v=>u?Math.round(v*9/5+32)+'°F':Math.round(v)+'°C';
 $('#iw').innerHTML=`☁ ${WX[c.weather_code]||'Conditions'} · ${t(c.temperature_2m)} · 💧${c.relative_humidity_2m}% · ${Math.round(c.surface_pressure)} hPa<br>💨 ${u?Math.round(c.wind_speed_10m*.621)+' mph':Math.round(c.wind_speed_10m)+' km/h'} from ${Math.round(c.wind_direction_10m)}° · clouds ${c.cloud_cover}% · rain ${c.precipitation} mm<br><small>Open-Meteo · observed ${esc(c.time.replace('T',' '))}</small><br><small>${d.time.map((x,i)=>x.slice(5)+': '+t(d.temperature_2m_min[i])+' to '+t(d.temperature_2m_max[i])+' '+(WX[d.weather_code[i]]||'')).join('<br>')}</small>`}
const wl={},wt={};
const WL=[['radar','Rain radar (live)',0],['clouds_new','Clouds',1],['temp_new','Temperature',1],['wind_new','Wind speed',1],['pressure_new','Pressure',1],['precipitation_new','Precipitation / storms',1]];
function wxPanel(){panel('Weather layers',WL.map(([id,n,k])=>`<div class="row"><div>${n}<small>${wl[id]?'On · '+wt[id]:k&&!C.owmKey?'Needs a free OpenWeatherMap key':'Off'}</small></div><div class="tg ${wl[id]?'on':''}" data-a="wl" data-v="${id}"></div></div>`).join('')+'<p class="mu">Tap any point on the map for humidity, pressure, wind and a 5-day forecast (snowfall appears as snow in the forecast text). Radar comes from RainViewer; map layers from OpenWeatherMap; point data from Open-Meteo. Times shown are the provider frame time or the moment the layer was loaded.</p>')}
A.wl=async id=>{if(!need())return;if(wl[id]){map.removeLayer(wl[id]);delete wl[id];return wxPanel()}
 if(id=='radar'){try{const j=await J('https://api.rainviewer.com/public/weather-maps.json'),f=j.radar.past.at(-1);wl[id]=L.tileLayer(j.host+f.path+'/256/{z}/{x}/{y}/2/1_1.png',{opacity:.65,maxNativeZoom:7,maxZoom:19,attribution:'Radar © RainViewer'}).addTo(map);wt[id]='radar frame '+new Date(f.time*1e3).toLocaleTimeString()}catch{toast('Rain radar is unavailable right now')}}
 else if(!C.owmKey)nope('Weather map layer','Create a free account at openweathermap.org → API keys → copy the key into owmKey in config.js and upload config.js. New keys can take up to 2 hours to activate.');
 else{wl[id]=L.tileLayer(`https://tile.openweathermap.org/map/${id}/{z}/{x}/{y}.png?appid=${encodeURIComponent(C.owmKey)}`,{opacity:.6,maxZoom:18,attribution:'Weather © OpenWeatherMap'}).addTo(map);wt[id]='loaded '+new Date().toLocaleTimeString()}
 wxPanel()};
toggleRadar=()=>A.wl('radar').then(()=>wxPanel());

// ===== Terrain =====
let hs,pg;
function terPanel(){panel('Terrain & elevation',`<p class="mu">Tap the map for elevation in metres and feet. Contour lines are part of the Terrain base map.</p><div class="rw"><button class="btn ${hs?'pri':''}" data-a="hs">Hillshade ${hs?'on':'off'}</button><button class="btn" data-a="ter">Terrain + contours</button><button class="btn" data-a="peaks">Peaks in view</button><button class="btn" data-a="prof">Elevation profile</button></div><p class="mu">For slope and ascent: draw a line with 📏, then press Elevation profile. Elevation: Open-Meteo (≈90 m DEM). Peaks: OpenStreetMap via Overpass (zoom 9+).</p>`)}
A.hs=()=>{if(!need())return;if(hs){map.removeLayer(hs);hs=null}else hs=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',{opacity:.5,maxZoom:16,attribution:'Hillshade © Esri'}).addTo(map);terPanel()};
A.ter=()=>{S.start='terrain';sv();layer()};
A.peaks=async()=>{if(!need())return;if(map.getZoom()<9)return toast('Zoom in to level 9 or closer to list peaks');const b=map.getBounds();
 try{const j=await J('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(`[out:json][timeout:20];node["natural"="peak"]["name"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});out 60;`));pg?pg.clearLayers():pg=L.layerGroup().addTo(map);
  j.elements.forEach(e=>L.circleMarker([e.lat,e.lon],{radius:6,color:'#fff',fillColor:'#e6b84a',fillOpacity:1}).bindPopup('<b>'+esc(e.tags.name)+'</b>'+(e.tags.ele?'<br>'+esc(e.tags.ele)+' m':'')).addTo(pg));toast(j.elements.length?j.elements.length+' named peaks shown':'No named peaks in this view')}catch{toast('Peak service is busy. Try again shortly.')}};
A.prof=async()=>{if(pts.length<2)return toast('Draw a line with 📏 first (2+ points)');const tot=plen(pts),N=Math.min(60,Math.max(10,Math.round(tot/200))),seg=pts.slice(1).map((p,i)=>hv(pts[i],p)),s=[];
 for(let k=0;k<N;k++){let d=tot*k/(N-1),i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++}const f=seg[i]?Math.min(d/seg[i],1):0,a=pts[i],b=pts[i+1];s.push([a.lat+(b.lat-a.lat)*f,a.lng+(b.lng-a.lng)*f])}
 try{const j=await J(`https://api.open-meteo.com/v1/elevation?latitude=${s.map(x=>x[0].toFixed(5))}&longitude=${s.map(x=>x[1].toFixed(5))}`),e=j.elevation;let up=0,dn=0,ms=0;e.forEach((v,i)=>{if(i){const d=v-e[i-1];d>0?up+=d:dn-=d;ms=Math.max(ms,Math.abs(d)/(tot/(N-1))*100)}});
  panel('Elevation profile',`<canvas id="pc" width="340" height="120"></canvas><p>Length ${fd(tot)} · ascent ${Math.round(up)} m (${Math.round(up*3.281)} ft) · descent ${Math.round(dn)} m (${Math.round(dn*3.281)} ft)</p><p>Min ${Math.round(Math.min(...e))} m · max ${Math.round(Math.max(...e))} m · steepest sample slope ${ms.toFixed(1)}%</p><p class="mu">Slope is averaged between samples, so real slopes can be steeper.</p>`);
  const c=$('#pc').getContext('2d'),mn=Math.min(...e),mx=Math.max(...e);c.strokeStyle='#e6b84a';c.lineWidth=2;c.beginPath();e.forEach((v,i)=>{const x=i/(e.length-1)*340,y=115-(v-mn)/Math.max(mx-mn,1)*105;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}catch{toast('Elevation service unavailable')}};

// ===== Measurements (undo/redo, drag-edit, history, export) =====
let redo=[],mm=[];const MH=()=>R('smh.m',[]);
mdraw=function(){mm.forEach(m=>m.remove());mm=[];pts.forEach((p,i)=>{const m=L.marker(p,{draggable:true,icon:L.divIcon({className:'vx',iconSize:[16,16]})}).addTo(map);m.on('drag',e=>{pts[i]=e.latlng;mline()}).on('dblclick contextmenu',()=>{pts.splice(i,1);mdraw()});mm.push(m)});mline()};
function mline(){mLine&&mLine.remove();mLine=null;if(pts.length)mLine=(mMode=='a'&&pts.length>2?L.polygon:L.polyline)(pts,{color:'#e6b84a',weight:3,interactive:false}).addTo(map);$('#mv').textContent=!pts.length?'Tap the map to add points · drag to edit · double-tap a point to delete':mMode=='a'&&pts.length>2?`Area ${fa(parea(pts))} · Perimeter ${fd(plen(pts,1))}`:`Distance ${fd(plen(pts))} · ${pts.length} points`}
mpt=l=>{pts.push(l);redo=[];mdraw()};
$('#mun').onclick=()=>{pts.length&&redo.push(pts.pop());mdraw()};$('#ms').addEventListener('click',()=>{if(!meas){mm.forEach(m=>m.remove());mm=[]}});
$('#mt .rw').insertAdjacentHTML('beforeend','<button class="btn" id="mre">Redo</button><button class="btn" id="msv">Save</button><button class="btn" id="mhs">List</button>');
$('#mre').onclick=()=>{redo.length&&pts.push(redo.pop());mdraw()};$('#msv').onclick=()=>A.msave();$('#mhs').onclick=()=>mPanel();
A.msave=()=>{if(pts.length<2)return toast('Add at least 2 points');const h=MH();h.unshift({t:Date.now(),m:mMode,txt:$('#mv').textContent,p:pts.map(p=>[p.lat,p.lng])});W('smh.m',h.slice(0,30));toast('Measurement saved on this device')};
const gj=(m,p)=>({type:'Feature',properties:{mode:m,exported:new Date().toISOString()},geometry:m=='a'&&p.length>2?{type:'Polygon',coordinates:[[...p,p[0]].map(x=>[x[1],x[0]])]}:{type:'LineString',coordinates:p.map(x=>[x[1],x[0]])}});
A.mexp=i=>{const e=MH()[i];if(!e)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(gj(e.m,e.p),null,1)],{type:'application/geo+json'}));a.download='smh-measurement.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)};
A.mld=i=>{const e=MH()[i];if(!e||!need())return;meas=true;$('#ms').classList.add('on');$('#mt').hidden=false;mMode=e.m;pts=e.p.map(p=>L.latLng(p[0],p[1]));mdraw();map.fitBounds(L.latLngBounds(pts),{padding:[40,40]});P.classList.remove('open')};
A.mdl=i=>{const h=MH();h.splice(i,1);W('smh.m',h);mPanel()};
function mPanel(){const h=MH();panel('Measurements',(h.length?h.map((e,i)=>`<div class="row"><div>${esc(e.txt)}<small>${new Date(e.t).toLocaleString()}</small></div><div class="rw"><button class="btn" data-a="mld" data-v="${i}">Open</button><button class="btn" data-a="mexp" data-v="${i}">GeoJSON</button><button class="btn" data-a="mdl" data-v="${i}">✕</button></div></div>`).join(''):'<p class="mu">No saved measurements. Use 📏, then Save.</p>')+'<p class="mu">Distances and areas are geodesic (spherical Earth model, ≈0.3% accuracy).</p>')}

// ===== GPS =====
let gh;show=(o=>function(p){const l=o(p);gr.p=p;$('#gr')&&gpsR();navTick(p);return l})(show);const gr={};
function gpsR(){const c=gr.p.coords;$('#gr').innerHTML=`${c.latitude.toFixed(6)}°, ${c.longitude.toFixed(6)}°<br>Accuracy ±${Math.round(c.accuracy)} m · Altitude ${c.altitude!=null?Math.round(c.altitude)+' m':'not available'}<br>Speed ${c.speed!=null?(c.speed*3.6).toFixed(1)+' km/h':'—'} · updated ${new Date(gr.p.timestamp).toLocaleTimeString()}`}
function gpsPanel(){panel('GPS & history',`<p id="gr">${gr.p?'':'No position yet. Tap “Locate once” or “Start tracking”.'}</p><div class="rw"><button class="btn ${S.track?'pri':''}" data-a="trk">${S.track?'Stop tracking':'Start tracking'}</button><button class="btn" data-a="loc1">Locate once</button><button class="btn" data-a="here">Save this location</button></div>
<div class="row"><div>Record location history<small>Off by default. Saved only on this device, only while tracking.</small></div><div class="tg ${S.hist?'on':''}" data-a="hrec"></div></div><div class="rw"><button class="btn" data-a="hshow">Show history on map</button><button class="btn" data-a="hdel">Delete history (${R('smh.lh',[]).length})</button></div>
<p class="mu">Accuracy ± is the radius of the blue circle: outdoors with a clear sky it is often 5–20 m; indoors it can be hundreds of metres. Your location never leaves your device unless you share a link.</p>`);gr.p&&gpsR()}
A.trk=()=>{track(false);S.track=!S.track;sv();track(S.track);gpsPanel()};A.loc1=()=>locate(false,l=>{map.setView(l,16)});
A.here=()=>locate(false,l=>{places.push({n:'My location',lat:l.lat,lng:l.lng,note:new Date().toLocaleString()});W('smh.p',places);toast('Saved to favorites')});
A.hrec=()=>{S.hist=!S.hist;sv();gpsPanel()};A.hdel=()=>{W('smh.lh',[]);gh&&gh.remove();gpsPanel();toast('History deleted')};
A.hshow=()=>{const h=R('smh.lh',[]);if(!need())return;if(h.length<2)return toast('No recorded history yet. Turn on recording, then start tracking.');gh&&gh.remove();gh=L.polyline(h.map(x=>[x[0],x[1]]),{color:'#3b8cff',weight:4,dashArray:'6 6'}).addTo(map);map.fitBounds(gh.getBounds(),{padding:[40,40]});P.classList.remove('open')};

// ===== Traffic =====
let tf;function traffic(){if(!need())return;if(tf){map.removeLayer(tf);tf=null;return toast('Traffic layer off')}
 if(!C.trafficKey)return nope('Live traffic','Create a free TomTom developer account (developer.tomtom.com) → create an app → copy its key into trafficKey in config.js → upload config.js. Incidents and closures are not included in this version; only live traffic flow.');
 tf=L.tileLayer(`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${encodeURIComponent(C.trafficKey)}`,{opacity:.85,maxZoom:18,attribution:'Traffic © TomTom'}).addTo(map);toast('Traffic flow on: green is free-flowing, red is congested')}

// ===== Countries =====
let cls;const cAt=async l=>{try{const r=await J(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&lat=${l.lat}&lon=${l.lng}`);r.address?.country_code?ctry(r.address.country_code.toUpperCase()):toast('No country here (open ocean?)')}catch{toast('Country lookup failed')}};
async function ctryPanel(){panel('Countries','<input id="cq" class="in" placeholder="Search countries" autocomplete="off"><div id="cls"><p class="mu">Loading…</p></div>');
 try{cls=cls||(await J('https://restcountries.com/v3.1/all?fields=name,cca2,flags')).sort((a,b)=>a.name.common.localeCompare(b.name.common))}catch{$('#cls').innerHTML='<p>The country list is unavailable right now.</p>';return}
 const rd=q=>{$('#cls').innerHTML=cls.filter(c=>c.name.common.toLowerCase().includes(q)).slice(0,60).map(c=>`<button class="row b" data-a="cc" data-v="${esc(c.cca2)}"><span>${esc(c.name.common)}</span><img src="${esc(c.flags.png)}" alt="" width="28" loading="lazy"></button>`).join('')||'<p class="mu">No match</p>'};rd('');$('#cq').oninput=e=>rd(e.target.value.toLowerCase())}
A.cc=c=>ctry(c,true);
async function ctry(code,fly){panel('Country','<p class="mu">Loading…</p>');try{let c=await J(`https://restcountries.com/v3.1/alpha/${code}?fields=name,flags,capital,population,area,languages,currencies,continents,idd,latlng,borders`);c=Array.isArray(c)?c[0]:c;
 const nb=c.borders?.length?await J('https://restcountries.com/v3.1/alpha?codes='+c.borders.join(',')+'&fields=name,cca2'):[],cu=Object.values(c.currencies||{}).map(x=>x.name+(x.symbol?' ('+x.symbol+')':'')).join(', ')||'—',ar=c.area||0;
 panel(c.name.common,`<img class="fl" src="${esc(c.flags.png)}" alt="${esc(c.flags.alt||'Flag')}"><h3>${esc(c.name.official)}</h3><div class="sv"><span>Capital</span><b>${esc((c.capital||['—']).join(', '))}</b></div><div class="sv"><span>Population</span><b>${(c.population||0).toLocaleString()}</b></div><div class="sv"><span>Area</span><b>${S.units=='mi'?Math.round(ar/2.59).toLocaleString()+' mi²':ar.toLocaleString()+' km²'}</b></div><div class="sv"><span>Languages</span><b>${esc(Object.values(c.languages||{}).join(', ')||'—')}</b></div><div class="sv"><span>Currency</span><b>${esc(cu)}</b></div><div class="sv"><span>Continent</span><b>${esc((c.continents||[]).join(', '))}</b></div><div class="sv"><span>Calling code</span><b>${esc((c.idd?.root||'')+(c.idd?.suffixes?.length==1?c.idd.suffixes[0]:''))||'—'}</b></div><div class="sv"><span>Coordinates</span><b>${c.latlng?c.latlng[0].toFixed(2)+'°, '+c.latlng[1].toFixed(2)+'°':'—'}</b></div><h3>Neighbours</h3><div class="rw">${nb.map(n=>`<button class="btn" data-a="cc" data-v="${esc(n.cca2)}">${esc(n.name.common)}</button>`).join('')||'<span class="mu">None (island or no land border)</span>'}</div><p class="mu">Data: REST Countries.</p>`);
 if(fly&&map&&c.latlng)map.setView(c.latlng,5)}catch{panel('Country','<p>Country data is unavailable right now.</p>')}}
$('#info .rw').insertAdjacentHTML('beforeend','<button class="btn" id="icn">🏳 Country</button>');$('#icn').onclick=()=>sel&&cAt(sel.l);

// ===== Route planner =====
const nv={a:null,b:null,m:'car',rs:[],i:0,voice:false,si:0},OSM={car:['routed-car','driving'],foot:['routed-foot','foot'],bike:['routed-bike','bike']};
const instr=s=>{const m=s.maneuver,t=m.type,d=m.modifier||'',n=s.name?' onto '+s.name:'';return t=='arrive'?'Arrive at your destination':(t=='depart'?'Head '+(d||'out'):t=='roundabout'||t=='rotary'?'Enter the roundabout':['turn','end of road','fork','on ramp','off ramp'].includes(t)?'Turn '+d:t=='merge'?'Merge '+d:'Continue '+d)+n};
const say=(t,f)=>{if(!('speechSynthesis'in window))return f&&toast('Voice is not supported in this browser');if(nv.voice||f){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(t))}};
const dm=s=>(s/60<1?'<1':Math.round(s/60))+' min';
function navPanel(){panel('Route planner',`<div class="row"><div>From<small>${nv.a?cs(nv.a):'Not set'}</small></div><div class="rw"><button class="btn" data-a="nfm">My location</button><button class="btn" data-a="nfp">Pin</button></div></div><div class="row"><div>To<small>${nv.b?cs(nv.b):'Tap the map, then “Pin”'}</small></div><button class="btn" data-a="ntp">Pin</button></div><div class="row"><div>Mode</div><div class="seg">${[['car','Drive'],['foot','Walk'],['bike','Cycle']].map(([v,n])=>`<button data-a="nmd" data-v="${v}" class="${nv.m==v?'on':''}">${n}</button>`).join('')}</div></div><div class="rw"><button class="btn pri" data-a="ngo">Get route</button><button class="btn" data-a="nvo">🔊 Voice ${nv.voice?'on':'off'}</button><button class="btn" data-a="ncx">Cancel route</button></div><div id="nr"></div>`);navRes()}
function navRes(){if(!nv.rs.length||!$('#nr'))return;const r=nv.rs[nv.i];$('#nr').innerHTML='<h3>Routes</h3>'+nv.rs.map((x,i)=>`<button class="row b" data-a="nsel" data-v="${i}"><span>${i==nv.i?'● ':'○ '}Route ${i+1}: ${fd(x.distance)} · ${dm(x.duration)}</span></button>`).join('')+'<h3>Directions</h3>'+r.legs[0].steps.map((s,i)=>`<button class="row b" data-a="nst" data-v="${i}"><span>${esc(instr(s))}</span><small>${fd(s.distance)}</small></button>`).join('')+'<p class="mu">Routing: routing.openstreetmap.de (OSRM). Times ignore live traffic. Voice announces each turn when live tracking is on.</p>'}
function navDraw(){route&&route.remove();route=L.layerGroup(nv.rs.map((r,i)=>L.geoJSON(r.geometry,{style:{color:i==nv.i?'#e6b84a':'#8fa3c4',weight:i==nv.i?6:4,opacity:i==nv.i?1:.7}}))).addTo(map)}
A.nfm=()=>locate(false,l=>{nv.a=l;navPanel()});A.nfp=()=>{if(sel){nv.a=sel.l;navPanel()}else toast('Tap the map to choose a pin first')};A.ntp=()=>{if(sel){nv.b=sel.l;navPanel()}else toast('Tap the map to choose a pin first')};
A.nmd=v=>{nv.m=v;nv.rs=[];navPanel()};A.nvo=()=>{nv.voice=!nv.voice;navPanel();nv.voice&&say('Voice guidance on',1)};A.nsel=i=>{nv.i=+i;nv.si=0;navDraw();navRes()};A.nst=i=>{const s=nv.rs[nv.i].legs[0].steps[i];say(instr(s),1);map.setView([s.maneuver.location[1],s.maneuver.location[0]],16)};
A.ncx=()=>{route&&route.remove();route=null;nv.rs=[];nv.si=0;'speechSynthesis'in window&&speechSynthesis.cancel();navPanel();toast('Route cancelled')};
A.ngo=async()=>{if(!need())return;if(!nv.a||!nv.b)return toast('Set both From and To first');if(!navigator.onLine)return toast('Routing needs internet');const [s,p]=OSM[nv.m];
 try{const j=await J(`https://routing.openstreetmap.de/${s}/route/v1/${p}/${nv.a.lng},${nv.a.lat};${nv.b.lng},${nv.b.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`);if(!j.routes?.length)return toast('No route found for this mode');nv.rs=j.routes;nv.i=0;nv.si=0;navDraw();map.fitBounds(L.geoJSON(nv.rs[0].geometry).getBounds(),{padding:[40,40]});navRes()}catch{toast('Routing service is unavailable. Try again later.')}};
function navTick(p){if(!nv.voice||!nv.rs.length)return;const nx=nv.rs[nv.i].legs[0].steps[nv.si+1];if(nx&&hv({lat:p.coords.latitude,lng:p.coords.longitude},{lat:nx.maneuver.location[1],lng:nx.maneuver.location[0]})<60){say(instr(nx));nv.si++}}
$('#idr').onclick=()=>{if(!sel)return;nv.b=sel.l;nv.rs=[];navPanel();if(!nv.a)locate(false,l=>{nv.a=l;navPanel();A.ngo()});else A.ngo()};

// ===== Historical imagery (Esri Wayback) with before/after slider =====
let wbr,wA,wB,wFn,wSl,wLn;
async function histPanel(){if(!need())return;panel('Historical imagery','<p class="mu">Loading Esri Wayback dates…</p>');
 try{if(!wbr){const c=await J('https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json');wbr=Object.values(c).map(v=>({u:v.itemURL,d:((v.itemTitle||'').match(/\d{4}-\d{2}-\d{2}/)||[''])[0]})).filter(x=>x.d&&x.u).sort((a,b)=>a.d<b.d?1:-1)}}catch{return panel('Historical imagery','<p>The Esri Wayback date list could not be loaded. Check your connection and try again.</p>')}
 if(!wbr.length)return panel('Historical imagery','<p>No dated imagery was returned by the provider.</p>');
 const op=i=>wbr.map((r,j)=>`<option value="${j}" ${j==i?'selected':''}>${r.d}</option>`).join('');
 panel('Historical imagery',`<p class="mu">Esri Wayback archive. Dates are release dates of the imagery layer, not exact capture dates, and not every area changes between releases. Imagery © Esri, Maxar and others; follow Esri's terms.</p><div class="row"><div>Older (left side)</div><select id="wba">${op(Math.min(wbr.length-1,Math.floor(wbr.length/2)))}</select></div><div class="row"><div>Newer (right side)</div><select id="wbb">${op(0)}</select></div><div class="rw"><button class="btn pri" data-a="wbgo">Compare</button><button class="btn" data-a="wbx">Stop</button></div>`)}
A.wbx=()=>{[wA,wB].forEach(l=>l&&map.removeLayer(l));wA=wB=null;wFn&&map.off('move zoom',wFn);wSl&&wSl.remove();wLn&&wLn.remove();wSl=wLn=null};
A.wbgo=()=>{const mk=j=>{const u=wbr[j].u.replace('{level}','{z}').replace('{row}','{y}').replace('{col}','{x}');return /\{(?!z\}|y\}|x\})/.test(u)?null:L.tileLayer(u,{maxZoom:19,attribution:'Esri Wayback '+wbr[j].d})};
 A.wbx();wA=mk(+$('#wba').value);wB=mk(+$('#wbb').value);if(!wA||!wB){return toast('Provider tile format changed; comparison unavailable')}wA.addTo(map);wB.addTo(map);
 wSl=document.createElement('input');wSl.type='range';wSl.id='cs';wSl.value=50;wSl.setAttribute('aria-label','Before and after');wLn=document.createElement('div');wLn.id='cl';document.body.append(wSl,wLn);
 wFn=()=>{const s=map.getSize(),nw=map.containerPointToLayerPoint([0,0]),x=nw.x+s.x*wSl.value/100;wA.getContainer().style.clip=`rect(${nw.y}px,${x}px,${nw.y+s.y}px,${nw.x}px)`;wB.getContainer().style.clip=`rect(${nw.y}px,${nw.x+s.x}px,${nw.y+s.y}px,${x}px)`;wLn.style.left=wSl.value+'%'};
 wSl.oninput=wFn;map.on('move zoom',wFn);setTimeout(wFn,50);P.classList.remove('open');toast('Drag the slider: older imagery left, newer right. Open Historical imagery → Stop to exit.',6000)};

// ===== 3D Earth globe (Three.js, loaded only when opened) =====
let G;
async function globe(){if(G)return;if(!navigator.onLine)return toast('The 3D globe needs an internet connection');
 const o=document.createElement('div');o.id='gb';o.innerHTML='<div id="gc"></div><div id="gi" class="card">Loading 3D Earth…</div><button class="ib card" id="gx" aria-label="Close globe">✕</button><div id="gd" class="card" hidden></div>';document.body.appendChild(o);G=o;
 try{window.THREE||await loadJS('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')}catch{o.remove();G=null;return toast('Could not load the 3D engine')}
 const T3=THREE,IMG='https://cdn.jsdelivr.net/npm/three-globe/example/img/',el=$('#gc'),PI=Math.PI;
 const rn=new T3.WebGLRenderer({antialias:false});rn.setPixelRatio(Math.min(devicePixelRatio,2));rn.setSize(el.clientWidth,el.clientHeight);el.appendChild(rn.domElement);
 const sc=new T3.Scene(),cam=new T3.PerspectiveCamera(45,el.clientWidth/el.clientHeight,.1,100);cam.position.z=3.4;
 const tl=new T3.TextureLoader(),fail=()=>{$('#gi').textContent='Earth textures could not load. Check your connection.'};
 const dayT=tl.load(IMG+'earth-blue-marble.jpg',()=>{$('#gi').textContent='Drag to rotate · pinch or scroll to zoom · tap a place · day/night from your clock'},undefined,fail),nightT=tl.load(IMG+'earth-night.jpg');sc.background=tl.load(IMG+'night-sky.png');
 const earth=new T3.Mesh(new T3.SphereGeometry(1,64,48),new T3.ShaderMaterial({uniforms:{d:{value:dayT},n:{value:nightT},sun:{value:new T3.Vector3(1,0,0)}},vertexShader:'varying vec2 u;varying vec3 w;void main(){u=uv;w=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D d,n;uniform vec3 sun;varying vec2 u;varying vec3 w;void main(){float k=smoothstep(-.12,.18,dot(w,normalize(sun)));gl_FragColor=vec4(mix(texture2D(n,u).rgb*1.3,texture2D(d,u).rgb,k),1.);}'}));
 const atm=new T3.Mesh(new T3.SphereGeometry(1.14,48,32),new T3.ShaderMaterial({transparent:true,blending:T3.AdditiveBlending,side:T3.BackSide,vertexShader:'varying vec3 v;void main(){v=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){float i=pow(max(.72-dot(v,vec3(0.,0.,1.)),0.),3.);gl_FragColor=vec4(.3,.6,1.,1.)*i;}'}));sc.add(earth,atm);
 const v3=(la,lo)=>{const p=(lo+180)*PI/180,t=(90-la)*PI/180;return new T3.Vector3(-Math.cos(p)*Math.sin(t),Math.cos(t),Math.sin(p)*Math.sin(t))};
 const sunV=()=>{const t=new Date(),dy=(t-new Date(t.getUTCFullYear(),0,0))/864e5;return v3(23.44*Math.sin(2*PI*(dy-81)/365),-((t.getUTCHours()+t.getUTCMinutes()/60-12)*15))};
 const c0=map?map.getCenter():{lat:20,lng:0};earth.rotation.set(Math.max(-1.2,Math.min(1.2,c0.lat*PI/180)),(-90-c0.lng)*PI/180,0);
 const ptr=new Map(),cl=(v,a,b)=>Math.max(a,Math.min(b,v));let mv=0,auto=S.motion,pd=0,pin;
 const dist=()=>{const a=[...ptr.values()];return Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])};
 el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);mv=0;auto=false;if(ptr.size==2)pd=dist()};
 el.onpointermove=e=>{if(!ptr.has(e.pointerId))return;const p=ptr.get(e.pointerId),dx=e.clientX-p[0],dy=e.clientY-p[1];ptr.set(e.pointerId,[e.clientX,e.clientY]);mv+=Math.abs(dx)+Math.abs(dy);
  if(ptr.size==1){const k=.0035*(cam.position.z-.8);earth.rotation.y+=dx*k;earth.rotation.x=cl(earth.rotation.x+dy*k,-1.4,1.4)}else{const nd=dist();cam.position.z=cl(cam.position.z*pd/nd,1.3,6);pd=nd}};
 el.onpointerup=el.onpointercancel=e=>{const one=ptr.size==1;ptr.delete(e.pointerId);if(one&&mv<8&&e.type=='pointerup')tap(e)};
 el.onwheel=e=>{e.preventDefault();cam.position.z=cl(cam.position.z*(1+e.deltaY*.001),1.3,6)};
 function tap(e){const r=rn.domElement.getBoundingClientRect(),ray=new T3.Raycaster();ray.setFromCamera(new T3.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)),cam);const h=ray.intersectObject(earth)[0];if(!h)return;
  const lp=earth.worldToLocal(h.point.clone()).normalize(),la=Math.asin(lp.y)*180/PI;let lo=Math.atan2(lp.z,-lp.x)*180/PI-180;if(lo<-180)lo+=360;
  pin&&earth.remove(pin);pin=new T3.Mesh(new T3.SphereGeometry(.014,12,8),new T3.MeshBasicMaterial({color:0xffd27a}));pin.position.copy(lp.clone().multiplyScalar(1.006));earth.add(pin);
  const d=$('#gd');d.hidden=false;d.innerHTML=`<b>${la.toFixed(4)}°, ${lo.toFixed(4)}°</b><p class="mu" id="gn">Looking up place…</p><div class="rw"><button class="btn pri" id="gm">Open on map</button><button class="btn" id="gct">Country info</button></div>`;
  J(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&lat=${la}&lon=${lo}`).then(r=>{$('#gn')&&($('#gn').textContent=r.display_name||'Open ocean')}).catch(()=>{$('#gn')&&($('#gn').textContent='Place name unavailable')});
  $('#gm').onclick=()=>{close();if(map){map.setView([la,lo],10);pick(L.latLng(la,lo))}};$('#gct').onclick=()=>{close();cAt(L.latLng(la,lo))}}
 const rs=()=>{rn.setSize(el.clientWidth,el.clientHeight);cam.aspect=el.clientWidth/el.clientHeight;cam.updateProjectionMatrix()};addEventListener('resize',rs);
 const tick=()=>{if(!G)return;requestAnimationFrame(tick);if(document.hidden)return;if(auto)earth.rotation.y+=.0015;earth.material.uniforms.sun.value.copy(sunV()).applyQuaternion(earth.quaternion);rn.render(sc,cam)};
 function close(){G=null;removeEventListener('resize',rs);rn.dispose();[earth.geometry,earth.material,atm.geometry,atm.material,dayT,nightT].forEach(x=>x.dispose&&x.dispose());o.remove()}
 $('#gx').onclick=close;tick()}
