export class Estudiante {
    constructor(nombre, cedula, carrera, indice) {
        this.nombre = nombre.trim();
        this.cedula = cedula.trim();
        this.carrera = carrera;
        this.indice = parseFloat(indice);
    }
}
