"use strict";
/* ===== Knowledge base (structured data; all verification statuses honest) ===== */
const DISCLAIMER="ميدي سينس نظام تعليمي للتقييم المبدئي للأعراض، وليس أداة تشخيص طبي معتمدة. لا يغني عن تقييم الطبيب. عدم ظهور علامة تحذيرية لا يعني استبعاد وجود حالة خطرة.";
const KB_VERSION="demo-0.1", DISC_VERSION="1";
const CATS={fever:"الحمى والأعراض العامة",cough:"السعال وأعراض الجهاز التنفسي",throat:"التهاب الحلق",headache:"الصداع",nausea:"الغثيان والقيء",abdomen:"ألم البطن",urinary:"أعراض المسالك البولية"};
const SOURCES=[
{id:"S-WHO",org:"World Health Organization (WHO)",title:"لم يُحدَّد بعد — يجب إدخال عنوان الوثيقة الدقيق",url:"",status:"unverified",checked:null,note:"مرجع مطلوب؛ لم يتم التحقق من أنه يدعم أي ادعاء."},
{id:"S-NICE",org:"National Institute for Health and Care Excellence (NICE)",title:"لم يُحدَّد بعد — يجب إدخال عنوان الوثيقة الدقيق",url:"",status:"unverified",checked:null,note:"مرجع مطلوب؛ لم يتم التحقق."},
{id:"S-CDC",org:"Centers for Disease Control and Prevention (CDC)",title:"لم يُحدَّد بعد — يجب إدخال عنوان الوثيقة الدقيق",url:"",status:"unverified",checked:null,note:"مرجع مطلوب؛ لم يتم التحقق."}];
/* Emergency warning signs (safety layer, independent from ordinary rules) */
const EMERG=[
{id:"E-01",q:"e_breath",ar:"صعوبة شديدة في التنفس",src:["S-WHO"]},
{id:"E-02",q:"e_chest",ar:"ألم شديد في الصدر",src:["S-WHO"]},
{id:"E-03",q:"e_neuro",ar:"ضعف مفاجئ في طرف أو صعوبة مفاجئة في الكلام أو الرؤية",src:["S-NICE"]},
{id:"E-04",q:"e_loc",ar:"فقدان الوعي أو ارتباك شديد",src:["S-NICE"]},
{id:"E-05",q:"e_stiff",ar:"تيبّس الرقبة مع الحمى والصداع",src:["S-CDC"],all:["e_stiff","fever"]}];
const QUESTIONS=[
{k:"e_breath",ar:"هل لديك صعوبة شديدة في التنفس الآن؟",en:"Severe breathing difficulty",cats:["*"],emerg:1},
{k:"e_chest",ar:"هل لديك ألم شديد في الصدر الآن؟",en:"Severe chest pain",cats:["*"],emerg:1},
{k:"e_neuro",ar:"هل ظهر فجأة ضعف في أحد الأطراف أو صعوبة في الكلام أو الرؤية؟",en:"Sudden neurological deficit",cats:["*"],emerg:1},
{k:"e_loc",ar:"هل فقدت الوعي أو أصبحت مرتبكًا بشدة؟",en:"Loss of consciousness / confusion",cats:["*"],emerg:1},
{k:"e_stiff",ar:"هل لديك تيبّس في الرقبة؟",en:"Neck stiffness",cats:["headache","fever"]},
{k:"fever",ar:"هل لديك حمى (ارتفاع في درجة الحرارة)؟",en:"Fever",cats:["fever","cough","throat","headache","urinary","abdomen"]},
{k:"cough",ar:"هل لديك سعال؟",en:"Cough",cats:["cough","throat","fever"]},
{k:"runny",ar:"هل لديك سيلان أو انسداد في الأنف؟",en:"Runny nose",cats:["cough","throat","fever"]},
{k:"sore",ar:"هل لديك ألم عند البلع أو التهاب في الحلق؟",en:"Sore throat",cats:["throat","cough","fever"]},
{k:"bilat",ar:"هل الصداع بضغط على الجانبين؟",en:"Bilateral pressing headache",cats:["headache"]},
{k:"unil",ar:"هل الصداع نابض في جانب واحد؟",en:"Unilateral throbbing headache",cats:["headache"]},
{k:"photo",ar:"هل يزداد الصداع مع الضوء؟",en:"Photophobia",cats:["headache"]},
{k:"nausea",ar:"هل لديك غثيان؟",en:"Nausea",cats:["nausea","headache","abdomen"]},
{k:"vomit",ar:"هل لديك قيء؟",en:"Vomiting",cats:["nausea","abdomen"]},
{k:"diarr",ar:"هل لديك إسهال؟",en:"Diarrhoea",cats:["nausea","abdomen"]},
{k:"burn",ar:"هل تشعر بحرقان عند التبول؟",en:"Dysuria",cats:["urinary"]},
{k:"freq",ar:"هل تتبول بتكرار أكثر من المعتاد؟",en:"Urinary frequency",cats:["urinary"]},
{k:"flank",ar:"هل لديك ألم في الخاصرة أو أسفل الظهر؟",en:"Flank pain",cats:["urinary"]}];
const RULES=[
{id:"R-RESP-01",ar:"نمط يتوافق مع عدوى تنفسية علوية",en:"Upper respiratory tract infection pattern",req:["cough","runny"],sup:["fever","sore"],exc:["e_breath"],src:["S-CDC"],cat:"cough",lim:"لا يفرّق بين الأسباب الفيروسية والبكتيرية ولا يستبعد أمراضًا تنفسية أخرى."},
{id:"R-THR-01",ar:"نمط يتوافق مع التهاب الحلق",en:"Sore throat pattern",req:["sore"],sup:["fever"],neg:["cough"],exc:["e_breath"],src:["S-NICE"],cat:"throat",lim:"لا يحدد السبب؛ التقييم السريري مطلوب لتحديده."},
{id:"R-HEAD-01",ar:"نمط صداع يشبه الصداع التوتري",en:"Tension-type headache pattern",req:["bilat"],neg:["nausea","photo"],exc:["e_stiff","e_neuro"],src:["S-NICE"],cat:"headache",lim:"الصداع المفاجئ أو الشديد أو الجديد يحتاج تقييمًا طبيًا."},
{id:"R-HEAD-02",ar:"نمط صداع يشبه الشقيقة",en:"Migraine-like pattern",req:["unil"],anyOf:["nausea","photo"],exc:["e_stiff","e_neuro"],src:["S-NICE"],cat:"headache",lim:"لا يستبعد أسبابًا أخرى للصداع."},
{id:"R-GI-01",ar:"نمط يتوافق مع التهاب معدي معوي",en:"Gastroenteritis pattern",req:["diarr"],anyOf:["nausea","vomit"],exc:["e_loc"],src:["S-WHO"],cat:"nausea",lim:"لا يقيّم الجفاف أو شدة الحالة؛ استشر الطبيب إذا استمرت الأعراض."},
{id:"R-URI-01",ar:"نمط يتوافق مع التهاب المسالك البولية",en:"Urinary tract infection pattern",req:["burn","freq"],sup:["flank","fever"],exc:["e_loc"],src:["S-NICE"],cat:"urinary",lim:"ألم الخاصرة مع الحمى قد يشير إلى مشكلة أشد وتحتاج تقييمًا سريعًا."}];
RULES.forEach(r=>{r.status="unverified";r.version=1;r.active=true;r.review="لم تُراجَع سريريًا";});

