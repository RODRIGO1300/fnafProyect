# Elenco

Cinco animatrónicos **originales** que cumplen los mismos roles de juego que
el clásico. Todo está definido en [`js/characters.js`](js/characters.js):
nombres, colores, rutas, intervalos y niveles de IA. Cambiar cualquier cosa
ahí no requiere tocar el motor.

| Personaje | Especie | Rol clásico | Puerta | Ruido |
|-----------|---------|-------------|--------|-------|
| **Bruno** | Oso | El presentador | Este (der.) | Risa grave al moverse |
| **Vega**  | Conejo | El de la izquierda | Oeste (izq.) | Ninguno |
| **Pola**  | Gallina | La de la derecha | Este (der.) | Cacharros en Cocina |
| **Rufo**  | Zorro | El pirata que corre | Oeste (izq.) | Golpe fuerte al atacar |
| **Áureo** | Oso dorado | La alucinación oculta | — | Zumbido agudo |

## Sistema de IA (fiel al original)

Cada animatrónico tiene un **nivel 0–20**. Cada X segundos "tira un d20"; si
el resultado es ≤ su nivel, **avanza**. Nivel 0 = nunca se mueve.

Intervalos de movimiento: Bruno 3,02 s · Vega 4,97 s · Pola 4,98 s · Rufo 5,01 s.

### Niveles por noche

| Noche | Bruno | Vega | Pola | Rufo |
|------:|:-----:|:----:|:----:|:----:|
| 1 | 0 | 2 | 1 | 1 |
| 2 | 0 | 4 | 3 | 3 |
| 3 | 1 | 6 | 5 | 5 |
| 4 | 2 | 9 | 8 | 8 |
| 5 | 3 | 12 | 11 | 12 |
| 6 | 4 | 16 | 16 | 16 |
| 7 | \*personalizada\* | | | |

A las **4 a.m.** (noche ≥ 3) todos suben +1. Bruno suma +2 extra si la
energía baja de 30 %.

## Comportamientos propios

**Bruno** — no se activa hasta que Vega y Pola han dejado el escenario al
menos una vez. Se **congela** mientras lo miras en su cámara. Va por el lado
este; si llega al Pasillo Este (esq.) con la puerta derecha cerrada,
retrocede. Si entra en la oficina, te mata al bajar el monitor. En un
**apagón** aparece en la puerta izquierda con la cara iluminada y una
melodía; tras un tiempo aleatorio, ataca (a menos que lleguen las 6 a.m.).

**Vega y Pola** — recorren salas hacia su puerta (con ramas para que no sea
lineal). En la esquina de tu puerta: si la cierras, se van; si la dejas
abierta y subes el monitor, se cuelan y te matan cuando lo bajes. Cerrar la
puerta con ellos ya dentro los expulsa.

**Rufo** — no cambia de sala: progresa por 4 fases en La Cala (cortina
cerrada → asomando → fuera → corriendo). Mirarlo por la cámara 1C lo frena y
puede hacerle retroceder. Si dejas las cámaras bajadas más de 6 s, avanza al
doble. Al llegar a la fase 4 esprinta por el pasillo oeste: si la puerta
izquierda está cerrada gastas energía (1 % + 5 % por cada golpe anterior) y
se reinicia; si está abierta, es instantáneo.

**Áureo** — evento raro desde la noche 2. Un póster de la oficina cambia a su
cara; si no subes el monitor, aparece desplomado en el suelo. Subir el
monitor lo disuelve. Si te quedas mirándolo, te mata.

## Contadores rápidos

- **Vega / Pola:** luz de puerta con frecuencia; si ves la cara, cierra.
- **Bruno:** vigílalo por cámara; energía siempre por encima de 30.
- **Rufo:** un vistazo a 1C cada poco; no abuses de tener las cámaras bajadas.
- **Áureo:** monitor arriba en cuanto veas el póster raro.

---

Elenco y arte originales. No afiliado con Scott Cawthon / Scott Games.
