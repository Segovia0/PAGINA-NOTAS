import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Importaciones de tus archivos modulares de rutas (Añadimos la de Auth)
import rutasEstudiantes from './backend/routes/estudiantes.routes.js';
import rutasAuth from './backend/routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================================
// 2. Middlewares globales del servidor (Límite extendido para imágenes)
// ======================================================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// 3. Registro de los endpoints de la API (Aquí conectamos ambos módulos)
app.use('/api/auth', rutasAuth);               // Módulo de Login
app.use('/api/estudiantes', rutasEstudiantes); // Módulo del CRUD de notas (Ya lo tenías)

// 4. Encendido del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
