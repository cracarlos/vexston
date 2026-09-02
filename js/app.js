(function(){
"use strict";
var ORIG = new Map();
var viewState = { view: "", id: "" };

function snapshot(){
  document.querySelectorAll("[data-i18n],[data-i18n-html],[data-i18n-ph]").forEach(function(el){
    var k = el.getAttribute("data-i18n") || el.getAttribute("data-i18n-html") || el.getAttribute("data-i18n-ph");
    if(el.hasAttribute("data-i18n-ph")){ if(!I18N.es[k]) I18N.es[k] = el.placeholder; return; }
    if(!ORIG.has(el)) ORIG.set(el, el.innerHTML);
    if(!I18N.es[k]) I18N.es[k] = el.innerHTML;
  });
}

function applyLang(lang){
  LANG = lang;
  var dict = I18N[lang] || I18N.es;
  document.querySelectorAll("[data-i18n]").forEach(function(el){
    var k = el.getAttribute("data-i18n");
    if(dict[k] != null) el.textContent = dict[k];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function(el){
    var k = el.getAttribute("data-i18n-ph");
    if(dict[k] != null) el.placeholder = dict[k];
  });
  document.querySelectorAll("[data-i18n-html]").forEach(function(el){
    var k = el.getAttribute("data-i18n-html");
    if(dict[k] != null) el.innerHTML = dict[k];
  });
  document.documentElement.lang = lang;
  document.querySelectorAll(".lang").forEach(function(el){ el.setAttribute("data-active", lang); });
  buildAreas(); buildTicker(); buildCourt(); buildMega(); buildAreaSelect();
  // renderVideos(liveVideosCache); — sección de video desactivada temporalmente
  if(viewState && viewState.view) handleRoute();
  if(window.chatGreet && document.getElementById("chatBody").children.length) window.chatGreet();
}

/* ─────────── Áreas ─────────── */
function buildAreas(){
  var grid = document.getElementById("areasGrid");
  grid.innerHTML = AREAS.map(function(a, i){
    var d = a[LANG];
    return '<a class="area" href="areas/'+a.id+'.html" data-reveal data-i="'+i+'" id="area-'+a.id+'">'+
           '<span class="n">'+String(i+1).padStart(2,"0")+'</span>'+
           '<h3>'+d.n+'</h3>'+
           '<p class="area-tag">'+d.t+'</p>'+
           '<p>'+d.s+'</p>'+
           '<span class="more">'+(UI[LANG].viewDetail||"Ver detalle")+' →</span>'+
           '</a>';
  }).join("");
  observeReveals(grid);
}

/* ─────────── Cintillo ─────────── */
function buildTicker(){
  var t = document.getElementById("tickerTrack");
  var one = AREAS.map(function(a){ return '<a class="ticker-item" href="areas/'+a.id+'.html">'+a[LANG].n+'</a>'; }).join("");
  t.innerHTML = one + '<span class="ticker-dup" aria-hidden="true">' + one + '</span>';
}


/* ─────────── Calendario judicial ─────────── */
function buildCourt(){
  var i = LANG === "en" ? 2 : LANG === "pt" ? 3 : 1;
  document.getElementById("courtList").innerHTML = COURT.map(function(c){
    return '<div class="court-row"><span>'+c[i]+'</span><time>'+c[0]+'</time></div>';
  }).join("");
}

document.getElementById("cGo").addEventListener("click", function(){
  var out = document.getElementById("cOut");
  var t = CTXT[LANG] || CTXT.es;
  var raw = document.getElementById("cDate").value;
  var qty = parseInt(document.getElementById("cQty").value, 10);
  var type = document.getElementById("cType").value;

  if(!raw || !qty || qty < 1){
    out.innerHTML = '<p class="calc-note">'+t.err+'</p>';
    out.setAttribute("data-shown","true");
    return;
  }

  var parts = raw.split("-");
  var d = new Date(+parts[0], +parts[1]-1, +parts[2]);
  var added = 0;

  if(type === "cont"){
    d.setDate(d.getDate() + qty);
  } else {
    while(added < qty){
      d.setDate(d.getDate() + 1);
      var w = d.getDay();
      if(w !== 0 && w !== 6) added++;
    }
  }

  var pretty = d.toLocaleDateString(FMT[LANG] || "es-VE", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
  var note = type === "cont" ? t.nc : type === "hab" ? t.nh : t.nd;
  var label = type === "cont" ? t.cont : type === "hab" ? t.hab : t.desp;

  out.innerHTML =
    '<div class="calc-date">'+t.vence+' '+pretty+'</div>'+
    '<p class="calc-note"><strong>'+qty+' '+label+'</strong> — '+note+'</p>'+
    '<div class="calc-warn"><p>'+t.warn+'</p></div>';
  out.setAttribute("data-shown","true");
});

/* ─────────── Header pegajoso ─────────── */
var head = document.getElementById("head");
var lastY = -1;
function onScroll(){
  var y = window.scrollY;
  if(y === lastY) return;
  lastY = y;
  var inAbogado = viewState.view === "abogados" || (viewState.view === "abogado" && viewState.id);
  head.setAttribute("data-stuck", inAbogado || y > 40 ? "true" : "false");
}
window.addEventListener("scroll", function(){ requestAnimationFrame(onScroll); }, {passive:true});
onScroll();

/* ─────────── Parallax del Ávila (solo transform) ─────────── */
var rA = document.getElementById("ridgeA"),
    rB = document.getElementById("ridgeB"),
    rC = document.getElementById("ridgeC");
var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!reduce && rA){
  var ticking = false;
  window.addEventListener("scroll", function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var y = window.scrollY;
      if(y < window.innerHeight * 1.2){
        rA.setAttribute("transform","translate(0,"+(y*0.06)+")");
        rB.setAttribute("transform","translate(0,"+(y*0.12)+")");
        rC.setAttribute("transform","translate(0,"+(y*0.20)+")");
      }
      ticking = false;
    });
  }, {passive:true});
}

