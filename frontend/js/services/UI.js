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
        const inputFoto = document.getElementById('foto'); // ← Capturamos el input

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

        // Enviamos los 4 datos de siempre más el valor de la foto (o un string vacío por defecto)
        return new Estudiante(nombre, cedula, carrera, indice, '');
    }

    // ... Todo tu constructor se queda exactamente igual ...
// Asegúrate de mapear los elementos del modal en tu constructor si lo deseas, o los leemos directo.

renderizarLista(estudiantes, filtro = '') {
    // Buscamos el cuerpo de la tabla por su ID original
    const tablaCuerpo = document.getElementById('tablaEstudiantes');
    if (!tablaCuerpo) return;
    
    tablaCuerpo.innerHTML = '';

    // Filtrado en tiempo real por cédula
    const estudiantesFiltrados = estudiantes.filter(est => 
        est.cedula.includes(filtro.trim())
    );

    if (estudiantesFiltrados.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron registros.</td></tr>`;
        return;
    }

    estudiantesFiltrados.forEach(estudiante => {
        const tr = document.createElement('tr');

        // Si el estudiante tiene foto en Base64 la usa, si no, carga la silueta por defecto
        const urlFoto = estudiante.foto || 'https://www.w3schools.com/howto/img_avatar.png';

       tr.innerHTML = `
    <td style="text-align: center; vertical-align: middle;">
        <img src="${urlFoto}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #1e3a8a; display: block; margin: 0 auto;">
    </td>
    <td>${estudiante.cedula}</td>
    <td>${estudiante.nombre}</td>
    <td>${estudiante.carrera}</td>
    <td style="font-weight: 700;">${parseFloat(estudiante.indice || 0).toFixed(2)}</td>
    <td>
        <div class="actions-container">
            <button class="btn btn-action btn-notes" data-cedula="${estudiante.cedula}" style="background: #0284c7; color: white;">Notas</button>
            <button class="btn btn-action btn-edit" data-cedula="${estudiante.cedula}">Editar</button>
            <button class="btn btn-action btn-report" data-cedula="${estudiante.cedula}" style="background: #10b981; color: white;">Reporte</button> <button class="btn btn-action btn-delete" data-cedula="${estudiante.cedula}">Eliminar</button>
        </div>
    </td>
`;
        tablaCuerpo.appendChild(tr);
    });
}

// NUEVOS MÉTODOS PARA CONTROLAR EL MODAL
abrirModalNotas(estudiante) {
    document.getElementById('modalNotas').classList.remove('hidden');
    document.getElementById('modalTitulo').textContent = `Notas de: ${estudiante.nombre}`;
    document.getElementById('modalCedula').value = estudiante.cedula;
    
    // Poblamos los inputs con las notas actuales (si no tiene, por defecto son 0)
    document.getElementById('nota1').value = estudiante.notas[0] || 0;
    document.getElementById('nota2').value = estudiante.notas[1] || 0;
    document.getElementById('nota3').value = estudiante.notas[2] || 0;
    document.getElementById('nota4').value = estudiante.notas[3] || 0;
}

cerrarModalNotas() {
    document.getElementById('modalNotas').classList.add('hidden');
    document.getElementById('formNotas').reset();
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