/* ===== Inference engine (pure, deterministic; no DOM) ===== */
const Engine={
 emergency(ans){ // independent safety layer; unanswered/unknown never reassure
  const out=[];
  for(const e of EMERG){const keys=e.all||[e.q];
   if(keys.every(k=>ans[k]==="yes"))out.push({id:e.id,ar:e.ar,trigger:keys,src:e.src});}
  return out;},
 evaluate(ans,opts={}){
  const trace=[],fired=[];
  const includeUnv=!!opts.includeUnverified;
  for(const r of RULES){
   const t={rule:r.id,fired:false,notes:[]};
   if(!r.active){t.notes.push("القاعدة غير مفعّلة");trace.push(t);continue}
   if(r.status!=="verified"&&!includeUnv){t.notes.push("تم تجاهل القاعدة لأنها غير موثّقة (unverified)");trace.push(t);continue}
   const st=k=>ans[k]||"unanswered";
   const missing=[...r.req.filter(k=>st(k)!=="yes"&&st(k)!=="no"),...(r.anyOf&&!r.anyOf.some(k=>st(k)==="yes")&&r.anyOf.every(k=>st(k)!=="no")?r.anyOf.filter(k=>st(k)!=="no"):[])];
   const exHit=(r.exc||[]).filter(k=>st(k)==="yes");
   const reqOk=r.req.every(k=>st(k)==="yes"), anyOk=!r.anyOf||r.anyOf.some(k=>st(k)==="yes");
   const negBad=(r.neg||[]).filter(k=>st(k)==="yes");
   if(exHit.length){t.notes.push("استبعاد: "+exHit.join("، "))}
   else if(negBad.length){t.notes.push("تعارض مع نتيجة سلبية مطلوبة: "+negBad.join("، "))}
   else if(reqOk&&anyOk){t.fired=true;fired.push({rule:r,support:[...r.req,...(r.anyOf||[]).filter(k=>st(k)==="yes"),...(r.sup||[]).filter(k=>st(k)==="yes")].filter((x,i,a)=>a.indexOf(x)===i),missing:(r.sup||[]).filter(k=>st(k)!=="yes"&&st(k)!=="no")});t.notes.push("تحققت الشروط المطلوبة")}
   else t.notes.push("شروط ناقصة: "+(missing.join("، ")||"نتائج سلبية"));
   trace.push(t)}
  return{fired,trace,insufficient:fired.length===0};}
};
const qText=k=>(QUESTIONS.find(q=>q.k===k)||{ar:k}).ar;