/* ─────────── Reveal ─────────── */
var io = null;
if("IntersectionObserver" in window){
  io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.setAttribute("data-in","true");
        io.unobserve(e.target);
      }
    });
  }, {rootMargin:"0px 0px -80px 0px", threshold:0.08});
}
function observeReveals(scope){
  var nodes = (scope || document).querySelectorAll("[data-reveal]:not([data-in])");
  if(!io){ nodes.forEach(function(n){ n.setAttribute("data-in","true"); }); return; }
  var seen = new Map();
  nodes.forEach(function(n){
    /* stagger corto, contado dentro de cada grupo — nunca bloquea la interacción */
    var p = n.parentNode;
    var k = seen.get(p) || 0;
    seen.set(p, k + 1);
    n.style.transitionDelay = Math.min(k * 45, 270) + "ms";
    io.observe(n);
  });
}
observeReveals(document);

/* ─────────── Menú móvil ─────────── */
var burger = document.getElementById("burger");
burger.addEventListener("click", function(){
  var open = document.body.getAttribute("data-menu") === "open";
  document.body.setAttribute("data-menu", open ? "closed" : "open");
  burger.setAttribute("aria-expanded", String(!open));
});
document.getElementById("panel").addEventListener("click", function(e){
  if(e.target.tagName === "A"){
    document.body.setAttribute("data-menu","closed");
    burger.setAttribute("aria-expanded","false");
  }
});

/* ─────────── Idioma ─────────── */
document.addEventListener("click", function(e){
  var b = e.target.closest(".lang button[data-lang]");
  if(b) applyLang(b.getAttribute("data-lang"));
});

