# Guía de anonimización — tutelas reales para validación externa (#125)

Antes de que el texto de una tutela real entre a cualquier archivo de este kit (`corpus.jsonl`, `queries.jsonl`) o a la base local `rag-eval-db`, removerlo o enmascararlo:

## Campos a remover o enmascarar siempre

- **Nombre completo del accionante** y de cualquier tercero mencionado (testigos, familiares) → reemplazar por un rol genérico: "el accionante", "su hijo menor de edad", etc.
- **Número de cédula / identificación** de cualquier persona.
- **Radicado judicial** (identifica el caso exacto y el juzgado) → reemplazar por un ID sintético (`REAL-001`, `REAL-002`, ...).
- **Dirección exacta del predio/domicilio** → generalizar a barrio/municipio si el dato es relevante al caso (p.ej. servidumbres de paso dependen de ubicación rural/urbana), nunca la dirección completa.
- **Teléfono, correo electrónico** de cualquier persona.
- **Nombre del juzgado específico** → generalizar a "Juzgado Civil Municipal de [ciudad]" si la instancia es relevante, o simplemente omitir.
- **Fechas exactas** que permitan correlacionar con el expediente público → generalizar a mes/año si la fecha no es sustantiva al análisis (plazos sí son sustantivos — revisar caso por caso).
- **Cualquier número de cuenta, factura o contrato** de Enel asociado al accionante.

## Qué SÍ puede quedar (es lo que hace el caso útil para la evaluación)

- El derecho invocado y los hechos jurídicamente relevantes (ej. "corte de servicio por mora", "servidumbre de paso para infraestructura").
- Los argumentos jurídicos usados en la contestación o el fallo.
- Las normas citadas.
- La categoría/derecho_vulnerado del caso.

## Verificación antes de usar el archivo

1. Buscar manualmente el texto anonimizado por patrones de cédula (dígitos agrupados de 6-10 cifras), email, y teléfono — igual que la verificación automática que ya corre sobre el corpus sintético (`eval/data/v3/README.md`, paso "Sin PII").
2. Pedir a una segunda persona (o releer en frío) que confirme que el texto no permite identificar al accionante ni el expediente exacto.
3. Solo entonces, copiar el texto anonimizado a `corpus.jsonl`/`queries.jsonl` dentro de `eval/data/validacion_externa/` — nunca antes.

## Recordatorio

Esto solo aplica si la política de Enel permite este uso de tutelas anonimizadas fuera del sistema de producción. Confirmarlo con Alejandro antes de anonimizar nada — este kit no asume que ya está permitido.
