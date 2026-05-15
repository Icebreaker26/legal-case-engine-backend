# Documentación Técnica de Ingeniería de Software

## 1. Introducción
El presente proyecto, constituye una plataforma de gestión jurídica diseñada para automatizar el ciclo de vida de acciones de tutela. El sistema integra tecnologías de vanguardia en Inteligencia Artificial (IA), bases de datos vectoriales y estándares de seguridad corporativa para optimizar la eficiencia operativa y reducir riesgos legales.

## 2. Metodología de Desarrollo: Agile-Scrum Adaptado
El proyecto se desarrolló bajo un marco **Agile-Scrum**, priorizando la entrega iterativa y la mejora continua.
*   **Sprints de Desarrollo:** El ciclo de vida se dividió en fases lógicas (Core, Seguridad, Auditoría, Analytics), permitiendo un despliegue incremental.
*   **Iteración Continua:** Cada funcionalidad fue validada mediante pruebas unitarias de flujo y retroalimentación constante sobre la experiencia de usuario (UX).

## 3. Ciclo de Vida del Software (SDLC)

### Fase 1: Ingeniería de Requisitos
Se definieron requisitos críticos basados en el contexto corporativo de ENEL:
*   **Funcionales:** Extracción automatizada de metadatos (RAG), gestión de trazabilidad, control de versiones de borrador y panel administrativo.
*   **No Funcionales:** 
    *   **Privacidad:** Procesamiento *on-premise* sin dependencia de APIs externas.
    *   **Seguridad:** Autenticación robusta y control de acceso RBAC.
    *   **Transparencia:** Implementación de endpoints de monitoreo de salud.

### Fase 2: Análisis y Diseño Arquitectónico
*   **Arquitectura de Datos:** Se empleó un enfoque híbrido relacional y vectorial. PostgreSQL con `pgvector` permitió la búsqueda semántica de precedentes históricos (RAG), garantizando una ventaja competitiva en la calidad de la defensa jurídica.
*   **Seguridad por Diseño:** Implementación de JWT (JSON Web Tokens) gestionados mediante `HttpOnly Cookies`, eliminando vulnerabilidades frente a ataques XSS comunes en el almacenamiento tradicional (`localStorage`).

### Fase 3: Implementación
La implementación siguió estándares de **Clean Code**:
*   **Modularidad:** Separación estricta de responsabilidades (Controllers, Services, Middlewares).
*   **Centralización:** Refactorización de peticiones API (`apiService.js`) y estandarización de constantes del dominio (`constants.js`), reduciendo la deuda técnica.
*   **Trazabilidad:** Integración de un sistema de auditoría transversal (`logs_sistema`) que registra cada operación crítica para cumplimiento legal.

### Fase 4: Pruebas y Aseguramiento de Calidad
*   **Pruebas de Integración:** Validación de flujos críticos (Auth, Procesamiento, Gestión).
*   **Validación de IA:** Evaluación de la precisión en la recuperación de información mediante búsqueda semántica comparada contra el corpus legal histórico.
*   **Seguridad:** Pruebas de penetración lógica (autorización fallida, acceso sin tokens).

### Fase 5: Mantenimiento y Evolución
*   **Monitoreo:** Endpoint `/api/health` para observabilidad.
*   **Documentación:** Generación de READMEs exhaustivos para asegurar la mantenibilidad a largo plazo.

## 4. Análisis de Resultados: Retorno de Inversión (ROI)
El sistema ha demostrado capacidad para transformar el área legal en un centro de eficiencia operativa:
1.  **Eficiencia:** Reducción del tiempo de respuesta mediante IA.
2.  **Mitigación de Riesgos:** Auditoría 360° y validación de usuarios reducen el riesgo de mal uso del sistema.
3.  **Capital Intelectual:** Conversión de años de experiencia legal (historias de tutelas) en una base de datos vectorial consultable.

## 5. Conclusiones
El sistema representa un sistema de grado de ingeniería funcional, seguro y escalable, que resuelve problemas reales de gobernanza de datos y productividad jurídica mediante el uso ético y local de la Inteligencia Artificial.
