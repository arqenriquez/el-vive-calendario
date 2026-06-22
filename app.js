/* ===================================================
   CALENDARIO ÉL VIVE · Junio – Diciembre 2026
   Datos + render + filtros + animaciones
   ---------------------------------------------------
   ¿CÓMO EDITAR?  Modifica el arreglo EVENTOS de abajo.
   Cada evento:
     { mes, dia, dow, cat, titulo, desc?, hora?, rango? }
   - mes:    "Junio" ... "Diciembre"
   - dia:    número (o texto para rangos, ej. "3 – 13")
   - dow:    día de la semana (Lun, Mar, Mié, Jue, Vie, Sáb, Dom)
   - cat:    consejo | apostolado | misa | matrimonios | economica | especial
   - hora:   opcional, ej. "5:00 p.m."
   - rango:  true si abarca varios días (vacaciones)
   =================================================== */

const CATEGORIAS = {
  consejo:     { nombre: "Junta de Consejo", color: "var(--c-consejo)" },
  apostolado:  { nombre: "Apostolado",        color: "var(--c-apostolado)" },
  misa:        { nombre: "Misa",              color: "var(--c-misa)" },
  matrimonios: { nombre: "Matrimonios · KIDS · Juntas", color: "var(--c-matrimonios)" },
  economica:   { nombre: "Económica",         color: "var(--c-economica)" },
  especial:    { nombre: "Especial",          color: "var(--c-especial)" },
};

const ANIO = 2026;

const ORDEN_MESES = ["Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Mes (texto) -> índice de mes de JavaScript (0 = enero)
const MES_NUM = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
  Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
};

// Último día que abarca el evento (para rangos como "3 – 13" usa el 13)
function diaFin(e) {
  if (typeof e.dia === "number") return e.dia;
  const nums = String(e.dia).match(/\d+/g);
  return nums && nums.length ? Number(nums[nums.length - 1]) : 1;
}

// ¿El evento ya terminó respecto a la fecha de HOY? (se recalcula en cada carga)
function esPasado(e) {
  if (!String(e.dia).trim()) return false; // sin fecha definida: nunca se atenúa
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(ANIO, MES_NUM[e.mes], diaFin(e));
  return fin < hoy;
}

