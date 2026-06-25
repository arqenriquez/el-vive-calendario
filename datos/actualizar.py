# -*- coding: utf-8 -*-
"""
Lee el Excel editado (datos/calendario-el-vive.xlsx) y:
  1) genera datos/eventos.json
  2) reescribe el bloque EVENTOS dentro de ../app.js
El día de la semana se recalcula automáticamente (salvo en eventos de rango).

Uso:
    python datos/actualizar.py
"""
import json
import os
import re
from datetime import date, datetime, timedelta, timezone

import openpyxl

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
XLSX_PATH = os.path.join(AQUI, "calendario-el-vive.xlsx")
JSON_PATH = os.path.join(AQUI, "eventos.json")
APPJS_PATH = os.path.join(RAIZ, "app.js")
INDEX_PATH = os.path.join(RAIZ, "index.html")

ANIO = 2026
ORDEN_MESES = ["Junio", "Julio", "Agosto", "Septiembre",
               "Octubre", "Noviembre", "Diciembre"]
MES_NUM = {m: i for i, m in enumerate(
    ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
     "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"], start=1)}

# nombre amigable (Excel) -> clave interna
NOMBRE_CAT = {
    "Junta de Consejo": "consejo",
    "Apostolado": "apostolado",
    "Misa": "misa",
    "Matrimonios · KIDS · Juntas": "matrimonios",
    "Económica": "economica",
    "Especial": "especial",
}
DOW_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]  # weekday(): Lun=0


def limpio(v):
    return "" if v is None else str(v).strip()


def parse_dia(v):
    """Devuelve int si es un día simple, o el texto tal cual si es un rango."""
    s = limpio(v)
    if re.fullmatch(r"\d+", s):
        return int(s)
    # ¿venía como float 8.0 desde Excel?
    if re.fullmatch(r"\d+\.0", s):
        return int(float(s))
    return s


def dow_es(mes, dia):
    try:
        return DOW_ES[date(ANIO, MES_NUM[mes], int(dia)).weekday()]
    except (ValueError, KeyError, TypeError):
        return ""


ICS_DIR = os.path.join(RAIZ, "ics")


def parse_hora(h):
    """'5:00 p.m.' -> (hh, mm) en 24 h; None si no se reconoce."""
    m = re.search(r"(\d{1,2}):(\d{2})\s*([ap])\.?\s*\.?m", str(h), re.I)
    if not m:
        return None
    hh, mm = int(m.group(1)), int(m.group(2))
    pm = m.group(3).lower() == "p"
    if pm and hh < 12:
        hh += 12
    if not pm and hh == 12:
        hh = 0
    return hh, mm


def fechas_cal(e):
    """('timed'|'allday', inicio, fin) o None si el evento no tiene fecha.
    Misma lógica que app.js: con hora = 1.5 h; sin hora o rango = día(s) completo(s)."""
    s = str(e["dia"]).strip()
    if not s or e["mes"] not in MES_NUM:
        return None
    partes = [p.strip() for p in re.split(r"[–-]", s) if p.strip()]
    if not partes or not partes[0].isdigit():
        return None
    dia_ini = int(partes[0])
    dia_fin = int(partes[1]) if len(partes) > 1 and partes[1].isdigit() else dia_ini
    mes_ini = MES_NUM[e["mes"]]
    mes_fin = mes_ini + 1 if dia_fin < dia_ini else mes_ini  # rango que cruza de mes
    es_rango = bool(e.get("rango")) or dia_fin != dia_ini
    hora = parse_hora(e.get("hora", ""))
    if hora and not es_rango:
        ini = datetime(ANIO, mes_ini, dia_ini, hora[0], hora[1])
        fin = ini + timedelta(minutes=90)
        return ("timed", ini.strftime("%Y%m%dT%H%M00"), fin.strftime("%Y%m%dT%H%M00"))
    ini = date(ANIO, mes_ini, dia_ini)
    fin = date(ANIO, mes_fin, dia_fin) + timedelta(days=1)  # fin exclusivo
    return ("allday", ini.strftime("%Y%m%d"), fin.strftime("%Y%m%d"))


def ics_text(titulo, desc, kind, start, end, loc=""):
    def esc(t):
        return (str(t).replace("\\", "\\\\").replace(";", "\\;")
                .replace(",", "\\,").replace("\n", "\\n"))
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    uid = f"elvive-{start}-{abs(hash(titulo)) % 100000}@elvive"
    dts = f";VALUE=DATE:{start}" if kind == "allday" else f":{start}"
    dte = f";VALUE=DATE:{end}" if kind == "allday" else f":{end}"
    L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EL VIVE//Calendario//ES",
         "CALSCALE:GREGORIAN", "BEGIN:VEVENT", f"UID:{uid}", f"DTSTAMP:{stamp}",
         f"DTSTART{dts}", f"DTEND{dte}", f"SUMMARY:{esc(titulo)}"]
    if desc:
        L.append(f"DESCRIPTION:{esc(desc)}")
    if loc:
        L.append(f"LOCATION:{esc(loc)}")
    L += ["END:VEVENT", "END:VCALENDAR"]
    return "\r\n".join(L) + "\r\n"


