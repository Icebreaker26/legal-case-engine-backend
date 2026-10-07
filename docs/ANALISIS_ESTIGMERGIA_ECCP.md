# Análisis conceptual: estigmergia cognitiva y scoring de precedentes (ECCP)

> **Estado: documento de referencia conceptual, no implementado.**
> Este documento recoge el análisis académico y el diseño conceptual discutidos antes de tocar código. Sirve como insumo para el marco teórico de la tesis y como referente de diseño cuando se decida implementar cambios al scoring de precedentes. No implica que el diseño aquí descrito esté activo en el sistema.
>
> Origen: discusión con un profesor experto que sugirió encuadrar el mecanismo de voto útil/no útil sobre precedentes como un caso de inteligencia de enjambre (estigmergia / Optimización por Colonia de Hormigas — ACO). Se evaluó la hipótesis con rigor académico antes de aceptarla, y se diseñó conceptualmente un algoritmo (ECCP) que la aprovecha sin sobre-afirmar el encuadre teórico.
>
> Referencias bibliográficas citadas de memoria — **verificar antes de citar en la tesis**.

---

## 1. Punto de partida: qué hace el sistema hoy

Estado verificado en el código al momento de este análisis (puede haber cambiado — confirmar antes de usar como referencia de implementación):

| Hecho | Dónde |
|---|---|
| `relevancia_score INTEGER NOT NULL DEFAULT 0` sobre `base_conocimiento_enel`, a nivel de chunk | `migrations/1781960000000_add-relevancia-score-to-memoria.cjs:2-5` |
| Endpoint `POST /api/tutelas/memoria/:documento_id/feedback` con body `{util: boolean}` | `src/modules/tutelas/routes/tutelaRoutes.js:132`, schema `tutelaSchema.js:68-70` |
| Suma +1 o -1 a **todos los chunks del documento**. Sin deduplicación por usuario, sin guardar la tutela/consulta de origen ni la fecha del voto | `tutelaController.js:485-493` |
| A score ≤ -5, `es_exitosa = false` — **estado absorbente**: el documento deja de recuperarse para siempre y ya nadie puede re-votarlo | `tutelaController.js:499-505` |
| El único rastro del voto es un log `FEEDBACK_UTIL/NO_UTIL` en `logs_sistema` (usuario, documento, IP), sin tutela ni posición mostrada | `tutelaController.js:507`, `src/services/auditService.js:12-21` |
| Producción usa `fusion='ponderado'` por defecto: `0.55·cos + 0.35·ts_rank + 0.10·clip(score,0,10)/10` | `consultaService.js:43`, `vectorService.js:28-32` |
| Por `GREATEST(...,0)`, los votos negativos **no afectan el ranking** hasta el precipicio de -5 | `vectorService.js:31` |
| En modo RRF, la rama de popularidad es independiente de la consulta — puede meter precedentes irrelevantes al top | `vectorService.js:143-161` |
| La configuración confirmada estadísticamente para producción (e5-small, α=0.9) **excluye el feedback** | `vectorService.js:189-212` |
| **En todos los corpus de evaluación de la tesis, `relevancia_score` vale siempre 0.** El componente de feedback no tiene evidencia empírica | `eval/scripts/v2_barrido_pesos.js:12`, `eval/scripts/00_ablation.js:12-13` |

Dos defectos de producción detectados en el camino, **independientes de esta discusión teórica**, candidatos a issue aparte:
1. Sin deduplicación, un solo usuario votando "no útil" 5 veces elimina un precedente de todo el sistema para siempre.
2. La rama de popularidad en RRF puede introducir precedentes irrelevantes al top.

---

## 2. Veredicto teórico

**Modificar: refutar ACO formal, aceptar estigmergia cognitiva como marco descriptivo (no como formalización matemática).**