const EVENTOS = [
  // ===== JUNIO =====
  { mes: "Junio", dia: 8, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Junio", dia: 10, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Junio", dia: 17, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Junio", dia: 30, dow: "Mar", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y hora por definir" },

  // ===== JULIO =====
  { mes: "Julio", dia: 1, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: 5, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Julio", dia: 6, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Julio", dia: 15, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: "24 – 26", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #121 de Monterrey", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Julio", dia: 29, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: "31 – 2", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #122 de Monterrey", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Julio", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y fecha exacta por definir" },

  // ===== AGOSTO =====
  { mes: "Agosto", dia: "3 – 16", dow: "Lun a Dom", cat: "especial", titulo: "Vacaciones", desc: "Del lunes 3 al domingo 16 de agosto.", rango: true },
  { mes: "Agosto", dia: 11, dow: "Mar", cat: "misa", titulo: "Misa por el 30.º Aniversario de la Comunidad ÉL VIVE" },
  { mes: "Agosto", dia: 19, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "economica", titulo: "Actividad económica chica" },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Agosto", dia: 31, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Agosto", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y fecha exacta por definir" },

  // ===== SEPTIEMBRE =====
  { mes: "Septiembre", dia: "4 – 6", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #3 de Chihuahua", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Septiembre", dia: 5, dow: "Sáb", cat: "misa", titulo: "Misa de Niños", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 9, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Septiembre", dia: 15, dow: "Mar", cat: "economica", titulo: "Kermés de la Parroquia La Resurrección" },
  { mes: "Septiembre", dia: 23, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Septiembre", dia: 26, dow: "Sáb", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 28, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Septiembre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y fecha exacta por definir" },

  // ===== OCTUBRE =====
  { mes: "Octubre", dia: 7, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Octubre", dia: 10, dow: "Sáb", cat: "especial", titulo: "Primera limpieza de rancho con Comunidad de Iniciación 1", desc: "Incluye un momento de convivencia, oración y encuentro en el rancho." },
  { mes: "Octubre", dia: 21, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "economica", titulo: "Actividad económica grande (Conferencias)" },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Octubre", dia: 26, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Octubre", dia: 27, dow: "Mar", cat: "especial", titulo: "Inicio de invitaciones para el Retiro de Compromiso 1" },
  { mes: "Octubre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y fecha exacta por definir" },

  // ===== NOVIEMBRE =====
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "economica", titulo: "Inicio de la Mega Rifa" },
  { mes: "Noviembre", dia: 4, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Noviembre", dia: 14, dow: "Sáb", cat: "misa", titulo: "Misa mensual y convivencia con KIDS", desc: "(O apostolado con KIDS, por definir.)", hora: "5:00 p.m." },
  { mes: "Noviembre", dia: 18, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Noviembre", dia: 23, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Noviembre", dia: 28, dow: "Sáb", cat: "especial", titulo: "Limpieza de rancho" },
  { mes: "Noviembre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y fecha exacta por definir" },

  // ===== DICIEMBRE =====
  { mes: "Diciembre", dia: 2, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Diciembre", dia: 8, dow: "Mar", cat: "economica", titulo: "Mega Rifa" },
  { mes: "Diciembre", dia: 11, dow: "Vie", cat: "especial", titulo: "Peregrinación" },
  { mes: "Diciembre", dia: 12, dow: "Sáb", cat: "especial", titulo: "Día de la Virgen, misa y Posada KIDS" },
  { mes: "Diciembre", dia: 14, dow: "Lun", cat: "especial", titulo: "Posada durante la junta", desc: "Última junta del mes de diciembre." },
  { mes: "Diciembre", dia: 16, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Diciembre", dia: 17, dow: "Jue", cat: "especial", titulo: "Última Hora Santa del año" },
  { mes: "Diciembre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y fecha exacta por definir" },
];

/* ============ RENDER ============ */
function render() {
  renderFiltros();
  renderAgenda();
  observarReveal();
}

function renderFiltros() {
  const cont = document.getElementById("filters-inner");
  const chips = [`<button class="chip active" data-cat="todos"><span class="dot" style="--cat:var(--vino)"></span>Todos</button>`];
  for (const [key, c] of Object.entries(CATEGORIAS)) {
    chips.push(
      `<button class="chip" data-cat="${key}" style="--cat:${c.color}"><span class="dot"></span>${c.nombre}</button>`
    );
  }
  cont.innerHTML = chips.join("");
  cont.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    cont.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    aplicarFiltro(btn.dataset.cat);
  });
}

function renderAgenda() {
  const agenda = document.getElementById("agenda");
  let html = "";
  for (const mes of ORDEN_MESES) {
    const eventos = EVENTOS.filter((e) => e.mes === mes);
    if (!eventos.length) continue;
    html += `<section class="month" data-mes="${mes}">
      <div class="month-head reveal">
        <span class="month-name">${mes}</span>
        <span class="month-year">${ANIO}</span>
        <span class="month-line"></span>
      </div>
      <div class="timeline">
        ${eventos.map((e) => eventoHTML(e, EVENTOS.indexOf(e))).join("")}
      </div>
    </section>`;
  }
  agenda.innerHTML = html;
}

function eventoHTML(e, idx) {
  const c = CATEGORIAS[e.cat];
  const hora = e.hora ? `<span class="event-time">🕐 ${e.hora}</span>` : "";
  const desc = e.desc ? `<p class="event-desc">${e.desc}</p>` : "";
  const pasado = esPasado(e) ? "past" : "";

  // Eventos sin día definido (ej. apostolado "fecha por definir"): casilla especial.
  const sinFecha = !String(e.dia).trim();
  const fechaBox = sinFecha
    ? `<span class="event-num event-num--tbd">📅</span><span class="event-dow">por definir</span>`
    : `<span class="event-dow">${e.dow}</span><span class="event-num">${e.dia}</span>`;

  // Botón "Agregar a tu calendario" (solo si el evento tiene fecha definida).
  const cal = fechasCalendario(e);
  const icsUrl = cal && Number.isInteger(idx) && idx >= 0 ? `ics/ev-${idx}.ics` : "";
  const calBtn = cal
    ? `<div class="cal-add" data-titulo="${escAttr(e.titulo)}" data-desc="${escAttr(e.desc || "")}" data-allday="${cal.allDay ? "1" : "0"}" data-start="${cal.start}" data-end="${cal.end}" data-ics="${icsUrl}">
        <button class="cal-btn" type="button" aria-haspopup="true" aria-expanded="false"><span class="cal-ico" aria-hidden="true">＋</span> Agregar a tu calendario</button>
        <div class="cal-menu" role="menu" hidden>
          <button class="cal-opt" type="button" data-cal-kind="google" role="menuitem">📅 Google Calendar</button>
          <button class="cal-opt" type="button" data-cal-kind="ics" role="menuitem">📅 Apple Calendar</button>
        </div>
      </div>`
    : "";

  return `<article class="event reveal ${e.rango ? "is-range" : ""} ${pasado}" data-cat="${e.cat}" style="--cat:${c.color}">
    <div class="event-date${sinFecha ? " event-date--tbd" : ""}">
      ${fechaBox}
    </div>
    <div class="event-body">
      <h3 class="event-title">${e.titulo}</h3>
      ${desc}
      <div class="event-meta">
        ${hora}
        <span class="event-tag">${c.nombre}</span>
      </div>
      ${calBtn}
    </div>
  </article>`;
}

/* ============ AGREGAR AL CALENDARIO ============ */
const pad2 = (n) => String(n).padStart(2, "0");

function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// "5:00 p.m." -> { hh, mm } en 24 h; null si no se reconoce.
function parseHora(h) {
  const m = String(h).match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*\.?m/i);
  if (!m) return null;
  let hh = +m[1];
  const mm = +m[2];
  const pm = m[3].toLowerCase() === "p";
  if (pm && hh < 12) hh += 12;
  if (!pm && hh === 12) hh = 0;
  return { hh, mm };
}

// Fecha/hora de inicio y fin para exportar. null si el evento no tiene fecha.
// Con hora -> evento de 1.5 h. Sin hora o rango -> día(s) completo(s).
function fechasCalendario(e) {
  const s = String(e.dia).trim();
  if (!s) return null;
  const mesIdx = MES_NUM[e.mes];
  if (mesIdx === undefined) return null;

  const partes = s.split(/[–-]/).map((x) => x.trim()).filter(Boolean);
  const diaIni = parseInt(partes[0], 10);
  if (isNaN(diaIni)) return null;
  const diaFin = partes.length > 1 ? parseInt(partes[1], 10) : diaIni;
  // Rango que cruza de mes (ej. "31 – 2"): el fin cae en el mes siguiente.
  const mesFin = diaFin < diaIni ? mesIdx + 1 : mesIdx;
  const esRango = e.rango || diaFin !== diaIni;
  const hora = e.hora ? parseHora(e.hora) : null;

  if (hora && !esRango) {
    const ini = new Date(ANIO, mesIdx, diaIni, hora.hh, hora.mm);
    const fin = new Date(ini.getTime() + 90 * 60000);
    const dt = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
    return { allDay: false, start: dt(ini), end: dt(fin) };
  }
  // Día completo: el fin es exclusivo (último día + 1).
  const ini = new Date(ANIO, mesIdx, diaIni);
  const fin = new Date(ANIO, mesFin, diaFin + 1);
  const d = (x) => `${x.getFullYear()}${pad2(x.getMonth() + 1)}${pad2(x.getDate())}`;
  return { allDay: true, start: d(ini), end: d(fin) };
}

function googleCalUrl(titulo, desc, f) {
  let u = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(titulo)}&dates=${f.start}/${f.end}`;
  if (desc) u += `&details=${encodeURIComponent(desc)}`;
  if (!f.allDay) u += "&ctz=America/Mexico_City";
  return u;
}

function icsTexto(titulo, desc, f) {
  const esc = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const n = new Date();
  const stamp = `${n.getUTCFullYear()}${pad2(n.getUTCMonth() + 1)}${pad2(n.getUTCDate())}T${pad2(n.getUTCHours())}${pad2(n.getUTCMinutes())}${pad2(n.getUTCSeconds())}Z`;
  const uid = `elvive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@elvive`;
  const dt = (val) => (f.allDay ? `;VALUE=DATE:${val}` : `:${val}`);
  const L = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EL VIVE//Calendario//ES", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stamp}`,
    `DTSTART${dt(f.start)}`, `DTEND${dt(f.end)}`, `SUMMARY:${esc(titulo)}`,
  ];
  if (desc) L.push(`DESCRIPTION:${esc(desc)}`);
  L.push("END:VEVENT", "END:VCALENDAR");
  return L.join("\r\n");
}

