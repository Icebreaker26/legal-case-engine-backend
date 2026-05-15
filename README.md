# Legal Case Engine Backend ⚖️🤖

[![Quality Assurance Pipeline](https://github.com/Icebreaker26/legal-case-engine-backend/actions/workflows/quality-assurance.yml/badge.svg?branch=main)](https://github.com/Icebreaker26/legal-case-engine-backend/actions/workflows/quality-assurance.yml)(https://github.com/tu-usuario/legal-case-engine-backend/actions/workflows/quality-assurance.yml/badge.svg)](https://github.com/tu-usuario/legal-case-engine-backend/actions)
![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)

---

## 🏛️ Descripción del Proyecto
**Legal Case Engine** es un motor backend de grado industrial diseñado para la gestión y automatización del ciclo de vida de acciones legales. Desarrollado con un enfoque en **resiliencia, seguridad y observabilidad**, este sistema transforma la gestión administrativa en un ecosistema inteligente, seguro y auditable.

## 🛠️ Arquitectura Técnica de Alto Nivel
Este sistema no es solo una API; es una arquitectura blindada diseñada para escalabilidad:
*   **Core:** Node.js (ESM) + Express.
*   **Persistencia:** PostgreSQL con `pgvector` para búsqueda semántica (RAG).
*   **Inteligencia Artificial:** Procesamiento local con `@xenova/transformers` (Privacidad absoluta: los datos no salen del servidor).
*   **Orquestación:** Despliegue portable mediante **Docker** y `docker-compose` con inicialización automática.

---

## 🛡️ Pilares de Ingeniería y Calidad (QA)

### 1. Blindaje de Seguridad
*   **Validación de Frontera:** Implementación de **Zod** para validación declarativa de contratos de datos.
*   **Inmunidad ante Inyecciones:** Fuzz Testing (via `fast-check`) para asegurar resiliencia ante entradas inesperadas.
*   **Seguridad HTTP:** Middleware `Helmet` para mitigación de ataques XSS, Clickjacking y MIME-sniffing.
*   **Auditoría SCA:** Análisis continuo de vulnerabilidades en la cadena de suministro (0 CVEs).

### 2. Observabilidad de Grado Industrial
*   **Trazabilidad:** Inyección de `X-Request-Id` único en cada petición.
*   **Logging Estructurado:** Migración a `Winston` (formato JSON) para auditoría legible por máquinas.

### 3. Resiliencia Operativa
*   **Arranque Seguro:** Patrón *Fail-Fast* en validación de variables de entorno.
*   **Sincronización:** Uso de `wait-for-it` para asegurar la conectividad con PostgreSQL antes de la inicialización del backend en entornos contenerizados.

---

## 🛠️ Configuración de Entorno (.env)
Para ejecutar el proyecto, asegúrate de tener un archivo `.env` en la raíz con las siguientes variables:

```env
PORT=4000
DATABASE_URL=postgresql://[usuario]:[pass]@localhost:[puerto]/[db]
JWT_SECRET=[secreto_de_al_menos_16_caracteres]
NODE_ENV=development
TEST_USER_EMAIL=[email_para_testing]
TEST_USER_PASS=[password_para_testing]
OPENAI_API_KEY=[tu_api_key]
`FRONTEND_URL`
```
> **Nota:** Estas variables son validadas al arranque mediante un esquema de `Zod` (Fail-Fast), asegurando que el sistema no inicie si falta alguna configuración crítica.

---
El sistema cuenta con una **Quality Gate** automatizada mediante GitHub Actions que garantiza la integridad antes de cada despliegue.

*   **Total Tests:** 25+ suites (Unitarias e Integración).
*   **Cobertura:** Auth, Tutelas, Historial, Rendimiento, Seguridad.
*   **Automatización:** Pipeline CI/CD que ejecuta auditoría SCA, tests funcionales y Fuzz Testing.

---

## 🚀 Despliegue y Portabilidad
La infraestructura es **código puro**. Despliega todo el ecosistema con un comando:

```bash
docker-compose up --build -d
```
*Esto orquesta el backend junto a PostgreSQL, inicializando automáticamente el esquema de base de datos.*

---

## 📚 Documentación Técnica
Para una revisión detallada de la metodología, incidentes superados y resultados empíricos, consulte nuestro [Dossier de Ingeniería de Calidad](docs/QUALITY_DOSSIER.md).

---
*Desarrollado como Proyecto de Ingeniería de Calidad (Mayo 2026).*
