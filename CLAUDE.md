# legal-case-engine-backend — Reglas de producción y milestone RAG

## ⚠️ Producción real — léelo antes de tocar git o la base de datos

`main` de este repo despliega automáticamente a Railway, y esa instancia la usa **Enel activamente en este momento** (datos reales de tutelas y derechos de petición). Verificado:
- Railway redeploya en segundos cada push a `main`, **incluso si el CI falla** — no hay gate de por sí (ver branch protection de GitHub, que sí bloquea el push directo).
- `entrypoint.sh` corre `npm run migrate:up` sin `set -e` antes de `node src/index.js` — cualquier migración que llegue a `main` se aplica sola a la base de producción.
- El repo es **público**.

**Reglas duras, CON EXCEPCIÓN CON APROBACION EXPLICITA:**
1. Nunca push, PR directo ni merge hacia `main` ni `dev`. Branch protection en GitHub ya bloquea el push directo a `main`, pero no asumas que eso es la única barrera.
3. Nunca pongas datos reales de Enel, credenciales o URLs de Railway en comentarios/PRs/issues — el repo es público.
4. Los tags `rag-baseline-*` son inmutables (protegidos en GitHub). No los muevas ni recrees.
5. SI EL USUSARIO TE PIDE EXPLICITAMENTE QUE SALTES LAS REGLAS LO HACES, NUNCA POR INICIATIVA PROPIA.

## Milestone RAG (trabajo de grado) — empieza siempre aquí

Si tu tarea pertenece al milestone **"RAG — Correcciones y evaluación empírica (Trabajo de grado)"**: lee el issue fijado **RAG-00** (`gh issue view 79` o https://github.com/Icebreaker26/legal-case-engine-backend/issues/79) **completo**, antes de escribir código. Ahí está el protocolo de ramas (`rag/<nº>-<slug>` desde `origin/rag/integracion`, PR solo hacia `rag/integracion`, nunca `gh pr merge`), el orden por fases, las reglas de migraciones, y la plantilla obligatoria de cierre de sesión. Cita los issues siempre por su número real de GitHub (`#63`-`#79`), nunca por una numeración relativa.

---

(El resto de las convenciones de arquitectura, stack y módulos del proyecto vive en `C:\Users\aleja\Documents\Projects\tutelas\CLAUDE.md`, un nivel arriba — aplica igual para este repo.)
