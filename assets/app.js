(function(){
"use strict";
let BLOCKS=[],Q=[],CAPTCHA="",STATIC=false;
const ISSUE_URL="https://github.com/ispyt-na-myslyvtsia/ispyt-na-myslyvtsia.github.com/issues/new";
const KEY="hunter-quiz-v2";
let stats={};
try{stats=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){stats={}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(stats))}catch(e){}}
const $=id=>document.getElementById(id);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const SECTIONS=["home","quiz","done","suggest"];
function show(id){SECTIONS.forEach(s=>$(s).classList.toggle("hidden",s!==id));window.scrollTo(0,0)}

function renderHome(){
  const box=$("blocks");box.innerHTML="";
  BLOCKS.forEach((name,b)=>{
    const qs=Q.filter(q=>q.b===b);
    if(!qs.length)return;
    const ok=qs.filter(q=>stats[q.id]===1).length;
    const bad=qs.filter(q=>stats[q.id]===0).length;
    const el=document.createElement("button");
    el.className="blk";
    el.innerHTML=`<span class="blk-name"></span><span class="blk-score">${ok} / ${qs.length}</span><span class="blk-meta">${qs.length} питань${bad?` · помилок: ${bad}`:""}</span><span class="bar"><i style="width:${Math.round(ok/qs.length*100)}%"></i></span>`;
    el.firstChild.textContent=name;
    el.onclick=()=>start(qs,name);
    box.appendChild(el);
  });
  const mist=Q.filter(q=>stats[q.id]===0);
  $("mistBtn").disabled=!mist.length;
  $("mistBtn").textContent=mist.length?`Повторити помилки (${mist.length})`:"Помилок поки немає";
  $("resetBtn2").disabled=!Object.keys(stats).length;
  $("allBtn").disabled=!Q.length;
}

let run={list:[],i:0,ok:0,wrong:[],title:"",answered:false};
function start(qs,title){
  if(!qs.length)return;
  run={list:shuffle(qs),i:0,ok:0,wrong:[],title,answered:false};
  show("quiz");renderQ();
}
function renderQ(){
  const q=run.list[run.i];run.answered=false;
  $("count").textContent=`${run.i+1} з ${run.list.length}`;
  $("qbar").style.width=(run.i/run.list.length*100)+"%";
  const qn=$("qnum");qn.textContent=(q.num?`№${q.num} · `:"")+BLOCKS[q.b];
  if(q.src==="community"){const t=document.createElement("span");t.className="src";t.textContent="від спільноти";qn.appendChild(t)}
  $("qtext").textContent=q.q;
  $("why").innerHTML="";$("nextBtn").classList.add("hidden");
  const box=$("opts");box.innerHTML="";
  shuffle([q.a,...q.w]).forEach((t,k)=>{
    const b=document.createElement("button");b.className="opt";b.dataset.c=t===q.a?"1":"0";
    b.innerHTML=`<span class="k">${k+1}</span><span></span>`;b.lastChild.textContent=t;
    b.onclick=()=>answer(b);box.appendChild(b);
  });
}
/* посилання в поясненнях: "(//uk.wikipedia.org/wiki/%D0...)" → клікабельне, з читабельним текстом */
const URL_RE=/(?:https?:)?\/\/[^\s()]+(?:\([^\s()]*\)[^\s()]*)*/g;
function linkify(el,text){
  let last=0;
  for(const m of text.matchAll(URL_RE)){
    const url=m[0].replace(/[.,;:]+$/,"");
    el.append(text.slice(last,m.index));
    const a=document.createElement("a");
    a.href=url.startsWith("//")?"https:"+url:url;a.target="_blank";a.rel="noopener";
    let label=url.replace(/^(https?:)?\/\/(www\.)?/,"");try{label=decodeURI(label)}catch(e){}
    a.textContent=label;el.append(a);
    last=m.index+url.length;
  }
  el.append(text.slice(last));
}
function answer(btn){
  if(run.answered)return;run.answered=true;
  const q=run.list[run.i];const right=btn.dataset.c==="1";
  [...$("opts").children].forEach(b=>{b.disabled=true;
    if(b.dataset.c==="1")b.classList.add("ok");else if(b===btn)b.classList.add("bad");else b.classList.add("dim");});
  stats[q.id]=right?1:0;save();
  if(right)run.ok++;else run.wrong.push(q);
  const w=document.createElement("div");w.className="why"+(right?"":" bad");
  const h=document.createElement("b");h.textContent=right?"Правильно.":"Ні. Правильна відповідь: "+q.a;w.appendChild(h);
  if(q.e){const p=document.createElement("p");linkify(p,q.e);w.appendChild(p)}
  if(q.warn){const x=document.createElement("p");x.className="warn";x.textContent="⚠ "+q.warn;w.appendChild(x)}
  $("why").appendChild(w);
  const n=$("nextBtn");n.classList.remove("hidden");n.textContent=run.i+1<run.list.length?"Далі":"Завершити";n.focus({preventScroll:true});
}
function next(){
  run.i++;
  if(run.i<run.list.length){renderQ();return}
  $("qbar").style.width="100%";
  $("doneTitle").textContent=run.title;
  $("doneScore").textContent=`${run.ok} / ${run.list.length}`;
  const pct=run.ok/run.list.length;
  $("doneText").textContent=run.wrong.length?(pct>=.9?`Майже ідеально. Залишилось ${run.wrong.length} - пройди їх ще раз, поки свіжі.`:`Помилок: ${run.wrong.length}. Повтори їх зараз, а завтра пройди тему ще раз повністю.`):"Без жодної помилки. Повернись до цієї теми через день-два, щоб закріпити.";
  $("redoBtn").classList.toggle("hidden",!run.wrong.length);
  show("done");
}
function goHome(){renderHome();show("home")}

