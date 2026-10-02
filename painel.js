
/* ============ Dados ============
   mode:   "online" | "offline"
   status: "pendente" | "producao" | "concluida" | "impressao" (só offline)
   date:   "AAAA-MM-DD" ou "" (a definir)                                  */
const GROUPS = {
  A: "Criação e marca",
  B: "Peças comerciais e comunicação",
  C: "Ponto de venda e obra",
  D: "Audiovisual e uniformes"
};
const P = (id, group, title, mode, date="", status="pendente", notes="") => ({ id, group, title, mode, date, status, link:"", notes });
const SEED = {
  pieces: [
    P("a1","A","Marca, conceito e identidade visual","online","2026-10-13","producao","Primeira entrega do projeto."),
    P("a4","A","Guide visual (personas e tom de voz)","online","2026-10-13","producao","Entregue junto com a marca."),
    P("a2","A","Book digital","online","2026-10-20","pendente","Produção inicia após aprovação da marca."),
    P("a2b","A","Book físico","offline"),
    P("a3","A","Templates PNG para apresentação do produto","online"),
    P("b1","B","Folder","offline"),
    P("b2","B","Folheto","offline"),
    P("b3","B","Ficha técnica dos lotes","offline"),
    P("b4","B","Card WhatsApp","online"),
    P("b5","B","E-mail marketing comercial","online"),
    P("c1","C","Banner","offline"),
    P("c2","C","Placa de terreno","offline"),
    P("c3","C","Tapume","offline"),
    P("c4","C","Sinalização de obra (arte)","offline"),
    P("c5","C","Sinalização caminho da venda","offline"),
    P("c6","C","Bandeira / Wind Banner","offline"),
    P("d1","D","Vídeo de produto","online","","pendente","Roteiro e apoio na edição, sem captação."),
    P("d2","D","Camisa (arte para confecção)","offline"),
    P("d3","D","Landing Page","online")
  ],
  links: [],
  updatedAt: null
};

const STATUS = {
  pendente:  { label: "Pendente informação", short: "Pendente" },
  producao:  { label: "Em produção",         short: "Em produção" },
  concluida: { label: "Concluída",           short: "Concluída" },
  impressao: { label: "Pronto para impressão", short: "Pronto p/ impressão" }
};
const MODES = { online: "Online", offline: "Offline" };
const KEY = "qdm-lancamento-v2";
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MON_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const DOW = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const ICON_ON  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`;
const ICON_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>`;

let data = load();
let fStatus = "all", fMode = "all", groupBy = "entrega";
let tab = "calendario";
let selDay = null;
const today = new Date(); today.setHours(0,0,0,0);
let view = new Date(today.getFullYear(), today.getMonth(), 1);

/* ============ ARMAZENAMENTO ============
   Hoje salva no navegador (localStorage).
   Para compartilhar entre equipe e cliente, troque SÓ estas duas funções
   por leitura/gravação no banco (todo o estado cabe em um único JSON). */
