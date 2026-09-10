# FNAF - clon (proyecto de práctica)

Clon básico del primer *Five Nights at Freddy's*. De momento solo incluye
el **menú principal** y el arranque de partida. **No hay animatrónicos ni IA.**

## Cómo jugar

Abre `index.html` en un navegador (doble clic). No necesita servidor ni
dependencias.

## Contenido actual

- **Menú principal** con estática de fondo, título con glitch y navegación
  por ratón o teclado (flechas + Enter). Solo "Nueva partida" está activa.
- **Recorte de periódico** (anuncio de empleo) al empezar.
- **Intro de noche** ("Noche 1").
- **Oficina vacía** funcional:
  - Puertas izquierda/derecha (clic para cerrar/abrir).
  - Luces izquierda/derecha (mantener pulsado).
  - Panel de cámaras (pestaña inferior o barra espaciadora) con mapa y
    nombres de sala, sin contenido todavía.
  - Reloj de 12 a.m. a 6 a.m. y medidor de energía que se consume según lo
    que tengas activo.
- **Pantalla de 6 a.m.** (victoria) y **sin energía** (fin), ambas vuelven
  al menú.

## Estructura

```
index.html        estructura de escenas
css/style.css     estilos y disposición
js/static.js      efecto de estática en canvas
js/game.js        máquina de estados y lógica de la noche
```

## Siguiente paso

Añadir los animatrónicos y su IA de movimiento por cámaras.

---

Proyecto de fans sin ánimo de lucro. No afiliado con Scott Cawthon / Scott Games.
