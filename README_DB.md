# Documentación del Modelo de Datos - Sistema de Tutelas

## 1. Arquitectura de Datos
El sistema utiliza **PostgreSQL 15** como motor de base de datos relacional, enriquecido con extensiones avanzadas para soportar funcionalidades de Inteligencia Artificial y seguridad:

- **uuid-ossp:** Generación de identificadores únicos universales (UUID) para asegurar la integridad de las tutelas.
- **pgvector:** Soporte para almacenamiento y búsqueda de **embeddings** (vectores), permitiendo búsquedas semánticas y recuperación de información (RAG) para la generación de respuestas legales.

## 2. Entidades Principales

### 2.1. Gestión de Tutelas (`tutelas`)
Es el núcleo del sistema. Almacena la información jurídica y el estado de cada proceso.
- **Campos clave:** `radicado`, `accionante`, `juzgado`, `fecha_vencimiento`, `estado`.
- **Automatización:** Incluye campos para `contenido_original` (extraído del PDF) y `contestacion_generada` (por la IA).
- **Control de Tiempos:** Gestiona el campo `dias_termino` para el cálculo de alertas legales.

### 2.2. Usuarios y Seguridad (`abogados`)
Gestiona el acceso y los niveles de privilegio.
- **Roles:** Soporta roles como `juridico`, `admin` y `super_admin`.
- **Flujo de Aprobación:** Implementa un sistema de aprobación (`is_approved`) para nuevos registros.

### 2.3. Base de Conocimiento Inteligente (`base_conocimiento_enel`)
Almacena el "cerebro" del sistema para la generación de respuestas exitosas.
- **Vectores de Embedding:** Utiliza `public.vector(1536)` (OpenAI) y `public.vector(384)` (Local) para comparaciones semánticas.
- **Búsqueda Semántica:** Implementa índices **HNSW** (`hnsw_vector_cosine_ops`) para búsquedas de alta velocidad en grandes volúmenes de datos legales.

## 3. Diccionario de Tablas de Apoyo
| Tabla | Función |
| :--- | :--- |
| **`areas`** | Catálogo de dependencias responsables de las tutelas. |
| **`historial_acciones`** | Trazabilidad completa (Logs de gestión) de cada caso con alertas de seguimiento. |
| **`categorias_juridicas`** | Clasificación por derechos vulnerados mediante palabras clave. |
| **`logs_sistema`** | Auditoría de seguridad (IP, usuario, acción, entidad afectada). |
| **`configuracion_roi`** | Parámetros para calcular el Retorno de Inversión (tiempo y costo ahorrado). |
| **`noise_patterns`** | Patrones de limpieza de texto para mejorar el procesamiento de OCR/IA. |

## 4. Relaciones y Restricciones
- **Integridad Referencial:** Las tutelas están vinculadas a un `responsable_id` (Abogado) y un `area_id` mediante llaves foráneas con eliminación en cascada donde aplica.
- **Unicidad:** Restricciones estrictas en `emails` de usuarios y `radicados` de tutelas para evitar duplicidad de información.
- **Check Constraints:** Validación de estados permitidos (`Pendiente`, `En Proceso`, `Respondida`, etc.) a nivel de motor de base de datos.

## 5. Optimización y Rendimiento
El sistema cuenta con:
- **Índices B-Tree:** Para búsquedas rápidas por ID y fechas.
- **Índices de Vectores (HNSW):** Específicos para la recuperación de jurisprudencia y documentos de referencia basados en similitud de coseno.

---
*Documento generado para el informe de práctica profesional - Alejandro Marín Torres.*
