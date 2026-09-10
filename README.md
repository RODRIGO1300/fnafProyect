# FNAF - clon (proyecto de práctica)

Clon del primer *Five Nights at Freddy's* con **elenco y arte originales**.
Incluye el menú, el arranque de partida y ahora los **cinco animatrónicos con
su IA completa**.

## Cómo jugar

Abre `index.html` en un navegador (doble clic). No necesita servidor ni
dependencias. Sonido incluido (procedural); haz un clic para activarlo.

## Controles

| Acción | Cómo |
|--------|------|
| Cerrar / abrir puerta | Clic en el botón "Puerta" de cada lado |
| Luz de pasillo | Mantener pulsado "Luz" |
| Cámaras | Pestaña inferior "CÁMARAS" o barra espaciadora |
| Cambiar de cámara | Clic en el mapa |

Sobrevive de las 12 a.m. a las 6 a.m. sin quedarte sin energía y sin que
ningún animatrónico entre en tu oficina.

## Contenido

- **Menú** con estática, título con glitch, navegación ratón/teclado,
  progreso guardado (`Continuar`, `Noche 6`, `Noche personalizada`) y una
  ficha de **Elenco**.
- **Recorte de periódico** e **intro de noche**.
- **Oficina** completa: puertas, luces, panel de cámaras con mapa, reloj y
  medidor de energía con consumo por uso.
- **5 animatrónicos** (Bruno, Vega, Pola, Rufo y el oculto Áureo) con IA
  fiel al sistema de niveles 0–20 del original. Ver [`CHARACTERS.md`](CHARACTERS.md).
- **Jumpscare**, pantalla de *Game Over*, **apagón** con secuencia de Bruno y
  pantalla de **6 a.m.** que encadena a la noche siguiente.
- **Noche personalizada** (se desbloquea al superar la noche 6).

## Estructura

```
index.html          escenas
css/style.css        estilos y disposición
js/static.js         estática de TV (canvas)
js/audio.js          sonido procedural (WebAudio)
js/characters.js     datos de los personajes + sprites SVG + tabla de IA
js/ai.js             motor de comportamiento de los animatrónicos
js/game.js           orquestador: escenas, bucle de noche, render
```

## Ajustar dificultad

Todo está en [`js/characters.js`](js/characters.js): `NIGHT_AI` (niveles por
noche), `moveInterval` y `path` de cada personaje.

---

Proyecto de fans sin ánimo de lucro. Elenco y arte originales.
No afiliado con Scott Cawthon / Scott Games.