> "El mecanismo implementado es retroalimentación explícita de relevancia (*explicit relevance feedback*) de un grupo pequeño de expertos, agregada como un *prior* de calidad por documento. Comparte con la estigmergia la coordinación indirecta entre agentes a través de un artefacto compartido (el score persistido), por lo que puede describirse como estigmergia cognitiva en sentido amplio (Ricci et al., 2007; Heylighen, 2016). No constituye una instancia de Optimización por Colonia de Hormigas: no hay agentes que construyan soluciones de forma estocástica, no hay regla de transición probabilística, no hay evaporación y no existe una función objetivo que se optimice por iteración."

### 2.1 Condiciones formales de un sistema de enjambre / ACO

| Condición | ¿Se cumple en el sistema actual? | Comentario |
|---|---|---|
| Coordinación indirecta vía el entorno | **Sí** | Un abogado modifica el score y eso cambia lo que ve otro abogado después — núcleo de la definición de Grassé (1959). |
| Sin control central | Parcial / No | Fórmula de agregación, pesos y umbral de -5 los fija el diseñador; es un controlador central determinista. |
| Agentes homogéneos y simples | No | Los abogados son heterogéneos, identificables, con razonamiento jurídico complejo. |
| Reglas locales estocásticas | No | En ACO la hormiga elige con probabilidad proporcional a feromona×heurística; aquí el sistema ordena de forma determinista y el abogado juzga, no muestrea. |
| Población grande | Probablemente no (verificar) | Con pocos agentes, cada voto es una etiqueta individual con mucho peso, no una feromona promediada por redundancia. |
| Evaporación | No | El score es acumulativo y eterno. |
| Feromona sobre aristas (dependiente de contexto) | No | τ vive en el nodo (documento), es global: un voto en una tutela de servidumbre sube el documento también en tutelas de facturación. |
| Construcción iterativa + depósito por calidad | No | No hay función objetivo; el "depósito" es un juicio binario humano, equivalente a una etiqueta supervisada. |

### 2.2 Dónde se rompe la analogía

1. **Sesgo de popularidad / efecto Mateo.** Mejor ranking → más exposición → más votos → mejor ranking. En ACO esto se controla con evaporación y límites τ_min/τ_max (MAX-MIN Ant System, Stützle & Hoos, 2000); el código actual no tiene ninguno.
2. **Reglas de decisión.** La hormiga es estocástica y sin modelo del problema; el abogado aplica doctrina y verifica vigencia normativa. Tratar su voto como "feromona" que se diluye por promedio desperdicia información semántica de alta calidad — es más correcto tratarlo como etiqueta experta.
3. **Cold start.** Un precedente nuevo arranca en 0 contra documentos con score alto, sin el mecanismo de exploración estocástica que sí tiene ACO.
4. **Número de agentes.** Con pocos abogados identificables, el fenómeno es juicio de expertos agregado, no emergencia de enjambre.
5. **Ausencia total de evidencia empírica.** `relevancia_score = 0` en todos los corpus de evaluación — no se puede afirmar que el mecanismo "funciona como enjambre" sin haberlo medido nunca.

### 2.3 Marcos alternativos, ordenados por ajuste

| Marco | Ajuste | Por qué |
|---|---|---|
| Relevance feedback explícito, *prior* de documento independiente de la consulta (Rocchio 1971; Salton & Buckley 1990; Kraaij, Westerveld & Hiemstra 2002) | El más exacto | Es literalmente lo que hace el código. |
| Human-in-the-Loop RAG | Muy alto | Describe bien el flujo completo (recuperación + redacción + validación humana). |
| Learning to Rank con feedback explícito (Joachims 2002; Joachims et al. 2017) | Alto, trabajo futuro | Encaja si se registra contexto, posición y propensión. |
| Bandits contextuales (Auer et al. 2002; Chapelle & Li 2011) | Alto para la capa de exploración | Marco correcto para formalizar exploración/explotación con costo. |
| Estigmergia cognitiva (Ricci et al. 2007; Heylighen 2016) | Medio — válido como lente descriptiva | Legítimo para agentes cognitivos que coordinan mediante marcas en artefactos (ej. Wikipedia en Heylighen). Usar en marco teórico/discusión, no como formalización del algoritmo. |
| Inteligencia colectiva (Woolley et al. 2010) | Bajo/medio | Demasiado general, no aporta formalismo. |
| ACO (Dorigo & Stützle 2004) | Bajo — sobreinterpretación | No hay problema combinatorio, agentes artificiales, regla de transición ni evaporación. |

