# FNAF - clon (proyecto de práctica)

Clon del primer *Five Nights at Freddy's* con arte y código originales.
El **turno de noche completo** ya funciona (oficina, cámaras, energía,
reloj, apagón, 6 a.m.). El **elenco está en rediseño**: de momento sólo hay
un personaje reservado (`Dogo`) que aún no participa.

## Cómo jugar

Abre `index.html` en un navegador (doble clic). No necesita servidor ni
dependencias. Haz un clic para activar el sonido.

## Controles

| Acción | Cómo |
|--------|------|
| Cerrar / abrir puerta | Clic en "Puerta" de cada lado |
| Luz de pasillo | Mantener pulsado "Luz" |
| Cámaras | Pestaña inferior "CÁMARAS" o barra espaciadora |
| Cambiar de cámara | Clic en el mapa |

Aguanta de las 12 a.m. a las 6 a.m. sin quedarte sin energía. El consumo
sube con cada puerta, luz o cámara que uses. Si llega a 0, apagón y
*Game Over*.

## Contenido

- **Menú**: estática, título con glitch, navegación ratón/teclado,
  interruptor de sonido, estrellas de progreso y acceso a Elenco y Noche
  Personalizada.
- **Elenco**: ficha del personaje reservado (Dogo, pendiente).
- **Noche Personalizada**: interfaz completa con deslizadores 0&ndash;20 y
  presets. **El botón "Empezar" está deshabilitado** — todavía no se puede
  iniciar.
- **Recorte de periódico** e **intro de noche** con reloj.
- **Oficina**: puertas con rejilla, luces de pasillo, ventilador animado,
  tablet, póster; HUD con hora (con pulso al cambiar), noche y medidor de
  energía por uso.
- **Panel de cámaras**: mapa estilo plano, 11 cámaras, ráfaga de estática al
  cambiar, cámara de Cocina sólo-audio, reloj y grabación.
- **Apagón** con ventilador que se para y melodía, **Game Over** y **6 a.m.**
  que encadena a la noche siguiente y desbloquea la Noche 6.

## Estructura

```
index.html          escenas
css/style.css        estilos, disposición y animaciones
js/static.js         estática de TV (canvas)
js/audio.js          sonido procedural (WebAudio)
js/characters.js     datos de personajes + sprites SVG + tabla de IA
js/ai.js             motor de IA (andamiaje; elenco desactivado)
js/game.js           orquestador: escenas, bucle de noche, oficina, cámaras
```

Ver [`CHARACTERS.md`](CHARACTERS.md) para cómo se añadirá el elenco.

---

Proyecto de fans sin ánimo de lucro. Arte y código originales.
No afiliado con Scott Cawthon / Scott Games.
