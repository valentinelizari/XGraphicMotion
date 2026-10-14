# X · ¿Qué está pasando?

Pieza de motion graphics (124 s, 4K/60 fps) que presenta el TP *“¿Qué está pasando con X?”*
(UADE · FACE · Construcción y Gestión de Marca · 2C 2026): contexto, identidad, posicionamiento,
mix, Brand Health Tracker y brand book, contado como un hilo de 6 posts.

Lenguaje visual: el sistema de X (negro, blanco y azul de acción `#1D9BF0`, Inter como sustituto de Chirp),
tipografía cinética por letra, gancho de apertura en montaje rápido, el pájaro de Twitter cortado en X
por dos hojas de luz que dan paso al monograma, transiciones hypermotion (slash wipe, whip, zoom-through,
smear, glitch), grilla de fondo que late con el pulso y banda sonora sintetizada a 120 BPM con diseño
sonoro tonal (afinado en la tonalidad) y cada corte en el pulso.

## Estructura

| Archivo | Qué hace |
|---|---|
| `src/engine.js` | Motor: easing, tipografía cinética `kt()`, cámara, post FX y marcas vectoriales (X y pájaro) |
| `src/scenes.js` | Línea de tiempo: intro, título, hilo, 6 capítulos, cierre + cues de sonido |
| `src/index.html` | Página que carga todo (`?play` para verla en vivo en el navegador, `?scale=2` para 4K) |
| `tools/render.mjs` | Render determinista cuadro a cuadro con Playwright → ffmpeg |
| `tools/render_all.sh` | Render en paralelo por tramos y concatenación |
| `tools/audio.py` | Música y diseño sonoro procedurales (numpy) a partir de los cues |

## Render

```bash
tools/render_all.sh 2 60 out 16 4            # 3840×2160 @ 60 fps → out/video.mp4
node tools/cues.mjs cues.json                 # exporta los cues de sonido
python3 tools/audio.py cues.json soundtrack.wav
ffmpeg -i out/video.mp4 -i soundtrack.wav -c:v copy -c:a aac -b:a 320k -shortest X_que_esta_pasando_4K.mp4
```

Vista previa en vivo: abrir `src/index.html?play` en Chrome.
