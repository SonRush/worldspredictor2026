(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function t(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(s){if(s.ep)return;s.ep=!0;const o=t(s);fetch(s.href,o)}})();const ye="./data/";async function z(e){const a=await fetch(`${ye}${e}?t=${Date.now()}`,{cache:"no-store"});if(!a.ok)throw new Error(`${e}: HTTP ${a.status}`);return await a.json()}async function Se(){const[e,a]=await Promise.all([z("teams.json"),z("tournament.json")]);if(!Array.isArray(e?.teams)||!a?.swiss?.rounds)throw new Error("Malformed data files");return{teams:e,tournament:a}}const Ae={LCK:15,LPL:10,LEC:0,LCS:-10,LTA:-10,LCP:-10,CBLOL:-20},Be=4,oe=24;function ie(e,a){return 1/(1+Math.pow(10,(a-e)/400))}function W(e,a){if(a<0||a>e)return 0;let t=1;for(let n=1;n<=a;n++)t=t*(e-a+n)/n;return t}function _(e,a){const t=Math.ceil(a/2),n=[];for(let s=0;s<t;s++)n.push({scoreA:t,scoreB:s,prob:W(t-1+s,s)*e**t*(1-e)**s});for(let s=0;s<t;s++)n.push({scoreA:s,scoreB:t,prob:W(t-1+s,s)*(1-e)**t*e**s});return n}function re(e,a){const t=a,n=Math.ceil(t/2);let s=0;for(let o=n;o<=t;o++)s+=W(t,o)*e**o*(1-e)**(t-o);return s}function ke(e,a){return _(e,a).reduce((t,n)=>n.prob>t.prob?n:t)}function V(e,a,t){return _(e,a).filter(n=>t?n.scoreA>n.scoreB:n.scoreB>n.scoreA).reduce((n,s)=>s.prob>n.prob?s:n)}function Y(e,a,t,n=0,s=0){const o=Math.ceil(a/2);let r=n,i=s;for(;r<o&&i<o;)t()<e?r++:i++;return{scoreA:r,scoreB:i}}function Ie(e,a,t,n=oe){const s=ie(e,a),o=n*((t?1:0)-s);return[e+o,a-o]}function Pe(e,a){const t={};for(const s of e)t[s.id]={team:s.id,base:s.baseElo,elo:s.baseElo,regionBonus:Ae[s.region]??0,formBonus:0,effective:s.baseElo,form:[],mapsWon:0,mapsLost:0,seriesWon:0,seriesLost:0};const n=a.filter(s=>s.status==="FINISHED"&&s.teamA&&s.teamB&&t[s.teamA]&&t[s.teamB]).slice().sort((s,o)=>(s.startTime??"").localeCompare(o.startTime??""));for(const s of n){const o=t[s.teamA],r=t[s.teamB],i=s.winner===s.teamA;let l=Math.max(1,i?s.scoreA:s.scoreB)-1,f=i?s.scoreB:s.scoreA;const c=[];for(;l>0||f>0;)f-- >0&&c.push(!i),l-- >0&&c.push(i);c.push(i);for(const h of c)[o.elo,r.elo]=Ie(o.elo,r.elo,h),o.form.push(h?"W":"L"),r.form.push(h?"L":"W"),h?(o.mapsWon++,r.mapsLost++):(r.mapsWon++,o.mapsLost++);i?(o.seriesWon++,r.seriesLost++):(r.seriesWon++,o.seriesLost++)}for(const s of Object.values(t)){const o=s.form.slice(-5),r=o.filter(i=>i==="W").length-o.filter(i=>i==="L").length;s.formBonus=r*Be,s.effective=s.elo+s.regionBonus+s.formBonus}return t}function H(e,a,t){return ie(e[a].effective,e[t].effective)}function Ee(e,a,t,n){const s=e[a],o=e[t],r=H(e,a,t);return{a,b:t,bestOf:n,pMap:r,pSeries:re(r,n),distribution:_(r,n),mostLikely:ke(r,n),factors:[{label:"Base Elo",value:s.base-o.base},{label:"Worlds 2026 results",value:s.elo-s.base-(o.elo-o.base)},{label:"Region strength",value:s.regionBonus-o.regionBonus},{label:"Recent form",value:s.formBonus-o.formBonus}]}}function le(e){let a=e>>>0;return()=>{a=a+1831565813>>>0;let t=a;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function k(e,a){const t=e.slice();for(let n=t.length-1;n>0;n--){const s=Math.floor(a()*(n+1));[t[n],t[s]]=[t[s],t[n]]}return t}const Le={"PI-C":{A:["PI-A","winner"],B:["PI-B","winner"]},"PI-D":{A:["PI-A","loser"],B:["PI-B","loser"]},"PI-E":{A:["PI-C","loser"],B:["PI-D","winner"]},"PI-F":{A:["PI-C","winner"],B:["PI-E","winner"]}},Oe="PI-F",Me={SF1:{A:"QF1",B:"QF2"},SF2:{A:"QF3",B:"QF4"},F:{A:"SF1",B:"SF2"}},j=3,N=3;function C(e){return`${e.wins}-${e.losses}`}function Fe(e){return e.wins===j-1||e.losses===N-1?3:1}function je(e,a,t){const[n,s]=[a,t].sort();return`SW-R${e}-${n}-${s}`}function q(e){return{...e,source:e.status==="FINISHED"&&e.winner?"official":null,projectedPairing:!1}}function Ce(e){return e.winner?e.winner===e.teamA?e.teamB:e.teamA:null}function Q(e,a){if(!e.teamA||!e.teamB)return;if(e.status==="FINISHED"&&e.winner){e.source="official";return}const t=Math.ceil(e.bestOf/2),n=H(a.ratings,e.teamA,e.teamB),s=a.overrides?.[e.id];if(s&&(s.winner===e.teamA||s.winner===e.teamB)){const r=s.winner===e.teamA,p=s.scoreA!=null&&s.scoreB!=null&&(r?s.scoreA===t&&s.scoreB<t:s.scoreB===t&&s.scoreA<t)?{scoreA:s.scoreA,scoreB:s.scoreB}:V(n,e.bestOf,r);e.scoreA=p.scoreA,e.scoreB=p.scoreB,e.winner=s.winner,e.source="manual";return}if(a.mode==="none")return;let o;a.mode==="favorite"?o=V(n,e.bestOf,n>=.5):o=e.status==="IN_PROGRESS"?Y(n,e.bestOf,a.rng,e.scoreA,e.scoreB):Y(n,e.bestOf,a.rng),e.scoreA=o.scoreA,e.scoreB=o.scoreB,e.winner=o.scoreA>o.scoreB?e.teamA:e.teamB,e.source="projected"}function Re(e,a){const t=new Map,n=[];for(const s of e.playIn.matches){const o=q(s),r=Le[o.id];if(r){const i=([p,l])=>{const f=t.get(p);return f?l==="winner"?f.winner:Ce(f):null};o.teamA??=i(r.A),o.teamB??=i(r.B)}Q(o,a),t.set(o.id,o),n.push(o)}return{matches:n,qualifier:t.get(Oe)?.winner??null}}function Te(e,a,t){for(const o of[0,1,2])for(let r=0;r<20;r++){const i=ce(k(e,a),t,o);if(i)return i}const n=e.slice(),s=[];for(;n.length>=2;)s.push([n.shift(),n.shift()]);return s}function ce(e,a,t){if(e.length===0)return[];if(e.length===1)return null;const[n,...s]=e;for(let o=0;o<s.length;o++){if(a(n,s[o])>t)continue;const r=s.slice(0,o).concat(s.slice(o+1)),i=ce(r,a,t);if(i)return[[n,s[o]],...i]}return null}function We(e,a,t,n){const s=i=>i===n?4:a.get(i)?.swissTier??4,o=i=>a.get(i)?.region,r=[];for(const[i,p]of[[1,4],[2,3]]){const l=k(e.filter(h=>s(h)===i),t),f=e.filter(h=>s(h)===p);let c=null;for(let h=0;h<60&&!c;h++){const g=k(f,t);g.length===l.length&&l.every((b,u)=>o(b)!==o(g[u]))&&(c=g)}c??=k(f,t),l.forEach((h,g)=>c[g]&&r.push([h,c[g]]))}return r}function R(e){return{team:e,wins:0,losses:0,opponents:[],finishedRound:null}}function Ne(e,a,t,n){const s=new Map(a.map(c=>[c.id,c])),o=a.filter(c=>c.stageEntry==="SWISS").map(c=>c.id),r=e.swiss.rounds.flatMap(c=>c.matches.flatMap(h=>[h.teamA,h.teamB])),i=Array.from(new Set([...o,...t?[t]:[],...r.filter(Boolean)])),p=Object.fromEntries(i.map(c=>[c,R(c)])),l=[];let f=!1;for(let c=1;c<=5;c++){const g=(e.swiss.rounds.find(v=>v.round===c)?.matches??[]).map(v=>{const $=q(v);return $.teamA&&p[$.teamA]&&($.pool=C(p[$.teamA])),$}),b=new Set(g.flatMap(v=>[v.teamA,v.teamB])),u=i.filter(v=>p[v].wins<j&&p[v].losses<N&&!b.has(v)),y=!f&&n.mode!=="none"&&i.length===16;if(u.length>0&&y){let v=[];if(c===1)v=We(u,s,n.rng,t);else{const $=new Map;for(const S of u){const B=C(p[S]);$.set(B,[...$.get(B)??[],S])}for(const S of $.values())v.push(...Te(S,n.rng,(B,L)=>p[B].opponents.includes(L)?2:0))}for(const[$,S]of v){const B=p[$];g.push({id:je(c,$,S),stage:"SWISS",round:c,label:null,teamA:$,teamB:S,bestOf:Fe(B),status:"SCHEDULED",scoreA:0,scoreB:0,winner:null,startTime:null,externalId:null,source:null,pool:C(B),projectedPairing:!0})}}for(const v of g)Q(v,n);for(const v of g){if(!v.winner||!v.teamA||!v.teamB){f=!0;continue}const $=p[v.teamA]??=R(v.teamA),S=p[v.teamB]??=R(v.teamB);$.opponents.push(v.teamB),S.opponents.push(v.teamA);const[B,L]=v.winner===v.teamA?[$,S]:[S,$];B.wins++,L.losses++,B.wins===j&&(B.finishedRound=c),L.losses===N&&(L.finishedRound=c)}u.length>0&&!y&&(f=!0),l.push({round:c,matches:g})}return{swissTeams:i,rounds:l,records:p}}function De(e){const a=Object.values(e).filter(t=>t.wins===j);return{complete:a.length===8&&Object.values(e).every(t=>t.wins===3||t.losses===3),byRecord:{"3-0":a.filter(t=>t.losses===0).map(t=>t.team),"3-1":a.filter(t=>t.losses===1).map(t=>t.team),"3-2":a.filter(t=>t.losses===2).map(t=>t.team)}}}function _e(e,a,t){const n=o=>a.get(o)?.region;let s=null;for(let o=0;o<80;o++){const r=k(e["3-0"],t),i=k(e["3-2"],t),p=e["3-1"],l=[],f=[];for(const b of r)l.push(b),f.push(i.shift()??"");const c=k([...p,...i],t),h=[],g=[[l[0],f[0]],[c[0],c[1]],[l[1],f[1]],[c[2],c[3]]];for(const[b,u]of g)b&&u&&h.push([b,u]);if(h.length!==4){const b=k([...e["3-0"],...e["3-1"],...e["3-2"]],t);return[0,2,4,6].map(u=>[b[u],b[u+1]])}if(s??=h,h.every(([b,u])=>n(b)!==n(u)))return h}return s}function He(e,a,t,n){const s=new Map(a.map(c=>[c.id,c])),{complete:o,byRecord:r}=De(t),i=new Map,p=e.knockout.matches.map(q),l=p.filter(c=>c.id.startsWith("QF"));if(l.some(c=>!c.teamA||!c.teamB)&&o&&n.mode!=="none"){const c=_e(r,s,n.rng),h=new Set(l.flatMap(b=>[b.teamA,b.teamB]).filter(Boolean));let g=0;for(const b of l)if(!(b.teamA&&b.teamB)){for(;g<c.length&&(h.has(c[g][0])||h.has(c[g][1]));)g++;if(g>=c.length)break;[b.teamA,b.teamB]=c[g++],b.projectedPairing=!0}}for(const c of p){const h=Me[c.id];h&&(c.teamA||(c.teamA=i.get(h.A)?.winner??null,c.projectedPairing||=i.get(h.A)?.source!=="official"),c.teamB||(c.teamB=i.get(h.B)?.winner??null,c.projectedPairing||=i.get(h.B)?.source!=="official")),Q(c,n),i.set(c.id,c)}return{matches:p,champion:i.get("F")?.winner??null}}function de(e,a,t){const n=Re(a,t),s=new Set(e.filter(l=>l.stageEntry==="SWISS").map(l=>l.id)),r=a.swiss.rounds.flatMap(l=>l.matches.flatMap(f=>[f.teamA,f.teamB])).find(l=>l&&!s.has(l))??null??n.qualifier,i=Ne(a,e,r,t),p=He(a,e,i.records,t);return{playIn:n.matches,playInQualifier:r,swissTeams:i.swissTeams,swissRounds:i.rounds,swissRecords:i.records,knockout:p.matches,champion:p.champion}}function pe(e){return[...e.playIn.matches,...e.swiss.rounds.flatMap(a=>a.matches),...e.knockout.matches]}const M="wp26:overrides",J="wp26:prefs",qe=2026;function X(e,a){try{const t=localStorage.getItem(e);return t?{...a,...JSON.parse(t)}:a}catch{return a}}function F(e,a){try{localStorage.setItem(e,JSON.stringify(a))}catch{}}class Qe{teamsFile;tournament;teams=[];teamsById=new Map;ratings={};overrides=X(M,{});prefs=X(J,{showProjection:!0,mcIterations:1e3,mcUseOverrides:!1,h2h:{a:"GEN",b:"BLG",bestOf:5}});mc=null;mcRunning=!1;scenarioSeed=null;listeners=[];cache=new Map;setData(a,t){this.teamsFile=a,this.tournament=t,this.teams=a.teams,this.teamsById=new Map(this.teams.map(n=>[n.id,n])),this.ratings=Pe(this.teams,pe(t)),this.cache.clear(),this.emit()}resolved(a){const t=this.scenarioSeed,n=t!=null?`random:${t}`:a?"favorite":"none";let s=this.cache.get(n);return s||(s=de(this.teams,this.tournament,{ratings:this.ratings,overrides:this.overrides,mode:t!=null?"random":a?"favorite":"none",rng:le(t??qe)}),this.cache.set(n,s)),s}togglePick(a,t){this.overrides[a]?.winner===t?delete this.overrides[a]:this.overrides[a]={winner:t},F(M,this.overrides),this.cache.clear(),this.emit()}setPickScore(a,t,n,s){this.overrides[a]={winner:t,scoreA:n,scoreB:s},F(M,this.overrides),this.cache.clear(),this.emit()}clearPicks(a){for(const t of Object.keys(this.overrides))(!a||t.startsWith(a))&&delete this.overrides[t];F(M,this.overrides),this.cache.clear(),this.emit()}setPrefs(a){this.prefs={...this.prefs,...a},F(J,this.prefs),this.emit()}setMc(a,t,n){this.mc=a,this.mcRunning=t,n!==void 0&&(this.scenarioSeed=n),this.emit()}setScenario(a){this.scenarioSeed=a,this.emit()}subscribe(a){this.listeners.push(a)}emit(){for(const a of this.listeners)a()}}const d=new Qe;function Z(e){const a=typeof performance<"u"?performance.now():Date.now(),t=e.seed??Math.floor(Math.random()*2**31),n=le(t),s=Math.max(1,Math.floor(e.iterations)),o={},r={},i=(l,f,c)=>{if(!f)return;const h=(r[l]??={})[f]??={played:0,won:0};h.played++,c&&h.won++};for(const l of e.teams)o[l.id]={team:l.id,swiss:0,playoffs:0,semis:0,final:0,champion:0,records:{}};for(let l=0;l<s;l++){const f=de(e.teams,e.tournament,{ratings:e.ratings,overrides:e.overrides,mode:"random",rng:n});for(const c of[...f.playIn,...f.knockout])i(c.id,c.teamA,c.winner===c.teamA),i(c.id,c.teamB,c.winner===c.teamB);for(const c of f.swissTeams){const h=o[c];if(!h)continue;h.swiss++;const g=f.swissRecords[c];if(g&&(g.wins===3||g.losses===3)){const b=`${g.wins}-${g.losses}`;h.records[b]=(h.records[b]??0)+1}g?.wins===3&&h.playoffs++}for(const c of f.knockout)c.winner&&(c.id.startsWith("QF")&&o[c.winner].semis++,c.id.startsWith("SF")&&o[c.winner].final++,c.id==="F"&&o[c.winner].champion++)}for(const l of Object.values(o)){l.swiss/=s,l.playoffs/=s,l.semis/=s,l.final/=s,l.champion/=s;for(const f of Object.keys(l.records))l.records[f]/=s}for(const l of Object.values(r))for(const f of Object.values(l))f.played/=s,f.won/=s;const p=typeof performance<"u"?performance.now():Date.now();return{iterations:s,seed:t,odds:o,slots:r,elapsedMs:p-a,usedOverrides:!!e.overrides&&Object.keys(e.overrides).length>0}}const ee={AL:"dark",CFO:"dark",FUR:"dark",T1:"dark",TES:"dark",DK:"light",GEN:"light",G2:"light",TL:"light",TSW:"light"};function m(e){return String(e??"").replace(/[&<>"']/g,a=>`&#${a.charCodeAt(0)};`)}const x=(e,a=1)=>e<=0?"0%":e>=1?"100%":e<.001?"<0.1%":`${(e*100).toFixed(a)}%`,ue={LCK:"#0AC8B9",LPL:"#E84057",LEC:"#C8AA6E",LCS:"#4A90E2",LTA:"#4A90E2",CBLOL:"#3FB950",LCP:"#B57EDC"};function w(e){return e?d.teamsById.get(e):void 0}function fe(e,a,t){return`<span class="hex-crest ${t}" style="--crest:${a}" aria-hidden="true">${m(e)}</span>`}function A(e,a="w-8 h-8 text-[10px]"){const t=w(e);if(!t)return fe("?","#3C3C41",a);const n=ue[t.region]??"#3C3C41",s=ee[t.id]?` data-tone="${ee[t.id]}"`:"";return`<span class="logo-crest ${a}" style="--crest:${n}"${s} data-code="${m(t.code)}"><img src="logos/${m(t.id)}.webp" alt="${m(t.name)}" width="40" height="40" loading="lazy" decoding="async" draggable="false"></span>`}function me(e){return`<span class="region-tag" style="--rc:${ue[e]??"#888"}">${m(e)}</span>`}function Ue(e){return!e.teamA||!e.teamB||!d.ratings[e.teamA]||!d.ratings[e.teamB]?null:re(H(d.ratings,e.teamA,e.teamB),e.bestOf)}function Ge(e){return e.status==="IN_PROGRESS"?'<span class="pill pill-live"><i></i>EN VIVO</span>':e.source==="official"?'<span class="pill pill-final">FINAL</span>':e.source==="manual"?'<span class="pill pill-pick">TU PICK</span>':e.source==="projected"?'<span class="pill pill-proj">PROYECCIÓN</span>':'<span class="pill pill-sched">PROGRAMADO</span>'}function Ke(e){if(!e)return"";try{return new Date(e).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function U(e,a={}){const t=Ue(e),n=e.status==="FINISHED"||!e.teamA||!e.teamB,s=(o,r,i)=>{const p=w(o),l=!!e.winner&&e.winner===o,f=!!e.winner&&e.winner!==o,c=e.source||e.status==="IN_PROGRESS";return`<button type="button" class="team-row ${l?"is-winner":""} ${f?"is-loser":""}"
      ${n?"disabled":""} data-pick="${m(e.id)}" data-team="${m(o??"")}"
      title="${n?"":"Click: elegir ganador (otra vez para quitar)"}">
      ${A(o,"w-6 h-6 text-[8px]")}
      <span class="flex-1 truncate text-left">${p?m(a.compact?p.code:p.name):'<span class="text-hex-500">Por definir</span>'}</span>
      ${i!=null&&!e.winner?`<span class="text-[10px] text-cyan-neon/80 tabular-nums">${x(i,0)}</span>`:""}
      <span class="score">${c?r:""}</span>
    </button>`};return`<div class="match-card ${e.projectedPairing?"is-projected":""} ${e.status==="IN_PROGRESS"?"is-live":""}" data-match="${m(e.id)}">
    <div class="flex items-center justify-between gap-2 px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-hex-500">
      <span class="truncate">${m(a.title??e.label??"")} <b class="text-gold-300">Bo${e.bestOf}</b></span>
      <span class="flex items-center gap-1">${e.startTime&&!e.source?`<span>${m(Ke(e.startTime))}</span>`:""}${Ge(e)}</span>
    </div>
    ${s(e.teamA,e.scoreA,t)}
    ${s(e.teamB,e.scoreB,t==null?null:1-t)}
    ${Ve(e)}
    ${t!=null?`<div class="prob-bar" title="Probabilidad de serie"><span style="width:${(t*100).toFixed(1)}%"></span></div>`:""}
    ${ze(e.id)}
  </div>`}function ze(e){const a=d.mc?.slots[e];if(!a)return"";const t=Object.entries(a).filter(([,n])=>n.won>=.005).sort((n,s)=>s[1].won-n[1].won).slice(0,3);return t.length?`<div class="slot-odds" title="Monte Carlo: probabilidad de ganar esta serie (sobre todas las simulaciones)">
    <span class="slot-odds-label">Sim</span>${t.map(([n,s])=>`<span class="slot-odds-item">${m(w(n)?.code??n)} <b>${x(s.won,0)}</b></span>`).join("")}
  </div>`:""}function Ve(e){if(e.source!=="manual"||e.bestOf===1||!e.winner||!e.teamA||!e.teamB)return"";const a=Math.ceil(e.bestOf/2),t=e.winner===e.teamA,n=d.overrides[e.id]?.scoreA!=null,s=Array.from({length:a},(o,r)=>{const[i,p]=t?[a,r]:[r,a];return`<button type="button" class="score-opt ${e.scoreA===i&&e.scoreB===p?"is-active":""}" data-score="${m(e.id)}"
      data-winner="${m(e.winner)}" data-sa="${i}" data-sb="${p}">${a}-${r}</button>`}).join("");return`<div class="score-picker" title="${n?"Marcador elegido por ti":"Automático: el marcador más probable para este ganador según el Elo de ambos equipos"}">
    <span>${m(w(e.winner)?.code)} gana</span>${s}${n?"":"<em>auto</em>"}
  </div>`}function he(){return d.scenarioSeed==null?"":`<div class="notice flex flex-wrap items-center gap-x-3 gap-y-1">
    <span>🎲 Estás viendo <b>un escenario simulado</b> (seed ${d.scenarioSeed}): oficial + tus picks + un resultado aleatorio ponderado por Elo para lo que falta.</span>
    <span class="ml-auto flex gap-2">
      <button class="btn-ghost" data-action="new-scenario">Otro escenario</button>
      <button class="btn-ghost" data-action="clear-scenario">Volver a favoritos</button>
    </span>
  </div>`}const te=[1e3,5e3,1e4,25e3,5e4];function G(){const e=te.includes(d.prefs.mcIterations)?d.prefs.mcIterations:1e3;return`<div class="flex flex-wrap items-center gap-2 text-xs">
    <label class="field-inline">Simulaciones <select data-mc="iterations">${te.map(t=>`<option value="${t}" ${t===e?"selected":""}>${t.toLocaleString()}</option>`).join("")}</select></label>
    <label class="toggle"><input type="checkbox" data-mc="overrides" ${d.prefs.mcUseOverrides?"checked":""}><span>Incluir mis picks</span></label>
    <button class="btn-gold" data-action="run-mc" ${d.mcRunning?"disabled":""}>${d.mcRunning?"Simulando…":"▶ Simular torneo"}</button>
  </div>`}function ge(){const e=d.mc;return d.mcRunning?`Simulando ${d.prefs.mcIterations.toLocaleString()} torneos…`:e?`${e.iterations.toLocaleString()} simulaciones · ${(e.elapsedMs/1e3).toFixed(2)} s · seed ${e.seed}${e.usedOverrides?" · con tus picks":""}`:"Sin simulación todavía."}function Ye(){const e=d.mc,a=e?Object.values(e.odds).sort((t,n)=>n.champion-t.champion||n.final-t.final).slice(0,8):[];return`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Simulador del torneo (Monte Carlo)</h3>
        <p class="panel-sub">Juega el resto de Worlds N veces desde el estado real (y, si quieres, con tus picks) y cuenta cuántas veces cada equipo llega a playoffs, a la final o gana el título.</p>
      </div>
      ${G()}
    </header>
    <p class="text-[11px] text-hex-500 mb-3">${m(ge())} · <a href="#rankings" class="text-cyan-neon hover:underline">Ver tabla completa →</a></p>
    <div class="grid gap-2 grid-cols-2 md:grid-cols-4 ${d.mcRunning?"opacity-50":""}">
      ${a.map((t,n)=>`<div class="stat-tile">
            <span class="hidden sm:inline text-hex-500 text-xs tabular-nums w-4">${n+1}</span><span class="hidden sm:inline-flex">${A(t.team)}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm"><span class="sm:hidden text-hex-500 tabular-nums">${n+1}. </span><span class="sm:hidden">${m(w(t.team)?.code)}</span><span class="hidden sm:inline">${m(w(t.team)?.name)}</span></div>
              <div class="text-xl font-display text-gold-300 tabular-nums leading-tight">${x(t.champion)}</div>
              <div class="text-[10px] text-hex-500 tabular-nums">Playoffs ${x(t.playoffs,0)} · Final ${x(t.final,0)}</div>
            </div>
          </div>`).join("")}
    </div>
  </section>`}function Je(e){const a=new Map(e.playIn.map(s=>[s.id,s])),t=(s,o)=>`
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">${m(s)}</h4>
      ${o.map(r=>a.get(r)?U(a.get(r)):"").join("")}
    </div>`,n=w(e.playInQualifier);return`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Play-In · Los Ángeles</h3>
        <p class="panel-sub">Doble eliminación, todas las series Bo5. Solo el ganador avanza al Swiss Stage (Tier 4 del sorteo).</p>
      </div>
      ${n?`<div class="flex items-center gap-2 text-sm">${A(n.id)}<span>Clasifica: <b class="text-gold-300">${m(n.name)}</b></span></div>`:""}
    </header>
    ${Xe()}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${t("Ronda 1",["PI-A","PI-B"])}
      ${t("Ronda 2",["PI-C","PI-D"])}
      ${t("Ronda 3",["PI-E"])}
      ${t("Final de clasificación",["PI-F"])}
    </div>
  </section>`}function Xe(){const e=d.mc;return e?`<div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
    <span class="text-hex-500 uppercase tracking-wider text-[10px]">Simulación · clasifica al Swiss</span>
    ${d.teams.filter(n=>n.stageEntry==="PLAY_IN").map(n=>({t:n,p:e.odds[n.id]?.swiss??0})).sort((n,s)=>s.p-n.p).map(({t:n,p:s})=>`<span class="stat-tile !p-1.5 !gap-2">${A(n.id,"w-6 h-6 text-[8px]")}<span>${m(n.code)}</span><b class="font-display text-gold-300 tabular-nums">${x(s,0)}</b></span>`).join("")}
  </div>`:""}const se=["3-0","3-1","3-2","2-3","1-3","0-3"];function Ze(){const e=d.mc;if(!e)return"";const a=Object.values(e.odds).filter(n=>n.swiss>0).sort((n,s)=>s.playoffs-n.playoffs||s.swiss-n.swiss),t=(n,s)=>{const o=n??0,r=Math.min(.85,o*1.6).toFixed(2);return`<td class="heat" style="background:rgb(${s?"var(--cyan-neon)":"var(--loss)"} / ${r})" title="${x(o)}">${o>=.005?x(o,0):"·"}</td>`};return`
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Resultado final del Swiss (Monte Carlo)</h3>
        <p class="panel-sub">${e.iterations.toLocaleString()} simulaciones: con qué récord termina cada equipo. 3-x = clasifica a playoffs, x-3 = eliminado.</p>
      </div>
    </header>
    <div class="table-wrap">
      <table class="rank-table heat-table">
        <thead><tr><th class="text-left">Equipo</th>${se.map(n=>`<th>${n}</th>`).join("")}<th>Playoffs</th></tr></thead>
        <tbody>${a.map(n=>`<tr>
            <td class="text-left"><div class="flex items-center gap-2">${A(n.team,"w-6 h-6 text-[8px]")}<span class="truncate">${m(w(n.team)?.name)}</span>${n.swiss<.995?`<span class="text-[10px] text-hex-500">(entra ${x(n.swiss,0)})</span>`:""}</div></td>
            ${se.map(s=>t(n.records[s],s.startsWith("3"))).join("")}
            <td class="font-display text-gold-300 tabular-nums">${x(n.playoffs,0)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  </section>`}function ae(e){const[a,t]=e.split("-").map(Number);return-(a*10-t)}function et(e,a,t){const n=new Map;for(const o of a)n.set(o.pool??"?",[...n.get(o.pool??"?")??[],o]);for(const[o]of t)n.has(o)||n.set(o,[]);const s=[...n.keys()].sort((o,r)=>ae(o)-ae(r));return`
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">Ronda ${e}</h4>
      ${s.length===0?'<p class="text-xs text-hex-500 italic">Pendiente de sorteo</p>':s.map(o=>{const r=n.get(o),[i,p]=o.split("-").map(Number),l=i===2&&p===2?"decisivo":i===2?"clasificación":p===2?"eliminación":"",f=t.get(o)??[];return`<div class="pool">
                  <div class="pool-head"><span class="pool-label">${m(o)}</span>${l?`<span class="text-[10px] uppercase text-gold-400">${l} · Bo3</span>`:'<span class="text-[10px] uppercase text-hex-500">Bo1</span>'}</div>
                  <div class="flex flex-col gap-2">${r.map(c=>U(c,{compact:!0})).join("")}
                  ${f.length?`<div class="flex flex-wrap gap-1 p-2 text-[10px] text-hex-500">Esperando sorteo: ${f.map(c=>A(c,"w-6 h-6 text-[8px]")).join("")}</div>`:""}
                  </div>
                </div>`}).join("")}
    </div>`}function tt(e){const a=Object.values(e.swissRecords),t=(n,s,o)=>{const r=a.filter(i=>i.wins===n&&i.losses===s);return`<div class="pool ${o?"pool-good":"pool-bad"}">
      <div class="pool-head"><span class="pool-label">${n}-${s}</span><span class="text-[10px] uppercase ${o?"text-cyan-neon":"text-loss"}">${o?"Playoffs":"Eliminado"}</span></div>
      <div class="flex flex-col gap-1">${r.length?r.map(i=>`<div class="flex items-center gap-2 text-sm px-2 py-1">${A(i.team,"w-6 h-6 text-[8px]")}<span class="truncate">${m(w(i.team)?.name)}</span></div>`).join(""):'<span class="text-xs text-hex-500 px-2 py-1">—</span>'}</div>
    </div>`};return`
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">Resultado</h4>
      ${t(3,0,!0)}${t(3,1,!0)}${t(3,2,!0)}
      ${t(2,3,!1)}${t(1,3,!1)}${t(0,3,!1)}
    </div>`}function st(e){const a=d.prefs.showProjection,t=d.resolved(a),n=t.swissRounds.map(o=>{const r=new Map,i=new Set(o.matches.flatMap(l=>[l.teamA,l.teamB]));if(t.swissRounds.filter(l=>l.round<o.round).every(l=>l.matches.every(f=>f.winner))&&t.swissTeams.length===16)for(const l of t.swissTeams){if(i.has(l))continue;let f=0,c=0;for(const h of t.swissRounds.filter(g=>g.round<o.round)){const g=h.matches.find(b=>b.teamA===l||b.teamB===l);g?.winner===l?f++:g?.winner&&c++}f<3&&c<3&&r.set(`${f}-${c}`,[...r.get(`${f}-${c}`)??[],l])}return et(o.round,o.matches,r)}).join(""),s=Object.keys(d.overrides).filter(o=>o.startsWith("SW-")||o.startsWith("PI-")).length;e.innerHTML=`
    <div class="flex flex-col gap-6">
      ${Ye()}
      ${he()}
      ${Je(t)}
      <section class="panel">
        <header class="panel-head">
          <div>
            <h3 class="panel-title">Swiss Stage · Allen, Texas</h3>
            <p class="panel-sub">16 equipos · 3 victorias clasifican, 3 derrotas eliminan · Bo1 salvo series de clasificación/eliminación (Bo3) · sin revanchas.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs">
            <label class="toggle"><input type="checkbox" data-action="toggle-projection" ${a?"checked":""}><span>Proyectar favoritos</span></label>
            ${s?`<button class="btn-ghost" data-action="clear-picks" data-prefix="SW-">Borrar picks (${s})</button>`:""}
          </div>
        </header>
        <p class="legend">
          <span><i class="dot bg-cyan-neon"></i>Oficial</span>
          <span><i class="dot bg-gold-300"></i>Tu pick (click en un equipo; en Bo3/Bo5 eliges el marcador)</span>
          <span><i class="dot border border-dashed border-hex-500"></i>Emparejamiento simulado</span>
        </p>
        <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          ${n}
          ${tt(t)}
        </div>
      </section>
      ${Ze()}
    </div>`}function at(e){const a=d.resolved(!0),t=new Map(a.knockout.map(l=>[l.id,l])),n=(l,f)=>U(t.get(l),{title:f}),s=w(a.champion),o=a.knockout.some(l=>l.source!=="official"),r=Object.keys(d.overrides).filter(l=>/^(QF|SF|F$)/.test(l)).length,i=d.mc,p=i?Object.values(i.odds).sort((l,f)=>f.champion-l.champion).slice(0,5):[];e.innerHTML=`
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
        <div class="champion ${s?"":"opacity-50"}">
          <div class="text-[10px] uppercase tracking-[0.3em] text-gold-400">${o?"Campeón proyectado":"Campeón"}</div>
          ${s?`<div class="flex items-center gap-3 justify-center mt-2">${A(s.id,"w-12 h-12 text-xs")}<span class="font-display text-2xl text-gold-100">${m(s.name)}</span></div>`:'<div class="mt-2 text-hex-500">Por definir</div>'}
        </div>
      </div>
    </div>
  </section>
  <section class="panel mt-6">
    <header class="panel-head"><div><h3 class="panel-title">Favoritos al título (Monte Carlo)</h3>
    <p class="panel-sub">${i?`${i.iterations.toLocaleString()} simulaciones del resto del torneo desde el estado real.`:d.mcRunning?"Simulando…":"Aún no hay simulación."}</p></div>${G()}</header>
    <div class="grid gap-2 sm:grid-cols-5">
      ${p.map(l=>`<div class="stat-tile">${A(l.team)}<div class="min-w-0"><div class="truncate text-sm">${m(w(l.team)?.name)}</div><div class="text-xl font-display text-gold-300 tabular-nums">${x(l.champion)}</div><div class="text-[10px] text-hex-500">Final ${x(l.final,0)}</div></div></div>`).join("")}
    </div>
  </section>
  ${nt()}`}function nt(){const e=d.mc;if(!e)return"";const a=Object.values(e.odds).map(n=>({team:n.team,wins:Math.round(n.champion*e.iterations),p:n.champion})).filter(n=>n.wins>0).sort((n,s)=>s.wins-n.wins),t=a[0]?.wins??1;return`
  <section class="panel mt-6">
    <header class="panel-head"><div><h3 class="panel-title">Campeones en las simulaciones</h3>
    <p class="panel-sub">De ${e.iterations.toLocaleString()} torneos simulados, cuántas veces ganó el título cada equipo.</p></div></header>
    <div class="table-wrap">
      <table class="rank-table">
        <thead><tr><th class="text-left">#</th><th class="text-left">Equipo</th><th>Veces campeón</th><th>%</th><th class="text-left w-1/3"></th></tr></thead>
        <tbody>${a.map((n,s)=>`<tr>
            <td class="text-left text-hex-500 tabular-nums">${s+1}</td>
            <td class="text-left"><div class="flex items-center gap-2">${A(n.team,"w-6 h-6 text-[8px]")}<span class="truncate">${m(w(n.team)?.name)}</span></div></td>
            <td class="font-display text-gold-300 tabular-nums">${n.wins.toLocaleString()}</td>
            <td class="tabular-nums">${x(n.p)}</td>
            <td class="text-left"><div class="prob-bar big"><span style="width:${(n.wins/t*100).toFixed(1)}%"></span></div></td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td></td><td class="text-left text-hex-500">Total</td><td class="tabular-nums text-gold-100">${a.reduce((n,s)=>n+s.wins,0).toLocaleString()}</td><td></td><td></td></tr></tfoot>
      </table>
    </div>
  </section>`}function ot(e){const{a,b:t,bestOf:n}=d.prefs.h2h,s=d.teams.map(u=>u.id),o=s.includes(a)?a:s[0],r=s.includes(t)&&t!==o?t:s.find(u=>u!==o),i=Ee(d.ratings,o,r,n),p=w(o),l=w(r),f=u=>d.teams.slice().sort((y,v)=>y.name.localeCompare(v.name)).map(y=>`<option value="${m(y.id)}" ${y.id===u?"selected":""}>${m(y.name)} (${m(y.region)})</option>`).join(""),c=Math.max(...i.distribution.map(u=>u.prob)),h=pe(d.tournament).filter(u=>u.status==="FINISHED"&&(u.teamA===o&&u.teamB===r||u.teamA===r&&u.teamB===o)),g=(u,y,v)=>{const $=w(u),S=d.ratings[u];return`<div class="flex flex-col items-center gap-2 ${v}">
      ${A(u,"w-16 h-16 text-sm")}
      <div class="font-display text-lg text-gold-100 text-center">${m($.name)}</div>
      <div class="flex items-center gap-2 text-xs">${me($.region)}<span class="text-hex-500">Elo ${S.effective.toFixed(0)}</span></div>
      <div class="font-display text-4xl md:text-5xl tabular-nums ${y>=.5?"text-cyan-neon":"text-gold-300"}">${x(y)}</div>
    </div>`},b=u=>w(u).roster.map(y=>`<li class="flex justify-between gap-2"><span class="text-hex-500 text-[10px] uppercase w-14">${m(y.role)}</span><span class="truncate">${m(y.player)}</span></li>`).join("");e.innerHTML=`
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
          <dt>Prob. por mapa (${m(p.code)})</dt><dd>${x(i.pMap)}</dd>
          <dt>Prob. de serie (${m(p.code)})</dt><dd>${x(i.pSeries)}</dd>
          <dt>Marcador más probable</dt><dd class="text-gold-300">${i.mostLikely.scoreA}-${i.mostLikely.scoreB} <span class="text-hex-500">(${x(i.mostLikely.prob)})</span></dd>
          <dt>Favorito</dt><dd>${m(i.pSeries>=.5?p.name:l.name)}</dd>
          <dt>Cruces en Worlds 2026</dt><dd>${h.length?h.map(u=>`${m(w(u.teamA)?.code)} ${u.scoreA}-${u.scoreB} ${m(w(u.teamB)?.code)}`).join(", "):"—"}</dd>
        </dl>
      </div>
      <div class="sub-panel">
        <h4 class="col-title">Distribución de marcadores</h4>
        <div class="flex flex-col gap-1.5">
          ${i.distribution.map(u=>`<div class="flex items-center gap-2 text-xs">
                <span class="w-16 tabular-nums ${u.scoreA>u.scoreB?"text-cyan-neon":"text-gold-300"}">${m(u.scoreA>u.scoreB?p.code:l.code)} ${Math.max(u.scoreA,u.scoreB)}-${Math.min(u.scoreA,u.scoreB)}</span>
                <span class="flex-1 h-3 bg-hex-800 rounded-sm overflow-hidden"><span class="block h-full ${u.scoreA>u.scoreB?"bg-cyan-neon/80":"bg-gold-300/80"}" style="width:${(u.prob/c*100).toFixed(1)}%"></span></span>
                <span class="w-12 text-right tabular-nums">${x(u.prob)}</span>
              </div>`).join("")}
        </div>
      </div>
      <div class="sub-panel">
        <h4 class="col-title">Factores determinantes</h4>
        <p class="text-[11px] text-hex-500 mb-2">Puntos de rating a favor de ${m(p.code)} (negativo = a favor de ${m(l.code)}).</p>
        <div class="flex flex-col gap-2">
          ${i.factors.map(u=>{const y=Math.min(50,Math.abs(u.value)/4);return`<div class="text-xs">
                <div class="flex justify-between"><span>${m(u.label)}</span><span class="tabular-nums ${u.value>=0?"text-cyan-neon":"text-gold-300"}">${u.value>=0?"+":""}${u.value.toFixed(0)}</span></div>
                <div class="relative h-1.5 bg-hex-800 mt-1"><span class="absolute top-0 h-full ${u.value>=0?"bg-cyan-neon left-1/2":"bg-gold-300 right-1/2"}" style="width:${y}%"></span></div>
              </div>`}).join("")}
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6">
      <div class="sub-panel"><h4 class="col-title">${m(p.name)}</h4><ul class="text-sm flex flex-col gap-1">${b(o)}</ul></div>
      <div class="sub-panel"><h4 class="col-title">${m(l.name)}</h4><ul class="text-sm flex flex-col gap-1">${b(r)}</ul></div>
    </div>
  </section>`}let I="champion",E=-1;function it(e){e===I?E=E===1?-1:1:(I=e,E=e==="name"?1:-1)}function rt(e){const a=d.mc,t=d.resolved(!1),n=d.teams.map(r=>{const i=d.ratings[r.id],p=a?.odds[r.id],l=t.swissRecords[r.id];return{t:r,r:i,o:p,rec:l,values:{elo:i.effective,delta:i.elo-i.base,record:i.seriesWon-i.seriesLost+i.seriesWon*.01,swiss:p?.swiss??0,playoffs:p?.playoffs??0,final:p?.final??0,champion:p?.champion??i.effective/1e6,name:0}}});n.sort((r,i)=>I==="name"?E*r.t.name.localeCompare(i.t.name):E*(r.values[I]-i.values[I])||i.r.effective-r.r.effective);const s=(r,i,p="")=>`<th class="${p}"><button data-sort="${r}" class="th-btn ${I===r?"is-sorted":""}">${i}${I===r?E===-1?" ▾":" ▴":""}</button></th>`,o=(r,i)=>r==null?'<span class="text-hex-500">—</span>':`<div class="flex items-center gap-2 justify-end"><span class="tabular-nums">${x(r)}</span><span class="hidden lg:block w-14 h-1.5 bg-hex-800"><span class="block h-full" style="width:${(r*100).toFixed(1)}%;background:${i}"></span></span></div>`;e.innerHTML=`
  <section class="panel">
    <header class="panel-head">
      <div><h3 class="panel-title">Power Rankings</h3>
      <p class="panel-sub">Elo efectivo = Elo base ajustado por resultados oficiales en Worlds 2026 (K=${oe} por mapa) + peso regional + forma reciente. Probabilidades por Monte Carlo.</p></div>
      ${G()}
    </header>
    <p class="text-[11px] text-hex-500 mb-3">${m(ge())}</p>
    <div class="table-wrap">
      <table class="rank-table">
        <thead><tr>
          <th class="w-8 hidden sm:table-cell">#</th>
          ${s("name","Equipo","text-left")}
          ${s("elo","Elo")}
          ${s("delta","Δ","hidden sm:table-cell")}
          ${s("record","Series","hidden md:table-cell")}
          <th class="hidden lg:table-cell">Forma</th>
          ${s("swiss","Swiss","hidden xl:table-cell")}
          ${s("playoffs","Playoffs")}
          ${s("final","Final","hidden sm:table-cell")}
          ${s("champion","Campeón")}
        </tr></thead>
        <tbody>
          ${n.map(({t:r,r:i,o:p,rec:l},f)=>{const c=l&&(l.wins===3||l.losses===3);return`<tr class="${l?.losses===3?"opacity-50":""}">
                <td class="text-hex-500 tabular-nums hidden sm:table-cell">${f+1}</td>
                <td class="text-left max-w-[10rem] sm:max-w-none"><div class="flex items-center gap-2 min-w-0">${A(r.id)}
                  <div class="min-w-0"><div class="truncate text-gold-100">${m(r.name)}</div>
                  <div class="flex items-center gap-1.5 text-[10px] text-hex-500">${me(r.region)}<span class="hidden sm:inline">${r.stageEntry==="PLAY_IN"?"Play-In":`Tier ${r.swissTier}`}</span>${l?`<span class="whitespace-nowrap">· Swiss ${l.wins}-${l.losses}${c?l.wins===3?" ✓":" ✗":""}</span>`:""}</div></div></div></td>
                <td class="tabular-nums text-gold-300">${i.effective.toFixed(0)}</td>
                <td class="tabular-nums hidden sm:table-cell ${i.elo-i.base>=0?"text-cyan-neon":"text-loss"}">${i.elo-i.base>=0?"+":""}${(i.elo-i.base).toFixed(0)}</td>
                <td class="tabular-nums hidden md:table-cell">${i.seriesWon}-${i.seriesLost} <span class="text-hex-500 text-[10px]">(${i.mapsWon}-${i.mapsLost})</span></td>
                <td class="hidden lg:table-cell"><div class="flex gap-0.5 justify-end">${i.form.length?i.form.slice(-5).map(h=>`<span class="form-chip ${h==="W"?"is-w":"is-l"}">${h}</span>`).join(""):'<span class="text-hex-500 text-xs">—</span>'}</div></td>
                <td class="hidden xl:table-cell">${o(p?.swiss,"#5B5A56")}</td>
                <td>${o(p?.playoffs,"#0AC8B9")}</td>
                <td class="hidden sm:table-cell">${o(p?.final,"#C8AA6E")}</td>
                <td>${o(p?.champion,"#C89B3C")}</td>
              </tr>`}).join("")}
        </tbody>
      </table>
    </div>
  </section>`}const ve="wp26:theme";function be(){try{const e=localStorage.getItem(ve);return e==="dark"||e==="light"?e:null}catch{return null}}function ne(){return be()??(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")}function T(e){document.documentElement.dataset.theme=e,document.querySelector('meta[name="theme-color"]')?.setAttribute("content",e==="light"?"#f6f2e9":"#010a13");const a=document.getElementById("theme-toggle");if(a){const t=e==="light"?"Cambiar a tema oscuro":"Cambiar a tema claro";a.setAttribute("aria-label",t),a.setAttribute("title",t)}}function lt(){T(ne()),document.getElementById("theme-toggle")?.addEventListener("click",()=>{const e=document.documentElement.dataset.theme==="light"?"dark":"light";try{localStorage.setItem(ve,e)}catch{}T(e)}),matchMedia("(prefers-color-scheme: light)").addEventListener("change",()=>{be()||T(ne())})}const O={swiss:{label:"Swiss Stage",render:st},bracket:{label:"Playoffs",render:at},h2h:{label:"H2H Simulator",render:ot},rankings:{label:"Power Rankings",render:rt}},ct=300*1e3,$e=document.getElementById("view"),dt=document.getElementById("tabs"),pt=document.getElementById("meta");function xe(){const e=location.hash.replace("#","");return e in O?e:"swiss"}function ut(){const e=xe();dt.innerHTML=Object.keys(O).map(a=>`<a href="#${a}" role="tab" aria-selected="${a===e}" class="tab ${a===e?"is-active":""}">${O[a].label}</a>`).join("")}function ft(){const e=new Date().toISOString().slice(0,10),a=d.tournament.event.stages,t=a.find(s=>e>=s.start&&e<=s.end);if(t)return t.name;const n=a.find(s=>e<s.start);return n?`Próximo: ${n.name} (${n.start})`:"Torneo finalizado"}function mt(){const e=[...d.tournament.playIn.matches,...d.tournament.swiss.rounds.flatMap(t=>t.matches),...d.tournament.knockout.matches].some(t=>t.status==="IN_PROGRESS"),a=new Date(d.tournament.lastUpdated);pt.innerHTML=`
    ${e?'<span class="pill pill-live"><i></i>EN VIVO</span>':""}
    <span class="hidden sm:inline text-gold-300">${m(ft())}</span>
    <span title="${m(d.tournament.lastUpdated)}">Datos: ${m(a.toLocaleString(void 0,{dateStyle:"medium",timeStyle:"short"}))}</span>
    <button class="btn-ghost" data-action="refresh" title="Recargar datos">↻</button>`}function K(){ut(),mt();const e=xe();O[e].render($e),document.title=`${O[e].label} · Worlds 2026 Predictor`}let P=null;function ht(){if(P)return P;try{P=new Worker(new URL(""+new URL("mc.worker-CJkWgdam.js",import.meta.url).href,import.meta.url),{type:"module"})}catch{P=null}return P}const gt=1e4;function we(e=d.prefs.mcIterations,a=!1){if(d.mcRunning)return;d.setMc(d.mc,!0);const t={teams:d.teams,tournament:d.tournament,ratings:d.ratings,iterations:e,overrides:d.prefs.mcUseOverrides?d.overrides:void 0},n=o=>d.setMc(o,!1,a?o.seed:void 0),s=ht();if(!s){setTimeout(()=>n(Z(t)),20);return}s.onmessage=o=>n(o.data),s.onerror=()=>{P=null,n(Z(t))},s.postMessage(JSON.parse(JSON.stringify(t)))}lt();document.addEventListener("error",e=>{const a=e.target;if(!(a instanceof HTMLImageElement))return;const t=a.closest(".logo-crest");if(!t)return;const n=[...t.classList].filter(s=>/^(w|h|text)-/.test(s)).join(" ");t.outerHTML=fe(t.dataset.code??"?",t.style.getPropertyValue("--crest"),n)},!0);document.addEventListener("click",e=>{const a=e.target,t=a.closest("[data-pick]");if(t&&!t.disabled&&t.dataset.team){d.togglePick(t.dataset.pick,t.dataset.team);return}const n=a.closest("[data-score]");if(n){const i=n.dataset;d.setPickScore(i.score,i.winner,Number(i.sa),Number(i.sb));return}const s=a.closest("[data-sort]");if(s){it(s.dataset.sort),K();return}const o=a.closest("[data-h2h-bo]");if(o){d.setPrefs({h2h:{...d.prefs.h2h,bestOf:Number(o.dataset.h2hBo)}});return}switch(a.closest("[data-action]")?.dataset.action){case"refresh":D(!0);break;case"run-mc":we(d.prefs.mcIterations,!0);break;case"new-scenario":d.setScenario(Math.floor(Math.random()*2**31));break;case"clear-scenario":d.setScenario(null);break;case"h2h-swap":{const{a:i,b:p,bestOf:l}=d.prefs.h2h;d.setPrefs({h2h:{a:p,b:i,bestOf:l}});break}case"clear-picks":{const i=(a.closest("[data-prefix]")?.dataset.prefix??"").split(",");i.includes("SW-")&&i.push("PI-");for(const p of i)d.clearPicks(p);break}}});document.addEventListener("change",e=>{const a=e.target;if(a.dataset.action==="toggle-projection")d.scenarioSeed=null,d.setPrefs({showProjection:a.checked});else if(a.dataset.h2h){const t={...d.prefs.h2h,[a.dataset.h2h]:a.value};if(t.a===t.b){const n=a.dataset.h2h==="a"?"b":"a";t[n]=d.prefs.h2h[a.dataset.h2h]}d.setPrefs({h2h:t})}else a.dataset.mc==="iterations"?d.setPrefs({mcIterations:Number(a.value)}):a.dataset.mc==="overrides"&&d.setPrefs({mcUseOverrides:a.checked})});window.addEventListener("hashchange",K);async function D(e=!1){try{const{teams:a,tournament:t}=await Se();(!d.tournament||t.lastUpdated!==d.tournament.lastUpdated||a.lastUpdated!==d.teamsFile.lastUpdated||e)&&(d.setData(a,t),we(Math.min(d.prefs.mcIterations,gt)))}catch(a){console.error(a),d.tournament||($e.innerHTML=`<div class="panel text-center text-loss">No se pudieron cargar los datos (${m(a.message)}).</div>`)}}d.subscribe(K);D().then(()=>setInterval(()=>{D()},ct));