/* ─────────── Modales ─────────── */
document.addEventListener("click", function(e){
  var trigger = e.target.closest("[data-open-modal]");
  if(trigger){
    var m = document.getElementById(trigger.getAttribute("data-open-modal"));
    if(m){ m.setAttribute("data-open","true"); document.body.style.overflow="hidden"; return; }
  }
  if(e.target.closest("[data-close]")){
    closeModals();
    return;
  }
  if(e.target.classList && e.target.classList.contains("scrim")){
    closeModals();
  }
});
function closeModals(){
  document.querySelectorAll('.scrim[data-open="true"]').forEach(function(m){
    m.setAttribute("data-open","false");
  });
  document.body.style.overflow="";
}
document.addEventListener("keydown", function(e){
  if(e.key !== "Escape") return;
  closeModals();
  var cp = document.getElementById("chatPanel");
  if(cp && cp.getAttribute("data-open") === "true"){
    cp.setAttribute("data-open","false");
    document.getElementById("chatBtn").setAttribute("aria-expanded","false");
  }
});

/* ─────────── Init ─────────── */
snapshot();
buildAreas(); buildTicker(); buildCourt(); buildMega(); buildAreaSelect();
// renderVideos(); initVideos(); — sección de video desactivada temporalmente
document.getElementById("yr").textContent = new Date().getFullYear();
handleRoute();


/* ─────────── Mega-menú ─────────── */
document.querySelectorAll("[data-mega]").forEach(function(el){
  var t;
  function open(v){ clearTimeout(t); el.setAttribute("data-open", v ? "true" : "false"); }
  el.addEventListener("mouseenter", function(){ open(true); });
  el.addEventListener("mouseleave", function(){ t = setTimeout(function(){ open(false); }, 90); });
  el.addEventListener("focusin", function(){ open(true); });
  el.addEventListener("focusout", function(e){
    if(!el.contains(e.relatedTarget)) open(false);
  });
  el.addEventListener("click", function(e){
    if(e.target.closest("a[href^='#']")) open(false);
  });
});

function buildMega(){
  var ul = document.getElementById("megaAreas");
  if(!ul) return;
  ul.innerHTML = AREAS.map(function(a, i){
    return '<li><a href="areas/'+a.id+'.html">'+a[LANG].n+'</a></li>';
  }).join("");
  var all = document.getElementById("megaAll");
  if(all) all.textContent = UI[LANG].viewAllAreas || "Ver las 18 áreas de práctica →";
}

/* ─────────── Evaluador de riesgo ─────────── */
(function(){
  var w = document.getElementById("riskWidget");
  if(!w) return;
  var step = 1, answers = {};

  w.addEventListener("click", function(e){
    var b = e.target.closest(".rq-opts button");
    if(!b) return;
    var q = b.closest(".rq");
    answers[q.getAttribute("data-q")] = b.getAttribute("data-track");
    q.setAttribute("data-on", "false");
    var bar = w.querySelector('.rq-bar i[data-p="'+step+'"]');
    if(bar) bar.setAttribute("data-done", "true");
    step++;
    var next = w.querySelector('.rq[data-q="'+step+'"]');
    if(next){ next.setAttribute("data-on", "true"); }
    else { showResult(); }
  });

  function showResult(){
    var map = UI[LANG].risk;
    var r = map[answers["3"]] || map.otro;
    document.getElementById("riskTag").textContent = r.tag;
    document.getElementById("riskTitle").textContent = r.title;
    document.getElementById("riskText").textContent =
      r.text + (answers["4"] === "hoy" ? map.urgentNote : "");
    document.getElementById("riskResult").setAttribute("data-on", "true");
  }

  document.getElementById("riskRestart").addEventListener("click", function(){
    step = 1; answers = {};
    document.getElementById("riskResult").setAttribute("data-on", "false");
    w.querySelectorAll(".rq").forEach(function(q){ q.setAttribute("data-on", "false"); });
    w.querySelectorAll(".rq-bar i").forEach(function(i){ i.setAttribute("data-done", "false"); });
    w.querySelector('.rq[data-q="1"]').setAttribute("data-on", "true");
  });
})();

