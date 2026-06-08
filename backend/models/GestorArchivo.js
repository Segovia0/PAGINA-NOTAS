import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual del archivo GestorArchivo.js de forma segura
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GestorArchivo {
    constructor() {
        // Subimos un nivel (salimos de 'models') y entramos a 'data/estudiantes.json'
        this.rutaArchivo = path.join(__dirname, '../data/estudiantes.json');
    }

    async leer() {
        try {
            const data = await fs.readFile(this.rutaArchivo, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Si el archivo no existe (ENOENT), lo inicializa con un array vacío []
            if (error.code === 'ENOENT') {
                await this.guardar([]);
                return [];
            }
            throw error;
        }
    }

    async guardar(datos) {
        await fs.writeFile(this.rutaArchivo, JSON.stringify(datos, null, 2), 'utf-8');
    }
}
