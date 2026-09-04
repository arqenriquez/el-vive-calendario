/* ===================================================================
   FLUJO DE EFECTIVO MX · Motor del juego
   -------------------------------------------------------------------
   Aquí vive TODA la lógica: estado, turnos, cartas, compras, ventas,
   deudas y condiciones de victoria. No toca el DOM: la interfaz
   (juego.js) lee el estado y llama a estos métodos.
   =================================================================== */

window.CF = window.CF || {};

(function () {
  const D = CF.DATOS;
  const VERSION_ESTADO = 1;
  const CLAVE_GUARDADO = "cf-mx-partida-v1";

  /* ---------- utilidades ---------- */
  const redondear = (n) => Math.round(n);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function barajar(arr) {
    const copia = arr.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  let contadorUid = 1;
  const nuevoUid = () => "a" + (contadorUid++) + "-" + Math.random().toString(36).slice(2, 7);

  /* ---------- mazos ---------- */
  function nuevoMazo(cartas) {
    return { orden: barajar(cartas.map((c) => c.id)), i: 0 };
  }

  function robar(mazo, cartas, filtro) {
    // Recorre el mazo hasta encontrar una carta válida (baraja de nuevo si se acaba).
    for (let intentos = 0; intentos < mazo.orden.length * 2 + 4; intentos++) {
      if (mazo.i >= mazo.orden.length) {
        mazo.orden = barajar(mazo.orden);
        mazo.i = 0;
      }
      const id = mazo.orden[mazo.i++];
      const carta = cartas.find((c) => c.id === id);
      if (!carta) continue;
      if (filtro && !filtro(carta)) continue;
      return carta;
    }
    return cartas[Math.floor(Math.random() * cartas.length)];
  }

  /* =================================================================
     MOTOR
     ================================================================= */
  const Motor = {
    estado: null,
    escuchas: [],

    /* ---------- ciclo de vida ---------- */
    nuevoJuego(profesionId) {
      const prof = D.PROFESIONES.find((p) => p.id === profesionId) || D.PROFESIONES[0];
      const gastos = [];
      const pasivos = [];

      prof.gastos.forEach((g) => {
        gastos.push({ id: g.id, nombre: g.nombre, monto: g.monto, base: true });
        if (g.pasivo) {
          pasivos.push({
            id: g.id,
            nombre: g.pasivo.nombre,
            saldo: g.pasivo.saldo,
            gastoId: g.id,
            liquidable: true,
          });
        }
      });

      this.estado = {
        v: VERSION_ESTADO,
        fase: "carrera",
        profesionId: prof.id,
        profesion: prof.nombre,
        emoji: prof.emoji,
        turno: 1,
        posicion: 0,
        salario: prof.salario,
        salarioBase: prof.salario,
        gastoPorHijo: prof.gastoPorHijo,
        hijos: 0,
        efectivo: prof.ahorros,
        gastos,
        pasivos,
        activos: [],
        caridad: 0,
        turnosPerdidos: 0,
        ultimoDado: null,
        pendiente: null,
        esperandoTiro: true,
        mazos: {
          pequenos: nuevoMazo(D.TRATOS_PEQUENOS),
          grandes: nuevoMazo(D.TRATOS_GRANDES),
          gastos: nuevoMazo(D.GASTOS),
          mercado: nuevoMazo(D.MERCADO),
          negociosVR: nuevoMazo(D.NEGOCIOS_VR),
          suenosVR: nuevoMazo(D.SUENOS_VR),
          contratiemposVR: nuevoMazo(D.CONTRATIEMPOS_VR),
          bonosVR: nuevoMazo(D.BONOS_VR),
        },
        historial: [],
        log: [],
        stats: { pagos: 0, comprados: 0, vendidos: 0, prestamos: 0, imprevistos: 0, donado: 0 },
        vr: null,
      };

      this.log(`Empiezas como ${prof.nombre}. Ahorros: ${this.moneda(prof.ahorros)}.`, "info");
      this.log(`Meta: que tu ingreso pasivo (${this.moneda(0)}) supere tus gastos (${this.moneda(this.gastosTotales())}).`, "meta");
      this.registrarHistorial();
      this.guardar();
      return this.estado;
    },

    cargarGuardado() {
      try {
        const crudo = localStorage.getItem(CLAVE_GUARDADO);
        if (!crudo) return null;
        const est = JSON.parse(crudo);
        if (!est || est.v !== VERSION_ESTADO) return null;
        this.estado = est;
        return est;
      } catch (e) {
        return null;
      }
    },

    hayGuardado() {
      try {
        const crudo = localStorage.getItem(CLAVE_GUARDADO);
        if (!crudo) return null;
        const est = JSON.parse(crudo);
        return est && est.v === VERSION_ESTADO ? est : null;
      } catch (e) {
        return null;
      }
    },

    guardar() {
      try {
        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(this.estado));
      } catch (e) { /* modo privado: seguimos sin guardar */ }
    },

    borrarGuardado() {
      try { localStorage.removeItem(CLAVE_GUARDADO); } catch (e) {}
    },

    /* ---------- cálculos del estado financiero ---------- */
    ingresoPasivo() {
      return redondear(this.estado.activos.reduce((s, a) => s + (a.flujo || 0), 0));
    },
    ingresoTotal() {
      return this.estado.salario + this.ingresoPasivo();
    },
    gastosTotales() {
      const e = this.estado;
      const fijos = e.gastos.reduce((s, g) => s + g.monto, 0);
      return redondear(fijos + e.hijos * e.gastoPorHijo);
    },
    flujoMensual() {
      return this.ingresoTotal() - this.gastosTotales();
    },
    totalActivos() {
      return redondear(this.estado.activos.reduce((s, a) => s + (a.valor || a.costo || 0), 0));
    },
    totalPasivos() {
      return redondear(this.estado.pasivos.reduce((s, p) => s + p.saldo, 0));
    },
    patrimonio() {
      return this.estado.efectivo + this.totalActivos() - this.totalPasivos();
    },
    progresoMeta() {
      const g = this.gastosTotales();
      if (g <= 0) return 1;
      return clamp(this.ingresoPasivo() / g, 0, 1);
    },

    moneda(n) {
      const signo = n < 0 ? "-" : "";
      return signo + "$" + Math.abs(redondear(n)).toLocaleString("es-MX");
    },

    /* ---------- bitácora ---------- */
    log(texto, tipo) {
      this.estado.log.unshift({ turno: this.estado.turno, texto, tipo: tipo || "info" });
      if (this.estado.log.length > 120) this.estado.log.pop();
    },

    registrarHistorial() {
      this.estado.historial.push({
        turno: this.estado.turno,
        pasivo: this.ingresoPasivo(),
        gastos: this.gastosTotales(),
        patrimonio: this.patrimonio(),
      });
      if (this.estado.historial.length > 200) this.estado.historial.shift();
    },

    /* ---------- dinero ---------- */
    cobrar(monto, concepto) {
      this.estado.efectivo += redondear(monto);
      if (concepto) this.log(`${concepto}: +${this.moneda(monto)}`, "bien");
    },

    /** Paga y, si no alcanza el efectivo, pide un préstamo automático. */
    pagar(monto, concepto) {
      monto = redondear(monto);
      this.estado.efectivo -= monto;
      if (concepto) this.log(`${concepto}: -${this.moneda(monto)}`, "mal");
      if (this.estado.efectivo < 0) {
        const falta = -this.estado.efectivo;
        const prestamo = Math.ceil(falta / 10000) * 10000;
        this.pedirPrestamo(prestamo, true);
      }
    },

    /* ---------- préstamos y deudas ---------- */
    pedirPrestamo(monto, automatico) {
      monto = Math.max(10000, Math.round(monto / 10000) * 10000);
      const pagoExtra = redondear(monto * 0.10);
      let gasto = this.estado.gastos.find((g) => g.id === "prestamo");
      if (!gasto) {
        gasto = { id: "prestamo", nombre: "Pago de préstamo bancario", monto: 0 };
        this.estado.gastos.push(gasto);
      }
      gasto.monto += pagoExtra;

      let pasivo = this.estado.pasivos.find((p) => p.id === "prestamo");
      if (!pasivo) {
        pasivo = { id: "prestamo", nombre: "Préstamo bancario", saldo: 0, gastoId: "prestamo", liquidable: true };
        this.estado.pasivos.push(pasivo);
      }
      pasivo.saldo += monto;

      this.estado.efectivo += monto;
      this.estado.stats.prestamos += monto;
      this.log(
        `${automatico ? "El banco te presta automáticamente" : "Pides un préstamo de"} ${this.moneda(monto)} · +${this.moneda(pagoExtra)} de pago mensual`,
        automatico ? "mal" : "aviso"
      );
      this.guardar();
      return { monto, pagoExtra };
    },

    /** Liquida (total o parcialmente) una deuda. El pago mensual baja en proporción. */
    abonarDeuda(pasivoId, monto) {
      const p = this.estado.pasivos.find((x) => x.id === pasivoId);
      if (!p || !p.liquidable) return { ok: false, msg: "Esa deuda no se puede liquidar por separado." };
      monto = Math.min(redondear(monto), p.saldo);
      if (monto <= 0) return { ok: false, msg: "Monto inválido." };
      if (monto > this.estado.efectivo) return { ok: false, msg: "No tienes efectivo suficiente." };

      const gasto = this.estado.gastos.find((g) => g.id === p.gastoId);
      const proporcion = monto / p.saldo;
      const alivio = gasto ? redondear(gasto.monto * proporcion) : 0;

      this.estado.efectivo -= monto;
      p.saldo -= monto;
      if (gasto) gasto.monto = Math.max(0, gasto.monto - alivio);

      if (p.saldo <= 0) {
        this.estado.pasivos = this.estado.pasivos.filter((x) => x !== p);
        this.estado.gastos = this.estado.gastos.filter((g) => g.id !== p.gastoId);
        this.log(`¡Liquidaste ${p.nombre}! Liberas ${this.moneda(alivio)} de flujo cada mes.`, "bien");
      } else {
        this.log(`Abonas ${this.moneda(monto)} a ${p.nombre}. Liberas ${this.moneda(alivio)} al mes.`, "bien");
      }
      this.revisarMeta();
      this.guardar();
      return { ok: true, alivio };
    },

    /* =================================================================
       TURNOS
       ================================================================= */
    dadosDisponibles() {
      return this.estado.caridad > 0 ? 3 : 1;
    },

    tirar(numDados) {
      const e = this.estado;
      if (e.pendiente || !e.esperandoTiro) return null;
      numDados = clamp(numDados || 1, 1, this.dadosDisponibles());

      if (e.turnosPerdidos > 0) {
        e.turnosPerdidos--;
        this.log(`Turno perdido por el recorte de personal. Te quedan ${e.turnosPerdidos}.`, "mal");
        this.terminarTurno();
        return { dados: [], perdido: true };
      }

      const dados = [];
      for (let i = 0; i < numDados; i++) dados.push(1 + Math.floor(Math.random() * 6));
      const pasos = dados.reduce((a, b) => a + b, 0);
      e.ultimoDado = dados;
      e.esperandoTiro = false;
      if (e.caridad > 0) e.caridad--;

      if (e.fase === "viaRapida") this.moverVR(pasos);
      else this.mover(pasos);

      return { dados, pasos };
    },

    mover(pasos) {
      const e = this.estado;
      const largo = D.TABLERO.length;
      for (let i = 0; i < pasos; i++) {
        e.posicion = (e.posicion + 1) % largo;
        // Cobras el día de pago también cuando solo PASAS por la casilla.
        if (D.TABLERO[e.posicion].tipo === "pago" && i < pasos - 1) this.diaDePago(true);
      }
      this.resolverCasilla();
    },

    diaDePago(dePaso) {
      const flujo = this.flujoMensual();
      this.estado.stats.pagos++;
      if (flujo >= 0) this.cobrar(flujo, dePaso ? "Pasas por Día de pago" : "Día de pago");
      else this.pagar(-flujo, "Día de pago (flujo negativo)");
      this.revisarMeta();
    },

    resolverCasilla() {
      const e = this.estado;
      const casilla = D.TABLERO[e.posicion];
      switch (casilla.tipo) {
        case "pago": {
          const flujo = this.flujoMensual();
          this.diaDePago(false);
          e.pendiente = { clase: "aviso", icono: "💰", titulo: "Día de pago",
            texto: `Cobras tu flujo mensual de ${this.moneda(flujo)}.`,
            detalle: `Ingreso total ${this.moneda(this.ingresoTotal())} − gastos ${this.moneda(this.gastosTotales())}`,
            nota: "El día de pago es la foto de tu vida financiera: si el número es chico, el problema no es cuánto ganas sino cuánto se te va." };
          break;
        }
        case "oportunidad":
          e.pendiente = { clase: "elegir-trato" };
          break;
        case "gasto":
          e.pendiente = this.cartaGasto();
          break;
        case "mercado":
          e.pendiente = this.cartaMercado();
          break;
        case "caridad": {
          const costo = redondear(this.ingresoTotal() * 0.10);
          e.pendiente = { clase: "caridad", costo };
          break;
        }
        case "bebe":
          this.nacerBebe();
          break;
        case "recorte":
          this.recorte();
          break;
      }
      this.guardar();
    },

    nacerBebe() {
      const e = this.estado;
      if (e.hijos >= 3) {
        e.pendiente = { clase: "aviso", icono: "👶", titulo: "¡Bebé!",
          texto: "Ya tienes tres hijos: en este juego no se cuentan más gastos por hijo.",
          nota: "Los hijos no son un mal negocio, pero sí cambian tu presupuesto para siempre. Planéalo." };
      } else {
        e.hijos++;
        e.pendiente = { clase: "aviso", icono: "👶", titulo: "¡Felicidades, llegó un bebé!",
          texto: `Tus gastos suben ${this.moneda(e.gastoPorHijo)} al mes. Ahora tienes ${e.hijos} ${e.hijos === 1 ? "hijo" : "hijos"}.`,
          nota: "Cada hijo sube tus gastos fijos de por vida. Tu meta de ingreso pasivo acaba de subir también." };
        this.log(`Nace un bebé: +${this.moneda(e.gastoPorHijo)} de gasto mensual.`, "aviso");
      }
      this.revisarMeta();
    },

    recorte() {
      const e = this.estado;
      const costo = this.gastosTotales();
      this.pagar(costo, "Recorte de personal");
      e.turnosPerdidos = 2;
      e.pendiente = { clase: "aviso", icono: "📉", titulo: "Recorte de personal",
        texto: `Te quedas sin empleo temporalmente: pagas ${this.moneda(costo)} (un mes completo de gastos) y pierdes 2 turnos.`,
        nota: "Por esto existe el fondo de emergencia: 3 a 6 meses de gastos guardados. Sin él, un recorte te obliga a endeudarte." };
      this.revisarMeta();
    },

    /* ---------- cartas ---------- */
    elegirTrato(mazoNombre) {
      const e = this.estado;
      if (mazoNombre === "pequenos") {
        const carta = robar(e.mazos.pequenos, D.TRATOS_PEQUENOS);
        e.pendiente = { clase: "trato", mazo: "pequenos", carta };
      } else {
        const carta = robar(e.mazos.grandes, D.TRATOS_GRANDES);
        e.pendiente = { clase: "trato", mazo: "grandes", carta };
      }
      this.guardar();
      return e.pendiente;
    },

    cartaGasto() {
      const e = this.estado;
      const carta = robar(e.mazos.gastos, D.GASTOS, (c) => !c.soloConHijos || e.hijos > 0);
      const total = carta.monto || 0;
      if (total > 0) this.pagar(total, `Gasto imprevisto: ${carta.titulo}`);
      if (carta.deuda) {
        const gasto = { id: "msi-" + carta.id + "-" + Date.now(), nombre: carta.deuda.nombre, monto: carta.deuda.pagoMensual };
        e.gastos.push(gasto);
        e.pasivos.push({ id: gasto.id, nombre: carta.deuda.nombre, saldo: carta.deuda.saldo, gastoId: gasto.id, liquidable: true });
        this.log(`${carta.titulo}: +${this.moneda(carta.deuda.pagoMensual)} de gasto mensual (deuda de ${this.moneda(carta.deuda.saldo)}).`, "mal");
      }
      e.stats.imprevistos += total;
      this.revisarMeta();
      return { clase: "aviso", icono: "💸", titulo: carta.titulo, texto: carta.texto,
        detalle: carta.deuda
          ? `Nueva deuda: ${this.moneda(carta.deuda.saldo)} · pago mensual ${this.moneda(carta.deuda.pagoMensual)}`
          : `Pagas ${this.moneda(total)} de contado.`,
        nota: carta.nota || "Los gastos imprevistos no son imprevistos: son inevitables. Lo que sí puedes elegir es tener con qué pagarlos." };
    },

    cartaMercado() {
      const e = this.estado;
      const carta = robar(e.mazos.mercado, D.MERCADO);
      return this.aplicarMercado(carta);
    },

    aplicarMercado(carta) {
      const e = this.estado;
      const base = { clase: "mercado", carta, titulo: carta.titulo, texto: carta.texto, nota: carta.nota };

      if (carta.efecto === "venta" || carta.efecto === "precioAccion") {
        const ofertas = [];
        e.activos.forEach((a) => {
          if (!this.coincide(a, carta.filtro)) return;
          if (carta.efecto === "precioAccion") {
            const precio = carta.precio.valor;
            ofertas.push({
              uid: a.uid, nombre: `${a.ticker} · ${a.unidades} títulos`,
              precio: redondear(precio * a.unidades),
              costo: redondear(a.costo),
              valor: redondear(a.costo),
              neto: redondear(precio * a.unidades),
              flujo: a.flujo, unidades: a.unidades, precioUnitario: precio,
            });
          } else {
            const valorBase = a.valor || a.costo;
            let precio = valorBase;
            if (carta.precio.modo === "masFijo") precio = valorBase + carta.precio.valor;
            else if (carta.precio.modo === "porcentaje") precio = valorBase * carta.precio.valor;
            ofertas.push({
              uid: a.uid, nombre: a.nombre,
              precio: redondear(precio),
              costo: redondear(a.costo),                       // lo que saliste de tu bolsa (enganche)
              valor: redondear(a.valor || a.costo),            // precio al que lo compraste
              neto: redondear(precio - (a.hipoteca || 0)),     // efectivo que te queda tras liquidar el crédito
              hipoteca: a.hipoteca || 0, flujo: a.flujo,
            });
          }
        });
        base.ofertas = ofertas;
        if (!ofertas.length) base.sinEfecto = "No tienes nada que encaje con esta carta. Sigue tu turno.";
        return base;
      }

      if (carta.efecto === "ajusteFlujo") {
        let afectados = 0, delta = 0;
        e.activos.forEach((a) => {
          if (!this.coincide(a, carta.filtro)) return;
          const antes = a.flujo;
          a.flujo = redondear(a.flujo * carta.factor);
          if (a.clase === "renta-fija" && a.monto) a.tasaAnual = (a.flujo * 12) / a.monto;
          delta += a.flujo - antes;
          afectados++;
        });
        base.clase = "aviso";
        base.icono = "📈";
        base.detalle = afectados
          ? `${afectados} ${afectados === 1 ? "activo afectado" : "activos afectados"} · ${delta >= 0 ? "+" : ""}${this.moneda(delta)} de flujo mensual`
          : "No tienes activos de ese tipo: esta vez no te afecta.";
        if (afectados) this.log(`${carta.titulo}: ${delta >= 0 ? "+" : ""}${this.moneda(delta)} de flujo mensual.`, delta >= 0 ? "bien" : "mal");
        this.revisarMeta();
        return base;
      }

      if (carta.efecto === "perdida") {
        const perdidos = e.activos.filter((a) => this.coincide(a, carta.filtro));
        if (perdidos.length) {
          const perdida = perdidos.reduce((s, a) => s + a.costo, 0);
          e.activos = e.activos.filter((a) => !perdidos.includes(a));
          this.log(`${carta.titulo}: pierdes ${this.moneda(perdida)}.`, "mal");
          base.detalle = `Pierdes ${this.moneda(perdida)} invertidos.`;
        } else {
          base.detalle = "No tienes esa inversión: esta vez te salvaste.";
        }
        base.clase = "aviso";
        base.icono = "⚠️";
        this.revisarMeta();
        return base;
      }

      if (carta.efecto === "efectivo") {
        let monto = carta.monto || 0;
        if (carta.modo === "salario") monto = redondear(e.salario * carta.factor);
        if (carta.modo === "porInmueble") {
          const n = e.activos.filter((a) => a.clase === "inmueble").length;
          monto = n * (carta.monto || 0);
          if (!n) {
            base.clase = "aviso"; base.icono = "📈";
            base.detalle = "No tienes inmuebles: esta carta no te afecta.";
            return base;
          }
        }
        if (monto >= 0) this.cobrar(monto, carta.titulo);
        else this.pagar(-monto, carta.titulo);
        base.clase = "aviso";
        base.icono = monto >= 0 ? "💰" : "💸";
        base.detalle = `${monto >= 0 ? "Recibes" : "Pagas"} ${this.moneda(Math.abs(monto))}.`;
        this.revisarMeta();
        return base;
      }

      base.clase = "aviso";
      base.icono = "📈";
      return base;
    },

    coincide(activo, filtro) {
      if (!filtro) return false;
      if (filtro.origen) return activo.origen === filtro.origen;
      if (filtro.ticker) return activo.ticker === filtro.ticker;
      if (filtro.clase && activo.clase !== filtro.clase) return false;
      if (filtro.subtipos && !filtro.subtipos.includes(activo.subtipo)) return false;
      if (filtro.subtipo && activo.subtipo !== filtro.subtipo) return false;
      return true;
    },

    /* ---------- comprar tratos ---------- */
    /** Devuelve los números de la carta ya calculados (para la interfaz). */
    analizarTrato(carta, unidades) {
      const r = { costo: 0, flujo: 0, deuda: 0, valor: 0, detalle: [] };
      if (carta.tipo === "acciones") {
        const n = Math.max(0, unidades || 0);
        r.costo = redondear(carta.precio * n);
        r.flujo = redondear((carta.dividendoMensual || 0) * n);
        r.valor = r.costo;
        r.detalle.push(["Precio por título", this.moneda(carta.precio)]);
        r.detalle.push(["Títulos", String(n)]);
        if (carta.dividendoMensual) r.detalle.push(["Dividendo mensual por título", this.moneda(carta.dividendoMensual)]);
        r.detalle.push(["Rango histórico", `${this.moneda(carta.rango[0])} – ${this.moneda(carta.rango[1])}`]);
      } else if (carta.tipo === "renta-fija") {
        r.costo = carta.monto;
        r.flujo = redondear((carta.monto * carta.tasaAnual) / 12);
        r.valor = carta.monto;
        r.detalle.push(["Monto a invertir", this.moneda(carta.monto)]);
        r.detalle.push(["Tasa anual", (carta.tasaAnual * 100).toFixed(1) + "%"]);
        r.detalle.push(["Interés mensual", this.moneda(r.flujo)]);
      } else {
        r.costo = carta.enganche;
        r.deuda = redondear((carta.precio || 0) - carta.enganche);
        r.flujo = carta.flujo || 0;
        r.valor = carta.precio;
        r.detalle.push(["Precio", this.moneda(carta.precio)]);
        r.detalle.push(["Enganche / lo que pones", this.moneda(carta.enganche)]);
        if (r.deuda > 0) r.detalle.push(["Crédito (hipoteca)", this.moneda(r.deuda)]);
        r.detalle.push(["Flujo mensual neto", this.moneda(r.flujo)]);
      }
      r.rendimiento = r.costo > 0 ? (r.flujo * 12) / r.costo : 0;
      return r;
    },

    comprarTrato(carta, unidades) {
      const e = this.estado;

      if (carta.tipo === "salario") {
        if (e.efectivo < carta.costo) return { ok: false, msg: "No te alcanza el efectivo." };
        e.efectivo -= carta.costo;
        e.salario += carta.aumento;
        this.log(`${carta.titulo}: tu salario sube ${this.moneda(carta.aumento)} al mes.`, "bien");
        e.stats.comprados++;
        this.revisarMeta();
        this.guardar();
        return { ok: true, msg: `Tu salario ahora es de ${this.moneda(e.salario)}.` };
      }

      const an = this.analizarTrato(carta, unidades);
      if (an.costo <= 0) return { ok: false, msg: "Elige cuántos títulos quieres comprar." };
      if (e.efectivo < an.costo) return { ok: false, msg: `Te faltan ${this.moneda(an.costo - e.efectivo)}. Pide un préstamo o pasa el trato.` };

      const activo = {
        uid: nuevoUid(),
        origen: carta.id,
        clase: carta.tipo === "acciones" ? "accion" : carta.tipo,
        subtipo: carta.subtipo || null,
        nombre: carta.tipo === "acciones" ? `${carta.ticker} (${unidades} títulos)` : carta.titulo,
        ticker: carta.ticker || null,
        unidades: carta.tipo === "acciones" ? unidades : null,
        monto: carta.tipo === "renta-fija" ? carta.monto : null,
        tasaAnual: carta.tipo === "renta-fija" ? carta.tasaAnual : null,
        costo: an.costo,
        valor: an.valor,
        hipoteca: an.deuda,
        flujo: an.flujo,
      };

      e.efectivo -= an.costo;
      e.activos.push(activo);
      if (an.deuda > 0) {
        e.pasivos.push({
          id: "hip-" + activo.uid, nombre: `Crédito de ${carta.titulo}`, saldo: an.deuda,
          gastoId: null, liquidable: false, ligadoA: activo.uid,
        });
      }
      e.stats.comprados++;
      this.log(`Compras ${activo.nombre}: -${this.moneda(an.costo)} · +${this.moneda(an.flujo)} de flujo.`, "bien");
      this.revisarMeta();
      this.guardar();
      return { ok: true, msg: `Tu ingreso pasivo ahora es ${this.moneda(this.ingresoPasivo())}.` };
    },

    /**
     * Venta de un activo.
     * @param uid            activo a vender
     * @param precio         precio TOTAL de la operación
     * @param unidades       (acciones) títulos a vender; si son menos de los que
     *                       tienes, se vende solo esa parte
     * @param precioUnitario (acciones) precio por título de la carta de mercado
     */
    venderActivo(uid, precio, unidades, precioUnitario) {
      const e = this.estado;
      const a = e.activos.find((x) => x.uid === uid);
      if (!a) return { ok: false, msg: "Ese activo ya no está en tu portafolio." };

      if (a.clase === "accion" && unidades && unidades < a.unidades) {
        const proporcion = unidades / a.unidades;
        const ingreso = redondear((precioUnitario || precio / a.unidades) * unidades);
        const costoParte = redondear(a.costo * proporcion);
        const flujoParte = redondear(a.flujo * proporcion);
        e.efectivo += ingreso;
        a.unidades -= unidades;
        a.costo -= costoParte;
        a.valor = a.costo;
        a.flujo -= flujoParte;
        a.nombre = `${a.ticker} (${a.unidades} títulos)`;
        e.stats.vendidos++;
        this.log(`Vendes ${unidades} títulos de ${a.ticker}: +${this.moneda(ingreso)} (costo ${this.moneda(costoParte)}).`, ingreso >= costoParte ? "bien" : "mal");
        this.revisarMeta();
        this.guardar();
        return { ok: true, ganancia: ingreso - costoParte };
      }

      const hipoteca = a.hipoteca || 0;
      const neto = redondear(precio - hipoteca);
      const ganancia = redondear(precio - (a.valor || a.costo));
      e.efectivo += neto;
      e.activos = e.activos.filter((x) => x !== a);
      e.pasivos = e.pasivos.filter((p) => p.ligadoA !== a.uid);
      e.stats.vendidos++;
      this.log(
        `Vendes ${a.nombre} en ${this.moneda(precio)}${hipoteca ? ` (liquidas ${this.moneda(hipoteca)} de crédito)` : ""}: ${ganancia >= 0 ? "ganas" : "pierdes"} ${this.moneda(Math.abs(ganancia))}.`,
        ganancia >= 0 ? "bien" : "mal"
      );
      this.revisarMeta();
      this.guardar();
      return { ok: true, ganancia };
    },

    /** Retiro de una inversión de renta fija (son líquidas por naturaleza). */
    retirarRentaFija(uid) {
      const e = this.estado;
      const a = e.activos.find((x) => x.uid === uid);
      if (!a || a.clase !== "renta-fija") return { ok: false, msg: "Solo puedes retirar inversiones de renta fija." };
      e.efectivo += a.monto;
      e.activos = e.activos.filter((x) => x !== a);
      this.log(`Retiras ${a.nombre}: +${this.moneda(a.monto)} (pierdes ${this.moneda(a.flujo)} de flujo).`, "aviso");
      this.revisarMeta();
      this.guardar();
      return { ok: true };
    },

    /* ---------- caridad ---------- */
    donar() {
      const costo = redondear(this.ingresoTotal() * 0.10);
      if (this.estado.efectivo < costo) return { ok: false, msg: "No te alcanza para donar." };
      this.estado.efectivo -= costo;
      this.estado.caridad = 3;
      this.estado.stats.donado += costo;
      this.log(`Donas ${this.moneda(costo)}. Los próximos 3 turnos puedes tirar hasta 3 dados.`, "bien");
      this.guardar();
      return { ok: true };
    },

    /* ---------- fin de turno ---------- */
    cerrarPendiente() {
      this.estado.pendiente = null;
      this.terminarTurno();
    },

    terminarTurno() {
      const e = this.estado;
      e.pendiente = null;
      e.esperandoTiro = true;
      e.turno++;
      this.registrarHistorial();
      e.stats.maxFlujo = Math.max(e.stats.maxFlujo || 0, this.ingresoPasivo());
      this.guardar();
    },

    /* ---------- meta y vía rápida ---------- */
    revisarMeta() {
      const e = this.estado;
      if (e.fase !== "carrera") return false;
      if (this.ingresoPasivo() >= this.gastosTotales() && this.gastosTotales() > 0) {
        this.entrarViaRapida();
        return true;
      }
      return false;
    },

    entrarViaRapida() {
      const e = this.estado;
      const pasivo = this.ingresoPasivo();
      const flujoVR = pasivo * 100;
      e.fase = "viaRapida";
      e.vr = {
        posicion: 0,
        flujoBase: flujoVR,
        negocios: [],
        sueno: null,
        meta: 500000,
        turnoEntrada: e.turno,
      };
      e.efectivo += flujoVR;
      e.pendiente = {
        clase: "vr-inicio",
        titulo: "¡Saliste de la carrera de la rata!",
        texto: `Tu ingreso pasivo (${this.moneda(pasivo)}) ya cubre todos tus gastos (${this.moneda(this.gastosTotales())}). Trabajar ahora es opcional.`,
        detalle: `Entras a la Vía Rápida con un flujo de ${this.moneda(flujoVR)} al mes y un bono de arranque del mismo monto.`,
      };
      this.log(`¡Saliste de la carrera de la rata en el turno ${e.turno}!`, "meta");
      this.guardar();
    },

    flujoVR() {
      const vr = this.estado.vr;
      if (!vr) return 0;
      return vr.flujoBase + vr.negocios.reduce((s, n) => s + n.flujo, 0);
    },
    flujoNegociosVR() {
      const vr = this.estado.vr;
      if (!vr) return 0;
      return vr.negocios.reduce((s, n) => s + n.flujo, 0);
    },

    moverVR(pasos) {
      const e = this.estado;
      const largo = D.VIA_RAPIDA_TABLERO.length;
      for (let i = 0; i < pasos; i++) {
        e.vr.posicion = (e.vr.posicion + 1) % largo;
        if (D.VIA_RAPIDA_TABLERO[e.vr.posicion].tipo === "flujo" && i < pasos - 1) {
          this.cobrar(this.flujoVR(), "Pasas por Día de flujo");
        }
      }
      this.resolverCasillaVR();
    },

    resolverCasillaVR() {
      const e = this.estado;
      const tipo = D.VIA_RAPIDA_TABLERO[e.vr.posicion].tipo;
      switch (tipo) {
        case "flujo": {
          const monto = this.flujoVR();
          this.cobrar(monto, "Día de flujo");
          e.pendiente = { clase: "aviso", icono: "💵", titulo: "Día de flujo",
            texto: `Cobras ${this.moneda(monto)}.`,
            nota: "En la Vía Rápida tu flujo ya no depende de tu trabajo: depende de lo que construiste." };
          break;
        }
        case "negocio": {
          const carta = robar(e.mazos.negociosVR, D.NEGOCIOS_VR, (c) => !e.vr.negocios.some((n) => n.id === c.id));
          e.pendiente = { clase: "vr-negocio", carta };
          break;
        }
        case "sueno": {
          const carta = robar(e.mazos.suenosVR, D.SUENOS_VR);
          e.pendiente = { clase: "vr-sueno", carta };
          break;
        }
        case "caridad": {
          const costo = redondear(this.flujoVR() * 0.10);
          e.pendiente = { clase: "caridad", costo, vr: true };
          break;
        }
        case "bono": {
          const carta = robar(e.mazos.bonosVR, D.BONOS_VR);
          this.cobrar(carta.monto, carta.titulo);
          e.pendiente = { clase: "aviso", icono: "🎁", titulo: carta.titulo, texto: carta.texto,
            detalle: `Recibes ${this.moneda(carta.monto)}.` };
          break;
        }
        case "contratiempo": {
          const carta = robar(e.mazos.contratiemposVR, D.CONTRATIEMPOS_VR);
          e.pendiente = this.aplicarContratiempoVR(carta);
          break;
        }
      }
      this.guardar();
    },

    aplicarContratiempoVR(carta) {
      const e = this.estado;
      const base = { clase: "aviso", icono: "⚠️", titulo: carta.titulo, texto: carta.texto };
      if (carta.modo === "fijo") {
        this.pagar(carta.monto, carta.titulo);
        base.detalle = `Pagas ${this.moneda(carta.monto)}.`;
      } else if (carta.modo === "mitadEfectivo") {
        const monto = redondear(Math.max(0, e.efectivo) / 2);
        this.pagar(monto, carta.titulo);
        base.detalle = `Pagas ${this.moneda(monto)} (la mitad de tu efectivo).`;
      } else if (carta.modo === "pierdeNegocio") {
        if (e.vr.negocios.length) {
          const perdido = e.vr.negocios.pop();
          base.detalle = `Pierdes: ${perdido.titulo} (−${this.moneda(perdido.flujo)} de flujo mensual).`;
          this.log(`Pierdes ${perdido.titulo} por un fraude.`, "mal");
        } else {
          base.detalle = "Todavía no tienes grandes negocios: no te afecta.";
        }
      } else if (carta.modo === "ajusteFlujo") {
        let delta = 0;
        e.vr.negocios.forEach((n) => {
          const antes = n.flujo;
          n.flujo = redondear(n.flujo * carta.factor);
          delta += n.flujo - antes;
        });
        base.detalle = delta ? `${this.moneda(delta)} de flujo mensual.` : "No tienes negocios afectados.";
      }
      return base;
    },

    comprarNegocioVR(carta) {
      const e = this.estado;
      if (e.efectivo < carta.precio) return { ok: false, msg: `Te faltan ${this.moneda(carta.precio - e.efectivo)}.` };
      e.efectivo -= carta.precio;
      e.vr.negocios.push({ id: carta.id, titulo: carta.titulo, precio: carta.precio, flujo: carta.flujo });
      this.log(`Compras ${carta.titulo}: +${this.moneda(carta.flujo)} de flujo mensual.`, "bien");
      const logrado = this.flujoNegociosVR() >= e.vr.meta;
      if (logrado) this.ganar("flujo");
      this.guardar();
      return { ok: true, gano: logrado };
    },

    comprarSuenoVR(carta) {
      const e = this.estado;
      if (e.efectivo < carta.precio) return { ok: false, msg: `Te faltan ${this.moneda(carta.precio - e.efectivo)}.` };
      e.efectivo -= carta.precio;
      e.vr.sueno = carta;
      this.ganar("sueno");
      this.guardar();
      return { ok: true, gano: true };
    },

    ganar(motivo) {
      const e = this.estado;
      e.fase = "ganado";
      e.motivoVictoria = motivo;
      this.log(motivo === "sueno" ? "¡Cumpliste tu sueño! Ganaste el juego." : "¡Alcanzaste medio millón de flujo mensual! Ganaste el juego.", "meta");
      this.guardar();
    },

    /* ---------- resumen final ---------- */
    resumen() {
      const e = this.estado;
      return {
        turnos: e.turno,
        profesion: e.profesion,
        pasivo: this.ingresoPasivo(),
        gastos: this.gastosTotales(),
        patrimonio: this.patrimonio(),
        efectivo: e.efectivo,
        activos: e.activos.length,
        stats: e.stats,
        sueno: e.vr && e.vr.sueno ? e.vr.sueno.titulo : null,
        flujoVR: e.vr ? this.flujoVR() : 0,
      };
    },
  };

  CF.Motor = Motor;
})();