**Recomendación para la tesis:** presentar el sistema como *relevance feedback explícito con prior de documento*, y la estigmergia cognitiva como lectura conceptual complementaria. Implementar evaporación y feromona condicionada a contexto (ECCP, §3) refuerza la analogía, pero no la convierte en ACO.

---

## 3. Diseño conceptual: ECCP — Estigmergia Cognitiva Contextual de Precedentes

### 3.1 Encuadre

ECCP es un mecanismo de **re-ranking por coordinación estigmérgica entre agentes cognitivos**. Toma de ACO los mecanismos de depósito condicionado al contexto, evaporación y límites de feromona, **sin pretender ser una instancia de ACO**. Del repertorio de swarm intelligence se usan como *principios de diseño*, no como garantías teóricas: depósito, evaporación, feromona repelente y exploración.

### 3.2 Componentes

**Agentes**: los abogados validadores. Son cognitivos, no reactivos — juzgan cada precedente con criterio jurídico. Su única acción estigmérgica es depositar un rastro ("útil"/"no útil") sobre un precedente mostrado en un caso concreto. No ven los rastros de otros como números, solo los perciben a través del orden en que se les presentan los precedentes (ver mitigación de imitación, §3.5).

**Entorno compartido**, en tres capas:
1. *Espacio de búsqueda*: embeddings + índice léxico (S_base = 0.9·coseno + 0.1·ts_rank — configuración confirmada).
2. *Campo de feromona*: registro de eventos (documento, usuario, tutela, contexto, posición mostrada, fecha). No es un número guardado — se calcula desde los eventos en el momento de la consulta.
3. *Estado de vigencia*: `vigencia_factor` por documento, modificado directamente por un humano cuando un precedente queda superado.

**Feromona condicionada a contexto τ(c, i)**: vive en el par (categoría jurídica, documento) — análogo a que en ACO la feromona viva en la arista y no en el nodo. Dos canales:
- Atractiva τ⁺(c,i), de votos "útil".
- Repelente τ⁻(c,i), de votos "no útil" — sustituye el umbral absorbente de -5 actual.

### 3.3 Reglas del algoritmo

**Depósito.** Un agente deposita como máximo un rastro por documento y por caso (re-votar reemplaza, no suma). Tope de aporte por agente y documento (ej. 3 rastros efectivos) para que el rastro mida cuántos agentes distintos encontraron útil el precedente, no cuánto lo usa uno solo. Peso ajustable por posición mostrada (fase 2, corrección de sesgo de posición).

**Evaporación — dos canales:**
1. *Gradual*: decaimiento exponencial con vida media h (punto de partida: 365 días). ρ_diario = 1 − 2^(−1/h).
2. *Por evento normativo*: a nivel documento, `vigencia_factor = 0` (desaparece de inmediato); a nivel contexto, vida media acelerada temporal para toda una categoría tras un cambio normativo.

*Límite honesto declarado*: la evaporación gradual es un sustituto débil de la obsolescencia jurídica real — el canal que protege de verdad es el normativo, y depende de que alguien lo marque.

**Lectura de la feromona — Beta-Bernoulli.** Prior neutral débil (a₀=b₀=2). Media = a/(a+b) es la señal de utilidad (0 sin rastros). Varianza mide evidencia disponible y alimenta la exploración. Equivalencias con ACO: el prior funciona como piso de feromona (τ_min), la saturación de la media funciona como techo (τ_max). Mezcla con el rastro global del documento (peso ~0.3) cuando hay pocos rastros en el contexto específico, lo que también amortigua errores del extractor de categoría (~26% de error según `RESULTADOS_TESIS.md`).