function load(){
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch(e){}
  return structuredClone(SEED);
}
function save(msg){
  data.updatedAt = new Date().toISOString();
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){}
  render(); if(msg) toast(msg);
}
function parseDate(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function sameMonth(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth(); }
function esc(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function safeUrl(u){ u=(u||"").trim(); if(!u) return ""; if(!/^https?:\/\//i.test(u)) u="https://"+u; return u; }
function uid(){ return Math.random().toString(36).slice(2,9); }
function fmtLong(s){ const t = parseDate(s).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); return t[0].toUpperCase()+t.slice(1); }
const order = Object.keys(GROUPS);
const byDate = (a,b)=> (a.date||"9999").localeCompare(b.date||"9999") || order.indexOf(a.group)-order.indexOf(b.group);
const editing = ()=> document.body.classList.contains("editing");
const statusesFor = mode => mode==="offline" ? ["pendente","producao","concluida","impressao"] : ["pendente","producao","concluida"];
const isDone = p => p.status==="concluida" || p.status==="impressao";

/* ============ Render ============ */
function render(){
  renderStats(); renderLegend(); renderCalendar(); renderCards(); renderLinks();
  const u = data.updatedAt ? new Date(data.updatedAt) : null;
  document.getElementById("updated").textContent = u ? "Atualizado em " + u.toLocaleDateString("pt-BR") + " às " + u.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "";
}

function renderStats(){
  const c = { all: data.pieces.length, pendente:0, producao:0, concluida:0, impressao:0 };
  data.pieces.forEach(p=>c[p.status]++);
  const done = c.concluida + c.impressao;
  const pct = c.all ? Math.round(done/c.all*100) : 0;
  const keys = ["all","pendente","producao","concluida","impressao"];
  document.getElementById("stats").innerHTML = keys.map(k=>`
    <button class="stat ${fStatus===k && tab==='cards'?'active':''}" data-stat="${k}">
      <div class="n">${c[k]}</div>
      <div class="l"><i class="dot ${k}"></i>${k==="all" ? `Peças no total · ${pct}% entregue` : STATUS[k].label}</div>
      ${k==="all" ? `<div class="progress"><i style="width:${pct}%"></i></div>` : ""}
    </button>`).join("");
}
function renderLegend(){
  document.getElementById("legend").innerHTML = Object.entries(STATUS).map(([k,s])=>`<span><i class="dot ${k}"></i>${s.label}</span>`).join("");
}

function evHTML(p){
  return `<button class="ev ${p.status}" data-open="${p.id}" draggable="${editing()}" data-drag="${p.id}" title="${esc(p.title)} · ${MODES[p.mode]} · ${STATUS[p.status].label}"><span class="mode">${p.mode==="online"?"ON":"OFF"}</span><span>${esc(p.title)}</span></button>`;
}

function renderCalendar(){
  document.getElementById("monthLabel").textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
  const start = new Date(view); start.setDate(1 - view.getDay());
  const byDay = {};
  data.pieces.filter(p=>p.date).forEach(p=>(byDay[p.date] ||= []).push(p));
  let html = DOW.map(d=>`<div class="dow">${d}</div>`).join("");
  for(let i=0;i<42;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    if(i===35 && d.getMonth()!==view.getMonth()) break;
    const key = iso(d), evs = (byDay[key]||[]).sort(byDate);
    const cls = ["day", d.getMonth()!==view.getMonth()?"out":"", +d===+today?"today":"", selDay===key?"sel":""].join(" ");
    html += `<div class="${cls}" data-day="${key}" data-drop="${key}"><span class="num">${d.getDate()}</span><div class="evs">`;
    evs.slice(0,4).forEach(p=> html += evHTML(p));
    if(evs.length>4) html += `<button class="more" data-day-more="${key}">+${evs.length-4} mais</button>`;
    html += `</div></div>`;
  }
  document.getElementById("calGrid").innerHTML = html;

  const und = data.pieces.filter(p=>!p.date).sort((a,b)=>order.indexOf(a.group)-order.indexOf(b.group));
  document.getElementById("undated").innerHTML = `
    <div class="undated-h"><b>Data a definir · ${und.length}</b>
      <span class="hint">${editing() ? "Arraste uma peça para um dia do calendário para agendar — ou de volta para cá para tirar a data." : "Peças que ainda serão agendadas."}</span></div>
    <div class="evs">${und.length ? und.map(evHTML).join("") : `<span class="hint">Todas as peças já têm data.</span>`}</div>`;
  renderDayList();
}

function renderDayList(){
  const el = document.getElementById("dayList");
  const list = selDay ? data.pieces.filter(p=>p.date===selDay) : data.pieces.filter(p=>p.date && sameMonth(parseDate(p.date),view));
  const title = selDay ? fmtLong(selDay) : "Peças de " + MONTHS[view.getMonth()];
  const und = data.pieces.filter(p=>!p.date);
  el.innerHTML = `<div class="group-title">${esc(title)}</div>` + (list.length ? `<div class="grid">${list.sort(byDate).map(cardHTML).join("")}</div>` : `<div class="empty">Nenhuma peça nesta data.</div>`)
    + (selDay ? "" : `<div class="group-title">Data a definir · ${und.length}</div><div class="grid">${und.map(cardHTML).join("")}</div>`);
}

function cardHTML(p){
  const d = p.date ? parseDate(p.date) : null;
  return `<article class="card ${p.status}" data-open="${p.id}" tabindex="0">
    <div class="card-top">
      <div>
        <span class="pill ${p.status}"><i class="dot ${p.status}"></i>${STATUS[p.status].label}</span>
        <h3>${esc(p.title)}</h3>
      </div>
      ${d ? `<div class="date-box"><b>${d.getDate()}</b><span>${MON_SHORT[d.getMonth()]}</span></div>` : `<div class="date-box tbd">A<br>definir</div>`}
    </div>
    <div class="meta">
      <span class="mode-tag">${p.mode==="online"?ICON_ON:ICON_OFF}${MODES[p.mode]}</span>
      <span class="type">${p.group} · ${GROUPS[p.group]}</span>
    </div>
    ${p.notes?`<p class="note">${esc(p.notes)}</p>`:""}
    ${isDone(p) && p.link ? `<a class="link" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener" data-stop>${p.status==="impressao"?"Arquivo para impressão ↗":"Ver peça ↗"}</a>` : ""}
  </article>`;
}

function renderCards(){
  const sc = [["all","Todos"],...Object.entries(STATUS).map(([k,s])=>[k,s.label])];
  document.getElementById("statusChips").innerHTML = `<span class="lbl">Status</span>` + sc.map(([k,l])=>`<button class="chip ${fStatus===k?'on':''}" data-fstatus="${k}">${k!=='all'?`<i class="dot ${k}"></i>`:''}${l}</button>`).join("");
  const mc = [["all","Todas"],["online","Online"],["offline","Offline"]];
  document.getElementById("modeChips").innerHTML = `<span class="lbl">Tipo</span>` + mc.map(([k,l])=>`<button class="chip ${fMode===k?'on':''}" data-fmode="${k}">${l}</button>`).join("");
  document.querySelectorAll("#groupSeg button").forEach(b=>b.classList.toggle("on", b.dataset.group===groupBy));

  const list = data.pieces.filter(p=>(fStatus==="all"||p.status===fStatus) && (fMode==="all"||p.mode===fMode)).sort(byDate);
  const wrap = document.getElementById("cardsWrap");
  if(!list.length){ wrap.innerHTML = `<div class="empty">Nenhuma peça com esses filtros.</div>`; return; }
  let groups = [];
  if(groupBy==="entrega"){
    groups = order.map(g=>({ title:`<span class="letter">${g}</span>${GROUPS[g]}`, items:list.filter(p=>p.group===g) })).filter(g=>g.items.length);
    groups.forEach(g=>{ const n=g.items.length, done=g.items.filter(isDone).length; g.title += ` <small>${done}/${n} entregues</small>`; });
  } else {
    const m = {};
    list.forEach(p=>{ const k = p.date ? p.date.slice(0,7) : "zzzz"; (m[k] ||= []).push(p); });
    groups = Object.keys(m).sort().map(k=>({ title: k==="zzzz" ? "Data a definir" : (()=>{ const d=parseDate(k+"-01"); const s=MONTHS[d.getMonth()]; return s[0].toUpperCase()+s.slice(1)+" "+d.getFullYear(); })(), items:m[k] }));
  }
  wrap.innerHTML = groups.map(g=>`<div class="group-title">${g.title}</div><div class="grid">${g.items.map(cardHTML).join("")}</div>`).join("");
}

const LINK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
function renderLinks(){
  const wrap = document.getElementById("linksWrap");
  if(!data.links.length){ wrap.innerHTML = `<div class="empty">Ainda não há links. Eles aparecem aqui conforme recebemos as informações.</div>`; return; }
  const cats = {};
  data.links.forEach(l=>(cats[l.category||"Geral"] ||= []).push(l));
  wrap.innerHTML = Object.entries(cats).map(([c,ls])=>`
    <div class="links-cat"><div class="group-title">${esc(c)}</div>
    ${ls.map(l=>`<a class="link-row" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">
      <span class="link-ic">${LINK_ICON}</span>
      <span class="link-main"><b>${esc(l.title)}</b><small>${esc(l.url)}</small></span>
      <button class="btn icon-btn ghost edit-only" data-edit-link="${l.id}" aria-label="Editar">✎</button>
      <span style="color:var(--muted)">↗</span>
    </a>`).join("")}</div>`).join("");
}

/* ============ Modais ============ */
const overlay = document.getElementById("overlay"), modal = document.getElementById("modal");
function openModal(html){ modal.innerHTML = html; overlay.classList.add("open"); overlay.setAttribute("aria-hidden","false"); }
function closeModal(){ overlay.classList.remove("open"); overlay.setAttribute("aria-hidden","true"); }
overlay.addEventListener("click", e=>{ if(e.target===overlay || e.target.closest("[data-close]")) closeModal(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });

function showPiece(id){
  const p = data.pieces.find(x=>x.id===id); if(!p) return;
  openModal(`
    <div class="modal-h"><div><span class="pill ${p.status}"><i class="dot ${p.status}"></i>${STATUS[p.status].label}</span><h3>${esc(p.title)}</h3></div>
    <button class="btn icon-btn ghost" data-close aria-label="Fechar">✕</button></div>
    <div class="modal-b">
      <dl class="kv">
        <dt>Data</dt><dd>${p.date ? fmtLong(p.date) : "A definir"}</dd>
        <dt>Tipo</dt><dd>${MODES[p.mode]}</dd>
        <dt>Entrega</dt><dd>${p.group} · ${GROUPS[p.group]}</dd>
        ${p.notes?`<dt>Observações</dt><dd style="font-weight:500">${esc(p.notes)}</dd>`:""}
      </dl>
      ${isDone(p) && p.link ? `<a class="cta-link ${p.status}" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">${p.status==="impressao"?"Acessar arquivo para impressão ↗":"Acessar peça concluída ↗"}</a>` : ""}
      ${isDone(p) && !p.link ? `<p class="hint">Link da peça ainda não adicionado.</p>` : ""}
    </div>
    ${editing()?`<div class="modal-f"><button class="btn primary" data-edit-piece="${p.id}">Editar peça</button></div>`:""}`);
}

function editPiece(id, presetDate){
  const p = id ? data.pieces.find(x=>x.id===id) : { id:"", title:"", group:"A", mode:"online", date: presetDate ?? "", status:"pendente", link:"", notes:"" };
  openModal(`
    <div class="modal-h"><h3>${id?"Editar peça":"Nova peça"}</h3><button class="btn icon-btn ghost" data-close aria-label="Fechar">✕</button></div>
    <form class="modal-b" id="pieceForm">
      <label class="f">Nome da peça<input name="title" required value="${esc(p.title)}" placeholder="Ex.: Folder"></label>
      <div class="f">Tipo
        <div class="pick c2">
          <label><input type="radio" name="mode" value="online" ${p.mode==="online"?"checked":""}>${ICON_ON.replace('<svg','<svg width="14" height="14"')} Online</label>
          <label><input type="radio" name="mode" value="offline" ${p.mode==="offline"?"checked":""}>${ICON_OFF.replace('<svg','<svg width="14" height="14"')} Offline</label>
        </div>
      </div>
      <div class="row2">
        <div class="f">Data de entrega
          <input type="date" name="date" value="${esc(p.date)}" ${p.date?"":"disabled"}>
          <label class="inline-check"><input type="checkbox" id="tbd" ${p.date?"":"checked"}> Data a definir</label>
        </div>
        <label class="f">Entrega<select name="group">${order.map(g=>`<option value="${g}" ${p.group===g?"selected":""}>${g} · ${GROUPS[g]}</option>`).join("")}</select></label>
      </div>
      <div class="f">Status<div class="pick c2" id="statusPick"></div></div>
      <label class="f" id="linkField">Link da peça<input name="link" value="${esc(p.link)}" placeholder="https://…"><span class="hint">Aparece para o cliente quando a peça estiver “Concluída” ou “Pronto para impressão”.</span></label>
      <label class="f">Observações<textarea name="notes" rows="3" placeholder="O que está pendente, dependências, detalhes…">${esc(p.notes)}</textarea></label>
      <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:4px">
        ${id?`<button type="button" class="btn danger" data-del-piece="${id}">Excluir</button>`:"<span></span>"}
        <span style="display:flex;gap:8px"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">Salvar</button></span>
      </div>
    </form>`);
  const form = document.getElementById("pieceForm");
  const drawStatus = (cur)=>{
    const mode = form.elements.mode.value;
    const allowed = statusesFor(mode);
    if(!allowed.includes(cur)) cur = "concluida";
    document.getElementById("statusPick").innerHTML = allowed.map(k=>`<label><input type="radio" name="status" value="${k}" ${cur===k?"checked":""}><i class="dot ${k}"></i>${STATUS[k].label}</label>`).join("");
  };
  drawStatus(p.status);
  form.querySelectorAll("input[name=mode]").forEach(r=>r.addEventListener("change",()=>drawStatus(form.elements.status?.value || "pendente")));
  form.querySelector("#tbd").addEventListener("change", e=>{ form.elements.date.disabled = e.target.checked; if(!e.target.checked && !form.elements.date.value) form.elements.date.value = iso(today); });
  form.addEventListener("submit", e=>{
    e.preventDefault();
    const f = { title: form.elements.title.value.trim(), mode: form.elements.mode.value, group: form.elements.group.value, status: form.elements.status.value,
                date: form.querySelector("#tbd").checked ? "" : form.elements.date.value, link: form.elements.link.value.trim(), notes: form.elements.notes.value.trim() };
    if(id) Object.assign(p, f); else data.pieces.push({ ...f, id: uid() });
    closeModal(); save("Peça salva");
  });
}

function editLink(id){
  const l = id ? data.links.find(x=>x.id===id) : { title:"", url:"", category:"" };
  const cats = [...new Set(data.links.map(x=>x.category).filter(Boolean).concat(["Materiais","Documentos","Aprovações","Referências"]))];
  openModal(`
    <div class="modal-h"><h3>${id?"Editar link":"Novo link"}</h3><button class="btn icon-btn ghost" data-close aria-label="Fechar">✕</button></div>
    <form class="modal-b" id="linkForm">
      <label class="f">Título<input name="title" required value="${esc(l.title)}" placeholder="Ex.: Tabela de valores"></label>
      <label class="f">URL<input name="url" required value="${esc(l.url)}" placeholder="https://…"></label>
      <label class="f">Categoria<input name="category" list="cats" value="${esc(l.category)}" placeholder="Materiais, Documentos…"></label>
      <datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
      <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:4px">
        ${id?`<button type="button" class="btn danger" data-del-link="${id}">Excluir</button>`:"<span></span>"}
        <span style="display:flex;gap:8px"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">Salvar</button></span>
      </div>
    </form>`);
  document.getElementById("linkForm").addEventListener("submit", e=>{
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    f.category = f.category.trim() || "Geral";
    if(id) Object.assign(l, f); else data.links.push({ ...f, id: uid() });
    closeModal(); save("Link salvo");
  });
}

/* ============ Arrastar e soltar (modo equipe) ============ */
let dragId = null;
document.addEventListener("dragstart", e=>{
  const el = e.target.closest?.("[data-drag]");
  if(!el || !editing()) return;
  dragId = el.dataset.drag; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId);
});
document.addEventListener("dragover", e=>{
  if(!dragId) return;
  const z = e.target.closest("[data-drop]"); if(!z) return;
  e.preventDefault();
  document.querySelectorAll(".drop").forEach(x=>x!==z && x.classList.remove("drop"));
  z.classList.add("drop");
});
document.addEventListener("dragleave", e=>{ const z = e.target.closest?.("[data-drop]"); if(z && !z.contains(e.relatedTarget)) z.classList.remove("drop"); });
document.addEventListener("drop", e=>{
  const z = e.target.closest("[data-drop]"); if(!z || !dragId) return;
  e.preventDefault();
  const p = data.pieces.find(x=>x.id===dragId); dragId = null;
  if(!p || p.date===z.dataset.drop) return render();
  p.date = z.dataset.drop;
  save(p.date ? `“${p.title}” movida para ${parseDate(p.date).toLocaleDateString("pt-BR")}` : `“${p.title}” sem data definida`);
});
document.addEventListener("dragend", ()=>{ dragId=null; document.querySelectorAll(".drop").forEach(x=>x.classList.remove("drop")); });

/* ============ Eventos ============ */
document.addEventListener("click", e=>{
  const t = e.target;
  if(t.closest("[data-stop]")) return;
  const editL = t.closest("[data-edit-link]"); if(editL){ e.preventDefault(); return editLink(editL.dataset.editLink); }
  const delP = t.closest("[data-del-piece]"); if(delP){ if(confirm("Excluir esta peça?")){ data.pieces = data.pieces.filter(p=>p.id!==delP.dataset.delPiece); closeModal(); save("Peça excluída"); } return; }
  const delL = t.closest("[data-del-link]"); if(delL){ if(confirm("Excluir este link?")){ data.links = data.links.filter(l=>l.id!==delL.dataset.delLink); closeModal(); save("Link excluído"); } return; }
  const edP = t.closest("[data-edit-piece]"); if(edP) return editPiece(edP.dataset.editPiece);
  const open = t.closest("[data-open]"); if(open){ e.stopPropagation(); return editing() ? editPiece(open.dataset.open) : showPiece(open.dataset.open); }
  const more = t.closest("[data-day-more]"); if(more){ selDay = more.dataset.dayMore; renderCalendar(); const dl=document.getElementById("dayList"); dl.style.display="block"; dl.scrollIntoView({behavior:"smooth"}); return; }
  const day = t.closest("[data-day]");
  if(day){
    if(matchMedia("(max-width:760px)").matches){ selDay = selDay===day.dataset.day ? null : day.dataset.day; renderCalendar(); return; }
    if(editing()) return editPiece(null, day.dataset.day);
    return;
  }
  const fs = t.closest("[data-fstatus]"); if(fs){ fStatus = fs.dataset.fstatus; render(); return; }
  const fm = t.closest("[data-fmode]"); if(fm){ fMode = fm.dataset.fmode; render(); return; }
  const gb = t.closest("[data-group]"); if(gb){ groupBy = gb.dataset.group; renderCards(); return; }
  const s = t.closest("[data-stat]"); if(s){ fStatus = s.dataset.stat; switchTab("cards"); render(); return; }
  if(t.closest("[data-add-piece]")) return editPiece(null);
});
document.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>{ switchTab(b.dataset.tab); renderStats(); }));
function switchTab(name){
  tab = name;
  document.querySelectorAll("nav.tabs button").forEach(b=>b.classList.toggle("on", b.dataset.tab===name));
  document.querySelectorAll("[data-panel]").forEach(p=>p.hidden = p.dataset.panel!==name);
}
document.getElementById("prev").onclick = ()=>{ view.setMonth(view.getMonth()-1); selDay=null; renderCalendar(); };
document.getElementById("next").onclick = ()=>{ view.setMonth(view.getMonth()+1); selDay=null; renderCalendar(); };
document.getElementById("addLink").onclick = ()=>editLink(null);
document.getElementById("toggleEdit").onclick = ()=>{
  const on = document.body.classList.toggle("editing");
  document.getElementById("toggleEdit").textContent = on ? "Sair do modo equipe" : "Modo equipe";
  render();
};
document.getElementById("exportBtn").onclick = ()=>{
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"quintas-da-mantiqueira-pecas.json"}).click();
};
document.getElementById("importBtn").onclick = ()=>document.getElementById("importFile").click();
document.getElementById("importFile").onchange = async e=>{
  try{ const j = JSON.parse(await e.target.files[0].text()); if(!Array.isArray(j.pieces)) throw 0; data = { links:[], ...j }; save("Dados importados"); }
  catch{ toast("Arquivo inválido"); }
  e.target.value="";
};
let tt; function toast(m){ const el=document.getElementById("toast"); el.textContent=m; el.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>el.classList.remove("show"),2200); }

render();
