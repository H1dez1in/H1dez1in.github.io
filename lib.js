import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3/+esm";
export{OBR};
export const KL="com.op2.fichas/link",KC="com.op2.fichas/cfg",KR="com.op2.fichas/roll",ID="op2-ficha",POPS=[ID,ID+"-b"],POS="op2.pos",GK="op2.g";
export const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
export const D=["d4","d6","d8","d10","d12","d20"],sd=d=>+String(d).slice(1),ar=x=>Array.isArray(x)?x:x?Object.values(x):[];
export const SKA={};
"fis:Acrobacia,Atletismo,Crime,Furtividade,Luta,Pontaria,Vigor;men:Inspecionar,Máquinas,Medicina,Ocultismo,Percepção,Sobrevivência;emo:Animais,Disciplina,Enganação,Intimidar,Intuição,Persuasão".split(";").forEach(g=>{const[a,l]=g.split(":");l.split(",").forEach(n=>SKA[n]=a)});
export const vit=(o,ch)=>{const n=+o.nivel||0;return ch?{pv:["pv",sd(o.fis)+2*n+(o.arq==="Revigorado"?2*n:o.arq==="Equilibrado"?n:0)+(+o.pvx||0)],pd:["pd",sd(o.emo)+2*n+(o.arq==="Disciplinado"?2*n:o.arq==="Equilibrado"?n:0)+(+o.pdx||0)]}:{pv:["pva",+o.pv||0],pd:["pda",+o.pd||0]}};

/* ---------- configuração ----------
   Sala (todos os jogadores recebem): {u, m}. m é um código PÚBLICO, derivado do código do mestre.
   Ele só dá acesso às fichas que os jogadores importam.
   Mestre (somente neste navegador): código secreto g. Nele ficam monstros, NPCs e fichas do mestre.
   O código secreto nunca vai para a sala. */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
export const pubDe=async g=>"p"+hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("op2|"+g))).slice(0,24);
export const cfgSala=async()=>{const m=(await OBR.room.getMetadata())[KC];return m&&m.u&&m.m?m:null};
export const lerG=()=>{try{return((JSON.parse(localStorage.getItem(GK)||"null")||{}).g)||""}catch{return""}};
export const salvarG=g=>{try{localStorage.setItem(GK,JSON.stringify({g}))}catch{}};
export const pidSan=s=>String(s||"").replace(/[^\w-]/g,"");
export const meuPid=()=>pidSan(OBR.player.id);
/* contexto = onde ler/gravar: {u, m, e: pasta das fichas, i: pasta das imagens} */
export const ctxMestre=async()=>{const s=await cfgSala(),g=lerG();return s&&g&&await pubDe(g)===s.m?{u:s.u,m:g,e:"e",i:"i"}:null};
export const ctxJog=async p=>{const s=await cfgSala();return s&&p?{u:s.u,m:s.m,e:"p/"+p,i:"pi/"+p}:null};
export const ctxTodos=async()=>{const s=await cfgSala();return s?{u:s.u,m:s.m,e:"p",i:"pi"}:null};

/* ---------- Firebase (REST) ---------- */
const B=c=>`${c.u}/mesas/${c.m}`,U=(c,p)=>`${B(c)}/${c.e}/${p}.json`,UI=(c,k,id)=>`${B(c)}/${c.i}/${k}/${id}.json`;
export const get=(c,p)=>fetch(U(c,p)).then(r=>r.json());
export const put=(c,p,v)=>fetch(U(c,p),{method:"PUT",body:JSON.stringify(v)});
export const patch=(c,p,v)=>fetch(U(c,p),{method:"PATCH",body:JSON.stringify(v)});
export const del=(c,p)=>fetch(U(c,p),{method:"DELETE"});
export const img=(c,k,id)=>fetch(UI(c,k,id)).then(r=>r.json());
export const putImg=(c,k,id,v)=>fetch(UI(c,k,id),v?{method:"PUT",body:JSON.stringify(v)}:{method:"DELETE"});
const setAt=(R,p,v)=>{const k=p.split("/").filter(Boolean);let c=R;k.slice(0,-1).forEach(x=>{if(c[x]==null||typeof c[x]!=="object")c[x]={};c=c[x]});const z=k[k.length-1];v===null?delete c[z]:c[z]=v};
export function conectar(c,cb){const R={},es=new EventSource(`${B(c)}/${c.e}.json`);
const h=e=>{try{const{path,data}=JSON.parse(e.data);
if(e.type==="put"&&path==="/"){for(const k in R)delete R[k];Object.assign(R,data||{})}
else if(e.type==="put")setAt(R,path,data);
else Object.entries(data||{}).forEach(([k,v])=>setAt(R,path.replace(/\/$/,"")+"/"+k,v));
cb(R)}catch{}};
es.addEventListener("put",h);es.addEventListener("patch",h);return es}
export async function diag(c){try{const r=await fetch(`${B(c)}.json?shallow=true`);
if(r.status===401||r.status===403)return"O Firebase recusou o acesso (Permission denied). No Realtime Database, aba Regras, cole as regras que aparecem na aba Sincronia da extensão e clique em Publicar.";
if(r.status===404)return"URL do banco incorreta. Use o endereço que aparece no topo da aba Dados do Realtime Database (não do Firestore).";
if(r.ok)return"O banco responde, mas a conexão em tempo real foi bloqueada. Desative o bloqueador (Brave Shields) para esta página ou teste em outro navegador.";
return`O Firebase respondeu com erro ${r.status}.`}catch{return"Não consegui falar com o Firebase. Confira a URL (https://…firebaseio.com) e se um bloqueador impede o acesso a firebaseio.com."}}