**Re-ranking acotado.**

```
Score_final(i) = vigencia_factor(i) · [ S_base(i) + γ · señal_feromona(c, i) ]
```

aplicado solo dentro de los top-K de S_base (K≈20). γ se acota a la mitad de la diferencia típica de S_base entre el puesto 1 y el 5 en el set de desarrollo — la feromona reordena entre precedentes comparables, nunca sube algo semánticamente lejano. Con γ=0 o sin rastros, ECCP es exactamente la configuración confirmada actual (degeneración segura).

**Exploración — slot único con UCB.** Puestos 1-4: explotación determinista por Score_final. Puesto 5: slot explorador — entre candidatos casi equivalentes en S_base (margen ε), gana el de mayor UCB bayesiano (media + z·desviación estándar de su Beta). Determinista y auditable (mismo estado → mismo resultado). Etiqueta visible al abogado ("precedente poco evaluado por el equipo"). Si ningún candidato está en el margen, no se explora — se prefiere no explorar a explorar mal, dado que el costo de un mal precedente en un caso real es alto.

### 3.4 Ciclo completo

1. **Consulta**: abogado abre tutela, se construye la consulta y se determina el contexto c.
2. **Recuperación base**: búsqueda híbrida (α=0.9) sobre S_base — sin feromona todavía. Este contrafactual es necesario para poder medir después si la feromona hizo algo.
3. **Percepción del entorno**: se leen los rastros en c (y globales), se evaporan según edad, se convierten en señal Beta.
4. **Re-ranking**: Score_final acotado + `vigencia_factor`.
5. **Exposición**: puestos 1-4 por rastro + 1 explorador. Se registra la impresión completa (qué se mostró, posición, S_base, posición contrafactual sin feromona, si fue exploración).
6. **Acción del agente**: el abogado usa y opcionalmente vota el precedente, vinculado a la impresión que lo originó.
7. **Depósito**: se escribe el evento (contexto, posición, fecha), con la regla de un rastro por agente/documento/caso.
8. **Retroalimentación**: la siguiente consulta de cualquier abogado, en contexto similar, percibe el campo modificado — aquí ocurre la coordinación indirecta propiamente dicha.
9. **Evaporación continua**: sin intervención, los rastros se debilitan con el tiempo; ante eventos normativos, se debilitan de golpe.

### 3.5 Mitigaciones integradas al diseño

| Riesgo | Mecanismo(s) que lo atacan |
|---|---|
| Sesgo de popularidad / efecto Mateo | Re-ranking solo dentro del top-K (corta la espiral en la raíz) + saturación Beta (corta el crecimiento de la ventaja) + tope por agente (corta la fuente) + evaporación (corta la persistencia) |
| Cold start | Prior Beta neutral (0, no "al fondo de la tabla") + slot explorador que favorece precedentes relevantes con poca evidencia + mezcla con rastro global |
| Pocos agentes (mitigación **parcial**, ver §3.6) | Tope por agente + prior Beta (poca reacción a 1-2 votos) + γ acotado |
| Imitación / prueba social | **No mostrar el conteo de votos al abogado** — el rastro solo actúa a través del orden, nunca como número visible. Reduce transparencia hacia el usuario; queda como decisión abierta a discutir (§3.7). |
| Precedentes superados | `vigencia_factor` multiplica el score completo — anula la señal colectiva aunque el precedente tenga muchos rastros |
| Estado absorbente actual (-5) | Se elimina; la feromona repelente degrada gradualmente y, si es fuerte, marca `requiere_revision` para decisión humana — ningún documento sale del sistema solo por votos |

### 3.6 Lo que sigue sin sostenerse del todo