// iPhone / iPad (incluye iPadOS que se reporta como Mac con pantalla táctil).
function esIOS() {
  const ua = navigator.userAgent || "";
  const iOSClasico = /iP(hone|od|ad)/.test(ua);
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSClasico || iPadOS;
}

function descargarICS(texto, nombre) {
  const blob = new Blob([texto], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 200);
}

function nombreArchivoICS(titulo) {
  const slug = titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "evento";
  return `elvive-${slug}.ics`;
}

function cerrarMenusCal() {
  document.querySelectorAll(".cal-menu:not([hidden])").forEach((m) => { m.hidden = true; });
  document.querySelectorAll(".cal-btn[aria-expanded='true']").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function initCalendario() {
  const agenda = document.getElementById("agenda");
  agenda.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".cal-btn");
    if (btn) {
      const menu = btn.parentElement.querySelector(".cal-menu");
      const abierto = !menu.hidden;
      cerrarMenusCal();
      if (!abierto) {
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
      return;
    }
    const opt = ev.target.closest(".cal-opt");
    if (!opt) return;
    const cont = opt.closest(".cal-add");
    const f = { allDay: cont.dataset.allday === "1", start: cont.dataset.start, end: cont.dataset.end };
    const titulo = cont.dataset.titulo || "Evento ÉL VIVE";
    const desc = cont.dataset.desc || "";
    if (opt.dataset.calKind === "google") {
      window.open(googleCalUrl(titulo, desc, f), "_blank", "noopener");
    } else if (esIOS() && cont.dataset.ics) {
      // iPhone/iPad: abrir el archivo .ics alojado (servido como text/calendar)
      // hace que iOS muestre la hoja "Agregar a Calendario".
      window.location.href = cont.dataset.ics;
    } else {
      // Escritorio / Android: descarga el .ics generado al momento.
      descargarICS(icsTexto(titulo, desc, f), nombreArchivoICS(titulo));
    }
    cerrarMenusCal();
  });
  // Cerrar el menú al tocar fuera.
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".cal-add")) cerrarMenusCal();
  });
}