def generar_ics(eventos):
    """Genera ../ics/ev-<i>.ics (uno por evento con fecha). El índice <i>
    coincide con la posición del evento en el arreglo EVENTOS de app.js."""
    if os.path.isdir(ICS_DIR):
        for f in os.listdir(ICS_DIR):
            if f.endswith(".ics"):
                os.remove(os.path.join(ICS_DIR, f))
    else:
        os.makedirs(ICS_DIR)
    n = 0
    for i, e in enumerate(eventos):
        fc = fechas_cal(e)
        if not fc:
            continue
        txt = ics_text(e["titulo"], e.get("desc", ""), *fc, loc=e.get("mapa", ""))
        with open(os.path.join(ICS_DIR, f"ev-{i}.ics"), "w",
                  encoding="utf-8", newline="") as f:
            f.write(txt)
        n += 1
    return n


def leer_excel():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["Calendario"]
    eventos = []
    for fila in ws.iter_rows(min_row=2, values_only=True):
        mes = limpio(fila[0])
        if not mes:
            continue  # fila vacía
        dia = parse_dia(fila[1])
        dow_excel = limpio(fila[2])
        cat_nombre = limpio(fila[3])
        titulo = limpio(fila[4])
        hora = limpio(fila[5])
        desc = limpio(fila[6])
        rango = limpio(fila[7]).lower() in ("sí", "si", "x", "verdadero", "true")
        mapa = limpio(fila[8]) if len(fila) > 8 else ""  # link de Google Maps (opcional)
        reprogramado = (limpio(fila[9]).lower() in ("sí", "si", "x", "verdadero", "true")
                        if len(fila) > 9 else False)

        cat = NOMBRE_CAT.get(cat_nombre, cat_nombre)
        # dow: para rangos respeta lo escrito; si no, recalcula desde la fecha
        dow = dow_excel if rango else (dow_es(mes, dia) or dow_excel)

        e = {"mes": mes, "dia": dia, "dow": dow, "cat": cat, "titulo": titulo}
        if hora:
            e["hora"] = hora
        if desc:
            e["desc"] = desc
        if rango:
            e["rango"] = True
        if mapa:
            e["mapa"] = mapa
        if reprogramado:
            e["reprogramado"] = True
        eventos.append(e)

    # Ordena por mes y día inicial. Los eventos sin día definido (ej. apostolado
    # "fecha por definir") van al FINAL de su mes (día = 99).
    def clave(e):
        s = str(e["dia"]).strip()
        if not s:
            d = 99
        else:
            try:
                d = int(re.split(r"[–\-]", s)[0].strip())
            except ValueError:
                d = 99
        return (ORDEN_MESES.index(e["mes"]) if e["mes"] in ORDEN_MESES else 99, d)

    eventos.sort(key=clave)
    return eventos


def js_valor(v):
    if isinstance(v, int):
        return str(v)
    return json.dumps(v, ensure_ascii=False)


def evento_a_js(e):
    partes = [f'mes: {js_valor(e["mes"])}',
              f'dia: {js_valor(e["dia"])}',
              f'dow: {js_valor(e["dow"])}',
              f'cat: {js_valor(e["cat"])}',
              f'titulo: {js_valor(e["titulo"])}']
    if e.get("desc"):
        partes.append(f'desc: {js_valor(e["desc"])}')
    if e.get("hora"):
        partes.append(f'hora: {js_valor(e["hora"])}')
    if e.get("rango"):
        partes.append("rango: true")
    if e.get("mapa"):
        partes.append(f'mapa: {js_valor(e["mapa"])}')
    if e.get("reprogramado"):
        partes.append("reprogramado: true")
    return "  { " + ", ".join(partes) + " },"


def construir_bloque(eventos):
    lineas = ["const EVENTOS = ["]
    for mes in ORDEN_MESES:
        delmes = [e for e in eventos if e["mes"] == mes]
        if not delmes:
            continue
        lineas.append(f"  // ===== {mes.upper()} =====")
        lineas.extend(evento_a_js(e) for e in delmes)
        lineas.append("")
    if lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    return "\n".join(lineas)


def actualizar_appjs(eventos):
    with open(APPJS_PATH, encoding="utf-8") as f:
        src = f.read()
    nuevo = construir_bloque(eventos)
    # Reemplaza desde "const EVENTOS = [" hasta el primer "];"
    patron = re.compile(r"const EVENTOS = \[.*?\n\];", re.DOTALL)
    if not patron.search(src):
        raise SystemExit("No encontré el bloque EVENTOS en app.js")
    src = patron.sub(lambda _: nuevo, src, count=1)
    with open(APPJS_PATH, "w", encoding="utf-8") as f:
        f.write(src)


def sellar_version():
    """Renueva ?v=<fechahora> en styles.css y app.js dentro de index.html.

    Así los navegadores descargan la versión nueva en lugar de reusar la
    guardada en caché (evita que la gente vea el calendario desactualizado).
    """
    token = datetime.now().strftime("%Y%m%d%H%M")
    with open(INDEX_PATH, encoding="utf-8") as f:
        src = f.read()
    nuevo = re.sub(r'(href|src)="(styles\.css|app\.js)(\?v=\d+)?"',
                   rf'\1="\2?v={token}"', src)
    if nuevo != src:
        with open(INDEX_PATH, "w", encoding="utf-8") as f:
            f.write(nuevo)
    return token


def main():
    eventos = leer_excel()
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(eventos, f, ensure_ascii=False, indent=2)
    actualizar_appjs(eventos)
    n_ics = generar_ics(eventos)
    token = sellar_version()
    print(f"Listo: {len(eventos)} eventos -> eventos.json y app.js actualizados. "
          f"({n_ics} archivos .ics | versión de caché: {token})")


if __name__ == "__main__":
    main()