1. **Con muy pocos abogados activos, "colectivo" es una palabra frágil.** Con 2-3 agentes, la coordinación indirecta existe en sentido técnico pero casi no hay agregación — se parece más a memoria compartida de un equipo pequeño que a un enjambre. Se recomienda fijar de antemano un mínimo (ej. ≥5 agentes activos, con la mayoría de documentos votados teniendo rastros de 2+ agentes). Por debajo de ese umbral, presentar ECCP como caso de estudio cualitativo, no hacer afirmaciones cuantitativas de emergencia. **El número real de abogados activos no se ha verificado** — consultar `SELECT COUNT(DISTINCT usuario_uuid) FROM logs_sistema WHERE accion LIKE 'FEEDBACK%'` antes de comprometer el encuadre cuantitativo en la tesis.
2. **Volumen de datos.** Con pocos votos/mes, los indicadores causales (§3.8) pueden tardar meses en tener potencia estadística.
3. **El contexto hereda los errores del extractor de categoría** (~26%). La mezcla con rastro global lo amortigua, no lo elimina.
4. **Los parámetros no se pueden calibrar con el corpus sintético** (feedback=0 ahí). Vida media, γ, ε, prior y tope por agente empiezan como valores razonados y se ajustan solo con datos reales.
5. **Los agentes no son independientes** — coordinación directa (reuniones, correos) entre abogados se confunde con la coordinación indirecta medida; es una amenaza a la validez que se declara, no se controla.
6. **"Inspirado en enjambre" es una elección retórica.** El mismo diseño es técnicamente *relevance feedback con prior bayesiano, decaimiento temporal y exploración tipo bandit*. El encuadre de enjambre aporta perspectiva de diseño y de evaluación (medir coordinación entre agentes vía el entorno), no garantías matemáticas propias — hay que poder responder esto ante un comité.

### 3.7 Decisiones abiertas (pendientes de validar antes de implementar)

1. ¿Se muestra al abogado alguna indicación del rastro (conteo, etiqueta cualitativa, nada)? — recomendación del análisis: nada visible como número.
2. Contexto: ¿solo categoría jurídica, o también un clúster semántico de la consulta? — recomendación: solo categoría en v1.
3. ¿Quién marca los eventos normativos (precedente superado) y con qué flujo de permisos?
4. Umbrales pre-registrados de éxito (§3.8) y el mínimo de agentes activos de §3.6.
5. Orden de entrega propuesto:
   - (a) arreglar deduplicación y estado absorbente actuales (independiente de ECCP);
   - (b) instrumentar impresiones y eventos sin cambiar el ranking;
   - (c) activar ECCP como modo opcional (`fusion:'alpha_fb'`), sin tocar el default;
   - (d) evaluación por interleaving.

### 3.8 Telemetría necesaria para sostener la afirmación con datos reales

El punto clave: **registrar impresiones, no solo votos.** Sin saber qué se mostró y dónde habría quedado sin feromona, solo se puede demostrar que la gente vota, no que hay coordinación indirecta.

Qué registrar: por impresión (caso, agente, contexto, documento, posición mostrada, posición contrafactual sin feromona, S_base, señal de feromona, si fue exploración, fecha); por voto (vínculo a la impresión, valor, fecha); por evento normativo (documento/categoría afectada, quién lo marcó, fecha).

Indicadores que sostendrían la afirmación de coordinación indirecta:
1. Exposición mediada por rastro de otros agentes (si ~0, la feromona no está haciendo nada).
2. Influencia entre agentes: tasa de "útil" de B en documentos promovidos por rastros de A vs. en la misma posición sin promoción — evidencia central.
3. Reutilización cruzada de precedentes entre agentes.
4. Convergencia vs. diversidad: índice de Gini de exposición en el tiempo (detecta efecto Mateo).
5. Rendimiento del slot explorador vs. el slot explotado, y cuántos "descubrimientos" pasan del explorador al top-4.
6. Acuerdo entre agentes (κ) en documentos votados por varios abogados.
7. Comparación causal vía team-draft interleaving (S_base solo vs. ECCP) — eficiente con pocos usuarios.
8. Tiempo de reorganización de la exposición tras un evento normativo.

