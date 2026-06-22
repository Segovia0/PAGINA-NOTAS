export class Estudiante {
    constructor(nombre, cedula, carrera, indice, foto = '') {
        this.nombre = nombre;
        this.cedula = cedula;
        this.carrera = carrera;
        this.indice = parseFloat(indice);
        this.foto = foto; // ← Ahora el modelo acepta y transporta la imagen
        this.notas = [0, 0, 0, 0];
    }
}
