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
  { mes: "Junio", dia: 20, dow: "Sáb", cat: "apostolado", titulo: "Apostolado" },

  // ===== JULIO =====
  { mes: "Julio", dia: 1, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: 5, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Julio", dia: 6, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Julio", dia: 15, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Julio", dia: 18, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual" },
  { mes: "Julio", dia: 29, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },

  // ===== AGOSTO =====
  { mes: "Agosto", dia: "3 – 16", dow: "Lun a Dom", cat: "especial", titulo: "Vacaciones", desc: "Del lunes 3 al domingo 16 de agosto.", rango: true },
  { mes: "Agosto", dia: 11, dow: "Mar", cat: "misa", titulo: "Misa por el 30.º Aniversario de la Comunidad ÉL VIVE" },
  { mes: "Agosto", dia: 19, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Agosto", dia: 22, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual" },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "economica", titulo: "Actividad económica chica" },
  { mes: "Agosto", dia: 30, dow: "Dom", cat: "misa", titulo: "Misa mensual" },
  { mes: "Agosto", dia: 31, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },

  // ===== SEPTIEMBRE =====
  { mes: "Septiembre", dia: 6, dow: "Dom", cat: "misa", titulo: "Misa de Niños" },
  { mes: "Septiembre", dia: 9, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Septiembre", dia: 15, dow: "Mar", cat: "economica", titulo: "Kermés de la Parroquia La Resurrección" },
  { mes: "Septiembre", dia: 19, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual" },
  { mes: "Septiembre", dia: 23, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Septiembre", dia: 27, dow: "Dom", cat: "misa", titulo: "Misa mensual", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 28, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },

  // ===== OCTUBRE =====
  { mes: "Octubre", dia: 7, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Octubre", dia: 10, dow: "Sáb", cat: "especial", titulo: "Primera limpieza de rancho con Comunidad de Iniciación 1", desc: "Incluye un momento de convivencia, oración y encuentro en el rancho." },
  { mes: "Octubre", dia: 17, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual" },
  { mes: "Octubre", dia: 21, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "economica", titulo: "Actividad económica grande (Conferencias)" },
  { mes: "Octubre", dia: 25, dow: "Dom", cat: "misa", titulo: "Misa mensual" },
  { mes: "Octubre", dia: 26, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Octubre", dia: 27, dow: "Mar", cat: "especial", titulo: "Inicio de invitaciones para el Retiro de Compromiso 1" },

  // ===== NOVIEMBRE =====
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "economica", titulo: "Inicio de la Mega Rifa" },
  { mes: "Noviembre", dia: 4, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Noviembre", dia: 7, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual" },
  { mes: "Noviembre", dia: 15, dow: "Dom", cat: "misa", titulo: "Misa mensual y convivencia con KIDS", desc: "(O apostolado con KIDS, por definir.)" },
  { mes: "Noviembre", dia: 18, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Noviembre", dia: 23, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación" },
  { mes: "Noviembre", dia: 28, dow: "Sáb", cat: "especial", titulo: "Limpieza de rancho" },

  // ===== DICIEMBRE =====
  { mes: "Diciembre", dia: 2, dow: "Mié", cat: "consejo", titulo: "Junta de Consejo" },
  { mes: "Diciembre", dia: 5, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual" },
  { mes: "Diciembre", dia: 8, dow: "Mar", cat: "economica", titulo: "Mega Rifa" },
  { mes: "Diciembre", dia: 11, dow: "Vie", cat: "especial", titulo: "Peregrinación" },
  { mes: "Diciembre", dia: 12, dow: "Sáb", cat: "especial", titulo: "Día de la Virgen y Posada KIDS" },
  { mes: "Diciembre", dia: 13, dow: "Dom", cat: "misa", titulo: "Misa mensual y Posada de la comunidad", hora: "5:00 p.m." },
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
        ${eventos.map(eventoHTML).join("")}
      </div>
    </section>`;
  }
  agenda.innerHTML = html;
}

function eventoHTML(e) {
  const c = CATEGORIAS[e.cat];
  const hora = e.hora ? `<span class="event-time">🕐 ${e.hora}</span>` : "";
  const desc = e.desc ? `<p class="event-desc">${e.desc}</p>` : "";
  const pasado = esPasado(e) ? "past" : "";
  return `<article class="event reveal ${e.rango ? "is-range" : ""} ${pasado}" data-cat="${e.cat}" style="--cat:${c.color}">
    <div class="event-date">
      <span class="event-dow">${e.dow}</span>
      <span class="event-num">${e.dia}</span>
    </div>
    <div class="event-body">
      <h3 class="event-title">${e.titulo}</h3>
      ${desc}
      <div class="event-meta">
        ${hora}
        <span class="event-tag">${c.nombre}</span>
      </div>
    </div>
  </article>`;
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
  initToTop();
});
