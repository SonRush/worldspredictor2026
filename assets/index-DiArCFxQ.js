(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))n(t);new MutationObserver(t=>{for(const o of t)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function s(t){const o={};return t.integrity&&(o.integrity=t.integrity),t.referrerPolicy&&(o.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?o.credentials="include":t.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(t){if(t.ep)return;t.ep=!0;const o=s(t);fetch(t.href,o)}})();const ye="./data/";async function z(e){const a=await fetch(`${ye}${e}?t=${Date.now()}`,{cache:"no-store"});if(!a.ok)throw new Error(`${e}: HTTP ${a.status}`);return await a.json()}async function Se(){const[e,a]=await Promise.all([z("teams.json"),z("tournament.json")]);if(!Array.isArray(e?.teams)||!a?.swiss?.rounds)throw new Error("Malformed data files");return{teams:e,tournament:a}}const Ae={LCK:15,LPL:10,LEC:0,LCS:-10,LTA:-10,LCP:-10,CBLOL:-20},Be=4,oe=24;function ie(e,a){return 1/(1+Math.pow(10,(a-e)/400))}function W(e,a){if(a<0||a>e)return 0;let s=1;for(let n=1;n<=a;n++)s=s*(e-a+n)/n;return s}function _(e,a){const s=Math.ceil(a/2),n=[];for(let t=0;t<s;t++)n.push({scoreA:s,scoreB:t,prob:W(s-1+t,t)*e**s*(1-e)**t});for(let t=0;t<s;t++)n.push({scoreA:t,scoreB:s,prob:W(s-1+t,t)*(1-e)**s*e**t});return n}function re(e,a){const s=a,n=Math.ceil(s/2);let t=0;for(let o=n;o<=s;o++)t+=W(s,o)*e**o*(1-e)**(s-o);return t}function ke(e,a){return _(e,a).reduce((s,n)=>n.prob>s.prob?n:s)}function Y(e,a,s){return _(e,a).filter(n=>s?n.scoreA>n.scoreB:n.scoreB>n.scoreA).reduce((n,t)=>t.prob>n.prob?t:n)}function J(e,a,s,n=0,t=0){const o=Math.ceil(a/2);let r=n,i=t;for(;r<o&&i<o;)s()<e?r++:i++;return{scoreA:r,scoreB:i}}function Ie(e,a,s,n=oe){const t=ie(e,a),o=n*((s?1:0)-t);return[e+o,a-o]}function Pe(e,a){const s={};for(const t of e)s[t.id]={team:t.id,base:t.baseElo,elo:t.baseElo,regionBonus:Ae[t.region]??0,formBonus:0,effective:t.baseElo,form:[],mapsWon:0,mapsLost:0,seriesWon:0,seriesLost:0};const n=a.filter(t=>t.status==="FINISHED"&&t.teamA&&t.teamB&&s[t.teamA]&&s[t.teamB]).slice().sort((t,o)=>(t.startTime??"").localeCompare(o.startTime??""));for(const t of n){const o=s[t.teamA],r=s[t.teamB],i=t.winner===t.teamA;let c=Math.max(1,i?t.scoreA:t.scoreB)-1,f=i?t.scoreB:t.scoreA;const l=[];for(;c>0||f>0;)f-- >0&&l.push(!i),c-- >0&&l.push(i);l.push(i);for(const m of l)[o.elo,r.elo]=Ie(o.elo,r.elo,m),o.form.push(m?"W":"L"),r.form.push(m?"L":"W"),m?(o.mapsWon++,r.mapsLost++):(r.mapsWon++,o.mapsLost++);i?(o.seriesWon++,r.seriesLost++):(r.seriesWon++,o.seriesLost++)}for(const t of Object.values(s)){const o=t.form.slice(-5),r=o.filter(i=>i==="W").length-o.filter(i=>i==="L").length;t.formBonus=r*Be,t.effective=t.elo+t.regionBonus+t.formBonus}return s}function H(e,a,s){return ie(e[a].effective,e[s].effective)}function Ee(e,a,s,n){const t=e[a],o=e[s],r=H(e,a,s);return{a,b:s,bestOf:n,pMap:r,pSeries:re(r,n),distribution:_(r,n),mostLikely:ke(r,n),factors:[{label:"Base Elo",value:t.base-o.base},{label:"Worlds 2026 results",value:t.elo-t.base-(o.elo-o.base)},{label:"Region strength",value:t.regionBonus-o.regionBonus},{label:"Recent form",value:t.formBonus-o.formBonus}]}}function ce(e){let a=e>>>0;return()=>{a=a+1831565813>>>0;let s=a;return s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296}}function k(e,a){const s=e.slice();for(let n=s.length-1;n>0;n--){const t=Math.floor(a()*(n+1));[s[n],s[t]]=[s[t],s[n]]}return s}const Oe={"PI-C":{A:["PI-A","winner"],B:["PI-B","winner"]},"PI-D":{A:["PI-A","loser"],B:["PI-B","loser"]},"PI-E":{A:["PI-C","loser"],B:["PI-D","winner"]},"PI-F":{A:["PI-C","winner"],B:["PI-E","winner"]}},Me="PI-F",Le={SF1:{A:"QF1",B:"QF2"},SF2:{A:"QF3",B:"QF4"},F:{A:"SF1",B:"SF2"}},j=3,N=3;function C(e){return`${e.wins}-${e.losses}`}function Fe(e){return e.wins===j-1||e.losses===N-1?3:1}function je(e,a,s){const[n,t]=[a,s].sort();return`SW-R${e}-${n}-${t}`}function q(e){return{...e,source:e.status==="FINISHED"&&e.winner?"official":null,projectedPairing:!1}}function Ce(e){return e.winner?e.winner===e.teamA?e.teamB:e.teamA:null}function Q(e,a){if(!e.teamA||!e.teamB)return;if(e.status==="FINISHED"&&e.winner){e.source="official";return}const s=Math.ceil(e.bestOf/2),n=H(a.ratings,e.teamA,e.teamB),t=a.overrides?.[e.id];if(t&&(t.winner===e.teamA||t.winner===e.teamB)){const r=t.winner===e.teamA,p=t.scoreA!=null&&t.scoreB!=null&&(r?t.scoreA===s&&t.scoreB<s:t.scoreB===s&&t.scoreA<s)?{scoreA:t.scoreA,scoreB:t.scoreB}:Y(n,e.bestOf,r);e.scoreA=p.scoreA,e.scoreB=p.scoreB,e.winner=t.winner,e.source="manual";return}if(a.mode==="none")return;let o;a.mode==="favorite"?o=Y(n,e.bestOf,n>=.5):o=e.status==="IN_PROGRESS"?J(n,e.bestOf,a.rng,e.scoreA,e.scoreB):J(n,e.bestOf,a.rng),e.scoreA=o.scoreA,e.scoreB=o.scoreB,e.winner=o.scoreA>o.scoreB?e.teamA:e.teamB,e.source="projected"}function Re(e,a){const s=new Map,n=[];for(const t of e.playIn.matches){const o=q(t),r=Oe[o.id];if(r){const i=([p,c])=>{const f=s.get(p);return f?c==="winner"?f.winner:Ce(f):null};o.teamA??=i(r.A),o.teamB??=i(r.B)}Q(o,a),s.set(o.id,o),n.push(o)}return{matches:n,qualifier:s.get(Me)?.winner??null}}function Te(e,a,s){for(const o of[0,1,2])for(let r=0;r<20;r++){const i=le(k(e,a),s,o);if(i)return i}const n=e.slice(),t=[];for(;n.length>=2;)t.push([n.shift(),n.shift()]);return t}function le(e,a,s){if(e.length===0)return[];if(e.length===1)return null;const[n,...t]=e;for(let o=0;o<t.length;o++){if(a(n,t[o])>s)continue;const r=t.slice(0,o).concat(t.slice(o+1)),i=le(r,a,s);if(i)return[[n,t[o]],...i]}return null}function We(e,a,s,n){const t=i=>i===n?4:a.get(i)?.swissTier??4,o=i=>a.get(i)?.region,r=[];for(const[i,p]of[[1,4],[2,3]]){const c=k(e.filter(m=>t(m)===i),s),f=e.filter(m=>t(m)===p);let l=null;for(let m=0;m<60&&!l;m++){const g=k(f,s);g.length===c.length&&c.every((b,u)=>o(b)!==o(g[u]))&&(l=g)}l??=k(f,s),c.forEach((m,g)=>l[g]&&r.push([m,l[g]]))}return r}function R(e){return{team:e,wins:0,losses:0,opponents:[],finishedRound:null}}function Ne(e,a,s,n){const t=new Map(a.map(l=>[l.id,l])),o=a.filter(l=>l.stageEntry==="SWISS").map(l=>l.id),r=e.swiss.rounds.flatMap(l=>l.matches.flatMap(m=>[m.teamA,m.teamB])),i=Array.from(new Set([...o,...s?[s]:[],...r.filter(Boolean)])),p=Object.fromEntries(i.map(l=>[l,R(l)])),c=[];let f=!1;for(let l=1;l<=5;l++){const g=(e.swiss.rounds.find(v=>v.round===l)?.matches??[]).map(v=>{const $=q(v);return $.teamA&&p[$.teamA]&&($.pool=C(p[$.teamA])),$}),b=new Set(g.flatMap(v=>[v.teamA,v.teamB])),u=i.filter(v=>p[v].wins<j&&p[v].losses<N&&!b.has(v)),x=!f&&n.mode!=="none"&&i.length===16;if(u.length>0&&x){let v=[];if(l===1)v=We(u,t,n.rng,s);else{const $=new Map;for(const S of u){const A=C(p[S]);$.set(A,[...$.get(A)??[],S])}for(const S of $.values())v.push(...Te(S,n.rng,(A,O)=>p[A].opponents.includes(O)?2:0))}for(const[$,S]of v){const A=p[$];g.push({id:je(l,$,S),stage:"SWISS",round:l,label:null,teamA:$,teamB:S,bestOf:Fe(A),status:"SCHEDULED",scoreA:0,scoreB:0,winner:null,startTime:null,externalId:null,source:null,pool:C(A),projectedPairing:!0})}}for(const v of g)Q(v,n);for(const v of g){if(!v.winner||!v.teamA||!v.teamB){f=!0;continue}const $=p[v.teamA]??=R(v.teamA),S=p[v.teamB]??=R(v.teamB);$.opponents.push(v.teamB),S.opponents.push(v.teamA);const[A,O]=v.winner===v.teamA?[$,S]:[S,$];A.wins++,O.losses++,A.wins===j&&(A.finishedRound=l),O.losses===N&&(O.finishedRound=l)}u.length>0&&!x&&(f=!0),c.push({round:l,matches:g})}return{swissTeams:i,rounds:c,records:p}}function De(e){const a=Object.values(e).filter(s=>s.wins===j);return{complete:a.length===8&&Object.values(e).every(s=>s.wins===3||s.losses===3),byRecord:{"3-0":a.filter(s=>s.losses===0).map(s=>s.team),"3-1":a.filter(s=>s.losses===1).map(s=>s.team),"3-2":a.filter(s=>s.losses===2).map(s=>s.team)}}}function _e(e,a,s){const n=o=>a.get(o)?.region;let t=null;for(let o=0;o<80;o++){const r=k(e["3-0"],s),i=k(e["3-2"],s),p=e["3-1"],c=[],f=[];for(const b of r)c.push(b),f.push(i.shift()??"");const l=k([...p,...i],s),m=[],g=[[c[0],f[0]],[l[0],l[1]],[c[1],f[1]],[l[2],l[3]]];for(const[b,u]of g)b&&u&&m.push([b,u]);if(m.length!==4){const b=k([...e["3-0"],...e["3-1"],...e["3-2"]],s);return[0,2,4,6].map(u=>[b[u],b[u+1]])}if(t??=m,m.every(([b,u])=>n(b)!==n(u)))return m}return t}function He(e,a,s,n){const t=new Map(a.map(l=>[l.id,l])),{complete:o,byRecord:r}=De(s),i=new Map,p=e.knockout.matches.map(q),c=p.filter(l=>l.id.startsWith("QF"));if(c.some(l=>!l.teamA||!l.teamB)&&o&&n.mode!=="none"){const l=_e(r,t,n.rng),m=new Set(c.flatMap(b=>[b.teamA,b.teamB]).filter(Boolean));let g=0;for(const b of c)if(!(b.teamA&&b.teamB)){for(;g<l.length&&(m.has(l[g][0])||m.has(l[g][1]));)g++;if(g>=l.length)break;[b.teamA,b.teamB]=l[g++],b.projectedPairing=!0}}for(const l of p){const m=Le[l.id];m&&(l.teamA||(l.teamA=i.get(m.A)?.winner??null,l.projectedPairing||=i.get(m.A)?.source!=="official"),l.teamB||(l.teamB=i.get(m.B)?.winner??null,l.projectedPairing||=i.get(m.B)?.source!=="official")),Q(l,n),i.set(l.id,l)}return{matches:p,champion:i.get("F")?.winner??null}}function de(e,a,s){const n=Re(a,s),t=new Set(e.filter(c=>c.stageEntry==="SWISS").map(c=>c.id)),r=a.swiss.rounds.flatMap(c=>c.matches.flatMap(f=>[f.teamA,f.teamB])).find(c=>c&&!t.has(c))??null??n.qualifier,i=Ne(a,e,r,s),p=He(a,e,i.records,s);return{playIn:n.matches,playInQualifier:r,swissTeams:i.swissTeams,swissRounds:i.rounds,swissRecords:i.records,knockout:p.matches,champion:p.champion}}function pe(e){return[...e.playIn.matches,...e.swiss.rounds.flatMap(a=>a.matches),...e.knockout.matches]}const L="wp26:overrides",V="wp26:prefs",qe=2026;function X(e,a){try{const s=localStorage.getItem(e);return s?{...a,...JSON.parse(s)}:a}catch{return a}}function F(e,a){try{localStorage.setItem(e,JSON.stringify(a))}catch{}}class Qe{teamsFile;tournament;teams=[];teamsById=new Map;ratings={};overrides=X(L,{});prefs=X(V,{showProjection:!0,mcIterations:1e3,mcUseOverrides:!1,h2h:{a:"GEN",b:"BLG",bestOf:5}});mc=null;mcRunning=!1;scenarioSeed=null;listeners=[];cache=new Map;setData(a,s){this.teamsFile=a,this.tournament=s,this.teams=a.teams,this.teamsById=new Map(this.teams.map(n=>[n.id,n])),this.ratings=Pe(this.teams,pe(s)),this.cache.clear(),this.emit()}resolved(a){const s=this.scenarioSeed,n=s!=null?`random:${s}`:a?"favorite":"none";let t=this.cache.get(n);return t||(t=de(this.teams,this.tournament,{ratings:this.ratings,overrides:this.overrides,mode:s!=null?"random":a?"favorite":"none",rng:ce(s??qe)}),this.cache.set(n,t)),t}togglePick(a,s){this.overrides[a]?.winner===s?delete this.overrides[a]:this.overrides[a]={winner:s},F(L,this.overrides),this.cache.clear(),this.emit()}setPickScore(a,s,n,t){this.overrides[a]={winner:s,scoreA:n,scoreB:t},F(L,this.overrides),this.cache.clear(),this.emit()}clearPicks(a){for(const s of Object.keys(this.overrides))(!a||s.startsWith(a))&&delete this.overrides[s];F(L,this.overrides),this.cache.clear(),this.emit()}setPrefs(a){this.prefs={...this.prefs,...a},F(V,this.prefs),this.emit()}setMc(a,s,n){this.mc=a,this.mcRunning=s,n!==void 0&&(this.scenarioSeed=n),this.emit()}setScenario(a){this.scenarioSeed=a,this.emit()}subscribe(a){this.listeners.push(a)}emit(){for(const a of this.listeners)a()}}const d=new Qe;function Z(e){const a=typeof performance<"u"?performance.now():Date.now(),s=e.seed??Math.floor(Math.random()*2**31),n=ce(s),t=Math.max(1,Math.floor(e.iterations)),o={},r={},i=(c,f,l)=>{if(!f)return;const m=(r[c]??={})[f]??={played:0,won:0};m.played++,l&&m.won++};for(const c of e.teams)o[c.id]={team:c.id,swiss:0,playoffs:0,semis:0,final:0,champion:0,records:{}};for(let c=0;c<t;c++){const f=de(e.teams,e.tournament,{ratings:e.ratings,overrides:e.overrides,mode:"random",rng:n});for(const l of[...f.playIn,...f.knockout])i(l.id,l.teamA,l.winner===l.teamA),i(l.id,l.teamB,l.winner===l.teamB);for(const l of f.swissTeams){const m=o[l];if(!m)continue;m.swiss++;const g=f.swissRecords[l];if(g&&(g.wins===3||g.losses===3)){const b=`${g.wins}-${g.losses}`;m.records[b]=(m.records[b]??0)+1}g?.wins===3&&m.playoffs++}for(const l of f.knockout)l.winner&&(l.id.startsWith("QF")&&o[l.winner].semis++,l.id.startsWith("SF")&&o[l.winner].final++,l.id==="F"&&o[l.winner].champion++)}for(const c of Object.values(o)){c.swiss/=t,c.playoffs/=t,c.semis/=t,c.final/=t,c.champion/=t;for(const f of Object.keys(c.records))c.records[f]/=t}for(const c of Object.values(r))for(const f of Object.values(c))f.played/=t,f.won/=t;const p=typeof performance<"u"?performance.now():Date.now();return{iterations:t,seed:s,odds:o,slots:r,elapsedMs:p-a,usedOverrides:!!e.overrides&&Object.keys(e.overrides).length>0}}const ee={AL:"dark",CFO:"dark",FUR:"dark",T1:"dark",TES:"dark",DK:"light",GEN:"light",G2:"light",TL:"light",TSW:"light"};function h(e){return String(e??"").replace(/[&<>"']/g,a=>`&#${a.charCodeAt(0)};`)}const w=(e,a=1)=>e<=0?"0%":e>=1?"100%":e<.001?"<0.1%":`${(e*100).toFixed(a)}%`,ue={LCK:"#0AC8B9",LPL:"#E84057",LEC:"#C8AA6E",LCS:"#4A90E2",LTA:"#4A90E2",CBLOL:"#3FB950",LCP:"#B57EDC"};function y(e){return e?d.teamsById.get(e):void 0}function fe(e,a,s){return`<span class="hex-crest ${s}" style="--crest:${a}" aria-hidden="true">${h(e)}</span>`}function B(e,a="w-8 h-8 text-[10px]"){const s=y(e);if(!s)return fe("?","#3C3C41",a);const n=ue[s.region]??"#3C3C41",t=ee[s.id]?` data-tone="${ee[s.id]}"`:"";return`<span class="logo-crest ${a}" style="--crest:${n}"${t} data-code="${h(s.code)}"><img src="logos/${h(s.id)}.webp" alt="${h(s.name)}" width="40" height="40" loading="lazy" decoding="async" draggable="false"></span>`}function me(e){return`<span class="region-tag" style="--rc:${ue[e]??"#888"}">${h(e)}</span>`}function Ue(e){return!e.teamA||!e.teamB||!d.ratings[e.teamA]||!d.ratings[e.teamB]?null:re(H(d.ratings,e.teamA,e.teamB),e.bestOf)}function Ge(e){return e.status==="IN_PROGRESS"?'<span class="pill pill-live"><i></i>EN VIVO</span>':e.source==="official"?'<span class="pill pill-final">FINAL</span>':e.source==="manual"?'<span class="pill pill-pick">TU PICK</span>':e.source==="projected"?'<span class="pill pill-proj">PROYECCIÓN</span>':'<span class="pill pill-sched">PROGRAMADO</span>'}function Ke(e){if(!e)return"";try{return new Date(e).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function U(e,a={}){const s=Ue(e),n=e.status==="FINISHED"||!e.teamA||!e.teamB,t=(o,r,i)=>{const p=y(o),c=!!e.winner&&e.winner===o,f=!!e.winner&&e.winner!==o,l=e.source||e.status==="IN_PROGRESS";return`<button type="button" class="team-row ${c?"is-winner":""} ${f?"is-loser":""}"
      ${n?"disabled":""} data-pick="${h(e.id)}" data-team="${h(o??"")}"
      title="${n?"":"Click: elegir ganador (otra vez para quitar)"}">
      ${B(o,"w-6 h-6 text-[8px]")}
      <span class="flex-1 truncate text-left">${p?h(a.compact?p.code:p.name):'<span class="text-hex-500">Por definir</span>'}</span>
      ${i!=null&&!e.winner?`<span class="text-[10px] text-cyan-neon/80 tabular-nums">${w(i,0)}</span>`:""}
      <span class="score">${l?r:""}</span>
    </button>`};return`<div class="match-card ${e.projectedPairing?"is-projected":""} ${e.status==="IN_PROGRESS"?"is-live":""}" data-match="${h(e.id)}">
    <div class="flex items-center justify-between gap-2 px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-hex-500">
      <span class="truncate">${h(a.title??e.label??"")} <b class="text-gold-300">Bo${e.bestOf}</b></span>
      <span class="flex items-center gap-1">${e.startTime&&!e.source?`<span>${h(Ke(e.startTime))}</span>`:""}${Ge(e)}</span>
    </div>
    ${t(e.teamA,e.scoreA,s)}
    ${t(e.teamB,e.scoreB,s==null?null:1-s)}
    ${Ye(e)}
    ${s!=null?`<div class="prob-bar" title="Probabilidad de serie"><span style="width:${(s*100).toFixed(1)}%"></span></div>`:""}
    ${ze(e.id)}
  </div>`}function ze(e){const a=d.mc?.slots[e];if(!a)return"";const s=Object.entries(a).filter(([,n])=>n.won>=.005).sort((n,t)=>t[1].won-n[1].won).slice(0,3);return s.length?`<div class="slot-odds" title="Monte Carlo: probabilidad de ganar esta serie (sobre todas las simulaciones)">
    <span class="slot-odds-label">Sim</span>${s.map(([n,t])=>`<span class="slot-odds-item">${h(y(n)?.code??n)} <b>${w(t.won,0)}</b></span>`).join("")}
  </div>`:""}function Ye(e){if(e.source!=="manual"||e.bestOf===1||!e.winner||!e.teamA||!e.teamB)return"";const a=Math.ceil(e.bestOf/2),s=e.winner===e.teamA,n=d.overrides[e.id]?.scoreA!=null,t=Array.from({length:a},(o,r)=>{const[i,p]=s?[a,r]:[r,a];return`<button type="button" class="score-opt ${e.scoreA===i&&e.scoreB===p?"is-active":""}" data-score="${h(e.id)}"
      data-winner="${h(e.winner)}" data-sa="${i}" data-sb="${p}">${a}-${r}</button>`}).join("");return`<div class="score-picker" title="${n?"Marcador elegido por ti":"Automático: el marcador más probable para este ganador según el Elo de ambos equipos"}">
    <span>${h(y(e.winner)?.code)} gana</span>${t}${n?"":"<em>auto</em>"}
  </div>`}function he(){return d.scenarioSeed==null?"":`<div class="notice flex flex-wrap items-center gap-x-3 gap-y-1">
    <span>🎲 Estás viendo <b>un escenario simulado</b> (seed ${d.scenarioSeed}): oficial + tus picks + un resultado aleatorio ponderado por Elo para lo que falta.</span>
    <span class="ml-auto flex gap-2">
      <button class="btn-ghost" data-action="new-scenario">Otro escenario</button>
      <button class="btn-ghost" data-action="clear-scenario">Volver a favoritos</button>
    </span>
  </div>`}const se=[1e3,5e3,1e4,25e3,5e4];function G(){const e=se.includes(d.prefs.mcIterations)?d.prefs.mcIterations:1e3;return`<div class="flex flex-wrap items-center gap-2 text-xs">
    <label class="field-inline">Simulaciones <select data-mc="iterations">${se.map(s=>`<option value="${s}" ${s===e?"selected":""}>${s.toLocaleString()}</option>`).join("")}</select></label>
    <label class="toggle"><input type="checkbox" data-mc="overrides" ${d.prefs.mcUseOverrides?"checked":""}><span>Incluir mis picks</span></label>
    <button class="btn-gold" data-action="run-mc" ${d.mcRunning?"disabled":""}>${d.mcRunning?"Simulando…":"▶ Simular torneo"}</button>
  </div>`}function ge(){const e=d.mc;return d.mcRunning?`Simulando ${d.prefs.mcIterations.toLocaleString()} torneos…`:e?`${e.iterations.toLocaleString()} simulaciones · ${(e.elapsedMs/1e3).toFixed(2)} s · seed ${e.seed}${e.usedOverrides?" · con tus picks":""}`:"Sin simulación todavía."}function Je(){const e=d.mc,a=e?Object.values(e.odds).sort((s,n)=>n.champion-s.champion||n.final-s.final).slice(0,8):[];return`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Simulador del torneo (Monte Carlo)</h3>
        <p class="panel-sub">Juega el resto de Worlds N veces desde el estado real (y, si quieres, con tus picks) y cuenta cuántas veces cada equipo llega a playoffs, a la final o gana el título.</p>
      </div>
      ${G()}
    </header>
    <p class="text-[11px] text-hex-500 mb-3">${h(ge())} · <a href="#rankings" class="text-cyan-neon hover:underline">Ver tabla completa →</a></p>
    <div class="grid gap-2 grid-cols-2 md:grid-cols-4 ${d.mcRunning?"opacity-50":""}">
      ${a.map((s,n)=>`<div class="stat-tile">
            <span class="hidden sm:inline text-hex-500 text-xs tabular-nums w-4">${n+1}</span><span class="hidden sm:inline-flex">${B(s.team)}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm"><span class="sm:hidden text-hex-500 tabular-nums">${n+1}. </span><span class="sm:hidden">${h(y(s.team)?.code)}</span><span class="hidden sm:inline">${h(y(s.team)?.name)}</span></div>
              <div class="text-xl font-display text-gold-300 tabular-nums leading-tight">${w(s.champion)}</div>
              <div class="text-[10px] text-hex-500 tabular-nums">Playoffs ${w(s.playoffs,0)} · Final ${w(s.final,0)}</div>
            </div>
          </div>`).join("")}
    </div>
  </section>`}function Ve(e){const a=new Map(e.playIn.map(t=>[t.id,t])),s=(t,o)=>`
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">${h(t)}</h4>
      ${o.map(r=>a.get(r)?U(a.get(r)):"").join("")}
    </div>`,n=y(e.playInQualifier);return`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Play-In · Los Ángeles</h3>
        <p class="panel-sub">Doble eliminación, todas las series Bo5. Solo el ganador avanza al Swiss Stage (Tier 4 del sorteo).</p>
      </div>
      ${n?`<div class="flex items-center gap-2 text-sm">${B(n.id)}<span>Clasifica: <b class="text-gold-300">${h(n.name)}</b></span></div>`:""}
    </header>
    ${Xe()}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${s("Ronda 1",["PI-A","PI-B"])}
      ${s("Ronda 2",["PI-C","PI-D"])}
      ${s("Ronda 3",["PI-E"])}
      ${s("Final de clasificación",["PI-F"])}
    </div>
  </section>`}function Xe(){const e=d.mc;return e?`<div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
    <span class="text-hex-500 uppercase tracking-wider text-[10px]">Simulación · clasifica al Swiss</span>
    ${d.teams.filter(n=>n.stageEntry==="PLAY_IN").map(n=>({t:n,p:e.odds[n.id]?.swiss??0})).sort((n,t)=>t.p-n.p).map(({t:n,p:t})=>`<span class="stat-tile !p-1.5 !gap-2">${B(n.id,"w-6 h-6 text-[8px]")}<span>${h(n.code)}</span><b class="font-display text-gold-300 tabular-nums">${w(t,0)}</b></span>`).join("")}
  </div>`:""}const te=["3-0","3-1","3-2","2-3","1-3","0-3"];function Ze(){const e=d.mc;if(!e)return"";const a=Object.values(e.odds).filter(n=>n.swiss>0).sort((n,t)=>t.playoffs-n.playoffs||t.swiss-n.swiss),s=(n,t)=>{const o=n??0,r=Math.min(.85,o*1.6).toFixed(2);return`<td class="heat" style="background:rgb(${t?"var(--cyan-neon)":"var(--loss)"} / ${r})" title="${w(o)}">${o>=.005?w(o,0):"·"}</td>`};return`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Resultado final del Swiss (Monte Carlo)</h3>
        <p class="panel-sub">${e.iterations.toLocaleString()} simulaciones: con qué récord termina cada equipo. 3-x = clasifica a playoffs, x-3 = eliminado.</p>
      </div>
    </header>
    <div class="table-wrap">
      <table class="rank-table heat-table">
        <thead><tr><th class="text-left">Equipo</th>${te.map(n=>`<th>${n}</th>`).join("")}<th>Playoffs</th></tr></thead>
        <tbody>${a.map(n=>`<tr>
            <td class="text-left"><div class="flex items-center gap-2">${B(n.team,"w-6 h-6 text-[8px]")}<span class="truncate">${h(y(n.team)?.name)}</span>${n.swiss<.995?`<span class="text-[10px] text-hex-500">(entra ${w(n.swiss,0)})</span>`:""}</div></td>
            ${te.map(t=>s(n.records[t],t.startsWith("3"))).join("")}
            <td class="font-display text-gold-300 tabular-nums">${w(n.playoffs,0)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  </section>`}function ae(e){const[a,s]=e.split("-").map(Number);return-(a*10-s)}function es(e,a,s){const n=new Map;for(const o of a)n.set(o.pool??"?",[...n.get(o.pool??"?")??[],o]);for(const[o]of s)n.has(o)||n.set(o,[]);const t=[...n.keys()].sort((o,r)=>ae(o)-ae(r));return`
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">Ronda ${e}</h4>
      ${t.length===0?'<p class="text-xs text-hex-500 italic">Pendiente de sorteo</p>':t.map(o=>{const r=n.get(o),[i,p]=o.split("-").map(Number),c=i===2&&p===2?"decisivo":i===2?"clasificación":p===2?"eliminación":"",f=s.get(o)??[];return`<div class="pool">
                  <div class="pool-head"><span class="pool-label">${h(o)}</span>${c?`<span class="text-[10px] uppercase text-gold-400">${c} · Bo3</span>`:'<span class="text-[10px] uppercase text-hex-500">Bo1</span>'}</div>
                  <div class="flex flex-col gap-2">${r.map(l=>U(l,{compact:!0})).join("")}
                  ${f.length?`<div class="flex flex-wrap gap-1 p-2 text-[10px] text-hex-500">Esperando sorteo: ${f.map(l=>B(l,"w-6 h-6 text-[8px]")).join("")}</div>`:""}
                  </div>
                </div>`}).join("")}
    </div>`}function ss(e){const a=Object.values(e.swissRecords),s=(n,t,o)=>{const r=a.filter(i=>i.wins===n&&i.losses===t);return`<div class="pool ${o?"pool-good":"pool-bad"}">
      <div class="pool-head"><span class="pool-label">${n}-${t}</span><span class="text-[10px] uppercase ${o?"text-cyan-neon":"text-loss"}">${o?"Playoffs":"Eliminado"}</span></div>
      <div class="flex flex-col gap-1">${r.length?r.map(i=>`<div class="flex items-center gap-2 text-sm px-2 py-1">${B(i.team,"w-6 h-6 text-[8px]")}<span class="truncate">${h(y(i.team)?.name)}</span></div>`).join(""):'<span class="text-xs text-hex-500 px-2 py-1">—</span>'}</div>
    </div>`};return`
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">Resultado</h4>
      ${s(3,0,!0)}${s(3,1,!0)}${s(3,2,!0)}
      ${s(2,3,!1)}${s(1,3,!1)}${s(0,3,!1)}
    </div>`}function ts(e){const a=d.prefs.showProjection,s=d.resolved(a),n=s.swissRounds.map(o=>{const r=new Map,i=new Set(o.matches.flatMap(c=>[c.teamA,c.teamB]));if(s.swissRounds.filter(c=>c.round<o.round).every(c=>c.matches.every(f=>f.winner))&&s.swissTeams.length===16)for(const c of s.swissTeams){if(i.has(c))continue;let f=0,l=0;for(const m of s.swissRounds.filter(g=>g.round<o.round)){const g=m.matches.find(b=>b.teamA===c||b.teamB===c);g?.winner===c?f++:g?.winner&&l++}f<3&&l<3&&r.set(`${f}-${l}`,[...r.get(`${f}-${l}`)??[],c])}return es(o.round,o.matches,r)}).join(""),t=Object.keys(d.overrides).filter(o=>o.startsWith("SW-")||o.startsWith("PI-")).length;e.innerHTML=`
    <div class="flex flex-col gap-6">
      ${Je()}
      ${he()}
      ${Ve(s)}
      <section class="panel">
        <header class="panel-head">
          <div>
            <h3 class="panel-title">Swiss Stage · Allen, Texas</h3>
            <p class="panel-sub">16 equipos · 3 victorias clasifican, 3 derrotas eliminan · Bo1 salvo series de clasificación/eliminación (Bo3) · sin revanchas.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs">
            <label class="toggle"><input type="checkbox" data-action="toggle-projection" ${a?"checked":""}><span>Proyectar favoritos</span></label>
            ${t?`<button class="btn-ghost" data-action="clear-picks" data-prefix="SW-">Borrar picks (${t})</button>`:""}
          </div>
        </header>
        <p class="legend">
          <span><i class="dot bg-cyan-neon"></i>Oficial</span>
          <span><i class="dot bg-gold-300"></i>Tu pick (click en un equipo; en Bo3/Bo5 eliges el marcador)</span>
          <span><i class="dot border border-dashed border-hex-500"></i>Emparejamiento simulado</span>
        </p>
        <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          ${n}
          ${ss(s)}
        </div>
      </section>
      ${Ze()}
    </div>`}function as(e){const a=d.resolved(!0),s=new Map(a.knockout.map(c=>[c.id,c])),n=(c,f)=>U(s.get(c),{title:f}),t=y(a.champion),o=a.knockout.some(c=>c.source!=="official"),r=Object.keys(d.overrides).filter(c=>/^(QF|SF|F$)/.test(c)).length,i=d.mc,p=i?Object.values(i.odds).sort((c,f)=>f.champion-c.champion).slice(0,5):[];e.innerHTML=`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Knockout Stage · Bo5</h3>
        <p class="panel-sub">Los dos 3-0 van a mitades opuestas contra equipos 3-2; el resto se sortea. Cuartos y semis en Allen (TX), final el 14 de noviembre en el Barclays Center (NY).</p>
      </div>
      ${r?`<button class="btn-ghost text-xs" data-action="clear-picks" data-prefix="QF,SF,F">Borrar picks (${r})</button>`:""}
    </header>
    ${he()}
    ${o&&d.scenarioSeed==null?'<p class="notice">Cuadro proyectado: resultados oficiales + tus picks + favoritos por Elo para lo que falta. Haz click en un equipo para forzar su victoria; el cuadro se recalcula.</p>':""}
    <div class="bracket">
      <div class="bracket-col"><h4 class="col-title">Cuartos</h4>${n("QF1","QF1")}${n("QF2","QF2")}<div class="h-2"></div>${n("QF3","QF3")}${n("QF4","QF4")}</div>
      <div class="bracket-col justify-around"><h4 class="col-title">Semifinales</h4>${n("SF1","SF1")}${n("SF2","SF2")}</div>
      <div class="bracket-col justify-center"><h4 class="col-title">Gran Final</h4>${n("F","Final · Brooklyn")}
        <div class="champion ${t?"":"opacity-50"}">
          <div class="text-[10px] uppercase tracking-[0.3em] text-gold-400">${o?"Campeón proyectado":"Campeón"}</div>
          ${t?`<div class="flex items-center gap-3 justify-center mt-2">${B(t.id,"w-12 h-12 text-xs")}<span class="font-display text-2xl text-gold-100">${h(t.name)}</span></div>`:'<div class="mt-2 text-hex-500">Por definir</div>'}
        </div>
      </div>
    </div>
  </section>
  <section class="panel mt-6">
    <header class="panel-head"><div><h3 class="panel-title">Favoritos al título (Monte Carlo)</h3>
    <p class="panel-sub">${i?`${i.iterations.toLocaleString()} simulaciones del resto del torneo desde el estado real.`:d.mcRunning?"Simulando…":"Aún no hay simulación."}</p></div>${G()}</header>
    <div class="grid gap-2 sm:grid-cols-5">
      ${p.map(c=>`<div class="stat-tile">${B(c.team)}<div class="min-w-0"><div class="truncate text-sm">${h(y(c.team)?.name)}</div><div class="text-xl font-display text-gold-300 tabular-nums">${w(c.champion)}</div><div class="text-[10px] text-hex-500">Final ${w(c.final,0)}</div></div></div>`).join("")}
    </div>
  </section>`}function ns(e){const{a,b:s,bestOf:n}=d.prefs.h2h,t=d.teams.map(u=>u.id),o=t.includes(a)?a:t[0],r=t.includes(s)&&s!==o?s:t.find(u=>u!==o),i=Ee(d.ratings,o,r,n),p=y(o),c=y(r),f=u=>d.teams.slice().sort((x,v)=>x.name.localeCompare(v.name)).map(x=>`<option value="${h(x.id)}" ${x.id===u?"selected":""}>${h(x.name)} (${h(x.region)})</option>`).join(""),l=Math.max(...i.distribution.map(u=>u.prob)),m=pe(d.tournament).filter(u=>u.status==="FINISHED"&&(u.teamA===o&&u.teamB===r||u.teamA===r&&u.teamB===o)),g=(u,x,v)=>{const $=y(u),S=d.ratings[u];return`<div class="flex flex-col items-center gap-2 ${v}">
      ${B(u,"w-16 h-16 text-sm")}
      <div class="font-display text-lg text-gold-100 text-center">${h($.name)}</div>
      <div class="flex items-center gap-2 text-xs">${me($.region)}<span class="text-hex-500">Elo ${S.effective.toFixed(0)}</span></div>
      <div class="font-display text-4xl md:text-5xl tabular-nums ${x>=.5?"text-cyan-neon":"text-gold-300"}">${w(x)}</div>
    </div>`},b=u=>y(u).roster.map(x=>`<li class="flex justify-between gap-2"><span class="text-hex-500 text-[10px] uppercase w-14">${h(x.role)}</span><span class="truncate">${h(x.player)}</span></li>`).join("");e.innerHTML=`
  <section class="panel">
    <header class="panel-head"><div><h3 class="panel-title">Matchup Simulator</h3>
      <p class="panel-sub">Probabilidad por mapa con Elo (P = 1 / (1 + 10<sup>(R<sub>B</sub>−R<sub>A</sub>)/400</sup>)) y distribución binomial para la serie.</p></div></header>
    <div class="grid gap-3 md:grid-cols-[1fr_auto_1fr] items-end">
      <label class="field"><span>Equipo A</span><select data-h2h="a">${f(o)}</select></label>
      <div class="flex gap-2 justify-center">
        <button class="btn-ghost" data-action="h2h-swap" title="Intercambiar">⇄</button>
        <div class="seg" role="group" aria-label="Formato">
          ${[1,3,5].map(u=>`<button data-h2h-bo="${u}" class="${u===n?"is-active":""}">Bo${u}</button>`).join("")}
        </div>
      </div>
      <label class="field"><span>Equipo B</span><select data-h2h="b">${f(r)}</select></label>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6 items-start">
      ${g(o,i.pSeries,"")}
      ${g(r,1-i.pSeries,"")}
    </div>
    <div class="prob-bar big mt-4"><span style="width:${(i.pSeries*100).toFixed(1)}%"></span></div>
    <div class="grid gap-4 md:grid-cols-3 mt-6">
      <div class="sub-panel">
        <h4 class="col-title">Resumen</h4>
        <dl class="kv">
          <dt>Prob. por mapa (${h(p.code)})</dt><dd>${w(i.pMap)}</dd>
          <dt>Prob. de serie (${h(p.code)})</dt><dd>${w(i.pSeries)}</dd>
          <dt>Marcador más probable</dt><dd class="text-gold-300">${i.mostLikely.scoreA}-${i.mostLikely.scoreB} <span class="text-hex-500">(${w(i.mostLikely.prob)})</span></dd>
          <dt>Favorito</dt><dd>${h(i.pSeries>=.5?p.name:c.name)}</dd>
          <dt>Cruces en Worlds 2026</dt><dd>${m.length?m.map(u=>`${h(y(u.teamA)?.code)} ${u.scoreA}-${u.scoreB} ${h(y(u.teamB)?.code)}`).join(", "):"—"}</dd>
        </dl>
      </div>
      <div class="sub-panel">
        <h4 class="col-title">Distribución de marcadores</h4>
        <div class="flex flex-col gap-1.5">
          ${i.distribution.map(u=>`<div class="flex items-center gap-2 text-xs">
                <span class="w-16 tabular-nums ${u.scoreA>u.scoreB?"text-cyan-neon":"text-gold-300"}">${h(u.scoreA>u.scoreB?p.code:c.code)} ${Math.max(u.scoreA,u.scoreB)}-${Math.min(u.scoreA,u.scoreB)}</span>
                <span class="flex-1 h-3 bg-hex-800 rounded-sm overflow-hidden"><span class="block h-full ${u.scoreA>u.scoreB?"bg-cyan-neon/80":"bg-gold-300/80"}" style="width:${(u.prob/l*100).toFixed(1)}%"></span></span>
                <span class="w-12 text-right tabular-nums">${w(u.prob)}</span>
              </div>`).join("")}
        </div>
      </div>
      <div class="sub-panel">
        <h4 class="col-title">Factores determinantes</h4>
        <p class="text-[11px] text-hex-500 mb-2">Puntos de rating a favor de ${h(p.code)} (negativo = a favor de ${h(c.code)}).</p>
        <div class="flex flex-col gap-2">
          ${i.factors.map(u=>{const x=Math.min(50,Math.abs(u.value)/4);return`<div class="text-xs">
                <div class="flex justify-between"><span>${h(u.label)}</span><span class="tabular-nums ${u.value>=0?"text-cyan-neon":"text-gold-300"}">${u.value>=0?"+":""}${u.value.toFixed(0)}</span></div>
                <div class="relative h-1.5 bg-hex-800 mt-1"><span class="absolute top-0 h-full ${u.value>=0?"bg-cyan-neon left-1/2":"bg-gold-300 right-1/2"}" style="width:${x}%"></span></div>
              </div>`}).join("")}
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6">
      <div class="sub-panel"><h4 class="col-title">${h(p.name)}</h4><ul class="text-sm flex flex-col gap-1">${b(o)}</ul></div>
      <div class="sub-panel"><h4 class="col-title">${h(c.name)}</h4><ul class="text-sm flex flex-col gap-1">${b(r)}</ul></div>
    </div>
  </section>`}let I="champion",E=-1;function os(e){e===I?E=E===1?-1:1:(I=e,E=e==="name"?1:-1)}function is(e){const a=d.mc,s=d.resolved(!1),n=d.teams.map(r=>{const i=d.ratings[r.id],p=a?.odds[r.id],c=s.swissRecords[r.id];return{t:r,r:i,o:p,rec:c,values:{elo:i.effective,delta:i.elo-i.base,record:i.seriesWon-i.seriesLost+i.seriesWon*.01,swiss:p?.swiss??0,playoffs:p?.playoffs??0,final:p?.final??0,champion:p?.champion??i.effective/1e6,name:0}}});n.sort((r,i)=>I==="name"?E*r.t.name.localeCompare(i.t.name):E*(r.values[I]-i.values[I])||i.r.effective-r.r.effective);const t=(r,i,p="")=>`<th class="${p}"><button data-sort="${r}" class="th-btn ${I===r?"is-sorted":""}">${i}${I===r?E===-1?" ▾":" ▴":""}</button></th>`,o=(r,i)=>r==null?'<span class="text-hex-500">—</span>':`<div class="flex items-center gap-2 justify-end"><span class="tabular-nums">${w(r)}</span><span class="hidden lg:block w-14 h-1.5 bg-hex-800"><span class="block h-full" style="width:${(r*100).toFixed(1)}%;background:${i}"></span></span></div>`;e.innerHTML=`
  <section class="panel">
    <header class="panel-head">
      <div><h3 class="panel-title">Power Rankings</h3>
      <p class="panel-sub">Elo efectivo = Elo base ajustado por resultados oficiales en Worlds 2026 (K=${oe} por mapa) + peso regional + forma reciente. Probabilidades por Monte Carlo.</p></div>
      ${G()}
    </header>
    <p class="text-[11px] text-hex-500 mb-3">${h(ge())}</p>
    <div class="table-wrap">
      <table class="rank-table">
        <thead><tr>
          <th class="w-8 hidden sm:table-cell">#</th>
          ${t("name","Equipo","text-left")}
          ${t("elo","Elo")}
          ${t("delta","Δ","hidden sm:table-cell")}
          ${t("record","Series","hidden md:table-cell")}
          <th class="hidden lg:table-cell">Forma</th>
          ${t("swiss","Swiss","hidden xl:table-cell")}
          ${t("playoffs","Playoffs")}
          ${t("final","Final","hidden sm:table-cell")}
          ${t("champion","Campeón")}
        </tr></thead>
        <tbody>
          ${n.map(({t:r,r:i,o:p,rec:c},f)=>{const l=c&&(c.wins===3||c.losses===3);return`<tr class="${c?.losses===3?"opacity-50":""}">
                <td class="text-hex-500 tabular-nums hidden sm:table-cell">${f+1}</td>
                <td class="text-left max-w-[10rem] sm:max-w-none"><div class="flex items-center gap-2 min-w-0">${B(r.id)}
                  <div class="min-w-0"><div class="truncate text-gold-100">${h(r.name)}</div>
                  <div class="flex items-center gap-1.5 text-[10px] text-hex-500">${me(r.region)}<span class="hidden sm:inline">${r.stageEntry==="PLAY_IN"?"Play-In":`Tier ${r.swissTier}`}</span>${c?`<span class="whitespace-nowrap">· Swiss ${c.wins}-${c.losses}${l?c.wins===3?" ✓":" ✗":""}</span>`:""}</div></div></div></td>
                <td class="tabular-nums text-gold-300">${i.effective.toFixed(0)}</td>
                <td class="tabular-nums hidden sm:table-cell ${i.elo-i.base>=0?"text-cyan-neon":"text-loss"}">${i.elo-i.base>=0?"+":""}${(i.elo-i.base).toFixed(0)}</td>
                <td class="tabular-nums hidden md:table-cell">${i.seriesWon}-${i.seriesLost} <span class="text-hex-500 text-[10px]">(${i.mapsWon}-${i.mapsLost})</span></td>
                <td class="hidden lg:table-cell"><div class="flex gap-0.5 justify-end">${i.form.length?i.form.slice(-5).map(m=>`<span class="form-chip ${m==="W"?"is-w":"is-l"}">${m}</span>`).join(""):'<span class="text-hex-500 text-xs">—</span>'}</div></td>
                <td class="hidden xl:table-cell">${o(p?.swiss,"#5B5A56")}</td>
                <td>${o(p?.playoffs,"#0AC8B9")}</td>
                <td class="hidden sm:table-cell">${o(p?.final,"#C8AA6E")}</td>
                <td>${o(p?.champion,"#C89B3C")}</td>
              </tr>`}).join("")}
        </tbody>
      </table>
    </div>
  </section>`}const ve="wp26:theme";function be(){try{const e=localStorage.getItem(ve);return e==="dark"||e==="light"?e:null}catch{return null}}function ne(){return be()??(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")}function T(e){document.documentElement.dataset.theme=e,document.querySelector('meta[name="theme-color"]')?.setAttribute("content",e==="light"?"#f6f2e9":"#010a13");const a=document.getElementById("theme-toggle");if(a){const s=e==="light"?"Cambiar a tema oscuro":"Cambiar a tema claro";a.setAttribute("aria-label",s),a.setAttribute("title",s)}}function rs(){T(ne()),document.getElementById("theme-toggle")?.addEventListener("click",()=>{const e=document.documentElement.dataset.theme==="light"?"dark":"light";try{localStorage.setItem(ve,e)}catch{}T(e)}),matchMedia("(prefers-color-scheme: light)").addEventListener("change",()=>{be()||T(ne())})}const M={swiss:{label:"Swiss Stage",render:ts},bracket:{label:"Playoffs",render:as},h2h:{label:"H2H Simulator",render:ns},rankings:{label:"Power Rankings",render:is}},cs=300*1e3,$e=document.getElementById("view"),ls=document.getElementById("tabs"),ds=document.getElementById("meta");function we(){const e=location.hash.replace("#","");return e in M?e:"swiss"}function ps(){const e=we();ls.innerHTML=Object.keys(M).map(a=>`<a href="#${a}" role="tab" aria-selected="${a===e}" class="tab ${a===e?"is-active":""}">${M[a].label}</a>`).join("")}function us(){const e=new Date().toISOString().slice(0,10),a=d.tournament.event.stages,s=a.find(t=>e>=t.start&&e<=t.end);if(s)return s.name;const n=a.find(t=>e<t.start);return n?`Próximo: ${n.name} (${n.start})`:"Torneo finalizado"}function fs(){const e=[...d.tournament.playIn.matches,...d.tournament.swiss.rounds.flatMap(s=>s.matches),...d.tournament.knockout.matches].some(s=>s.status==="IN_PROGRESS"),a=new Date(d.tournament.lastUpdated);ds.innerHTML=`
    ${e?'<span class="pill pill-live"><i></i>EN VIVO</span>':""}
    <span class="hidden sm:inline text-gold-300">${h(us())}</span>
    <span title="${h(d.tournament.lastUpdated)}">Datos: ${h(a.toLocaleString(void 0,{dateStyle:"medium",timeStyle:"short"}))}</span>
    <button class="btn-ghost" data-action="refresh" title="Recargar datos">↻</button>`}function K(){ps(),fs();const e=we();M[e].render($e),document.title=`${M[e].label} · Worlds 2026 Predictor`}let P=null;function ms(){if(P)return P;try{P=new Worker(new URL(""+new URL("mc.worker-CJkWgdam.js",import.meta.url).href,import.meta.url),{type:"module"})}catch{P=null}return P}const hs=1e4;function xe(e=d.prefs.mcIterations,a=!1){if(d.mcRunning)return;d.setMc(d.mc,!0);const s={teams:d.teams,tournament:d.tournament,ratings:d.ratings,iterations:e,overrides:d.prefs.mcUseOverrides?d.overrides:void 0},n=o=>d.setMc(o,!1,a?o.seed:void 0),t=ms();if(!t){setTimeout(()=>n(Z(s)),20);return}t.onmessage=o=>n(o.data),t.onerror=()=>{P=null,n(Z(s))},t.postMessage(JSON.parse(JSON.stringify(s)))}rs();document.addEventListener("error",e=>{const a=e.target;if(!(a instanceof HTMLImageElement))return;const s=a.closest(".logo-crest");if(!s)return;const n=[...s.classList].filter(t=>/^(w|h|text)-/.test(t)).join(" ");s.outerHTML=fe(s.dataset.code??"?",s.style.getPropertyValue("--crest"),n)},!0);document.addEventListener("click",e=>{const a=e.target,s=a.closest("[data-pick]");if(s&&!s.disabled&&s.dataset.team){d.togglePick(s.dataset.pick,s.dataset.team);return}const n=a.closest("[data-score]");if(n){const i=n.dataset;d.setPickScore(i.score,i.winner,Number(i.sa),Number(i.sb));return}const t=a.closest("[data-sort]");if(t){os(t.dataset.sort),K();return}const o=a.closest("[data-h2h-bo]");if(o){d.setPrefs({h2h:{...d.prefs.h2h,bestOf:Number(o.dataset.h2hBo)}});return}switch(a.closest("[data-action]")?.dataset.action){case"refresh":D(!0);break;case"run-mc":xe(d.prefs.mcIterations,!0);break;case"new-scenario":d.setScenario(Math.floor(Math.random()*2**31));break;case"clear-scenario":d.setScenario(null);break;case"h2h-swap":{const{a:i,b:p,bestOf:c}=d.prefs.h2h;d.setPrefs({h2h:{a:p,b:i,bestOf:c}});break}case"clear-picks":{const i=(a.closest("[data-prefix]")?.dataset.prefix??"").split(",");i.includes("SW-")&&i.push("PI-");for(const p of i)d.clearPicks(p);break}}});document.addEventListener("change",e=>{const a=e.target;if(a.dataset.action==="toggle-projection")d.scenarioSeed=null,d.setPrefs({showProjection:a.checked});else if(a.dataset.h2h){const s={...d.prefs.h2h,[a.dataset.h2h]:a.value};if(s.a===s.b){const n=a.dataset.h2h==="a"?"b":"a";s[n]=d.prefs.h2h[a.dataset.h2h]}d.setPrefs({h2h:s})}else a.dataset.mc==="iterations"?d.setPrefs({mcIterations:Number(a.value)}):a.dataset.mc==="overrides"&&d.setPrefs({mcUseOverrides:a.checked})});window.addEventListener("hashchange",K);async function D(e=!1){try{const{teams:a,tournament:s}=await Se();(!d.tournament||s.lastUpdated!==d.tournament.lastUpdated||a.lastUpdated!==d.teamsFile.lastUpdated||e)&&(d.setData(a,s),xe(Math.min(d.prefs.mcIterations,hs)))}catch(a){console.error(a),d.tournament||($e.innerHTML=`<div class="panel text-center text-loss">No se pudieron cargar los datos (${h(a.message)}).</div>`)}}d.subscribe(K);D().then(()=>setInterval(()=>{D()},cs));
