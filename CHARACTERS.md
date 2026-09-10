# Personajes

Elenco propio (arte y nombres originales). Todo es data-driven: cada
personaje es una entrada de `ANIMATRONICS` en [`js/world.js`](js/world.js).

| Personaje | Especie | Estado | Rol |
|-----------|---------|--------|-----|
| **Dogo**  | Perro   | **Activo** | Recorre el ala este y se asoma a la puerta derecha |
| **Caty**  | Gata    | Reservado (`implemented:false`) | — |
| **Roy**   | Mapache | Reservado | — |
| **Remy**  | Mapache rojo | Reservado | — |

## Dogo

- **Ruta**: `1A → 1B → 7 → 6 (Cocina, sólo audio) → 4A → 4B → puerta derecha`.
- Se **congela** mientras lo miras en su cámara actual (como Freddy).
- **Sin jumpscare todavía**: si llega a la puerta derecha y la dejas
  abierta, se retira solo tras `doorLingerMs` (6 s); cerrar la puerta
  también lo hace volver al comedor.
- Niveles de IA **provisionalmente altos** (`NIGHT_AI`: Noche 1 = 5 …
  Noche 6 = 19) para verle recorrer las cámaras desde la primera noche.
- Sprites: `assets/personajes/DOGO/sprites/` (cámaras + puerta), colocados
  por cámara con `cameraLayout` (tamaño, posición y modo de fusión).

## Sistema de IA

Cada animatrónico tiene un nivel **0–20**. Cada `moveInterval` ms se tira
un d20; si sale ≤ su nivel, **avanza** (una sala, una fase…). Nivel 0 =
nunca se mueve. A las **4 a.m.** (noche ≥ 3) todos suben +1.

## Añadir / activar un personaje

1. **`js/world.js`**
   - `implemented: true` en su ficha de `ANIMATRONICS`.
   - `start`, `path` (o fases), `door`, `moveInterval`.
   - Entrada en `NIGHT_AI` (niveles por noche).
   - Añadirlo a `ROSTER` (activo de noche) y, si procede, a `CUSTOM_ROSTER`.
   - Sus rutas de sprite en la propia ficha; `SPRITES[species]` como
     respaldo SVG.
2. **`js/ai.js`** → rama de comportamiento en `behave()`, y exponerlo en
   `presenceInCam` / `atDoor` / `inOffice`.
3. **`js/office.js` / `js/cameras.js`** ya pintan lo que el motor reporte;
   el jumpscare se dispara cuando el motor llama a `hooks.jumpscare(id)`
   (Dogo aún no lo hace).

---

Personajes y arte originales. No afiliado con Scott Cawthon / Scott Games.
