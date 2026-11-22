import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3/+esm";
export{OBR};
export const KL="com.op2.fichas/link",KC="com.op2.fichas/cfg",KR="com.op2.fichas/roll",ID="op2-ficha";
export const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
export const D=["d4","d6","d8","d10","d12","d20"],sd=d=>+String(d).slice(1),ar=x=>Array.isArray(x)?x:x?Object.values(x):[];
export const SKA={};
"fis:Acrobacia,Atletismo,Crime,Furtividade,Luta,Pontaria,Vigor;men:Inspecionar,Máquinas,Medicina,Ocultismo,Percepção,Sobrevivência;emo:Animais,Disciplina,Enganação,Intimidar,Intuição,Persuasão".split(";").forEach(g=>{const[a,l]=g.split(":");l.split(",").forEach(n=>SKA[n]=a)});
export const vit=(o,ch)=>{const n=+o.nivel||0;return ch?{pv:["pv",sd(o.fis)+2*n+(o.arq==="Revigorado"?2*n:o.arq==="Equilibrado"?n:0)+(+o.pvx||0)],pd:["pd",sd(o.emo)+2*n+(o.arq==="Disciplinado"?2*n:o.arq==="Equilibrado"?n:0)+(+o.pdx||0)]}:{pv:["pva",+o.pv||0],pd:["pda",+o.pd||0]}};
export const cfg=async()=>(await OBR.room.getMetadata())[KC]||null;
const U=(c,p)=>`${c.u}/mesas/${c.m}/e/${p}.json`;
export const get=(c,p)=>fetch(U(c,p)).then(r=>r.json());
export const put=(c,p,v)=>fetch(U(c,p),{method:"PUT",body:JSON.stringify(v)});
export const patch=(c,p,v)=>fetch(U(c,p),{method:"PATCH",body:JSON.stringify(v)});
export const img=(c,k,id)=>fetch(`${c.u}/mesas/${c.m}/i/${k}/${id}.json`).then(r=>r.json());
const setAt=(R,p,v)=>{const k=p.split("/").filter(Boolean);let c=R;k.slice(0,-1).forEach(x=>{if(c[x]==null||typeof c[x]!=="object")c[x]={};c=c[x]});const z=k[k.length-1];v===null?delete c[z]:c[z]=v};
export function conectar(c,cb){const R={},es=new EventSource(`${c.u}/mesas/${c.m}/e.json`);
const h=e=>{try{const{path,data}=JSON.parse(e.data);
if(e.type==="put"&&path==="/"){for(const k in R)delete R[k];Object.assign(R,data||{})}
else if(e.type==="put")setAt(R,path,data);
else Object.entries(data||{}).forEach(([k,v])=>setAt(R,path.replace(/\/$/,"")+"/"+k,v));
cb(R)}catch{}};
es.addEventListener("put",h);es.addEventListener("patch",h);return es}
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
export async function diag(c){try{const r=await fetch(`${c.u}/mesas/${c.m}.json?shallow=true`);
if(r.status===401||r.status===403)return"O Firebase recusou o acesso (Permission denied). No Realtime Database, aba Regras, cole as regras indicadas e clique em Publicar.";
if(r.status===404)return"URL do banco incorreta. Use o endereço que aparece no topo da aba Dados do Realtime Database (não do Firestore).";
if(r.ok)return"O banco responde, mas a conexão em tempo real foi bloqueada. Desative o bloqueador (Brave Shields) para esta página ou teste em outro navegador.";
return`O Firebase respondeu com erro ${r.status}.`}catch{return"Não consegui falar com o Firebase. Confira a URL (https://…firebaseio.com) e se um bloqueador impede o acesso a firebaseio.com."}}
