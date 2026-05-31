# Guía de Consultas a Base de Datos (Backend)

Para evitar errores de sintaxis al ejecutar consultas SQL directamente desde la terminal (especialmente problemas de comillas, escapes y caracteres especiales), **NO** utilices `node -e` con consultas complejas.

## Solución: Script `db_helper.js`

He creado un script auxiliar (`scripts/db_helper.js`) que permite ejecutar cualquier consulta SQL de forma segura utilizando el pool de conexión existente.

### Uso

Ejecuta el script desde la carpeta `tutelas_backend` utilizando el siguiente formato:

```bash
node scripts/db_helper.js "TU_QUERY_SQL" '["PARAMETRO1", "PARAMETRO2"]'
```

### Ejemplos

1. **Consultar datos (SELECT):**
   ```bash
   node scripts/db_helper.js "SELECT * FROM objetivos WHERE usuario_id = $1" '[2]'
   ```

2. **Actualizar datos (UPDATE):**
   ```bash
   node scripts/db_helper.js "UPDATE objetivos SET estado = $1 WHERE usuario_id = $2 AND estado = $3" '["archived", 2, "active"]'
   ```

### Ventajas
- **Seguridad:** Utiliza consultas parametrizadas (`$1`, `$2`, etc.), previniendo inyección SQL.
- **Robustez:** Evita el infierno de escapar comillas (`\"`) en la terminal, ya que los parámetros se pasan como un JSON.
- **Legibilidad:** Utiliza `console.table` para mostrar resultados estructurados.
