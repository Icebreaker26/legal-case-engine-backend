# Plataforma de Gestión e Inteligencia Jurídica

## Resumen Ejecutivo
Es una solución de gestión jurídica desarrollada internamente para automatizar el ciclo de vida de las acciones de tutela en ENEL. La plataforma transforma un proceso administrativo manual en un **ecosistema inteligente, seguro y auditable**.

## Propuesta de Valor
*   **Reducción de Riesgo Legal:** Eliminación de fallos por vencimiento de términos mediante un sistema de alertas proactivo.
*   **Eficiencia Operativa:** Reducción drástica del tiempo de procesamiento documental mediante extracción automática de datos e inteligencia asistida.
*   **Privacidad Corporativa:** Procesamiento 100% local. Los datos nunca salen del entorno controlado de ENEL, garantizando cumplimiento total con normativas de protección de datos.
*   **Gestión del Conocimiento:** Captura del historial de precedentes exitosos, evitando la pérdida de expertise legal ante la rotación de personal.

## IA y RAG (Generación Aumentada por Recuperación)
El sistema utiliza una arquitectura de IA de última generación enfocada en la precisión y seguridad:
1.  **Cerebro Legal Corporativo:** Transformamos nuestro archivo histórico en una base de datos vectorial que reside 100% en nuestros servidores.
2.  **Búsqueda Semántica:** Ante una nueva tutela, el sistema comprende su significado y recupera instantáneamente los argumentos legales más efectivos usados en casos similares.
3.  **IA Asistida (No Generativa a Ciegas):** El sistema entrega al abogado los argumentos validados y efectivos del pasado. Esto evita "alucinaciones" (invención de leyes) y mantiene el control jurídico total en manos del abogado humano, quien ensabla la defensa final con alta calidad.

## Características Clave
*   **RBAC (Control de Acceso basado en Roles):** Jerarquía de seguridad con niveles `super_admin`, `admin`, `juridico` y `auditor` para control granular de operaciones.
*   **Gestión de Papelera:** Sistema de recuperación de expedientes y conocimiento eliminados con auditoría completa.
*   **Visualización de Documentos:** Visor de documentos legales con formato profesional (justificado, jerarquías) para lectura efectiva.
*   **Extracción Inteligente:** Identificación automática de Radicado, Accionante, Juzgado y Derecho Vulnerado desde PDFs.
*   **Auditoría 360°:** Registro detallado de cada acción del sistema (quién, qué, cuándo y desde dónde) para cumplimiento y seguridad.
*   **Seguridad:** Implementación de autenticación JWT con `HttpOnly Cookies` para máxima protección.
*   **Monitoreo Transparente:** Endpoint `/api/health` para el monitoreo de salud del sistema, permitiendo su integración con herramientas de observabilidad corporativa.

## ROI Estimado
1.  **Optimización de Tiempos:** Ahorro significativo de horas hombre semanales en tareas repetitivas de redacción y búsqueda documental.
2.  **Mitigación de Sanciones:** Prevención de multas por vencimiento de términos legales.
3.  **Activo Digital:** Conversión del conocimiento legal disperso en un activo digital estructurado y reutilizable, escalable y auditable.

---
*Plataforma desarrollada para maximizar la eficacia del equipo legal, garantizando la excelencia operativa y la seguridad de la información corporativa.*