Criterio de éxito a pre-registrar antes de desplegar (como en #121): umbral fijo para (1), diferencia significativa en (2), sin concentración creciente en (4). Si no se cumple, el resultado se reporta como negativo — también es un resultado legítimo para la tesis.

---

## 4. Procedencia de los conceptos (para citar correctamente)

| Concepto | Procedencia | Campo de origen |
|---|---|---|
| Depósito + evaporación de feromona, ecuación τᵢ(t+1) = (1-ρ)·τᵢ(t) + Σ Δτᵢᵐ | Dorigo (1992); Dorigo, Maniezzo & Colorni (1996), Ant System | Optimización combinatoria / IA biológica |
| Coordinación vía marcas en el entorno (estigmergia) | Grassé (1959) | Etología / biología |
| Estigmergia *cognitiva* (agentes con razonamiento, no insectos) | Ricci, Omicini, Viroli et al. (2007); Heylighen (2016) | Sistemas multiagente cognitivos |
| Límites de feromona (τ_min/τ_max) contra convergencia prematura | Stützle & Hoos (2000), MAX-MIN Ant System | Optimización combinatoria |
| Beta-Bernoulli para estimar una tasa de éxito | Estadística bayesiana clásica | Inferencia bayesiana |
| UCB (Upper Confidence Bound) para exploración | Lai & Robbins (1985); Auer, Cesa-Bianchi & Fischer (2002) | Aprendizaje por refuerzo / bandits |
| Relevance feedback explícito, prior de documento | Rocchio (1971); Salton & Buckley (1990); Kraaij, Westerveld & Hiemstra (2002) | Information Retrieval |
| Sesgo de posición en ranking | Joachims (2002); Joachims et al. (2017) | Learning to Rank |

**Nota importante:** de estas ocho líneas, solo las dos primeras y la tercera pertenecen estrictamente al campo de inteligencia de enjambre. Beta-Bernoulli, UCB y el resto son préstamos deliberados de otros campos (estadística bayesiana, aprendizaje por refuerzo, information retrieval) para resolver problemas que ACO puro no resuelve (saturación, cold start, exploración segura con costo). El algoritmo final (ECCP) es un híbrido inter-disciplinario con la estigmergia como marco narrativo/organizador — esto debe declararse explícitamente en la tesis, no presentarse como una aplicación directa de un único algoritmo de la literatura de swarm intelligence.

**Todas las referencias se citaron de memoria durante el análisis — verificar en fuente primaria antes de incluir en la tesis.**

---

## 5. Archivos de referencia en el código (al momento de este análisis)

- `src/modules/tutelas/services/vectorService.js` (líneas 28-32, 143-161, 189-212, 208-248)
- `src/modules/tutelas/controllers/tutelaController.js` (líneas 476-514)
- `src/modules/tutelas/services/consultaService.js` (línea 43, default `ponderado`)
- `migrations/1781960000000_add-relevancia-score-to-memoria.cjs`
- `src/services/auditService.js`
- `eval/scripts/v2_barrido_pesos.js` (línea 12: feedback siempre 0 en evaluación)
- `tutelas-frontend/src/modules/tutelas/services/tutelaService.js` (líneas 53-55: payload actual del voto)

---

## 6. Siguiente paso sugerido

Antes de implementar cualquier pieza de ECCP:
1. Verificar el número real de abogados activos que votan (`logs_sistema`) para saber si el encuadre cuantitativo de §3.6 es viable.
2. Resolver las decisiones abiertas de §3.7.
3. Si se decide avanzar, abrir issues de implementación por fases siguiendo el orden de §3.7.5, cada uno en su propia rama `rag/<nº>-<slug>` hacia `rag/integracion`, según el protocolo de RAG-00 (issue #79).
