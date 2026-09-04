/* ===================================================================
   FLUJO DE EFECTIVO MX · Interfaz
   Dibuja el tablero, las cartas y los paneles; llama al motor.
   =================================================================== */

(function () {
  const D = CF.DATOS;
  const M = CF.Motor;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const el = (tag, clase, html) => {
    const n = document.createElement(tag);
    if (clase) n.className = clase;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const $m = (n) => M.moneda(n);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let dadosElegidos = 1;

  /* =================================================================
     ARRANQUE
     ================================================================= */
  function iniciar() {
    const guardado = M.hayGuardado();
    if (guardado) {
      const btn = $("#btn-continuar");
      btn.hidden = false;
      btn.textContent = `Continuar partida (${guardado.profesion}, turno ${guardado.turno})`;
    }

    $("#btn-continuar").addEventListener("click", () => {
      if (M.cargarGuardado()) irAJuego();
    });
    $("#btn-nueva").addEventListener("click", abrirSelectorProfesion);
    $("#btn-cancelar-seleccion").addEventListener("click", () => {
      $("#selector-profesion").hidden = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("#btn-como").addEventListener("click", panelComoSeJuega);
    $("#btn-glosario-inicio").addEventListener("click", panelGlosario);

    $("#btn-tirar").addEventListener("click", tirar);
    $("#btn-estado").addEventListener("click", panelEstado);
    $("#btn-banco").addEventListener("click", panelBanco);
    $("#btn-registro").addEventListener("click", panelRegistro);
    $("#btn-menu").addEventListener("click", panelMenu);
    $("#btn-cerrar-panel").addEventListener("click", cerrarPanel);
    $("#panel-fondo").addEventListener("click", (ev) => { if (ev.target.id === "panel-fondo") cerrarPanel(); });

    $$("#selector-dados .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        dadosElegidos = Number(chip.dataset.dados);
        pintarChipsDados();
      });
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      const modalAbierto = !$("#modal-fondo").classList.contains("oculto");
      const panelAbierto = !$("#panel-fondo").classList.contains("oculto");
      if (panelAbierto) return;
      ev.preventDefault();
      if (modalAbierto) {
        const b = $("#modal-pie .btn-primario") || $("#modal-pie .btn");
        if (b && !b.disabled) b.click();
      } else if ($("#pantalla-juego").classList.contains("oculta") === false) {
        tirar();
      }
    });
  }

  function abrirSelectorProfesion() {
    const cont = $("#prof-grid");
    cont.innerHTML = "";
    D.PROFESIONES.forEach((p) => {
      const gastos = p.gastos.reduce((s, g) => s + g.monto, 0);
      const flujo = p.salario - gastos;
      const deuda = p.gastos.reduce((s, g) => s + (g.pasivo ? g.pasivo.saldo : 0), 0);
      const card = el("button", "prof-card");
      card.innerHTML = `
        <div class="prof-cabeza">
          <span class="prof-emoji">${p.emoji}</span>
          <span class="prof-nombre">${esc(p.nombre)}</span>
        </div>
        <p class="prof-resumen">${esc(p.resumen)}</p>
        <div class="prof-nums">
          <div class="prof-num"><span class="etq">Sueldo</span><strong>${$m(p.salario)}</strong></div>
          <div class="prof-num ${flujo >= 5000 ? "bien" : "mal"}"><span class="etq">Flujo</span><strong>${$m(flujo)}</strong></div>
          <div class="prof-num"><span class="etq">Deudas</span><strong>${$m(deuda)}</strong></div>
        </div>`;
      card.addEventListener("click", () => {
        M.nuevoJuego(p.id);
        dadosElegidos = 1;
        irAJuego();
      });
      cont.appendChild(card);
    });
    $("#selector-profesion").hidden = false;
    $("#selector-profesion").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function irAJuego() {
    $("#pantalla-inicio").classList.add("oculta");
    $("#pantalla-juego").classList.remove("oculta");
    window.scrollTo(0, 0);
    renderTodo();
    if (M.estado.fase === "ganado") return mostrarVictoria();
    if (M.estado.pendiente) abrirModal();
  }

  /* =================================================================
     RENDER GENERAL
     ================================================================= */
  function enVR() { return M.estado.fase === "viaRapida" || (M.estado.fase === "ganado" && M.estado.vr); }

  function renderTodo() {
    const e = M.estado;
    if (!e) return;

    $("#barra-emoji").textContent = e.emoji;
    $("#barra-profesion").textContent = enVR() ? "Vía Rápida · " + e.profesion : e.profesion;
    $("#barra-turno").textContent = e.turno;
    $("#barra-efectivo").textContent = $m(e.efectivo);
    $(".barra-efectivo").classList.toggle("negativo", e.efectivo < 0);

    renderMeta();
    renderTablero();
    renderCentro();

    const btn = $("#btn-tirar");
    btn.disabled = !!e.pendiente || e.fase === "ganado";
    if (e.turnosPerdidos > 0) btn.textContent = `Perder turno (${e.turnosPerdidos} restantes)`;
    else btn.textContent = dadosElegidos > 1 ? `Tirar ${dadosElegidos} dados` : "Tirar dado";

    const selDados = $("#selector-dados");
    const puede = M.dadosDisponibles() > 1 && e.fase !== "ganado";
    selDados.classList.toggle("oculto", !puede);
    if (!puede) dadosElegidos = 1;
    pintarChipsDados();
  }

  function pintarChipsDados() {
    $$("#selector-dados .chip").forEach((c) => c.classList.toggle("activo", Number(c.dataset.dados) === dadosElegidos));
    const btn = $("#btn-tirar");
    if (btn && !M.estado.pendiente && M.estado.turnosPerdidos === 0) {
      btn.textContent = dadosElegidos > 1 ? `Tirar ${dadosElegidos} dados` : "Tirar dado";
    }
  }

  function renderMeta() {
    const e = M.estado;
    if (enVR()) {
      const flujoNeg = M.flujoNegociosVR();
      const meta = e.vr.meta;
      $("#meta-pasivo").textContent = $m(flujoNeg);
      $("#meta-gastos").textContent = $m(meta);
      $("#meta-fill").style.width = Math.min(100, (flujoNeg / meta) * 100) + "%";
      $(".meta-textos").children[0].firstChild.textContent = "Flujo de tus negocios ";
      $(".meta-textos").children[1].firstChild.textContent = "Meta ";
      $("#meta-nota").textContent = e.vr.sueno
        ? "¡Cumpliste tu sueño!"
        : "Compra tu sueño o llega a medio millón de flujo mensual.";
      return;
    }
    const pasivo = M.ingresoPasivo();
    const gastos = M.gastosTotales();
    $("#meta-pasivo").textContent = $m(pasivo);
    $("#meta-gastos").textContent = $m(gastos);
    $("#meta-fill").style.width = (M.progresoMeta() * 100).toFixed(1) + "%";
    const falta = gastos - pasivo;
    $("#meta-nota").textContent = falta > 0
      ? `Te faltan ${$m(falta)} de ingreso pasivo para salir de la carrera de la rata.`
      : "¡Tu ingreso pasivo ya cubre tus gastos!";
  }

  // Perímetro de un tablero de 7x7 = 24 casillas.
  function coordenada(i) {
    if (i <= 6) return { r: 1, c: i + 1 };
    if (i <= 12) return { r: i - 5, c: 7 };
    if (i <= 18) return { r: 7, c: 7 - (i - 12) };
    return { r: 7 - (i - 18), c: 1 };
  }

  function renderTablero() {
    const e = M.estado;
    const tablero = enVR() ? D.VIA_RAPIDA_TABLERO : D.TABLERO;
    const defs = enVR() ? D.CASILLAS_VR : D.CASILLAS;
    const pos = enVR() ? e.vr.posicion : e.posicion;

    const cont = $("#tablero");
    cont.innerHTML = "";
    tablero.forEach((casilla, i) => {
      const def = defs[casilla.tipo];
      const { r, c } = coordenada(i);
      const nodo = el("div", "casilla" + (i === pos ? " activa" : ""));
      nodo.style.gridRow = r;
      nodo.style.gridColumn = c;
      nodo.style.color = def.color;
      nodo.innerHTML = `<span>${def.emoji}</span><span class="cas-etq">${esc(def.corto || def.nombre)}</span>`;
      if (i === pos) nodo.appendChild(el("span", "ficha"));
      cont.appendChild(nodo);
    });
  }

  function renderCentro() {
    const e = M.estado;
    const flujo = enVR() ? M.flujoVR() : M.flujoMensual();
    $("#centro-flujo").textContent = $m(flujo);
    $(".centro-flujo").classList.toggle("negativo", flujo < 0);
    const nota = $("#centro-nota");
    if (e.fase === "ganado") nota.textContent = "¡Ganaste!";
    else if (e.pendiente) nota.textContent = "Resuelve la carta";
    else if (e.turnosPerdidos > 0) nota.textContent = `Pierdes ${e.turnosPerdidos} turno(s)`;
    else nota.textContent = enVR() ? "Vía Rápida" : "Tira el dado para avanzar";

    const dados = $("#dados");
    if (e.ultimoDado && e.ultimoDado.length) {
      dados.innerHTML = e.ultimoDado.map((d) => `<span class="dado">${d}</span>`).join("");
    }
  }

  /* =================================================================
     TIRAR
     ================================================================= */
  function tirar() {
    const e = M.estado;
    if (!e || e.pendiente || e.fase === "ganado") return;
    const n = Math.min(dadosElegidos, M.dadosDisponibles());

    const dados = $("#dados");
    dados.innerHTML = Array.from({ length: n }, () => `<span class="dado girando">?</span>`).join("");

    setTimeout(() => {
      const res = M.tirar(n);
      dadosElegidos = 1;
      renderTodo();
      if (!res) return;
      if (res.perdido) {
        mostrarAviso("Pierdes el turno por el recorte de personal", "mal");
        return;
      }
      if (M.estado.fase === "ganado") return mostrarVictoria();
      if (M.estado.pendiente) abrirModal();
    }, 420);
  }

  /* =================================================================
     MODALES
     ================================================================= */
  function abrirModal() {
    $("#modal-fondo").classList.remove("oculto");
    renderModal();
  }
  function cerrarModal() {
    $("#modal-fondo").classList.add("oculto");
  }

  function cabezaModal(icono, etiqueta, titulo) {
    $("#modal-icono").textContent = icono;
    $("#modal-etiqueta").textContent = etiqueta;
    $("#modal-titulo").textContent = titulo;
  }

  function filaDato(etq, valor, clase) {
    return `<div class="fila-dato ${clase || ""}"><span>${esc(etq)}</span><strong>${valor}</strong></div>`;
  }

  /** Cierra la carta y termina el turno, respetando cambios de fase. */
  function continuarTurno() {
    if (M.estado.fase === "ganado") { renderTodo(); return mostrarVictoria(); }
    if (M.estado.pendiente && M.estado.pendiente.clase === "vr-inicio") { renderTodo(); return renderModal(); }
    M.cerrarPendiente();
    cerrarModal();
    renderTodo();
  }

  function renderModal() {
    const p = M.estado.pendiente;
    if (!p) return cerrarModal();
    const cuerpo = $("#modal-cuerpo");
    const pie = $("#modal-pie");
    cuerpo.innerHTML = "";
    pie.innerHTML = "";

    switch (p.clase) {
      case "aviso": return modalAviso(p, cuerpo, pie);
      case "elegir-trato": return modalElegirTrato(cuerpo, pie);
      case "trato": return modalTrato(p, cuerpo, pie);
      case "mercado": return modalMercado(p, cuerpo, pie);
      case "caridad": return modalCaridad(p, cuerpo, pie);
      case "vr-inicio": return modalVRInicio(p, cuerpo, pie);
      case "vr-negocio": return modalVRNegocio(p, cuerpo, pie);
      case "vr-sueno": return modalVRSueno(p, cuerpo, pie);
      default: return modalAviso(p, cuerpo, pie);
    }
  }

  function modalAviso(p, cuerpo, pie) {
    cabezaModal(p.icono || "ℹ️", p.etiqueta || "Casilla", p.titulo || "");
    let html = "";
    if (p.texto) html += `<p class="texto-carta">${esc(p.texto)}</p>`;
    if (p.detalle) html += `<div class="tabla-datos">${filaDato("Resultado", esc(p.detalle))}</div>`;
    if (p.nota) html += `<p class="nota-carta"><b>Para tenerlo claro:</b> ${esc(p.nota)}</p>`;
    cuerpo.innerHTML = html;
    const btn = el("button", "btn btn-primario", "Continuar");
    btn.addEventListener("click", continuarTurno);
    pie.appendChild(btn);
  }

  function modalElegirTrato(cuerpo, pie) {
    cabezaModal("💡", "Oportunidad", "¿Trato pequeño o trato grande?");
    const cont = el("div", "eleccion");

    const chico = el("button", "opcion-trato", `
      <span class="t">Trato pequeño</span>
      <span class="d">Inversiones de entrada: CETES, pagarés, acciones de la BMV, FIBRAs, una casita para rentar o un negocio chico. Desde unos miles de pesos.</span>`);
    chico.addEventListener("click", () => { M.elegirTrato("pequenos"); renderModal(); });

    const grande = el("button", "opcion-trato", `
      <span class="t">Trato grande</span>
      <span class="d">Operaciones fuertes: edificios, bodegas industriales, franquicias, hoteles. Piden capital serio y dan flujo serio.</span>`);
    grande.addEventListener("click", () => { M.elegirTrato("grandes"); renderModal(); });

    cont.appendChild(chico);
    cont.appendChild(grande);
    cuerpo.appendChild(cont);
    cuerpo.appendChild(el("p", "nota-carta",
      `<b>Efectivo disponible:</b> ${$m(M.estado.efectivo)}. Si un trato te queda grande, puedes pedir un préstamo desde el panel del Banco... pero cada peso prestado te cuesta flujo cada mes.`));
  }

  function modalTrato(p, cuerpo, pie) {
    const c = p.carta;
    const esAccion = c.tipo === "acciones";
    const etiqueta = p.mazo === "grandes" ? "Trato grande" : "Trato pequeño";
    const icono = { acciones: "📈", "renta-fija": "🏦", inmueble: "🏠", negocio: "🏪", salario: "🎓" }[c.tipo] || "💡";
    cabezaModal(icono, etiqueta, esAccion ? `${c.ticker} · ${c.nombre}` : c.titulo);

    // Cantidad de títulos para acciones/FIBRAs
    let unidades = 1;
    if (esAccion) {
      const posible = Math.floor(M.estado.efectivo / c.precio);
      unidades = Math.max(1, Math.min(posible, Math.floor(posible * 0.5) || 1));
    }

    const bloqueTexto = el("div");
    bloqueTexto.innerHTML =
      `<p class="texto-carta">${esc(c.texto)}</p>` +
      (c.riesgo ? `<p style="margin:8px 0 0"><span class="etiqueta-riesgo riesgo-${c.riesgo.replace(/\s/g, "")}">Riesgo ${esc(c.riesgo)}</span></p>` : "");
    cuerpo.appendChild(bloqueTexto);

    let stepper = null;
    if (esAccion) {
      stepper = el("div", "campo");
      stepper.innerHTML = `
        <label>¿Cuántos títulos compras?</label>
        <div class="stepper">
          <button type="button" data-paso="-1">−</button>
          <input type="number" min="0" step="1" value="${unidades}" id="inp-unidades" />
          <button type="button" data-paso="1">+</button>
        </div>
        <div class="stepper-atajos">
          <button class="chip" data-set="10">10</button>
          <button class="chip" data-set="100">100</button>
          <button class="chip" data-set="1000">1,000</button>
          <button class="chip" data-max="1">Máximo</button>
        </div>`;
      cuerpo.appendChild(stepper);
    }

    const tabla = el("div", "tabla-datos");
    cuerpo.appendChild(tabla);
    if (c.nota) cuerpo.appendChild(el("p", "nota-carta", `<b>Para tenerlo claro:</b> ${esc(c.nota)}`));

    const btnComprar = el("button", "btn btn-primario", "Comprar");
    const btnPasar = el("button", "btn btn-fantasma", "Pasar");
    const btnPrestamo = el("button", "btn btn-secundario", "Pedir préstamo");
    const fila = el("div", "fila");
    fila.appendChild(btnComprar);
    fila.appendChild(btnPasar);
    pie.appendChild(fila);

    function leerUnidades() {
      if (!esAccion) return 0;
      const v = Number($("#inp-unidades").value);
      return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
    }

    function refrescar() {
      const u = leerUnidades();
      if (c.tipo === "salario") {
        tabla.innerHTML =
          filaDato("Costo del curso", $m(c.costo)) +
          filaDato("Aumento de sueldo", "+" + $m(c.aumento) + " al mes", "destacada") +
          filaDato("Se recupera en", Math.ceil(c.costo / c.aumento) + " meses") +
          filaDato("Tu efectivo", $m(M.estado.efectivo), M.estado.efectivo < c.costo ? "alerta" : "");
        btnComprar.disabled = M.estado.efectivo < c.costo;
        btnComprar.textContent = "Inscribirme";
      } else {
        const an = M.analizarTrato(c, u);
        let html = an.detalle.map((d) => filaDato(d[0], d[1])).join("");
        html += filaDato("Sale de tu bolsa", $m(an.costo), M.estado.efectivo < an.costo ? "alerta" : "");
        html += filaDato("Flujo mensual que suma", (an.flujo >= 0 ? "+" : "") + $m(an.flujo), an.flujo > 0 ? "destacada" : "");
        if (an.costo > 0) {
          html += filaDato("Rendimiento anual sobre tu dinero", (an.rendimiento * 100).toFixed(1) + "%",
            an.rendimiento >= 0.09 ? "destacada" : (an.rendimiento < 0.05 ? "alerta" : ""));
        }
        html += filaDato("Tu efectivo", $m(M.estado.efectivo));
        tabla.innerHTML = html;
        btnComprar.disabled = an.costo <= 0 || M.estado.efectivo < an.costo;
        btnComprar.textContent = an.costo > 0 ? `Comprar por ${$m(an.costo)}` : "Comprar";

        if (M.estado.efectivo < an.costo && an.costo > 0) {
          if (!pie.contains(btnPrestamo)) pie.appendChild(btnPrestamo);
        } else if (pie.contains(btnPrestamo)) {
          pie.removeChild(btnPrestamo);
        }
      }
    }

    if (stepper) {
      stepper.addEventListener("click", (ev) => {
        const b = ev.target.closest("button");
        if (!b) return;
        const inp = $("#inp-unidades");
        if (b.dataset.paso) inp.value = Math.max(0, leerUnidades() + Number(b.dataset.paso));
        else if (b.dataset.set) inp.value = Number(b.dataset.set);
        else if (b.dataset.max) inp.value = Math.floor(M.estado.efectivo / c.precio);
        refrescar();
      });
      stepper.addEventListener("input", refrescar);
    }

    btnPrestamo.addEventListener("click", () => {
      const an = M.analizarTrato(c, leerUnidades());
      const falta = an.costo - M.estado.efectivo;
      const monto = Math.ceil(falta / 10000) * 10000;
      if (!confirm(`¿Pedir ${$m(monto)} al banco?\n\nTe costará ${$m(monto * 0.10)} de pago mensual, para siempre, hasta que lo liquides.`)) return;
      M.pedirPrestamo(monto);
      mostrarAviso(`Préstamo de ${$m(monto)} aprobado`, "mal");
      renderTodo();
      refrescar();
    });

    btnComprar.addEventListener("click", () => {
      const res = M.comprarTrato(c, leerUnidades());
      if (!res.ok) return mostrarAviso(res.msg, "mal");
      mostrarAviso(res.msg, "bien");
      continuarTurno();
    });

    btnPasar.addEventListener("click", () => {
      M.log(`Pasas el trato: ${c.titulo || c.ticker}.`, "info");
      continuarTurno();
    });

    refrescar();
  }

  function modalMercado(p, cuerpo, pie) {
    cabezaModal("📈", "El mercado", p.titulo);
    cuerpo.innerHTML = `<p class="texto-carta">${esc(p.texto)}</p>`;

    if (!p.ofertas || !p.ofertas.length) {
      cuerpo.appendChild(el("div", "tabla-datos", filaDato("Resultado", esc(p.sinEfecto || "Esta carta no te afecta."))));
    } else {
      const lista = el("div", "bloque");
      p.ofertas.forEach((of) => {
        const valor = of.valor != null ? of.valor : of.costo;
        const ganancia = of.precio - valor;
        const neto = of.neto != null ? of.neto : of.precio;
        const nodo = el("div", "oferta");
        const hayVarias = of.unidades && of.unidades > 1;
        nodo.innerHTML = `
          <div class="oferta-cabeza">
            <span class="oferta-nombre">${esc(of.nombre)}</span>
            <span class="oferta-precio">${$m(of.precio)}</span>
          </div>
          <div class="oferta-datos">
            Lo compraste en ${$m(valor)} ·
            <span class="${ganancia >= 0 ? "ganancia-positiva" : "ganancia-negativa"}">${ganancia >= 0 ? "Plusvalía" : "Pérdida"} ${$m(Math.abs(ganancia))}</span><br>
            ${of.hipoteca ? `Liquidas ${$m(of.hipoteca)} de crédito y ` : ""}recibes <b>${$m(neto)}</b> en efectivo
            ${of.costo && of.costo !== valor ? ` (pusiste ${$m(of.costo)} de tu bolsa)` : ""}
            ${of.flujo ? ` · dejas de cobrar ${$m(of.flujo)} al mes` : ""}
          </div>`;
        if (hayVarias) {
          const campo = el("div", "campo");
          campo.innerHTML = `
            <label>Títulos a vender (tienes ${of.unidades})</label>
            <div class="stepper">
              <input type="number" min="1" max="${of.unidades}" value="${of.unidades}" data-inp="${of.uid}" />
            </div>`;
          nodo.appendChild(campo);
        }
        const btn = el("button", "btn btn-oro", "Vender");
        btn.addEventListener("click", () => {
          let unidades = of.unidades || 0;
          if (hayVarias) {
            const inp = nodo.querySelector(`[data-inp="${of.uid}"]`);
            unidades = Math.max(1, Math.min(of.unidades, Math.floor(Number(inp.value) || 0)));
          }
          const precioTotal = of.precioUnitario ? of.precioUnitario * unidades : of.precio;
          const res = M.venderActivo(of.uid, precioTotal, unidades, of.precioUnitario);
          if (!res.ok) return mostrarAviso(res.msg, "mal");
          mostrarAviso(`Vendido · ${res.ganancia >= 0 ? "ganancia" : "pérdida"} de ${$m(Math.abs(res.ganancia))}`, res.ganancia >= 0 ? "bien" : "mal");
          // Si el activo sigue vivo (venta parcial de títulos), actualiza la oferta; si no, quítala.
          const restante = M.estado.activos.find((a) => a.uid === of.uid);
          if (restante && of.precioUnitario && restante.unidades > 0) {
            of.unidades = restante.unidades;
            of.nombre = `${restante.ticker} · ${restante.unidades} títulos`;
            of.precio = Math.round(of.precioUnitario * restante.unidades);
            of.neto = of.precio;
            of.costo = Math.round(restante.costo);
            of.valor = Math.round(restante.costo);
            of.flujo = restante.flujo;
          } else {
            p.ofertas = p.ofertas.filter((x) => x.uid !== of.uid);
          }
          renderTodo();
          renderModal();
        });
        nodo.appendChild(btn);
        lista.appendChild(nodo);
      });
      cuerpo.appendChild(lista);
    }

    if (p.nota) cuerpo.appendChild(el("p", "nota-carta", `<b>Para tenerlo claro:</b> ${esc(p.nota)}`));

    const btn = el("button", "btn btn-primario", p.ofertas && p.ofertas.length ? "No vender nada / continuar" : "Continuar");
    btn.addEventListener("click", continuarTurno);
    pie.appendChild(btn);
  }

  function modalCaridad(p, cuerpo, pie) {
    cabezaModal("🤝", "Caridad", "¿Quieres donar?");
    cuerpo.innerHTML =
      `<p class="texto-carta">Puedes donar el 10% de tu ingreso total a una causa. Si lo haces, durante los próximos 3 turnos podrás tirar 1, 2 o 3 dados y moverte más rápido.</p>` +
      `<div class="tabla-datos">
         ${filaDato("Donativo", $m(p.costo))}
         ${filaDato("Tu efectivo", $m(M.estado.efectivo), M.estado.efectivo < p.costo ? "alerta" : "")}
       </div>` +
      `<p class="nota-carta"><b>Para tenerlo claro:</b> más dados = más casillas por turno = más oportunidades... y también más gastos imprevistos. La generosidad acelera el juego, no lo hace gratis.</p>`;

    const si = el("button", "btn btn-primario", `Donar ${$m(p.costo)}`);
    si.disabled = M.estado.efectivo < p.costo;
    si.addEventListener("click", () => {
      const res = M.donar();
      if (!res.ok) return mostrarAviso(res.msg, "mal");
      mostrarAviso("Donaste. Ahora puedes tirar hasta 3 dados por 3 turnos", "bien");
      continuarTurno();
    });
    const no = el("button", "btn btn-fantasma", "Esta vez no");
    no.addEventListener("click", continuarTurno);
    const fila = el("div", "fila");
    fila.appendChild(si);
    fila.appendChild(no);
    pie.appendChild(fila);
  }

  function modalVRInicio(p, cuerpo, pie) {
    cabezaModal("🎉", "Meta cumplida", p.titulo);
    cuerpo.innerHTML =
      `<p class="texto-carta">${esc(p.texto)}</p>` +
      `<div class="tabla-datos">${filaDato("Vía Rápida", esc(p.detalle), "destacada")}</div>` +
      `<p class="nota-carta"><b>Cómo se gana ahora:</b> compra tu sueño o construye negocios que sumen ${$m(500000)} de flujo mensual. Ojo con los contratiempos: aquí también hay auditorías y demandas.</p>`;
    const btn = el("button", "btn btn-primario", "Entrar a la Vía Rápida");
    btn.addEventListener("click", () => {
      M.cerrarPendiente();
      cerrarModal();
      renderTodo();
    });
    pie.appendChild(btn);
  }

  function modalVRNegocio(p, cuerpo, pie) {
    const c = p.carta;
    cabezaModal("🏢", "Gran negocio", c.titulo);
    cuerpo.innerHTML =
      `<p class="texto-carta">${esc(c.texto)}</p>` +
      `<div class="tabla-datos">
        ${filaDato("Precio", $m(c.precio), M.estado.efectivo < c.precio ? "alerta" : "")}
        ${filaDato("Flujo mensual", "+" + $m(c.flujo), "destacada")}
        ${filaDato("Rendimiento anual", ((c.flujo * 12 / c.precio) * 100).toFixed(1) + "%")}
        ${filaDato("Tu efectivo", $m(M.estado.efectivo))}
        ${filaDato("Flujo de negocios / meta", $m(M.flujoNegociosVR()) + " / " + $m(M.estado.vr.meta))}
      </div>`;
    const comprar = el("button", "btn btn-primario", "Comprar");
    comprar.disabled = M.estado.efectivo < c.precio;
    comprar.addEventListener("click", () => {
      const res = M.comprarNegocioVR(c);
      if (!res.ok) return mostrarAviso(res.msg, "mal");
      mostrarAviso(`Compraste ${c.titulo}`, "bien");
      if (res.gano) { renderTodo(); return mostrarVictoria(); }
      continuarTurno();
    });
    const pasar = el("button", "btn btn-fantasma", "Pasar");
    pasar.addEventListener("click", continuarTurno);
    const fila = el("div", "fila");
    fila.appendChild(comprar);
    fila.appendChild(pasar);
    pie.appendChild(fila);
  }

  function modalVRSueno(p, cuerpo, pie) {
    const c = p.carta;
    cabezaModal("⭐", "Tu sueño", c.titulo);
    cuerpo.innerHTML =
      `<p class="texto-carta">${esc(c.texto)}</p>` +
      `<div class="tabla-datos">
        ${filaDato("Costo del sueño", $m(c.precio), M.estado.efectivo < c.precio ? "alerta" : "destacada")}
        ${filaDato("Tu efectivo", $m(M.estado.efectivo))}
      </div>` +
      `<p class="nota-carta"><b>Para tenerlo claro:</b> comprar tu sueño gana la partida. El punto del juego nunca fue el dinero: era poder elegir.</p>`;
    const comprar = el("button", "btn btn-oro", "Comprar mi sueño");
    comprar.disabled = M.estado.efectivo < c.precio;
    comprar.addEventListener("click", () => {
      const res = M.comprarSuenoVR(c);
      if (!res.ok) return mostrarAviso(res.msg, "mal");
      renderTodo();
      mostrarVictoria();
    });
    const pasar = el("button", "btn btn-fantasma", "Todavía no");
    pasar.addEventListener("click", continuarTurno);
    const fila = el("div", "fila");
    fila.appendChild(comprar);
    fila.appendChild(pasar);
    pie.appendChild(fila);
  }

  /* =================================================================
     VICTORIA
     ================================================================= */
  function mostrarVictoria() {
    const r = M.resumen();
    $("#modal-fondo").classList.remove("oculto");
    cabezaModal("🏆", "Fin de la partida", "¡Ganaste!");
    const cuerpo = $("#modal-cuerpo");
    const pie = $("#modal-pie");
    cuerpo.innerHTML = `
      <div class="victoria">
        <div class="trofeo">🏆</div>
        <h2>${r.sueno ? "Cumpliste tu sueño" : "Medio millón de flujo mensual"}</h2>
        <p class="texto-carta">${r.sueno ? esc(r.sueno) : "Tus negocios de la Vía Rápida generan más de " + $m(500000) + " al mes."}</p>
        <div class="resumen">
          <div class="rcell"><span class="etq">Profesión</span><strong>${esc(r.profesion)}</strong></div>
          <div class="rcell"><span class="etq">Turnos</span><strong>${r.turnos}</strong></div>
          <div class="rcell"><span class="etq">Flujo mensual</span><strong>${$m(r.flujoVR)}</strong></div>
          <div class="rcell"><span class="etq">Efectivo final</span><strong>${$m(r.efectivo)}</strong></div>
          <div class="rcell"><span class="etq">Tratos comprados</span><strong>${r.stats.comprados}</strong></div>
          <div class="rcell"><span class="etq">Imprevistos pagados</span><strong>${$m(r.stats.imprevistos)}</strong></div>
        </div>
      </div>`;
    pie.innerHTML = "";
    const nueva = el("button", "btn btn-primario", "Jugar otra vez");
    nueva.addEventListener("click", () => {
      M.borrarGuardado();
      cerrarModal();
      $("#pantalla-juego").classList.add("oculta");
      $("#pantalla-inicio").classList.remove("oculta");
      $("#btn-continuar").hidden = true;
      abrirSelectorProfesion();
    });
    const cerrar = el("button", "btn btn-fantasma", "Ver mi tablero");
    cerrar.addEventListener("click", cerrarModal);
    const fila = el("div", "fila");
    fila.appendChild(nueva);
    fila.appendChild(cerrar);
    pie.appendChild(fila);
  }

  /* =================================================================
     PANELES
     ================================================================= */
  function abrirPanel(titulo, nodo) {
    $("#panel-titulo").textContent = titulo;
    const cuerpo = $("#panel-cuerpo");
    cuerpo.innerHTML = "";
    cuerpo.appendChild(nodo);
    $("#panel-fondo").classList.remove("oculto");
  }
  function cerrarPanel() { $("#panel-fondo").classList.add("oculto"); }

  function panelEstado() {
    const e = M.estado;
    const cont = el("div", "bloque");

    /* Ingresos */
    const ingresos = el("div", "tarjeta");
    let html = `<div class="linea"><span class="n">Salario</span><span>${$m(e.salario)}</span></div>`;
    e.activos.filter((a) => a.flujo).forEach((a) => {
      html += `<div class="linea"><span class="n">${esc(a.nombre)}</span><span class="positivo">${$m(a.flujo)}</span></div>`;
    });
    if (enVR()) {
      html += `<div class="linea"><span class="n">Flujo de la Vía Rápida</span><span class="positivo">${$m(e.vr.flujoBase)}</span></div>`;
      e.vr.negocios.forEach((n) => {
        html += `<div class="linea"><span class="n">${esc(n.titulo)}</span><span class="positivo">${$m(n.flujo)}</span></div>`;
      });
    }
    html += `<div class="linea total"><span class="n">Ingreso total</span><span>${$m(enVR() ? M.flujoVR() + e.salario : M.ingresoTotal())}</span></div>`;
    html += `<div class="linea"><span class="n">Del cual es ingreso pasivo</span><span class="positivo">${$m(M.ingresoPasivo())}</span></div>`;
    ingresos.innerHTML = html;
    cont.appendChild(bloque("Ingresos", ingresos));

    /* Gastos */
    const gastos = el("div", "tarjeta");
    html = "";
    e.gastos.forEach((g) => {
      html += `<div class="linea"><span class="n">${esc(g.nombre)}</span><span class="negativo">${$m(g.monto)}</span></div>`;
    });
    if (e.hijos) html += `<div class="linea"><span class="n">Gastos por ${e.hijos} ${e.hijos === 1 ? "hijo" : "hijos"}</span><span class="negativo">${$m(e.hijos * e.gastoPorHijo)}</span></div>`;
    html += `<div class="linea total"><span class="n">Gastos totales</span><span>${$m(M.gastosTotales())}</span></div>`;
    gastos.innerHTML = html;
    cont.appendChild(bloque("Gastos mensuales", gastos));

    /* Flujo */
    const flujo = el("div", "tarjeta");
    const f = M.flujoMensual();
    flujo.innerHTML = `
      <div class="linea total"><span class="n">Flujo mensual</span><span class="${f >= 0 ? "positivo" : "negativo"}">${$m(f)}</span></div>
      <p class="subtexto">Esto es lo que te queda cada mes después de pagar todo. Para salir de la carrera de la rata necesitas que el ingreso pasivo (${$m(M.ingresoPasivo())}) supere tus gastos (${$m(M.gastosTotales())}).</p>`;
    cont.appendChild(bloque("Resultado del mes", flujo));

    /* Gráfica */
    if (e.historial.length > 2) {
      const g = el("div", "tarjeta");
      g.appendChild(grafica(e.historial));
      g.appendChild(el("p", "subtexto", "Verde: tu ingreso pasivo. Rojo: tus gastos. El juego se gana cuando el verde cruza al rojo."));
      cont.appendChild(bloque("Tu avance", g));
    }

    /* Activos */
    const activos = el("div", "tarjeta");
    if (!e.activos.length) {
      activos.innerHTML = `<p class="subtexto">Todavía no tienes activos. Cada trato que compres aparecerá aquí con el flujo que aporta.</p>`;
    } else {
      html = "";
      e.activos.forEach((a) => {
        html += `<div class="linea"><span class="n">${esc(a.nombre)}</span><span>${$m(a.valor || a.costo)}${a.flujo ? ` <span class="positivo">(${$m(a.flujo)}/mes)</span>` : ""}</span></div>`;
      });
      html += `<div class="linea total"><span class="n">Valor de tus activos</span><span>${$m(M.totalActivos())}</span></div>`;
      activos.innerHTML = html;
    }
    cont.appendChild(bloque("Activos", activos));

    /* Pasivos */
    const pasivos = el("div", "tarjeta");
    if (!e.pasivos.length) {
      pasivos.innerHTML = `<p class="subtexto">No tienes deudas. Eso es más raro (y más valioso) de lo que parece.</p>`;
    } else {
      html = "";
      e.pasivos.forEach((p) => {
        html += `<div class="linea"><span class="n">${esc(p.nombre)}</span><span class="negativo">${$m(p.saldo)}</span></div>`;
      });
      html += `<div class="linea total"><span class="n">Total de deudas</span><span>${$m(M.totalPasivos())}</span></div>`;
      pasivos.innerHTML = html;
    }
    cont.appendChild(bloque("Pasivos", pasivos));

    /* Patrimonio */
    const patr = el("div", "tarjeta");
    patr.innerHTML = `
      <div class="linea"><span class="n">Efectivo</span><span>${$m(e.efectivo)}</span></div>
      <div class="linea"><span class="n">Activos</span><span>${$m(M.totalActivos())}</span></div>
      <div class="linea"><span class="n">Deudas</span><span class="negativo">−${$m(M.totalPasivos())}</span></div>
      <div class="linea total"><span class="n">Patrimonio neto</span><span>${$m(M.patrimonio())}</span></div>`;
    cont.appendChild(bloque("Patrimonio", patr));

    abrirPanel("Estado financiero", cont);
  }

  function bloque(titulo, nodo) {
    const b = el("div", "bloque");
    b.appendChild(el("div", "bloque-titulo", esc(titulo)));
    b.appendChild(nodo);
    return b;
  }

  function grafica(historial) {
    const w = 320, h = 90, pad = 6;
    const datos = historial.slice(-40);
    const max = Math.max(1, ...datos.map((d) => Math.max(d.pasivo, d.gastos)));
    const punto = (v, i) => {
      const x = pad + (i / Math.max(1, datos.length - 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    const linPasivo = datos.map((d, i) => punto(d.pasivo, i)).join(" ");
    const linGastos = datos.map((d, i) => punto(d.gastos, i)).join(" ");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("class", "grafica");
    svg.innerHTML = `
      <polyline points="${linGastos}" fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round" />
      <polyline points="${linPasivo}" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linejoin="round" />`;
    return svg;
  }

  function panelBanco() {
    const e = M.estado;
    const cont = el("div", "bloque");

    const resumen = el("div", "tarjeta");
    resumen.innerHTML = `
      <div class="linea"><span class="n">Efectivo</span><span>${$m(e.efectivo)}</span></div>
      <div class="linea"><span class="n">Pago mensual de deudas</span><span class="negativo">${$m(e.gastos.filter((g) => e.pasivos.some((p) => p.gastoId === g.id)).reduce((s, g) => s + g.monto, 0))}</span></div>`;
    cont.appendChild(bloque("Tu dinero", resumen));

    /* Préstamo */
    const prest = el("div", "tarjeta");
    prest.innerHTML = `
      <div class="campo">
        <label>¿Cuánto quieres pedir? (múltiplos de $10,000)</label>
        <input type="number" id="inp-prestamo" step="10000" min="10000" value="50000" />
      </div>
      <p class="subtexto">Cada $10,000 que pidas te cuestan <b>$1,000 al mes</b>, para siempre, hasta que liquides. Es a propósito: así se siente el crédito caro en la vida real.</p>`;
    const btnPrest = el("button", "btn btn-secundario", "Pedir préstamo");
    btnPrest.addEventListener("click", () => {
      const v = Number($("#inp-prestamo").value);
      if (!v || v < 10000) return mostrarAviso("El mínimo son $10,000", "mal");
      const r = M.pedirPrestamo(v);
      mostrarAviso(`Recibes ${$m(r.monto)} · +${$m(r.pagoExtra)} de gasto mensual`, "mal");
      renderTodo();
      panelBanco();
    });
    prest.appendChild(btnPrest);
    cont.appendChild(bloque("Pedir prestado", prest));

    /* Deudas */
    const deudas = el("div", "bloque");
    const liquidables = e.pasivos.filter((p) => p.liquidable);
    if (!liquidables.length) {
      const t = el("div", "tarjeta");
      t.innerHTML = `<p class="subtexto">No tienes deudas que puedas liquidar por ahora.</p>`;
      deudas.appendChild(t);
    } else {
      liquidables.forEach((p) => {
        const gasto = e.gastos.find((g) => g.id === p.gastoId);
        const t = el("div", "tarjeta");
        t.innerHTML = `
          <div class="linea"><span class="n">${esc(p.nombre)}</span><span class="negativo">${$m(p.saldo)}</span></div>
          <div class="linea"><span class="n">Pago mensual</span><span>${$m(gasto ? gasto.monto : 0)}</span></div>
          <div class="campo">
            <label>Abonar (o liquidar todo)</label>
            <input type="number" min="1000" step="1000" value="${Math.min(p.saldo, e.efectivo > 0 ? Math.min(p.saldo, e.efectivo) : 1000)}" data-abono="${p.id}" />
          </div>`;
        const fila = el("div", "fila");
        fila.style.display = "grid";
        fila.style.gridTemplateColumns = "1fr 1fr";
        fila.style.gap = "8px";
        const btnAbonar = el("button", "btn btn-secundario", "Abonar");
        btnAbonar.addEventListener("click", () => {
          const v = Number(t.querySelector(`[data-abono="${p.id}"]`).value);
          const r = M.abonarDeuda(p.id, v);
          if (!r.ok) return mostrarAviso(r.msg, "mal");
          mostrarAviso(`Liberas ${$m(r.alivio)} de flujo mensual`, "bien");
          renderTodo();
          panelBanco();
        });
        const btnLiquidar = el("button", "btn btn-primario", `Liquidar ${$m(p.saldo)}`);
        btnLiquidar.disabled = e.efectivo < p.saldo;
        btnLiquidar.addEventListener("click", () => {
          const r = M.abonarDeuda(p.id, p.saldo);
          if (!r.ok) return mostrarAviso(r.msg, "mal");
          mostrarAviso(`¡Deuda liquidada! Liberas ${$m(r.alivio)} al mes`, "bien");
          renderTodo();
          panelBanco();
        });
        fila.appendChild(btnAbonar);
        fila.appendChild(btnLiquidar);
        t.appendChild(fila);
        deudas.appendChild(t);
      });
    }
    cont.appendChild(bloque("Liquidar deudas", deudas));

    /* Renta fija disponible para retirar */
    const liquidos = e.activos.filter((a) => a.clase === "renta-fija");
    if (liquidos.length) {
      const b = el("div", "bloque");
      liquidos.forEach((a) => {
        const t = el("div", "tarjeta");
        t.innerHTML = `
          <div class="linea"><span class="n">${esc(a.nombre)}</span><span>${$m(a.monto)}</span></div>
          <div class="linea"><span class="n">Interés mensual</span><span class="positivo">${$m(a.flujo)}</span></div>`;
        const btn = el("button", "btn btn-fantasma", "Retirar inversión");
        btn.addEventListener("click", () => {
          M.retirarRentaFija(a.uid);
          mostrarAviso(`Retiras ${$m(a.monto)}`, "bien");
          renderTodo();
          panelBanco();
        });
        t.appendChild(btn);
        b.appendChild(t);
      });
      cont.appendChild(bloque("Inversiones líquidas (renta fija)", b));
    }

    abrirPanel("Banco", cont);
  }

  function panelRegistro() {
    const cont = el("div", "bloque");
    if (!M.estado.log.length) {
      cont.appendChild(el("p", "subtexto", "Todavía no pasa nada. Tira el dado."));
    }
    M.estado.log.forEach((l) => {
      const item = el("div", "registro-item " + l.tipo);
      item.innerHTML = `<span class="t">Turno ${l.turno}</span><span>${esc(l.texto)}</span>`;
      cont.appendChild(item);
    });
    abrirPanel("Registro de la partida", cont);
  }

  function panelGlosario() {
    const cont = el("div", "bloque");
    cont.appendChild(el("p", "subtexto",
      "Los conceptos que aparecen en las cartas, explicados en corto. Esta es la parte del juego que sí se usa en la vida real."));
    D.GLOSARIO.forEach((g) => {
      const item = el("div", "glosario-item");
      item.innerHTML = `<h4>${esc(g.t)}</h4><p>${esc(g.d)}</p>`;
      cont.appendChild(item);
    });
    abrirPanel("Glosario financiero", cont);
  }

  function panelComoSeJuega() {
    const cont = el("div", "bloque");
    cont.innerHTML = `
      <div class="tarjeta">
        <p class="subtexto"><b>La idea:</b> empiezas con una profesión mexicana, su sueldo y sus deudas. Cada vuelta al tablero es un año de tu vida financiera. Ganas cuando tu <b>ingreso pasivo</b> (rentas, intereses, dividendos, negocios) supera tus <b>gastos mensuales</b>.</p>
      </div>
      <div class="tarjeta">
        <p class="subtexto"><b>💡 Oportunidad:</b> eliges entre un trato pequeño (CETES, acciones, FIBRAs, una casita) o uno grande (edificios, bodegas, franquicias). Compra solo lo que te deje flujo.</p>
        <p class="subtexto"><b>💰 Día de pago:</b> cobras tu flujo mensual. También cobras si solo pasas por la casilla.</p>
        <p class="subtexto"><b>📈 El mercado:</b> aparecen compradores, cambios de precio o movimientos de tasas de Banxico. Aquí es donde vendes.</p>
        <p class="subtexto"><b>💸 Gasto imprevisto:</b> tenencia, el boiler, los XV años de tu sobrina. La vida real.</p>
        <p class="subtexto"><b>🤝 Caridad:</b> donas el 10% de tu ingreso y por 3 turnos puedes tirar hasta 3 dados.</p>
        <p class="subtexto"><b>👶 Bebé:</b> suben tus gastos fijos. <b>📉 Recorte:</b> pagas un mes completo de gastos y pierdes 2 turnos.</p>
      </div>
      <div class="tarjeta">
        <p class="subtexto"><b>El banco</b> te presta en múltiplos de $10,000 y cada uno te cuesta $1,000 al mes. Si te quedas sin efectivo, el préstamo es automático: así se siente endeudarse por necesidad.</p>
        <p class="subtexto">También puedes <b>liquidar o abonar</b> a tus deudas: cada peso que quitas de deuda te devuelve flujo mensual.</p>
      </div>
      <div class="tarjeta">
        <p class="subtexto"><b>Vía Rápida:</b> al salir de la carrera de la rata, tu flujo se multiplica por 100 y juegas por grandes negocios. Ganas cuando compras tu sueño o llegas a $500,000 de flujo mensual.</p>
      </div>
      <div class="tarjeta">
        <p class="subtexto"><b>Atajo:</b> la barra espaciadora tira el dado y confirma la carta. Para partidas rápidas, es todo lo que necesitas.</p>
      </div>`;
    abrirPanel("Cómo se juega", cont);
  }

  function panelMenu() {
    const cont = el("div", "bloque");
    const acciones = [
      ["Cómo se juega", panelComoSeJuega],
      ["Glosario financiero", panelGlosario],
      ["Estado financiero", panelEstado],
    ];
    acciones.forEach(([txt, fn]) => {
      const b = el("button", "btn btn-secundario", txt);
      b.addEventListener("click", fn);
      cont.appendChild(b);
    });

    const reiniciar = el("button", "btn btn-peligro", "Abandonar y empezar de nuevo");
    reiniciar.addEventListener("click", () => {
      if (!confirm("¿Seguro? Se pierde el avance de esta partida.")) return;
      M.borrarGuardado();
      cerrarPanel();
      cerrarModal();
      $("#pantalla-juego").classList.add("oculta");
      $("#pantalla-inicio").classList.remove("oculta");
      $("#btn-continuar").hidden = true;
      abrirSelectorProfesion();
    });
    cont.appendChild(reiniciar);

    cont.appendChild(el("p", "subtexto",
      "Tu partida se guarda sola en este navegador. Puedes cerrar y volver después."));
    abrirPanel("Menú", cont);
  }

  /* =================================================================
     AVISOS
     ================================================================= */
  function mostrarAviso(texto, tipo) {
    const cont = $("#avisos");
    const nodo = el("div", "aviso " + (tipo || ""), esc(texto));
    cont.appendChild(nodo);
    setTimeout(() => {
      nodo.style.transition = "opacity .3s ease";
      nodo.style.opacity = "0";
      setTimeout(() => nodo.remove(), 320);
    }, 2400);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
