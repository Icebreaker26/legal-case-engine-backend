# Guía de etiquetado — validación externa con tutelas reales (#125)

Adaptado del protocolo ciego de `#75`/`#113` (dos sesiones de IA completamente aisladas) a una sola persona real. El objetivo es el mismo: que quien etiqueta no sepa qué sistema (léxico-solo o híbrida) recuperó cada documento, para que el juicio de relevancia no se contamine con esa información.

## Antes de empezar

1. **Pedir el CSV sin las columnas `sistemas` y `n_sistemas_que_lo_recuperaron`** — quien prepara el archivo (Alejandro o un agente) debe ocultarlas antes de entregarlo a quien etiqueta. Si estás etiquetando y las ves, decílo — el etiquetado deja de ser válido.
2. Cada fila es un par (consulta, documento candidato) — el mismo documento puede aparecer en varias filas si varios sistemas lo recuperaron para la misma consulta (eso ya está deduplicado por el script de pooling, no hace falta que lo gestiones).

## Cómo calificar cada par (escala 0-3)

Para cada fila, leer la consulta (`query_texto`, la tutela real anonimizada) y el documento candidato (`doc_titulo` + `doc_snippet`), y asignar en `relevancia_0a3`:

- **3 — Totalmente relevante**: el documento resuelve exactamente el mismo tipo de caso/derecho que la consulta, con argumentos directamente aplicables.
- **2 — Relevante**: mismo derecho/categoría, pero con hechos o alcance distintos — útil como referencia, no como precedente directo.
- **1 — Marginalmente relevante**: toca el mismo tema de forma tangencial, o comparte solo la categoría general sin similitud de hechos.
- **0 — No relevante**: no tiene relación sustantiva con la consulta.

Agregar una **razón breve** por cada calificación (columna `razon_breve` o `notas`, según el template) — necesaria para poder auditar el criterio después, igual que en `#75`/`#113`.

## Reglas para mantener el etiquetado válido

- No buscar el expediente real ni intentar "adivinar" qué sistema recuperó cada fila — calificar solo por el contenido de la consulta y el documento, como si fuera la primera vez que los ves juntos.
- No comparar filas de la misma consulta entre sí para "ordenar" — cada par se califica de forma independiente.
- Si una fila es ambigua, preferir documentar la duda en `razon_breve` en vez de forzar un número — ayuda a decidir después si ese par se descarta.

## Acuerdo intra-anotador (opcional, recomendado si hay tiempo)

Con un solo abogado disponible no se puede medir Cohen's κ entre dos personas como en `#75` (κ=0.667-0.895) — alternativa de bajo costo: guardar una copia de ~20% de las filas (al azar) etiquetadas, y pedirle a la misma persona que las vuelva a calificar unos días después, sin ver sus respuestas anteriores. Comparar ambas rondas da una medida aproximada de consistencia interna. No es obligatorio para que la validación cuente — es una forma barata de reforzarla si hay tiempo.

## Al terminar

Completar `relevancia_anotador1_0a3` en todas las filas del CSV (dejar vacío solo si de verdad no se puede juzgar, y explicar por qué en `notas`) y devolver el archivo para correr `03d_fusionar_qrels.js` (ver `README.md` de esta carpeta).
