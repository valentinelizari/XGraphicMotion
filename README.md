# X · ¿Qué está pasando?

Pieza de motion graphics (124 s, 4K/60 fps) que presenta el TP *“¿Qué está pasando con X?”*
(UADE · FACE · Construcción y Gestión de Marca · 2C 2026): contexto, identidad, posicionamiento,
mix, Brand Health Tracker y brand book, contado como un hilo de 6 posts.

Lenguaje visual: el sistema de X (negro, blanco y azul de acción `#1D9BF0`, Inter como sustituto de Chirp),
tipografía cinética por letra, *liquid morph* (SDF + metaballs en WebGL: el pájaro hecho de círculos
se derrite y se convierte en la X), transiciones hypermotion (slash wipe, zoom-through, smear, glitch)
y banda sonora sintetizada a 120 BPM con cada corte en el pulso.

## Estructura

| Archivo | Qué hace |
|---|---|
| `src/engine.js` | Motor: easing, tipografía cinética `kt()`, cámara, post FX y el renderer líquido WebGL |
| `src/scenes.js` | Línea de tiempo: intro, título, hilo, 6 capítulos, cierre + cues de sonido |
| `src/index.html` | Página que carga todo (`?play` para verla en vivo en el navegador, `?scale=2` para 4K) |
| `tools/render.mjs` | Render determinista cuadro a cuadro con Playwright → ffmpeg |
| `tools/render_all.sh` | Render en paralelo por tramos y concatenación |
| `tools/audio.py` | Música y diseño sonoro procedurales (numpy) a partir de los cues |

## Render

```bash
tools/render_all.sh 2 60 out 16 4            # 3840×2160 @ 60 fps → out/video.mp4
CUES=cues.json node tools/render.mjs 0.25 1 0 1 /dev/null   # exporta los cues
python3 tools/audio.py cues.json soundtrack.wav
ffmpeg -i out/video.mp4 -i soundtrack.wav -c:v copy -c:a aac -b:a 320k -shortest X_que_esta_pasando_4K.mp4
```

Vista previa en vivo: abrir `src/index.html?play` en Chrome.