/* ===== Storage (local demo mode — NOT remote persistence) ===== */
const Store={
 get(){try{return JSON.parse(localStorage.getItem("ms_hist")||"[]")}catch(e){return[]}},
 set(v){try{localStorage.setItem("ms_hist",JSON.stringify(v));return true}catch(e){return false}}
};
let S={step:0,cat:null,ans:{},meta:{},showUnv:false,lastId:null,saved:null};

/* ===== UI ===== */
const PAGES={home:"الرئيسية",assess:"تقييم الأعراض",kb:"قاعدة المعرفة",rules:"مستكشف القواعد",sources:"المصادر",history:"سجل التقييمات",method:"المنهجية",about:"حول المشروع",settings:"الإعدادات"};
const $=s=>document.querySelector(s);
const disc=()=>`<div class="disc" role="note">${DISCLAIMER}</div>`;
function route(){const p=(location.hash.slice(1)||"home");const pg=PAGES[p]?p:(p==="results"?"results":"home");
 $("#nav").innerHTML=Object.entries(PAGES).map(([k,v])=>`<a href="#${k}" class="${k===pg?"on":""}">${v}</a>`).join("");
 $("#app").innerHTML=disc()+(VIEWS[pg]||VIEWS.home)();document.title=(PAGES[pg]||"نتائج التقييم")+" — MediSense AI";window.scrollTo(0,0);bind(pg)}