/* ─────────── Pestañas del portal ─────────── */
(function(){
  var head = document.getElementById("ptabsHead");
  if(!head) return;
  var ink = document.getElementById("ptabsInk");

  function moveInk(btn){
    ink.style.width = btn.offsetWidth + "px";
    ink.style.transform = "translateX(" + btn.offsetLeft + "px)";
  }
  head.addEventListener("click", function(e){
    var b = e.target.closest("button[data-tab]");
    if(!b) return;
    head.querySelectorAll("button").forEach(function(x){ x.setAttribute("data-on", x === b ? "true" : "false"); });
    document.querySelectorAll(".ptab").forEach(function(p){
      p.setAttribute("data-on", p.getAttribute("data-tab") === b.getAttribute("data-tab") ? "true" : "false");
    });
    moveInk(b);
  });
  function init(){
    var on = head.querySelector('button[data-on="true"]');
    if(on) moveInk(on);
  }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(init); } else { setTimeout(init, 300); }
  window.addEventListener("resize", init);
})();

/* ─────────── Estimador de antigüedad laboral ─────────── */
document.getElementById("antRun").addEventListener("click", function(){
  var out = document.getElementById("antOut");
  var t = CTXT[LANG] || CTXT.es;
  var sal = parseFloat(document.getElementById("antSalario").value);
  var yrs = parseInt(document.getElementById("antAnios").value, 10);

  if(!sal || sal <= 0 || !yrs || yrs < 1){
    out.innerHTML = '<p class="calc-note">'+t.antErr+'</p>';
    out.setAttribute("data-shown","true");
    return;
  }
  // Referencia: 30 días de salario por año de servicio (salario diario = mensual / 30)
  var diario = sal / 30;
  var monto = diario * 30 * yrs;
  var fmt = new Intl.NumberFormat(FMT[LANG] || "es-VE", {minimumFractionDigits:2, maximumFractionDigits:2});

  out.innerHTML =
    '<div class="calc-date">Bs. ' + fmt.format(monto) + '</div>' +
    '<p class="calc-note">' + t.antNote.replace("{y}", yrs) + '</p>' +
    '<div class="calc-warn"><p>' + t.antWarn + '</p></div>';
  out.setAttribute("data-shown","true");
});

/* ─────────── Buscador jurídico ─────────── */
(function(){
  var btn = document.getElementById("juriBtn"), inp = document.getElementById("juriSearch"), out = document.getElementById("juriOut");
  if(!btn) return;
  function run(){
    var q = inp.value.trim();
    out.textContent = q ? (CTXT[LANG] || CTXT.es).juri.replace("{q}", q) : "";
  }
  btn.addEventListener("click", run);
  inp.addEventListener("keydown", function(e){ if(e.key === "Enter") run(); });
})();

/* ─────────── Formulario de cita ─────────── */
(function(){
  var modes = document.getElementById("modes");
  if(!modes) return;
  modes.addEventListener("click", function(e){
    var b = e.target.closest(".mode");
    if(!b) return;
    modes.querySelectorAll(".mode").forEach(function(x){ x.setAttribute("data-on", x === b ? "true" : "false"); });
  });

  document.getElementById("citaForm").addEventListener("submit", function(ev){
    ev.preventDefault();
    var t = CTXT[LANG] || CTXT.es;
    var box = document.getElementById("fSent");
    var name = document.getElementById("fName").value.trim();
    var mail = document.getElementById("fMail").value.trim();
    if(!name || !mail){
      box.textContent = t.formErr;
      box.setAttribute("data-on","true");
      return;
    }
    var mode = (modes.querySelector('.mode[data-on="true"]') || {}).getAttribute
             ? modes.querySelector('.mode[data-on="true"]').querySelector("strong span").textContent
             : "";
    box.textContent = t.formOk.replace("{n}", name.split(" ")[0]).replace("{m}", mode.toLowerCase());
    box.setAttribute("data-on","true");
  });
})();