/* ---------- rolagem ---------- */
export function rolar(o,da,db,p={}){
const st=(d,k)=>D[Math.max(0,Math.min(d==="d20"?5:4,D.indexOf(d)+k))],rd=n=>1+Math.floor(Math.random()*n),pc=p.pc,dt=p.dt||0,ds=[st(da,p.k||0),st(db,p.k||0)];
if(p.bx)ds.push(p.bx);if(pc&&o.bonus)ds.push(o.bonus);
const raw=ds.map(d=>rd(sd(d))),pd=pc?o.pav:"",pv=pd?rd(sd(pd)):0,r=pv?raw.map(v=>v<pv?0:v):raw;
const top=[...r].sort((x,y)=>y-x),sum=top.slice(0,3).reduce((s,x)=>s+x,0),RA=top[0],RB=top[top.length-1];
const crit=r.some((v,i)=>v>5&&r.indexOf(v)!==i),fail=raw.every(v=>v===1)||(pv>0&&sum===0),ok=crit||(!fail&&(!dt||sum>=dt));
const res=crit?"Acerto crítico":fail?"Falha crítica":!dt?"":ok?"Sucesso":"Falha";
const dano=p.dmg&&ok?(p.dmg==="ra"?(crit?RA+(top[1]||0):RA):RB)+(p.mod||0):null;
return{raw,r,pv,ds,sum,RA,RB,dt,crit,fail,ok,res,dano}}
export const anunciar=(t,v,oc)=>OBR.broadcast.sendMessage(KR,{t,v},{destination:oc?"LOCAL":"ALL"});

/* ---------- popup da ficha ----------
   O Owlbear não deixa arrastar popups: só dá para reabri-los em outra posição e mudar a altura.
   lado "L" = esquerda, "R" = direita, vazio = perto do token. A escolha fica guardada.
   Usamos dois ids alternados: o popup que se move abre o novo ANTES de se fechar. */
export async function abrirPop(q,pt,de){
const[W,H]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
const w=Math.min(380,W-24),h=Math.min(640,H-24),top=Math.max(12,Math.round((H-h)/2));
let lado="";try{lado=localStorage.getItem(POS)||""}catch{}
const a=lado==="L"?{left:12,top}:(lado==="R"||!pt)?{left:W-w-12,top}:{left:Math.max(12,Math.min(pt.x+60,W-w-12)),top:Math.max(12,Math.min(pt.y-h/2,H-h-12))};
const abre=i=>OBR.popover.open({id:POPS[i],url:`/index.html?${q}&i=${i?"b":"a"}`,width:w,height:h,anchorReference:"POSITION",anchorPosition:a,anchorOrigin:{horizontal:"LEFT",vertical:"TOP"},transformOrigin:{horizontal:"LEFT",vertical:"TOP"},disableClickAway:true});
if(de!==undefined){await abre(de?0:1);await OBR.popover.close(POPS[de])}
else{await fechaPop();await abre(0)}}
export const fechaPop=async()=>{for(const x of POPS)try{await OBR.popover.close(x)}catch{}};
