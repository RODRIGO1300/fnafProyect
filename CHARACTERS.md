# Personajes

El elenco anterior se ha retirado. **El diseño definitivo del elenco está
pendiente** y se anunciará más adelante.

## Personaje reservado

| Personaje | Especie | Estado |
|-----------|---------|--------|
| **Dogo**  | Perro   | Pendiente — sin comportamiento todavía |

`Dogo` es un marcador de posición. Aparece en la ficha de **Elenco** y como
único deslizador de la **Noche Personalizada**, pero **no se mueve durante la
noche**. Su arte definitivo y su lógica llegarán en una actualización
posterior, con su propia carpeta de recursos.

## Cómo se añadirá un personaje

Todo está preparado para reconectar personajes sin tocar el orquestador:

1. **`js/characters.js`**
   - `implemented: true` en su entrada de `ANIMATRONICS`.
   - `moveInterval`, `start`, `path` / fases, `door`.
   - Niveles por noche en `NIGHT_AI` (escala 0&ndash;20).
   - Añadirlo a `ROSTER` (activo en la noche) y, si procede, a `CUSTOM_ROSTER`.
   - Un sprite SVG en `SPRITES` para su `species`.
2. **`js/ai.js`**
   - Su comportamiento en `behave()` (o una función propia).
   - Exponerlo en `presenceInCam` / `atDoor` / `inOffice` para el render.
3. **`js/game.js`** no necesita cambios: ya dibuja lo que el motor
   reporte y dispara el jumpscare cuando el motor llama a `hooks.jumpscare`.

## Sistema de IA previsto

Cada animatrónico tendrá un nivel **0&ndash;20**. Cada `moveInterval` ms se
tira un d20; si el resultado es ≤ su nivel, avanza. Nivel 0 = nunca se mueve.
A las **4 a.m.** (noche ≥ 3) todos suben +1.

---

Personajes y arte originales. No afiliado con Scott Cawthon / Scott Games.