function buildAreaSelect(){
  var sel = document.getElementById("fArea");
  if(!sel) return;
  sel.innerHTML = '<option value="">' + (UI[LANG].selectArea || "—") + '</option>' +
    AREAS.map(function(a){ return '<option>' + a[LANG].n + '</option>'; }).join("");
}

/* ─────────── Chat ─────────── */
(function(){
  var btn = document.getElementById("chatBtn"),
      panel = document.getElementById("chatPanel"),
      body = document.getElementById("chatBody"),
      quick = document.getElementById("chatQuick");

  function say(text, mine){
    var d = document.createElement("div");
    d.className = "bubble " + (mine ? "bubble-me" : "bubble-bot");
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  window.chatGreet = function(){
    body.innerHTML = "";
    say(UI[LANG].chat.hello);
  };

  btn.addEventListener("click", function(){
    var open = panel.getAttribute("data-open") === "true";
    panel.setAttribute("data-open", open ? "false" : "true");
    btn.setAttribute("aria-expanded", String(!open));
    if(!open && !body.children.length) window.chatGreet();
  });
  document.querySelector("[data-chat-close]").addEventListener("click", function(){
    panel.setAttribute("data-open","false");
    btn.setAttribute("aria-expanded","false");
  });

  quick.addEventListener("click", function(e){
    var b = e.target.closest("button[data-q]");
    if(!b) return;
    say(b.textContent, true);
    var key = b.getAttribute("data-q");
    setTimeout(function(){ say(UI[LANG].chat[key] || UI[LANG].chat.def); }, 420);
  });
})();

/* ─────────── Login del portal (placeholder; el modal ahora es un aviso de "próximamente habilitado") ─────────── */
/* document.getElementById("loginForm").addEventListener("submit", function(ev){
  ev.preventDefault();
  var t = CTXT[LANG] || CTXT.es;
  var out = document.getElementById("lgOut");
  var mail = document.getElementById("lgMail").value.trim();
  out.innerHTML = '<p class="calc-note">' + (mail ? t.loginSoon : t.loginErr) + '</p>';
  out.setAttribute("data-shown","true");
}); */

/* ─────────── Carrusel del hero: marca → fotografías → marca ─────────── */
(function(){
  var hero = document.querySelector(".hero");
  var slides = [].slice.call(document.querySelectorAll(".hero-slide"));
  if(!hero || !slides.length) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var URLS = ["https://images.unsplash.com/photo-1714594923299-e915b7d71701?auto=format&fit=crop&w=2000&q=80", "https://images.unsplash.com/photo-1726731782158-fcf6822b6ca4?auto=format&fit=crop&w=2000&q=80", "https://images.unsplash.com/photo-1678371838890-efa428d293f7?auto=format&fit=crop&w=2000&q=80", "https://images.unsplash.com/photo-1759169306784-40fc77c746a6?auto=format&fit=crop&w=2000&q=80"];
  var MARCA = 6200, FOTO = 5200;   // el estado de marca dura algo más: es el que ancla
  var i = 0, t = null;

  /* i = 0 es el estado de marca; 1..4 son las fotografías. El ciclo vuelve a 0. */
  function paso(){
    var esMarca = (i === 0);
    hero.setAttribute("data-phase", esMarca ? "marca" : "foto");
    slides.forEach(function(s, k){ s.setAttribute("data-on", (!esMarca && k === i - 1) ? "true" : "false"); });
    t = setTimeout(function(){
      i = (i + 1) % (slides.length + 1);
      paso();
    }, esMarca ? MARCA : FOTO);
  }

  /* Sólo arrancamos cuando las cuatro estén descargadas: nunca un hueco en negro */
  var faltan = URLS.length, fallo = false;
  URLS.forEach(function(u, k){
    var img = new Image();
    img.onload = function(){
      slides[k].style.backgroundImage = "url('" + u + "')";
      if(--faltan === 0 && !fallo){ i = 0; t = setTimeout(function(){ i = 1; paso(); }, MARCA); }
    };
    img.onerror = function(){ fallo = true; };   // si Unsplash no responde, se queda el azul
    img.src = u;
  });

  /* No gastamos ciclos ni datos mientras el hero no se ve */
  document.addEventListener("visibilitychange", function(){
    if(document.hidden){ clearTimeout(t); }
    else if(!fallo && faltan === 0){ clearTimeout(t); paso(); }
  });
})();

/* ═══════════════ VÍDEOS / YOUTUBE ═══════════════ */
var liveVideosCache = null;
function youtubeUrl(id){ return "https://www.youtube.com/watch?v=" + id; }
function vShort(d, n){
  var t = (d || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}
function renderVideos(list){
  var vids = list || getVideos();
  var feat = vids.find(function(v){ return v.featured; }) || vids[0];
  if(!feat) return;
  var vui = (UI[LANG].video) || {};
  var featEl = document.getElementById("videoFeatured");
  var gridEl = document.getElementById("videoGrid");
  if(featEl){
    featEl.innerHTML =
      '<a class="v-player" href="'+youtubeUrl(feat.id)+'" target="_blank" rel="noopener" aria-label="Reproducir: '+feat.title+'">'+
        '<img src="https://img.youtube.com/vi/'+feat.id+'/maxresdefault.jpg" alt="'+feat.title+'" loading="lazy" decoding="async" onerror="this.src=\'https://img.youtube.com/vi/'+feat.id+'/hqdefault.jpg\'">'+
        '<span class="v-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>'+
        '<span class="v-dur">'+vui.viewBtn+'</span>'+
      '</a>'+
      '<div class="v-feat-body">'+
        '<p class="eyebrow" style="color:var(--azure-lift)">'+(feat.tag || vui.featuredTag)+'</p>'+
        '<h3>'+feat.title+'</h3>'+
        '<p>'+vShort(feat.desc, 240)+'</p>'+
      '</div>';
  }
  if(gridEl){
    gridEl.innerHTML = vids.filter(function(v){ return v.id !== feat.id; }).map(function(v){
      return '<a class="v-card" href="'+youtubeUrl(v.id)+'" target="_blank" rel="noopener">'+
        '<div class="v-thumb"><img src="https://img.youtube.com/vi/'+v.id+'/hqdefault.jpg" alt="'+v.title+'" loading="lazy" decoding="async">'+
        '<span class="v-dur">'+vui.viewBtn+'</span></div>'+
        '<div class="v-card-body">'+
          (v.tag ? '<p class="eyebrow" style="color:var(--azure-lift)">'+v.tag+'</p>' : '')+
          '<h4>'+v.title+'</h4>'+
          '<p>'+vShort(v.desc, 150)+'</p>'+
        '</div>'+
      '</a>';
    }).join("");
  }
}
async function initVideos(){
  try{
    var live = await fetchChannelVideos();
    if(live && live.length){
      liveVideosCache = live.map(function(v, i){ return Object.assign({}, v, {featured: i === 0}); });
      return renderVideos(liveVideosCache);
    }
  }catch(e){ /* proxy/offline → usa datos estáticos */ }
  renderVideos();
}

/* ═══════════════ VISTAS DE ABOGADOS (router ?view=) ═══════════════ */
function currentParams(){ return new URLSearchParams(window.location.search); }
function handleRoute(){
  var p = currentParams();
  viewState.view = p.get("view") || "";
  viewState.id = p.get("id") || "";
  var mainEl = document.getElementById("main");
  var abPage = document.getElementById("abogadosPage");
  var abCard = document.getElementById("abogadoPage");
  if(!mainEl || !abPage || !abCard) return;
  var inAbogado = viewState.view === "abogados" || (viewState.view === "abogado" && viewState.id);
  head.setAttribute("data-stuck", inAbogado ? "true" : (window.scrollY > 40 ? "true" : "false"));
  if(viewState.view === "abogados"){
    mainEl.style.display = "none"; abCard.style.display = "none"; abPage.style.display = "block";
    renderAbogadosList(); window.scrollTo(0, 0);
    return;
  }
  if(viewState.view === "abogado" && viewState.id){
    mainEl.style.display = "none"; abPage.style.display = "none"; abCard.style.display = "block";
    renderAbogadoCard(viewState.id); window.scrollTo(0, 0);
    return;
  }
  mainEl.style.display = ""; abPage.style.display = "none"; abCard.style.display = "none";
}

function generateVCF(a){
  var vcf = [
    "BEGIN:VCARD","VERSION:3.0",
    "FN:" + a.nombre, "N:" + a.nombre + ";;;;",
    "ORG:VEXSTON","TITLE:" + a.cargo,
    "TEL;TYPE=CELL:" + a.telPersonal, "TEL;TYPE=WORK:" + a.telOficina,
    "EMAIL;TYPE=PERSONAL:" + a.emailPersonal, "EMAIL;TYPE=WORK:" + a.emailInstitucional,
    "URL:" + a.web, "X-SOCIALPROFILE;TYPE=instagram:" + a.instagramHandle,
    "END:VCARD"
  ].join("\r\n");
  var blob = new Blob([vcf], {type:"text/vcard"});
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url; link.download = a.id + ".vcf";
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

function initialsOf(name){
  return name.split(/\s+/).filter(function(w){ return /^[A-ZÁÉÍÓÚÑ]/.test(w); }).slice(0, 2).map(function(w){ return w[0]; }).join("").toUpperCase();
}

function renderAbogadosList(){
  var ui = (UI[LANG].abogados) || {};
  var html = '<div class="shell">'+
    '<p class="eyebrow">VEXSTON</p>'+
    '<h2 style="font-size:clamp(1.9rem,3.4vw,2.8rem);font-weight:400;margin-bottom:.6rem">'+ui.listTitle+'</h2>'+
    '<p class="lede" style="margin-bottom:2.6rem;max-width:52ch">'+ui.listSubtitle+'</p>'+
    '<div class="abogados-grid">';
  getAbogados().forEach(function(a){
    html +=
      '<a class="abogado-card" href="?view=abogado&id='+a.id+'">'+
        '<div class="abogado-card-inner">'+
          '<span class="abogado-avatar">'+initialsOf(a.nombre)+'</span>'+
          '<div class="abogado-card-body">'+
            '<h3>'+a.nombre+'</h3>'+
            '<p class="abogado-cargo">'+a.cargo+'</p>'+
            '<p class="abogado-areas">'+a.areas.join(" · ")+'</p>'+
            '<span class="a-more">'+ui.areas+' <span class="arrow">→</span></span>'+
          '</div>'+
        '</div>'+
      '</a>';
  });
  html += '</div></div>';
  document.getElementById("abogadosPage").innerHTML = html;
  observeReveals(document.getElementById("abogadosPage"));
}

function renderAbogadoCard(id){
  var a = getAbogado(id);
  var ui = (UI[LANG].abogados) || {};
  if(!a){
    var url = new URL(window.location);
    url.searchParams.set("view", "abogados"); url.searchParams.delete("id");
    window.history.replaceState({}, "", url);
    return handleRoute();
  }
  var actions =
    '<a class="abogado-action-btn" href="tel:'+a.telPersonal+'"><span class="abogado-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.08 19.5 19.5 0 01-6-6A19.86 19.86 0 012.09 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13 1.05.38 2.07.72 3.05a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.98.34 2 .59 3.05.72A2 2 0 0122 16.92z"/></svg></span><span class="abogado-action-label">'+ui.cardCall+'</span><span class="abogado-action-arrow">→</span></a>'+
    '<a class="abogado-action-btn" href="https://wa.me/'+a.whatsapp.replace(/\+/g,"")+'" target="_blank" rel="noopener"><span class="abogado-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 014 11.5a8.5 8.5 0 0115-3.8 8.38 8.38 0 01.9 3.8z"/></svg></span><span class="abogado-action-label">'+ui.cardWhatsApp+'</span><span class="abogado-action-arrow">→</span></a>'+
    '<a class="abogado-action-btn" href="tel:'+a.telOficina+'"><span class="abogado-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.08 19.5 19.5 0 01-6-6A19.86 19.86 0 012.09 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13 1.05.38 2.07.72 3.05a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.98.34 2 .59 3.05.72A2 2 0 0122 16.92z"/></svg></span><span class="abogado-action-label">'+ui.cardOffice+'</span><span class="abogado-action-arrow">→</span></a>'+
    '<a class="abogado-action-btn" href="mailto:'+a.emailPersonal+'"><span class="abogado-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 6l8 6 8-6"/></svg></span><span class="abogado-action-label">'+ui.cardEmail+'</span><span class="abogado-action-arrow">→</span></a>'+
    '<a class="abogado-action-btn" href="'+a.web+'" target="_blank" rel="noopener"><span class="abogado-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg></span><span class="abogado-action-label">'+ui.cardWeb+'</span><span class="abogado-action-arrow">→</span></a>'+
    '<a class="abogado-action-btn" href="'+a.instagram+'" target="_blank" rel="noopener"><span class="abogado-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><path d="M17.5 6.5h.01"/></svg></span><span class="abogado-action-label">'+ui.cardInstagram+'</span><span class="abogado-action-arrow">→</span></a>';
  document.getElementById("abogadoPage").innerHTML =
    '<div class="abogado-card-view"><div class="abogado-card-inner-view">'+
      '<div class="abogado-header">'+
        '<span class="abogado-avatar big">'+initialsOf(a.nombre)+'</span>'+
        '<div class="abogado-name-block"><h2>'+a.nombre+'</h2><p class="abogado-cargo">'+a.cargo+'</p></div>'+
      '</div>'+
      '<div class="abogado-actions">'+actions+'</div>'+
      '<div class="abogado-info">'+
        '<p class="abogado-info-title">'+ui.infoTitle+'</p>'+
        '<div class="abogado-info-row"><span class="abogado-info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 6l8 6 8-6"/></svg></span><div><b>'+ui.personalEmail+'</b><span>'+a.emailPersonal+'</span></div></div>'+
        '<div class="abogado-info-row"><span class="abogado-info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 6l8 6 8-6"/></svg></span><div><b>'+ui.institutionalEmail+'</b><span>'+a.emailInstitucional+'</span></div></div>'+
        '<div class="abogado-info-row"><span class="abogado-info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg></span><div><b>'+ui.web+'</b><span>'+a.web+'</span></div></div>'+
        '<div class="abogado-info-row"><span class="abogado-info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><path d="M17.5 6.5h.01"/></svg></span><div><b>Instagram</b><span>'+a.instagramHandle+'</span></div></div>'+
      '</div>'+
      '<button class="abogado-save-btn" onclick="generateVCF(getAbogado(\''+a.id+'\'))"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>'+ui.saveContact+'</button>'+
      '<p class="abogado-save-note">'+ui.saveNote+'</p>'+
      '<div class="abogado-back"><a href="?view=abogados">← '+ui.back+'</a></div>'+
    '</div></div>';
}

/* intercepta enlaces internos ?view= y anclas sin recargar la página */
document.addEventListener("click", function(e){
  var a = e.target.closest("a");
  if(!a) return;
  var href = a.getAttribute("href");
  if(!href) return;
  if(href.indexOf("?view=") === 0){
    e.preventDefault();
    var url = new URL(href, window.location.href);
    window.history.pushState({}, "", url);
    handleRoute();
    return;
  }
  if(href.indexOf("#") === 0 && (viewState.view === "abogados" || viewState.view === "abogado")){
    e.preventDefault();
    var u = new URL(window.location);
    u.search = "";
    u.hash = href;
    window.history.pushState({}, "", u);
    handleRoute();
    var target = document.querySelector(href);
    if(target) setTimeout(function(){ target.scrollIntoView({behavior:"smooth"}); }, 50);
    return;
  }
});
window.addEventListener("popstate", handleRoute);
})();