/* --- пропозиція питання --- */
let openedAt=0,captchaId=null,captchaLoading=false;
function initCaptcha(){
  if(!CAPTCHA||captchaId!==null)return;
  if(window.turnstile){captchaId=turnstile.render("#captcha",{sitekey:CAPTCHA,language:"uk"});return}
  if(captchaLoading)return;captchaLoading=true;
  window.onTurnstileLoad=initCaptcha;
  const s=document.createElement("script");
  s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
  s.async=true;document.head.appendChild(s);
}
function captchaToken(){return captchaId!==null&&window.turnstile?turnstile.getResponse(captchaId)||"":""}
function resetCaptcha(){if(captchaId!==null&&window.turnstile)turnstile.reset(captchaId)}
function openSuggest(){
  const sel=$("sBlock");
  if(!sel.options.length){
    const o=document.createElement("option");o.value="";o.textContent="Обери тему";sel.appendChild(o);
    BLOCKS.forEach((n,i)=>{const x=document.createElement("option");x.value=i;x.textContent=n;sel.appendChild(x)});
  }
  $("suggestMsg").innerHTML="";
  openedAt=Date.now();
  show("suggest");
  initCaptcha();
}
function setMsg(kind,text){const m=$("suggestMsg");m.innerHTML="";const p=document.createElement("p");p.className="msg "+kind;p.textContent=text;m.appendChild(p);m.scrollIntoView({block:"center",behavior:"smooth"})}
function clearErrors(f){f.querySelectorAll(".err").forEach(e=>e.remove())}
function fieldError(f,name,text){
  const el=name==="wrong"?f.querySelector("fieldset"):f.querySelector(`[name="${name}"]`)?.closest("label");
  if(!el)return;const s=document.createElement("span");s.className="err";s.textContent=text;el.appendChild(s);
}
/* статична версія (GitHub Pages): відкриваємо заповнену форму issue, модератор схвалює міткою approved */
function openIssue(p){
  const v={template:"question.yml",title:"Питання: "+String(p.question).trim().slice(0,80),
    topic:BLOCKS[p.block],num:p.num,question:p.question,correct:p.correct,
    wrong1:p.wrong[0],wrong2:p.wrong[1],wrong3:p.wrong[2],explanation:p.explanation,
    note:[p.author_name&&"Автор: "+p.author_name,p.author_note].filter(Boolean).join("\n")};
  const url=ISSUE_URL+"?"+Object.entries(v).filter(([,x])=>String(x??"").trim()).map(([k,x])=>k+"="+encodeURIComponent(String(x).trim())).join("&");
  if(url.length>8000){setMsg("bad","Текст задовгий для GitHub. Скороти пояснення або коментар.");return}
  window.open(url,"_blank","noopener");
  setMsg("ok","Відкрили GitHub із заповненою формою. Увійди в акаунт і натисни «Create». Після перевірки питання з'явиться в тесті.");
}
async function submitSuggest(ev){
  ev.preventDefault();
  const f=$("suggestForm");clearErrors(f);
  const fd=new FormData(f);
  const payload={
    block:fd.get("block")===""?-1:Number(fd.get("block")),
    num:fd.get("num")||"",
    question:fd.get("question"),correct:fd.get("correct"),
    wrong:fd.getAll("wrong"),explanation:fd.get("explanation"),
    author_name:fd.get("author_name"),author_note:fd.get("author_note"),
    website:fd.get("website"),t:openedAt,captcha:captchaToken()
  };
  const local={};
  if(payload.block<0)local.block="Обери тему";
  if(String(payload.question).trim().length<10)local.question="Питання: щонайменше 10 символів";
  if(!String(payload.correct).trim())local.correct="Вкажи правильну відповідь";
  if(payload.wrong.filter(x=>String(x).trim()).length!==3)local.wrong="Заповни всі три хибні варіанти";
  if(String(payload.explanation).trim().length<10)local.explanation="Пояснення: щонайменше 10 символів";
  if(Object.keys(local).length){Object.entries(local).forEach(([k,v])=>fieldError(f,k,v));setMsg("bad","Перевір поля, позначені нижче.");return}
  if(STATIC){openIssue(payload);return}
  if(CAPTCHA&&!payload.captcha){setMsg("bad","Підтверди, що ти не бот (галочка над кнопкою).");return}
  const btn=$("suggestSubmit");btn.disabled=true;btn.textContent="Надсилаю…";
  try{
    const r=await fetch("api/submit.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>({}));
    if(r.ok&&d.ok){f.reset();openedAt=Date.now();setMsg("ok","Дякуємо! Питання надіслано на перевірку. Після схвалення воно з'явиться в тесті.")}
    else if(d.fields){Object.entries(d.fields).forEach(([k,v])=>fieldError(f,k,v));setMsg("bad","Перевір поля, позначені нижче.")}
    else setMsg("bad",d.message||"Не вдалося надіслати. Спробуй ще раз трохи згодом.");
  }catch(e){setMsg("bad","Немає з'єднання з сервером. Перевір інтернет і спробуй ще раз.")}
  finally{btn.disabled=false;btn.textContent="Надіслати на перевірку";resetCaptcha()}
}

const CAL=[["Перепілка",4,6,"сер–жов","b"],["Качки, кулики, голуби",4,8,"сер–гру","b"],["Гуси",4,9,"сер–січ","b"],["Куріпка сіра, фазан",6,8,"жов–гру","b"],["Козуля, самці",1,8,"тра–гру","z"],["Копитні, самці",4,9,"сер–січ","z"],["Копитні, самиці",5,9,"вер–січ","z"],["Бабак",3,5,"лип–вер","z"],["Лисиця, білка, куниці",6.5,10,"15 жов–лют","z"],["Бобер, ондатра, норка",7,10,"лис–лют","z"],["Заєць-русак",7,9,"лис–січ","z"],["Вовк, ворони, сороки",0,11,"цілий рік","q"],["Місяці тиші",0,3,"кві–лип","q"]];
function calSVG(){
  const X=230,W=35,M=["кві","тра","чер","лип","сер","вер","жов","лис","гру","січ","лют","бер"];
  const col={b:["--bird","--bird-bg"],z:["--beast","--beast-bg"],q:["--quiet","--quiet-bg"]};
  const H=40+CAL.length*28+50;
  let s=`<svg viewBox="0 0 660 ${H}" role="img" aria-label="Календар термінів полювання" font-family="Golos Text, system-ui, sans-serif">`;
  for(let i=0;i<=12;i++){const x=X+i*W;s+=`<line x1="${x}" y1="30" x2="${x}" y2="${40+CAL.length*28}" stroke="var(--line)" stroke-width="${i===9?1.5:0.6}" ${i===9?'stroke-dasharray="4 3"':''}/>`}
  M.forEach((m,i)=>{s+=`<text x="${X+i*W+W/2}" y="22" text-anchor="middle" font-size="13" fill="var(--muted)">${m}</text>`});
  CAL.forEach((r,k)=>{
    const cy=40+k*28+14,[c,bg]=col[r[4]];
    const x=X+r[1]*W+2,w=(r[2]+1-r[1])*W-4;
    s+=`<text x="6" y="${cy}" dominant-baseline="central" font-size="15" fill="var(--ink)">${r[0]}</text>`;
    s+=`<rect x="${x}" y="${cy-10}" width="${w}" height="20" rx="5" fill="var(${bg})" stroke="var(${c})" stroke-width="1" ${r[0]==="Місяці тиші"?'stroke-dasharray="4 3"':''}/>`;
    s+=`<text x="${x+w/2}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="var(--ink)">${r[3]}</text>`;
  });
  const ly=40+CAL.length*28+28;
  [["Птахи","b",6],["Звірі","z",96],["Цілий рік / тиша","q",186]].forEach(([t,k,x])=>{const [c,bg]=col[k];s+=`<rect x="${x}" y="${ly-8}" width="16" height="16" rx="4" fill="var(${bg})" stroke="var(${c})"/><text x="${x+24}" y="${ly}" dominant-baseline="central" font-size="13" fill="var(--muted)">${t}</text>`});
  s+=`<line x1="350" y1="${ly}" x2="372" y2="${ly}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="380" y="${ly}" dominant-baseline="central" font-size="13" fill="var(--muted)">Новий рік</text>`;
  return s+"</svg>";
}
document.querySelectorAll(".calslot").forEach(el=>el.innerHTML=calSVG());
$("calBtn").onclick=()=>{const c=$("calQuiz");const open=c.classList.toggle("hidden")===false;$("calBtn").setAttribute("aria-expanded",open);$("calBtn").textContent=open?"Сховати календар":"Календар"};

document.querySelectorAll(".calslot").forEach(el=>el.innerHTML=calSVG());
$("calBtn").onclick=()=>{const c=$("calQuiz");const open=c.classList.toggle("hidden")===false;$("calBtn").setAttribute("aria-expanded",open);$("calBtn").textContent=open?"Сховати календар":"Календар"};
$("nextBtn").onclick=next;
$("backBtn").onclick=goHome;
$("homeBtn").onclick=goHome;
$("suggestBack").onclick=goHome;
$("suggestBtn").onclick=openSuggest;
$("suggestForm").addEventListener("submit",submitSuggest);
$("suggestForm").addEventListener("input",e=>{const l=e.target.closest("label,fieldset");l&&l.querySelectorAll(".err").forEach(x=>x.remove())});
$("redoBtn").onclick=()=>start(run.wrong,"Повтор помилок");
$("allBtn").onclick=()=>start(Q,"Усі питання");
$("mistBtn").onclick=()=>start(Q.filter(q=>stats[q.id]===0),"Мої помилки");
function resetProgress(){if(confirm("Скинути весь прогрес?")){stats={};save();renderHome()}}
$("resetBtn").onclick=resetProgress;
$("resetBtn2").onclick=resetProgress;
document.addEventListener("keydown",e=>{
  if($("quiz").classList.contains("hidden"))return;
  if(!run.answered&&/^[1-9]$/.test(e.key)){const b=$("opts").children[+e.key-1];if(b)answer(b)}
  else if(run.answered&&e.key==="Enter"){e.preventDefault();next()}
});

$("allBtn").disabled=true;$("mistBtn").disabled=true;$("resetBtn2").disabled=true;
/* на статичному хостингу (GitHub Pages) PHP немає: беремо питання з data/questions.json і ховаємо форму пропозицій */
const getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw 0;return r.json()});
getJSON("api/questions.php").catch(()=>getJSON("data/questions.json").then(d=>{STATIC=true;$("suggestSubmit").textContent="Продовжити на GitHub";
    document.querySelector("#suggest .lede").textContent="Знаєш питання, якого тут немає? Заповни форму: вона відкриється на GitHub як заявка (потрібен безкоштовний акаунт). Після перевірки питання з'явиться в тесті для всіх.";return d})).then(d=>{
  BLOCKS=d.blocks||[];Q=d.questions||[];CAPTCHA=d.captcha||"";renderHome();if(!$("suggest").classList.contains("hidden"))initCaptcha();
}).catch(()=>{
  $("blocks").innerHTML='<p class="msg bad">Не вдалося завантажити питання. Онови сторінку.</p>';
});
})();