const srcLinks=ids=>ids.map(i=>{const s=SOURCES.find(x=>x.id===i);return `<span class="tag w">${i}: ${s.status==="verified"?"موثّق":"غير موثّق"}</span>`}).join("");
const VIEWS={
home(){const h=Store.get().slice(0,3);return `<h1>MediSense AI — النظام الخبير للتقييم الطبي المبدئي</h1>
<p>نظام خبير تعليمي يعتمد على قواعد IF–THEN صريحة ومحرك استدلال حتمي، مع طبقة أمان مستقلة للتحذيرات الطارئة.</p>
<div class="alert" style="font-weight:400">وضع تجريبي محلي: لا يوجد اتصال بقاعدة بيانات بعيدة؛ التقييمات تُحفظ في متصفحك فقط. جميع القواعد والمصادر حاليًا <b>غير موثّقة</b> وتحتاج مراجعة سريرية قبل أي استخدام حقيقي.</div>
<div class="grid"><div class="card"><h3>${RULES.length}</h3>قواعد (جميعها غير موثّقة)</div><div class="card"><h3>${Object.keys(CATS).length}</h3>فئات أعراض مدعومة</div><div class="card"><h3>${QUESTIONS.length}</h3>أسئلة منظّمة</div><div class="card"><h3>${SOURCES.filter(s=>s.status==="verified").length}/${SOURCES.length}</h3>مصادر موثّقة</div></div>
<p><a class="btn" href="#assess">ابدأ التقييم</a> <a class="btn sec" href="#kb">قاعدة المعرفة</a> <a class="btn sec" href="#method">المنهجية</a></p>
<div class="card"><h2>مسار العمل</h2><ol><li>اختيار العرض الأساسي</li><li>فحص العلامات التحذيرية (يعمل مع كل إجابة)</li><li>أسئلة خاصة بالعرض</li><li>مراجعة الإجابات</li><li>نتائج مفسَّرة مع أثر الاستدلال</li></ol></div>
<div class="card"><h2>آخر التقييمات</h2>${h.length?h.map(a=>`<div>${new Date(a.at).toLocaleString("ar-EG")} — ${CATS[a.cat]}</div>`).join(""):"لا توجد تقييمات محفوظة بعد."}</div>`},
assess(){
 if(S.step===0)return `<h1>تقييم الأعراض</h1><div class="card"><h2>ما العرض الأساسي الذي تريد تقييمه؟</h2><p>هذه الفئات لا تعني تغطية شاملة لكل الأمراض.</p><div class="grid">${Object.entries(CATS).map(([k,v])=>`<button class="btn sec" data-cat="${k}">${v}</button>`).join("")}</div><p><button class="btn sec" id="demo">تحميل حالة تجريبية (مُحاكاة)</button></p></div>`;
 const emerg=Engine.emergency(S.ans);
 const qs=QUESTIONS.filter(q=>q.cats.includes("*")||q.cats.includes(S.cat));
 const alerts=emerg.length?`<div class="alert" role="alert">⚠️ تحذير: أبلغت عن «${emerg.map(e=>e.ar).join("، ")}». قد يستدعي ذلك رعاية طبية عاجلة. تواصل مع خدمات الطوارئ المحلية أو توجّه لأقرب طوارئ الآن، ولا تنتظر إكمال الأسئلة. <div class="tag w">القاعدة: ${emerg.map(e=>e.id).join("، ")} — المصدر غير موثّق</div></div>`:"";
 const Q=q=>`<div class="q"><fieldset><legend>${q.ar} <small class="ltr">(${q.en})</small></legend><div class="opts">${[["yes","نعم"],["no","لا"],["unknown","لا أعرف"]].map(([v,l])=>`<label><input type="radio" name="${q.k}" value="${v}" ${S.ans[q.k]===v?"checked":""}> <span>${l}</span></label>`).join("")}</div><small>${S.ans[q.k]?"":"لم تتم الإجابة"}</small></fieldset></div>`;
 const pct=[0,33,66,100][S.step];
 let body="";
 if(S.step===1)body=`<h2>الخطوة 1: العلامات التحذيرية</h2>`+qs.filter(q=>q.emerg).map(Q).join("");
 if(S.step===2){body=`<h2>الخطوة 2: أسئلة «${CATS[S.cat]}»</h2><div class="q"><label>متى بدأ العرض؟ <select data-m="onset"><option value="">لم تتم الإجابة</option>${["اليوم","منذ أيام","منذ أسابيع"].map(o=>`<option ${S.meta.onset===o?"selected":""}>${o}</option>`).join("")}</select></label></div><div class="q"><label>الفئة العمرية: <select data-m="age"><option value="">لم تتم الإجابة</option>${["أقل من 18","18–64","65 فأكثر"].map(o=>`<option ${S.meta.age===o?"selected":""}>${o}</option>`).join("")}</select></label></div>`+qs.filter(q=>!q.emerg).map(Q).join("")}
 if(S.step===3)body=`<h2>الخطوة 3: مراجعة الإجابات</h2><div class="tw"><table><tr><th>السؤال</th><th>الإجابة</th></tr>${qs.map(q=>`<tr><td>${q.ar}</td><td>${{yes:"نعم",no:"لا",unknown:"لا أعرف"}[S.ans[q.k]]||"لم تتم الإجابة"}</td></tr>`).join("")}</table></div><p>لا تُعتبر الأسئلة غير المُجاب عنها إجابات سلبية.</p>`;
 return `<h1>تقييم الأعراض</h1>${alerts}<div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div><div class="card">${body}<div class="row" style="margin-top:1rem"><button class="btn sec" id="back">السابق</button>${S.step<3?`<button class="btn" id="next">التالي</button>`:`<button class="btn" id="submit">عرض النتائج</button>`}</div></div>`},
results(){
 const a=Store.get().find(x=>x.id===S.lastId);if(!a)return `<div class="card">لا توجد نتيجة. <a href="#assess">ابدأ تقييمًا</a></div>`;
 const em=Engine.emergency(a.ans),ev=Engine.evaluate(a.ans,{includeUnverified:S.showUnv});
 return `<h1>نتائج التقييم</h1>
<div class="card"><h2>أ. تحذيرات السلامة</h2>${em.length?em.map(e=>`<div class="alert" role="alert">${e.ar} — تواصل مع الطوارئ المحلية. المُحفِّز: ${e.trigger.map(qText).join(" + ")} <div class="tag w">${e.id} · ${srcLinks(e.src)}</div></div>`).join(""):"لم تُبلغ عن علامة تحذيرية ضمن القائمة المحدودة في هذا النظام. هذا لا يستبعد وجود حالة خطرة."}</div>
<label class="row"><input type="checkbox" id="unv" ${S.showUnv?"checked":""}> تفعيل القواعد غير الموثّقة (لأغراض العرض التعليمي فقط)</label>
<div class="card"><h2>ب. احتمالات تعليمية</h2>${em.length?`<p>تم تقديم تحذير السلامة على أي نتيجة عادية؛ لا تعتمد على النتائج التالية قبل معالجة التحذير.</p>`:""}${ev.fired.length?ev.fired.map(f=>`<div class="card"><h3>قد يتوافق هذا النمط من الأعراض مع: ${f.rule.ar} <small class="ltr">(${f.rule.en})</small></h3><span class="tag w">قاعدة غير موثّقة — عرض تجريبي</span><p><b>النتائج الداعمة:</b> ${f.support.map(qText).join("؛ ")}</p>${f.missing.length?`<p><b>معلومات ناقصة:</b> ${f.missing.map(qText).join("؛ ")}</p>`:""}<p><b>القاعدة:</b> <bdi class="ltr">${f.rule.id}</bdi> v${f.rule.version} ${srcLinks(f.rule.src)}</p><p><b>حدود:</b> ${f.rule.lim}</p></div>`).join(""):`<p>معلومات غير كافية لإنتاج احتمالات تعليمية${S.showUnv?"":" (القواعد غير الموثّقة معطّلة)"}. غياب النتائج لا يعني أنك بصحة جيدة.</p>`}</div>
<div class="card"><h2>ج. الخطوات التالية</h2><ul><li>راجع طبيبًا أو مقدّم رعاية صحية للتقييم، خاصة عند استمرار الأعراض أو تفاقمها.</li><li>إذا ظهرت علامة تحذيرية جديدة، تواصل مع خدمات الطوارئ المحلية.</li></ul><small>لا يقدّم النظام أدوية أو جرعات أو خطط علاج.</small></div>
<div class="card"><h2>د. حدود التقييم</h2><p>${DISCLAIMER}</p><p>لا تُعرض احتمالات أو نسب ثقة لأنه لا يوجد أساس مُثبت لحسابها.</p></div>
<details class="card"><summary>أثر الاستدلال (Inference trace)</summary><div class="tw"><table><tr><th>القاعدة</th><th>تحققت؟</th><th>ملاحظات</th></tr>${ev.trace.map(t=>`<tr><td><bdi class="ltr">${t.rule}</bdi></td><td>${t.fired?"نعم":"لا"}</td><td>${t.notes.join("؛ ")}</td></tr>`).join("")}</table></div></details>
<a class="btn sec" href="#history">سجل التقييمات</a>`},
kb(){return `<h1>قاعدة المعرفة الطبية</h1><div class="grid">${Object.entries(CATS).map(([k,v])=>`<div class="card"><h3>${v}</h3>${RULES.filter(r=>r.cat===k).map(r=>`<div>• ${r.ar} <span class="tag w">غير موثّقة</span></div>`).join("")||"<small>لا توجد قواعد بعد (أسئلة فقط).</small>"}</div>`).join("")}</div>`},
rules(){return `<h1>مستكشف القواعد</h1>${RULES.map(r=>`<details class="card"><summary><b>${r.ar}</b> <bdi class="ltr">${r.id}</bdi> <span class="tag w">${r.status}</span></summary><p><b>IF</b> ${r.req.map(qText).join(" <b>AND</b> ")}${r.anyOf?` <b>AND ANY OF</b> (${r.anyOf.map(qText).join(" / ")})`:""}${r.neg?` <b>AND NOT</b> (${r.neg.map(qText).join(" / ")})`:""}<br><b>UNLESS</b> ${(r.exc||[]).map(qText).join(" / ")}<br><b>THEN</b> ${r.ar} (تفسير تعليمي)</p><p>داعم: ${(r.sup||[]).map(qText).join("؛ ")||"—"}<br>المصادر: ${srcLinks(r.src)}<br>الإصدار: ${r.version} · المراجعة: ${r.review}<br>حدود: ${r.lim}</p></details>`).join("")}<h2>قواعد الطوارئ</h2>${EMERG.map(e=>`<div class="card"><bdi class="ltr">${e.id}</bdi> — ${e.ar} ${srcLinks(e.src)}</div>`).join("")}`},
sources(){return `<h1>المصادر الطبية</h1><div class="alert" style="font-weight:400">لم يتم التحقق من أي مصدر. لم تُدخل روابط أو عناوين وثائق لتجنّب اختلاق مراجع؛ يجب على المراجع إضافتها والتحقق من دعمها لكل ادعاء.</div><div class="tw"><table><tr><th>المعرّف</th><th>الجهة</th><th>الوثيقة</th><th>الحالة</th><th>القواعد المرتبطة</th></tr>${SOURCES.map(s=>`<tr><td><bdi class="ltr">${s.id}</bdi></td><td><bdi class="ltr">${s.org}</bdi></td><td>${s.title}</td><td>${s.status}</td><td>${[...RULES,...EMERG].filter(r=>r.src.includes(s.id)).map(r=>r.id).join("، ")}</td></tr>`).join("")}</table></div>`},
history(){const h=Store.get();return `<h1>سجل التقييمات</h1>${h.length?h.map(a=>`<div class="card row"><span style="margin-inline-end:auto">${new Date(a.at).toLocaleString("ar-EG")} — ${CATS[a.cat]}</span><button class="btn sec" data-view="${a.id}">عرض</button><button class="btn dg" data-del="${a.id}">حذف</button></div>`).join(""):`<div class="card">لا توجد تقييمات.</div>`}<small>محفوظة محليًا في هذا المتصفح فقط.</small>`},
method(){return `<h1>منهجية النظام</h1><div class="card"><h3>تمثيل المعرفة</h3>أسئلة وقواعد ومصادر كبيانات منظّمة منفصلة عن الواجهة.</div><div class="card"><h3>محرك الاستدلال</h3>حتمي: تُطلق القاعدة فقط إذا تحققت كل الشروط المطلوبة بإجابة «نعم»، ولم يتحقق استبعاد. «لا أعرف» و«لم تتم الإجابة» لا تُعامَل كنفي. تُتجاهل القواعد غير الموثّقة أو غير المفعّلة افتراضيًا، ويُحفظ أثر استدلال لكل قاعدة.</div><div class="card"><h3>طبقة الطوارئ</h3>مستقلة عن القواعد العادية، تعمل مع كل إجابة، وتتقدّم على أي نتيجة. لا تعطي طمأنة عند غياب المعلومات.</div><div class="card"><h3>حدود وتمييز مهم</h3>التحقق البرمجي (أن الشيفرة تعمل كما صُمّمت) يختلف عن التحقق السريري (أن القواعد صحيحة طبيًا). لم يُجرَ أي تحقق سريري. لا تُعرض احتمالات أو نسب ثقة.</div>`},
about(){return `<h1>حول المشروع</h1><div class="card"><p>مشروع جامعي لعرض بنية النظم الخبيرة: قواعد قابلة للفحص، تفسير الاستدلال، وطبقة سلامة.</p><h3>ما هو منفَّذ في هذه النسخة (HTML/CSS/JS فقط)</h3><ul><li>الواجهة العربية RTL، المقابلة التكيفية، محرك القواعد، طبقة الطوارئ، سجل محلي.</li></ul><h3>غير منفَّذ لأنه يتطلب خادمًا</h3><ul><li>Supabase (الحسابات، قاعدة البيانات، RLS) وواجهة الإدارة والمراجعة. لا يمكن فرض الصلاحيات من متصفح فقط، لذلك لم تُزيَّف.</li></ul><h3>الخصوصية</h3><p>لا تُرسل أي بيانات إلى أي خدمة خارجية. التخزين محلي في المتصفح ويمكن حذفه.</p></div>`},
settings(){return `<h1>إعدادات الحساب</h1><div class="card"><p>لا توجد حسابات في هذه النسخة (وضع محلي تجريبي).</p><button class="btn dg" id="wipe">حذف كل البيانات المحلية</button></div>`}
};
const DEMO={fever:"yes",cough:"yes",runny:"yes",sore:"yes",e_breath:"no",e_chest:"no",e_neuro:"no",e_loc:"no"};
function bind(pg){
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{S={...S,step:1,cat:b.dataset.cat,ans:{},meta:{}};route()});
 const d=$("#demo");if(d)d.onclick=()=>{S={...S,step:3,cat:"cough",ans:{...DEMO},meta:{onset:"منذ أيام",age:"18–64"}};route()};
 document.querySelectorAll(".opts input").forEach(i=>i.onchange=()=>{S.ans[i.name]=i.value;const y=Engine.emergency(S.ans).length;route();const f=document.querySelector(`input[name="${i.name}"][value="${i.value}"]`);if(f)f.focus()});
 document.querySelectorAll("[data-m]").forEach(s=>s.onchange=()=>{S.meta[s.dataset.m]=s.value});
 const n=$("#next");if(n)n.onclick=()=>{S.step++;route()};const b=$("#back");if(b)b.onclick=()=>{S.step--;route()};
 const sb=$("#submit");if(sb)sb.onclick=()=>{const id="a"+Date.now();const h=Store.get();h.unshift({id,at:Date.now(),cat:S.cat,ans:{...S.ans},meta:{...S.meta},kb:KB_VERSION,disc:DISC_VERSION});if(!Store.set(h)){alert("تعذّر حفظ التقييم محليًا (التخزين غير متاح). ستُعرض النتيجة دون حفظ.");}S.lastId=id;if(!Store.get().find(x=>x.id===id)){Store._tmp=[{id,at:Date.now(),cat:S.cat,ans:{...S.ans}}]}location.hash="results"};
 const u=$("#unv");if(u)u.onchange=()=>{S.showUnv=u.checked;route()};
 document.querySelectorAll("[data-view]").forEach(x=>x.onclick=()=>{S.lastId=x.dataset.view;location.hash="results"});
 document.querySelectorAll("[data-del]").forEach(x=>x.onclick=()=>{if(confirm("حذف هذا التقييم نهائيًا؟")){Store.set(Store.get().filter(a=>a.id!==x.dataset.del));route()}});
 const w=$("#wipe");if(w)w.onclick=()=>{if(confirm("سيتم حذف كل التقييمات المحلية. متابعة؟")){Store.set([]);route()}};
}
addEventListener("hashchange",route);route();