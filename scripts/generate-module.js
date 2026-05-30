import fs from 'fs';
import path from 'path';

const moduleName = process.argv[2];
if (!moduleName) {
    console.error('Por favor, indica el nombre del módulo.');
    process.exit(1);
}

const baseDir = path.join('src', 'modules', moduleName);
const dirs = ['controllers', 'routes', 'services', 'schemas'];

dirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });
});

// Crear archivo de rutas básico
const routeContent = `import { Router } from 'express';\n\nconst router = Router();\n\n// TODO: Implementar rutas\n\nexport default router;`;
fs.writeFileSync(path.join(baseDir, 'routes', `${moduleName}Routes.js`), routeContent);

console.log(`Módulo ${moduleName} creado exitosamente en ${baseDir}`);