/* ============ FILTRO ============ */
function aplicarFiltro(cat) {
  const eventos = document.querySelectorAll(".event");
  eventos.forEach((ev) => {
    const match = cat === "todos" || ev.dataset.cat === cat;
    ev.classList.toggle("filtered-out", !match);
  });
  // Ocultar meses que quedaron vacíos
  document.querySelectorAll(".month").forEach((m) => {
    const visibles = m.querySelectorAll(".event:not(.filtered-out)").length;
    m.classList.toggle("month-hidden", visibles === 0);
  });
  const algo = document.querySelectorAll(".event:not(.filtered-out)").length;
  document.getElementById("empty-state").hidden = algo !== 0;
}

/* ============ ANIMACIONES AL SCROLL ============ */
function observarReveal() {
  const mostrar = (el) => el.classList.add("in");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Revela al entrar en pantalla, o si ya quedó por encima del viewport
        // (p. ej. tras un salto de scroll o recarga con posición restaurada).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          mostrar(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => {
    // Lo que ya está visible o por encima al cargar, se muestra sin esperar.
    if (el.getBoundingClientRect().top < window.innerHeight) mostrar(el);
    else io.observe(el);
  });
}

/* ============ BOTÓN ARRIBA ============ */
function initToTop() {
  const btn = document.getElementById("to-top");
  btn.hidden = false;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", () => {
  render();
  initCalendario();
  initToTop();
});
