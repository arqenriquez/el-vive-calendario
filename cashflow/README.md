# Flujo de Efectivo MX

Juego de finanzas personales inspirado en **Cashflow 101** de Robert Kiyosaki, pero
reescrito para el contexto mexicano: profesiones de aquí, pesos, Infonavit, Fonacot,
tarjetas departamentales, CETES, pagarés, FIBRAs, la BMV y bienes raíces nacionales.

Pensado para **partidas rápidas de una sola persona** (como la vieja versión en línea):
abres, eliges profesión y en 10–15 minutos repasas un escenario financiero completo.

👉 Se juega en `cashflow/index.html`. Sin backend, sin frameworks, sin instalación.

## Cómo se juega

1. Eliges una de **12 profesiones mexicanas**, cada una con su sueldo, sus gastos y sus deudas reales.
2. Tiras el dado y recorres el tablero (24 casillas):
   - 💡 **Oportunidad** → eliges *trato pequeño* (CETES, acciones, FIBRAs, una casita, un negocio chico) o *trato grande* (edificios, bodegas, franquicias, hoteles).
   - 💰 **Día de pago** → cobras tu flujo mensual (también si solo pasas por la casilla).
   - 📈 **El mercado** → compradores, cambios de precio en la BMV, movimientos de tasa de Banxico. Aquí se vende.
   - 💸 **Gasto imprevisto** → tenencia, el boiler, los XV años de tu sobrina, el Buen Fin a 18 meses.
   - 🤝 **Caridad** → donas el 10% de tu ingreso y por 3 turnos tiras hasta 3 dados.
   - 👶 **Bebé** y 📉 **Recorte de personal**.
3. **Ganas la primera mitad** cuando tu *ingreso pasivo* supera tus *gastos mensuales*: sales de la carrera de la rata.
4. Entras a la **Vía Rápida**, donde compras grandes negocios y **ganas** al comprar tu sueño
   o al llegar a $500,000 de flujo mensual.

Atajo para jugar rápido: la **barra espaciadora** tira el dado y confirma la carta actual.
La partida se guarda sola en el navegador (`localStorage`).

## Qué tiene de mexicano

| Tema | Cómo aparece en el juego |
|---|---|
| Vivienda | Crédito **Infonavit** / Cofinavit, hipoteca bancaria, casa de interés social, remates bancarios |
| Deuda de consumo | Tarjetas, **tienda departamental** (Coppel/Elektra), **Fonacot**, meses sin intereses del Buen Fin |
| Ahorro e inversión | **CETES** (cetesdirecto), **pagarés** bancarios, **Udibonos**, fondos de deuda, factoraje |
| Bolsa | **NAFTRAC**, AMXL, WALMEX, CEMEX, GAPB, VOLARA y **FIBRAs** (FUNO11, FMTY14, DANHOS13) |
| Bienes raíces | Tizayuca, Guadalajara, Mérida, Tulum, el Bajío (nearshoring), Querétaro, Zapopan, Oaxaca |
| Negocios | Papelería, lavandería, tacos, café móvil, vending, gasolinera, franquicias, self storage |
| Impuestos | ISR/IMSS, **RESICO**, devolución del SAT, **PTU**, predial |

Hay un **glosario financiero** dentro del juego (menú → Glosario) con los conceptos
que aparecen en las cartas, explicados en corto.

## Nota honesta sobre los números

Los sueldos, gastos y deudas de las profesiones son aproximaciones realistas de México.
Los **tratos del mazo son deliberadamente buenos**: representan las oportunidades que
encontrarías después de analizar muchas, no el promedio del mercado. Un inmueble
apalancado del juego rinde 30–45% anual sobre el enganche; en la vida real un buen
inmueble en renta da 8–12% anual sobre el precio, y con apalancamiento sano quizá
15–25% sobre tu dinero.

Está calibrado así a propósito para que una partida dure entre **60 y 100 turnos**
(unos 10–15 minutos) en lugar de varias horas. Si alguien te ofrece 45% anual
garantizado en la vida real, revisa dos veces: en el juego es diseño, afuera suele
ser una señal de alarma.

En cambio, la **renta fija sí está a tasas realistas** (CETES ~8.5%, pagarés ~6%):
por eso se siente lenta comparada con los inmuebles. Esa diferencia es una de las
lecciones del juego, no un error de balance.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de las pantallas |
| `styles.css` | Tema oscuro, tablero y componentes |
| `js/datos.js` | **Todo el contenido editable**: profesiones, cartas, tablero, glosario |
| `js/motor.js` | Lógica del juego (estado, turnos, compras, ventas, deudas, victoria). No toca el DOM |
| `js/juego.js` | Interfaz: dibuja tablero, cartas y paneles; llama al motor |

## Cómo editar el contenido

Todo vive en **`js/datos.js`**:

- **Profesiones** → arreglo `PROFESIONES`. Cada gasto con `pasivo` se vuelve una deuda
  liquidable desde el panel del Banco.
- **Tratos pequeños / grandes** → `TRATOS_PEQUENOS` y `TRATOS_GRANDES`.
  Tipos disponibles:
  - `renta-fija` → `monto` + `tasaAnual` (el flujo mensual se calcula solo)
  - `acciones` → `precio`, `dividendoMensual`, `rango` (para FIBRAs y acciones)
  - `inmueble` / `negocio` → `precio`, `enganche`, `flujo`
  - `salario` → `costo` + `aumento` (invertir en ti mismo)
  - El campo `nota` es la explicación educativa que aparece en la carta.
- **Gastos imprevistos** → `GASTOS`. Si traen `deuda`, agregan un pago mensual permanente.
- **Cartas de mercado** → `MERCADO`, con efectos `venta`, `precioAccion`, `ajusteFlujo`,
  `perdida` y `efectivo`.
- **Tablero** → `TABLERO` (24 casillas) y `VIA_RAPIDA_TABLERO`.
- **Glosario** → `GLOSARIO`.

Después de editar, recarga la página. Si cambias la estructura del estado guardado,
sube `VERSION_ESTADO` en `js/motor.js` para invalidar las partidas viejas.

## Verlo localmente

```bash
python -m http.server 5599
# y entra a http://localhost:5599/cashflow/
```

Publicado en GitHub Pages queda en `.../cashflow/`.

## Créditos

Juego original: **CASHFLOW 101**, de Robert Kiyosaki (Rich Dad). Esta es una
adaptación personal, no oficial y sin fines comerciales, con contenido, cartas y
mecánicas propias escritas para el contexto mexicano.
