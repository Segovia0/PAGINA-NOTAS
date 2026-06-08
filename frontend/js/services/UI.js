import { Estudiante } from '../models/Estudiante.js';

export class UI {
    constructor() {
        this.form = document.getElementById('estudianteForm');
        this.tabla = document.getElementById('tablaEstudiantes');
        this.totalEstudiantesDOM = document.getElementById('totalEstudiantes');
        this.promedioGeneralDOM = document.getElementById('promedioGeneral');
        this.alertBox = document.getElementById('alertBox');
        
        // Elementos de control de edición
        this.editMode = document.getElementById('editMode');
        this.oldCedula = document.getElementById('oldCedula');
        this.formTitle = document.getElementById('formTitle');
        this.btnSubmit = document.getElementById('btnSubmit');
        this.btnCancelar = document.getElementById('btnCancelar');
    }

    capturarFormulario() {
        const nombre = document.getElementById('nombre').value;
        const cedula = document.getElementById('cedula').value;
        const carrera = document.getElementById('carrera').value;
        const indice = document.getElementById('indice').value;

        // Validaciones en el Frontend
        if (nombre.trim().length < 4) {
            this.mostrarError('El nombre debe tener un mínimo de 4 letras.');
            return null;
        }
        if (carrera === 'default' || !carrera) {
            this.mostrarError('Debe seleccionar una carrera.');
            return null;
        }
        const parsedIndice = parseFloat(indice);
        if (isNaN(parsedIndice) || parsedIndice < 1 || parsedIndice > 20) {
            this.mostrarError('El índice académico debe estar en el rango de 1 a 20.');
            return null;
        }

        return new Estudiante(nombre, cedula, carrera, indice);
    }

    renderizarLista(estudiantes, filtroCerdula = '') {
        this.tabla.innerHTML = '';
        
        // Filtro en tiempo real si el usuario está escribiendo en el buscador
        const registrosFiltrados = estudiantes.filter(est => 
            est.cedula.toLowerCase().includes(filtroCerdula.toLowerCase())
        );

        if (registrosFiltrados.length === 0) {
            this.tabla.innerHTML = `<tr><td colspan="5" style="text-align:center;">No se encontraron registros</td></tr>`;
            return;
        }

        registrosFiltrados.forEach(est => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${est.cedula}</strong></td>
                <td>${est.nombre}</td>
                <td>${est.carrera}</td>
                <td>${est.indice.toFixed(2)}</td>
                <td>
                    <button class="btn btn-action btn-edit" data-cedula="${est.cedula}">Editar</button>
                    <button class="btn btn-action btn-delete" data-cedula="${est.cedula}">Eliminar</button>
                </td>
            `;
            this.tabla.appendChild(tr);
        });
    }

    actualizarEstadisticas(estudiantes) {
        const total = estudiantes.length;
        this.totalEstudiantesDOM.textContent = total;

        if (total === 0) {
            this.promedioGeneralDOM.textContent = '0.00';
            return;
        }

        const sumatoria = estudiantes.reduce((acum, est) => acum + est.indice, 0);
        const promedioGeneral = sumatoria / total;
        this.promedioGeneralDOM.textContent = promedioGeneral.toFixed(2);
    }

    mostrarError(mensaje) {
        this.alertBox.className = 'alert alert-danger';
        this.alertBox.textContent = mensaje;
        this.alertBox.classList.remove('hidden');
        setTimeout(() => this.alertBox.classList.add('hidden'), 4000);
    }

    mostrarExito(mensaje) {
        this.alertBox.className = 'alert alert-success';
        this.alertBox.textContent = mensaje;
        this.alertBox.classList.remove('hidden');
        setTimeout(() => this.alertBox.classList.add('hidden'), 4000);
    }

    activarModoEdicion(estudiante) {
        this.editMode.value = 'true';
        this.oldCedula.value = estudiante.cedula;
        
        document.getElementById('nombre').value = estudiante.nombre;
        document.getElementById('cedula').value = estudiante.cedula;
        document.getElementById('carrera').value = estudiante.carrera;
        document.getElementById('indice').value = estudiante.indice;

        this.formTitle.textContent = 'Editar Estudiante';
        this.btnSubmit.textContent = 'Actualizar Registro';
        this.btnCancelar.classList.remove('hidden');
    }

    desactivarModoEdicion() {
        this.form.reset();
        document.getElementById('carrera').value = 'default';
        this.editMode.value = 'false';
        this.oldCedula.value = '';
        
        this.formTitle.textContent = 'Registrar Estudiante';
        this.btnSubmit.textContent = 'Guardar Registro';
        this.btnCancelar.classList.add('hidden');
    }
}
