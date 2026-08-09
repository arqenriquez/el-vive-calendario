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

/* ===== Estado de la interfaz (vista Lista / Mes) ===== */
let vistaActual = "lista";   // 'lista' | 'mes'
let filtroActivo = "todos";  // categoría activa (compartida entre ambas vistas)
let mesActual = 0;           // índice dentro de ORDEN_MESES (grilla mostrada)

// Etiquetas para el modal de detalle del día (ej. "Miércoles 10 de junio").
const DOW_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MAX_EVENTOS_DIA = 3; // barras visibles por celda antes de "+N más"

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

/* ===== Fechas para la vista Mes ===== */
// Fecha sin horas (para comparar solo por día).
function soloDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
// ¿Son el mismo día del calendario?
function mismaFecha(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
// Rango { inicio, fin } (objetos Date) que abarca un evento, o null si no tiene fecha.
// Soporta día único (número), rango en el mes ("24 – 26") y rango que cruza de
// mes ("31 – 2", donde el 2.º número es menor que el 1.º).
function rangoEvento(e) {
  const m1 = MES_NUM[e.mes];
  const dia = e.dia;
  if (dia === "" || dia === undefined || dia === null) return null;
  if (typeof dia === "number") {
    return { inicio: new Date(ANIO, m1, dia), fin: new Date(ANIO, m1, dia) };
  }
  const nums = String(dia).split(/[–-]/).map((s) => parseInt(s.trim(), 10));
  const d1 = nums[0];
  const d2 = nums.length > 1 && !isNaN(nums[1]) ? nums[1] : d1;
  const m2 = d2 < d1 ? m1 + 1 : m1; // el rango cruza al mes siguiente
  return { inicio: new Date(ANIO, m1, d1), fin: new Date(ANIO, m2, d2) };
}

const EVENTOS = [
  // ===== JUNIO =====
  { mes: "Junio", dia: 8, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Junio", dia: 10, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Junio", dia: 17, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },

  // ===== JULIO =====
  { mes: "Julio", dia: 1, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Hospital General del Estado (Blvd. Colosio y Quintero Arce)", mapa: "https://maps.app.goo.gl/wZGdSHUt6B2ged2w8", reprogramado: true },
  { mes: "Julio", dia: 1, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: 5, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Julio", dia: 6, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Julio", dia: 15, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: "24 – 26", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #121 de Monterrey", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Julio", dia: 29, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Julio", dia: 29, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: "31 – 2", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #122 de Monterrey", desc: "Nos unimos todos en oración", rango: true },

  // ===== AGOSTO =====
  { mes: "Agosto", dia: "3 – 16", dow: "Lun a Dom", cat: "especial", titulo: "Vacaciones", desc: "Del lunes 3 al domingo 16 de agosto.", rango: true },
  { mes: "Agosto", dia: 11, dow: "Mar", cat: "misa", titulo: "Misa por el 30.º Aniversario de la Comunidad ÉL VIVE" },
  { mes: "Agosto", dia: 19, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Agosto", dia: 19, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Agosto", dia: 24, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "economica", titulo: "Actividad económica chica" },
  { mes: "Agosto", dia: 30, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },

  // ===== SEPTIEMBRE =====
  { mes: "Septiembre", dia: "4 – 6", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #3 de Chihuahua", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Septiembre", dia: 6, dow: "Dom", cat: "misa", titulo: "Misa de Niños", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 9, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Septiembre", dia: 15, dow: "Mar", cat: "economica", titulo: "Kermés de la Parroquia La Resurrección" },
  { mes: "Septiembre", dia: 23, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Septiembre", dia: 23, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Septiembre", dia: 27, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 28, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },

  // ===== OCTUBRE =====
  { mes: "Octubre", dia: 7, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Octubre", dia: 10, dow: "Sáb", cat: "especial", titulo: "Primera limpieza de rancho con Comunidad de Iniciación 1", desc: "Incluye un momento de convivencia, oración y encuentro en el rancho." },
  { mes: "Octubre", dia: 14, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Octubre", dia: 21, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "economica", titulo: "Actividad económica grande (Conferencias)" },
  { mes: "Octubre", dia: 25, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Octubre", dia: 26, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Octubre", dia: 27, dow: "Mar", cat: "especial", titulo: "Inicio de invitaciones para el Retiro de Compromiso 1" },

  // ===== NOVIEMBRE =====
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "economica", titulo: "Inicio de la Mega Rifa" },
  { mes: "Noviembre", dia: 4, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Noviembre", dia: 14, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Noviembre", dia: 15, dow: "Dom", cat: "misa", titulo: "Misa mensual y convivencia con KIDS", desc: "(O apostolado con KIDS, por definir.)", hora: "5:00 p.m." },
  { mes: "Noviembre", dia: 18, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Noviembre", dia: 23, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },

  // ===== DICIEMBRE =====
  { mes: "Diciembre", dia: 2, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Diciembre", dia: "4 – 6", dow: "Vie a Dom", cat: "especial", titulo: "Retiro de Compromiso", desc: "Retiro de compromiso INI#1 HMO", rango: true },
  { mes: "Diciembre", dia: 8, dow: "Mar", cat: "economica", titulo: "Mega Rifa" },
  { mes: "Diciembre", dia: 9, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Diciembre", dia: 11, dow: "Vie", cat: "especial", titulo: "Peregrinación" },
  { mes: "Diciembre", dia: 12, dow: "Sáb", cat: "especial", titulo: "Día de la Virgen, misa y Posada KIDS" },
  { mes: "Diciembre", dia: 14, dow: "Lun", cat: "especial", titulo: "Posada durante la junta", desc: "Última junta del mes de diciembre." },
  { mes: "Diciembre", dia: 16, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Diciembre", dia: 17, dow: "Jue", cat: "especial", titulo: "Última Hora Santa del año" },
];

/* ============ RENDER ============ */
function render() {
  renderFiltros();
  renderAgenda();
  observarReveal();
}

function renderFiltros() {
  const cont = document.getElementById("filter-dropdown");
  const opciones = [
    `<button class="filter-option is-active" role="menuitemradio" aria-checked="true" data-cat="todos" style="--cat:var(--vino)"><span class="dot"></span>Todos</button>`,
  ];
  for (const [key, c] of Object.entries(CATEGORIAS)) {
    opciones.push(
      `<button class="filter-option" role="menuitemradio" aria-checked="false" data-cat="${key}" style="--cat:${c.color}"><span class="dot"></span>${c.nombre}</button>`
    );
  }
  cont.innerHTML = opciones.join("");
  cont.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-option");
    if (!btn) return;
    seleccionarFiltro(btn.dataset.cat);
    cerrarMenuFiltro();
    document.getElementById("filter-toggle").focus();
  });
}

// Marca la opción activa, actualiza la etiqueta del botón y aplica el filtro.
function seleccionarFiltro(cat) {
  document.querySelectorAll(".filter-option").forEach((b) => {
    const on = b.dataset.cat === cat;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
  const toggle = document.getElementById("filter-toggle");
  const label = document.getElementById("filter-toggle-label");
  if (cat === "todos") {
    label.textContent = "Tipo de junta";
    toggle.classList.remove("has-filter");
    toggle.style.removeProperty("--cat");
  } else {
    label.textContent = CATEGORIAS[cat].nombre;
    toggle.classList.add("has-filter");
    toggle.style.setProperty("--cat", CATEGORIAS[cat].color);
  }
  aplicarFiltro(cat);
}

/* ===== Menú desplegable de filtros ===== */
function abrirMenuFiltro() {
  document.getElementById("filter-dropdown").hidden = false;
  document.getElementById("filter-toggle").setAttribute("aria-expanded", "true");
}
function cerrarMenuFiltro() {
  document.getElementById("filter-dropdown").hidden = true;
  document.getElementById("filter-toggle").setAttribute("aria-expanded", "false");
}
function initMenuFiltro() {
  const btn = document.getElementById("filter-toggle");
  const dd = document.getElementById("filter-dropdown");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dd.hidden ? abrirMenuFiltro() : cerrarMenuFiltro();
  });
  // Clic fuera del menú → cerrar.
  document.addEventListener("click", (e) => {
    if (!dd.hidden && !e.target.closest("#filter-menu")) cerrarMenuFiltro();
  });
  // Esc → cerrar.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dd.hidden) cerrarMenuFiltro();
  });
}

function renderAgenda() {
  const agenda = document.getElementById("agenda");
  let html = "";
  for (const mes of ORDEN_MESES) {
    const eventos = EVENTOS.filter((e) => e.mes === mes);
    if (!eventos.length) continue;

    // Un mes está "cerrado" cuando TODAS sus fechas ya pasaron: se muestra
    // contraído (solo el título) y se despliega al dar clic. Así la página se
    // concentra en el mes vigente y los anteriores quedan como consulta.
    const cerrado = eventos.every(esPasado);

    const headInner = `
        <span class="month-name">${mes}</span>
        <span class="month-year">${ANIO}</span>
        <span class="month-line"></span>
        ${cerrado ? `<span class="month-count">Ver fechas anteriores</span><span class="month-chevron" aria-hidden="true">▾</span>` : ""}`;

    const head = cerrado
      ? `<button class="month-head month-head--toggle reveal" type="button" aria-expanded="false" aria-controls="tl-${mes}">${headInner}</button>`
      : `<div class="month-head reveal">${headInner}</div>`;

    html += `<section class="month ${cerrado ? "month--collapsible is-collapsed" : ""}" data-mes="${mes}">
      ${head}
      <div class="timeline" id="tl-${mes}">
        ${eventos.map((e) => eventoHTML(e, EVENTOS.indexOf(e))).join("")}
      </div>
    </section>`;
  }
  agenda.innerHTML = html;
}

/* Despliega u oculta los meses ya cerrados (toggle contraído por default). */
function initColapsables() {
  const agenda = document.getElementById("agenda");
  agenda.addEventListener("click", (e) => {
    const head = e.target.closest(".month-head--toggle");
    if (!head) return;
    const section = head.closest(".month");
    const contraido = section.classList.toggle("is-collapsed");
    head.setAttribute("aria-expanded", contraido ? "false" : "true");
  });
}

function eventoHTML(e, idx) {
  const c = CATEGORIAS[e.cat];
  const hora = e.hora ? `<span class="event-time">🕐 ${e.hora}</span>` : "";
  const desc = e.desc ? `<p class="event-desc">${e.desc}</p>` : "";
  const pasado = esPasado(e) ? "past" : "";
  const doneCheck = esPasado(e)
    ? `<span class="event-done" title="Ya se realizó" aria-label="Ya se realizó">✓</span>`
    : "";

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

  // Botón "Ver ubicación" (solo si el evento trae link de Google Maps).
  const mapa = e.mapa
    ? `<a class="event-map" href="${e.mapa}" target="_blank" rel="noopener noreferrer">📍 Ver ubicación</a>`
    : "";

  // Aviso de reprogramación / cambio de fecha.
  const reprog = e.reprogramado
    ? `<p class="event-reprog">🔁 Fecha actualizada</p>`
    : "";

  return `<article class="event reveal ${e.rango ? "is-range" : ""} ${pasado}" data-cat="${e.cat}" style="--cat:${c.color}">
    ${doneCheck}
    <div class="event-date${sinFecha ? " event-date--tbd" : ""}">
      ${fechaBox}
    </div>
    <div class="event-body">
      <h3 class="event-title">${e.titulo}</h3>
      ${reprog}
      ${desc}
      <div class="event-meta">
        ${hora}
        ${mapa}
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

// Maneja clics en los botones "Agregar a tu calendario" (usado tanto en la
// Lista como dentro del modal de detalle del día).
function manejarClicCalendario(ev) {
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
}

function initCalendario() {
  document.getElementById("agenda").addEventListener("click", manejarClicCalendario);
  document.getElementById("dia-events").addEventListener("click", manejarClicCalendario);
  // Cerrar el menú al tocar fuera.
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".cal-add")) cerrarMenusCal();
  });
}

/* ============ FILTRO (compartido entre Lista y Mes) ============ */
function aplicarFiltro(cat) {
  filtroActivo = cat;
  // Filtrado de la Lista (solo dentro de #agenda: no tocar tarjetas del modal).
  const eventos = document.querySelectorAll("#agenda .event");
  eventos.forEach((ev) => {
    const match = cat === "todos" || ev.dataset.cat === cat;
    ev.classList.toggle("filtered-out", !match);
  });
  // Ocultar meses que quedaron vacíos
  document.querySelectorAll(".month").forEach((m) => {
    const visibles = m.querySelectorAll(".event:not(.filtered-out)").length;
    m.classList.toggle("month-hidden", visibles === 0);
  });
  const algo = document.querySelectorAll("#agenda .event:not(.filtered-out)").length;
  // El aviso "sin actividades" de la Lista solo aplica cuando la Lista está visible.
  document.getElementById("empty-state").hidden = vistaActual !== "lista" || algo !== 0;
  // Si la grilla está activa, reflejar el filtro también ahí.
  if (vistaActual === "mes") renderMes();
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

/* ===================================================
   VISTA MES (grilla mensual) + toggle Lista / Mes
   =================================================== */

// Restaura el scroll del body solo si el modal del día está cerrado.
function restaurarScroll() {
  if (document.getElementById("dia-modal").hidden) document.body.style.overflow = "";
}

// Mes inicial de la grilla: el mes real actual si cae en el rango Jun–Dic 2026;
// si no, el extremo más cercano.
function mesInicial() {
  const hoy = new Date();
  if (hoy.getFullYear() !== ANIO) return hoy.getFullYear() < ANIO ? 0 : ORDEN_MESES.length - 1;
  const idx = hoy.getMonth() - MES_NUM["Junio"]; // Junio = índice 0 de ORDEN_MESES
  return Math.max(0, Math.min(ORDEN_MESES.length - 1, idx));
}

// Cambia entre vista Lista y vista Mes.
function setVista(v) {
  vistaActual = v;
  document.querySelectorAll(".view-btn").forEach((b) => {
    const on = b.dataset.vista === v;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const esMes = v === "mes";
  document.getElementById("agenda").hidden = esMes;
  document.getElementById("mes-view").hidden = !esMes;
  if (esMes) {
    document.getElementById("empty-state").hidden = true; // el aviso de la Lista no aplica aquí
    renderMes();
  } else {
    aplicarFiltro(filtroActivo); // recomputa el estado visible de la Lista
  }
}

// Reconstruye la grilla del mes actual aplicando el filtro activo.
function renderMes() {
  const mesNombre = ORDEN_MESES[mesActual];
  const jsMonth = MES_NUM[mesNombre];
  document.getElementById("mes-title").textContent = `${mesNombre} ${ANIO}`;

  // Flechas: deshabilitadas en los límites del rango permitido (Jun–Dic 2026).
  document.getElementById("mes-prev").disabled = mesActual === 0;
  document.getElementById("mes-next").disabled = mesActual === ORDEN_MESES.length - 1;

  // Eventos con fecha que pasan el filtro (los "sin fecha" no entran a la grilla).
  const visibles = EVENTOS.filter((e) => filtroActivo === "todos" || e.cat === filtroActivo);

  // Grilla lunes→domingo, 6 filas fijas (42 celdas) para altura consistente.
  const primero = new Date(ANIO, jsMonth, 1);
  const leadDow = (primero.getDay() + 6) % 7; // 0 = lunes
  const inicioGrid = new Date(ANIO, jsMonth, 1 - leadDow);
  const hoy = soloDia(new Date());

  let html = "";
  let hayEnMes = false;

  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrid.getFullYear(), inicioGrid.getMonth(), inicioGrid.getDate() + i);
    const enMes = d.getMonth() === jsMonth;
    const esHoy = mismaFecha(d, hoy);

    // Eventos cuyo rango cubre este día.
    const delDia = visibles.filter((e) => {
      const r = rangoEvento(e);
      return r && d >= soloDia(r.inicio) && d <= soloDia(r.fin);
    });
    if (enMes && delDia.length) hayEnMes = true;

    const barras = delDia.slice(0, MAX_EVENTOS_DIA).map((e) => {
      const r = rangoEvento(e);
      const ini = mismaFecha(d, soloDia(r.inicio));
      const fin = mismaFecha(d, soloDia(r.fin));
      // Barra continua en rangos: solo se redondea en el 1.º y último día.
      const extremos = `${ini ? "is-start" : ""} ${fin ? "is-end" : ""}`.trim();
      const texto = e.rango ? e.titulo : CATEGORIAS[e.cat].nombre;
      return `<span class="mes-bar ${extremos}" style="--cat:${CATEGORIAS[e.cat].color}" title="${e.titulo}">${texto}</span>`;
    }).join("");
    const extra = delDia.length - MAX_EVENTOS_DIA;
    const mas = extra > 0 ? `<span class="mes-more">+${extra} más</span>` : "";

    const clases = ["mes-cell", enMes ? "" : "mes-cell--out", delDia.length ? "has-eventos" : ""]
      .filter(Boolean).join(" ");
    const fechaKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    html += `<div class="${clases}" data-fecha="${fechaKey}">
      <span class="mes-daynum${esHoy ? " is-today" : ""}">${d.getDate()}</span>
      <div class="mes-bars">${barras}${mas}</div>
    </div>`;
  }

  document.getElementById("mes-grid").innerHTML = html;
  document.getElementById("mes-empty").hidden = hayEnMes;
}

// Abre el modal con el detalle de un día (reutiliza la tarjeta de la Lista).
function abrirDia(fecha) {
  const dia = soloDia(fecha);
  const delDia = EVENTOS.filter((e) => {
    if (filtroActivo !== "todos" && e.cat !== filtroActivo) return false;
    const r = rangoEvento(e);
    return r && dia >= soloDia(r.inicio) && dia <= soloDia(r.fin);
  });
  if (!delDia.length) return;

  document.getElementById("dia-title").textContent =
    `${DOW_LARGO[fecha.getDay()]} ${fecha.getDate()} de ${MESES_LARGO[fecha.getMonth()]}`;
  const cont = document.getElementById("dia-events");
  // Reutiliza la tarjeta de la Lista (con su índice real para el botón de calendario).
  cont.innerHTML = delDia.map((e) => eventoHTML(e, EVENTOS.indexOf(e))).join("");
  // Las tarjetas nacen con .reveal (opacity:0); dentro del modal las mostramos ya.
  cont.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));

  const modal = document.getElementById("dia-modal");
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("dia-close").focus();
}

function cerrarDia() {
  cerrarMenusCal(); // por si quedó abierto un menú "Agregar a calendario" dentro
  const modal = document.getElementById("dia-modal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  restaurarScroll();
}

function initToggle() {
  document.getElementById("view-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".view-btn");
    if (btn) setVista(btn.dataset.vista);
  });
}

function initMes() {
  mesActual = mesInicial();
  document.getElementById("mes-prev").addEventListener("click", () => {
    if (mesActual > 0) { mesActual--; renderMes(); }
  });
  document.getElementById("mes-next").addEventListener("click", () => {
    if (mesActual < ORDEN_MESES.length - 1) { mesActual++; renderMes(); }
  });
  // Clic en una celda con eventos → abre el modal del día.
  document.getElementById("mes-grid").addEventListener("click", (e) => {
    const cell = e.target.closest(".mes-cell.has-eventos");
    if (!cell) return;
    const [y, m, dd] = cell.dataset.fecha.split("-").map(Number);
    abrirDia(new Date(y, m, dd));
  });
}

function initDiaModal() {
  const modal = document.getElementById("dia-modal");
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-dclose")) cerrarDia();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) cerrarDia();
  });
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", () => {
  render();
  initColapsables();
  initCalendario();
  initToTop();
  initMenuFiltro();
  initToggle();
  initMes();
  initDiaModal();
});
