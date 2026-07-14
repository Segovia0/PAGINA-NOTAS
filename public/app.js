let listaEstudiantes = []; // Estado local en caché de la aplicación

document.addEventListener('DOMContentLoaded', () => {
    cargarEstudiantes();

    // Manejador del submit del formulario único
    document.getElementById('formularioEstudiante').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const actionState = document.getElementById('actionState').value;
        const cedula = document.getElementById('cedula').value;

        let url = '/api/estudiantes';
        let method = 'POST';

        // Mutar la petición si estamos editando
        if (actionState === 'edit') {
            url = `/api/estudiantes/${cedula}`;
            method = 'PUT';
        }

        const respuesta = await fetch(url, { method: method, body: formData });

        if (respuesta.ok) {
            form.reset();
            resetFormMode();
            cargarEstudiantes();
        } else {
            const err = await respuesta.json();
            alert(`Error en el servidor: ${err.error}`);
        }
    });
});

// Petición GET general
async function cargarEstudiantes() {
    const respuesta = await fetch('/api/estudiantes');
    listaEstudiantes = await respuesta.json();
    renderizarTabla();
}

// Inyección dinámica de filas de la tabla
function renderizarTabla() {
    const tbody = document.getElementById('tablaEstudiantes');
    tbody.innerHTML = '';

    listaEstudiantes.forEach(estudiante => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="/uploads/${estudiante.foto}" class="avatar" alt="perfil"></td>
            <td>${estudiante.cedula}</td>
            <td><strong>${estudiante.nombre}</strong></td>
            <td>${estudiante.pnf}</td>
            <td><small style="color:#64748b;">[${estudiante.notas.join(', ')}]</small></td>
            <td><strong>${estudiante.promedio} Ptos</strong></td>
            <td><span class="badge badge-${estudiante.estatus}">${estudiante.estatus}</span></td>
            <td>
                <div class="actions-btn-group">
                    <button class="btn-action btn-edit" onclick="prepararEdicion('${estudiante.cedula}')">Editar</button>
                    <button class="btn-action btn-delete" onclick="eliminarEstudiante('${estudiante.cedula}')">Borrar</button>
                    <button class="btn-action btn-report" onclick="generarReporteIndividual('${estudiante.cedula}')">Reporte</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Carga de datos de la fila seleccionada hacia los campos del formulario
function prepararEdicion(cedula) {
    const estudiante = listaEstudiantes.find(e => e.cedula === cedula);
    if (!estudiante) return;

    document.getElementById('actionState').value = 'edit';
    document.getElementById('formTitle').innerText = 'Editar Estudiante';
    document.getElementById('btnSubmit').innerText = 'Actualizar Datos';
    document.getElementById('btnSubmit').classList.add('edit-mode');
    document.getElementById('btnCancel').style.display = 'block';

    // Congelar el input de cédula para resguardar la consistencia de datos relacionales
    document.getElementById('cedula').value = estudiante.cedula;
    document.getElementById('cedula').readOnly = true;

    document.getElementById('nombre').value = estudiante.nombre;
    document.getElementById('pnf').value = estudiante.pnf;
    document.getElementById('nota1').value = estudiante.notas[0];
    document.getElementById('nota2').value = estudiante.notas[1];
    document.getElementById('nota3').value = estudiante.notas[2];
    document.getElementById('nota4').value = estudiante.notas[3];
}

// Restauración de comportamiento por defecto del formulario
function resetFormMode() {
    document.getElementById('actionState').value = 'create';
    document.getElementById('formTitle').innerText = 'Registrar Estudiante';
    document.getElementById('btnSubmit').innerText = 'Guardar Estudiante';
    document.getElementById('btnSubmit').classList.remove('edit-mode');
    document.getElementById('btnCancel').style.display = 'none';
    document.getElementById('cedula').readOnly = false;
    document.getElementById('formularioEstudiante').reset();
}

// Operación DELETE asíncrona
async function eliminarEstudiante(cedula) {
    if (confirm(`¿Está completamente seguro de eliminar de la matrícula al alumno C.I: ${cedula}?`)) {
        const respuesta = await fetch(`/api/estudiantes/${cedula}`, { method: 'DELETE' });
        if (respuesta.ok) cargarEstudiantes();
    }
}

// Generación del reporte de calificaciones individual en ventana flotante limpia
function generarReporteIndividual(cedula) {
    const estudiante = listaEstudiantes.find(e => e.cedula === cedula);
    if (!estudiante) return;

    const ventanaReporte = window.open('', '_blank');
    ventanaReporte.document.write(`
        <html>
        <head>
            <title>Boletín Oficial - ${estudiante.nombre}</title>
            <style>
                body { font-family: system-ui, Arial, sans-serif; padding: 40px; text-align: center; color: #334155; background: #f1f5f9; }
                .boletin-card { background: white; border: 2px solid #1e40af; padding: 30px; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
                .foto-perfil { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 3px solid #1e40af; }
                h1 { color: #1e40af; font-size: 22px; margin: 0 0 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 25px; margin-bottom: 25px; }
                th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: center; }
                th { background: #f1f5f9; color: #475569; font-size: 13px; }
                td { font-weight: bold; }
                .destaque { font-size: 16px; font-weight: bold; margin-top: 15px; background: #f8fafc; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; }
                .no-print { background: #1e40af; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 25px; font-size: 14px; }
                @media print { .no-print { display: none; } body { background: white; padding: 0; } .boletin-card { border: 1px solid #000; box-shadow: none; } }
            </style>
        </head>
        <body>
            <button class="no-print" onclick="window.print()">🖨️ Imprimir Boletín de Calificaciones</button>
            <div class="boletin-card">
                <img src="/uploads/${estudiante.foto}" class="foto-perfil">
                <h1>BOLETÍN DE CALIFICACIONES</h1>
                <p style="margin: 0; color: #64748b; font-size: 12px;">Control de Estudio Oficial</p>
                <hr style="border:0; border-top: 1px solid #cbd5e1; margin: 20px 0;">
                <p style="text-align: left; margin: 6px 0; font-size: 14px;"><strong>Estudiante:</strong> ${estudiante.nombre}</p>
                <p style="text-align: left; margin: 6px 0; font-size: 14px;"><strong>Cédula:</strong> ${estudiante.cedula}</p>
                <p style="text-align: left; margin: 6px 0; font-size: 14px;"><strong>Programa:</strong> ${estudiante.pnf}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Corte 1</th>
                            <th>Corte 2</th>
                            <th>Corte 3</th>
                            <th>Corte 4</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${estudiante.notas[0]}</td>
                            <td>${estudiante.notas[1]}</td>
                            <td>${estudiante.notas[2]}</td>
                            <td>${estudiante.notas[3]}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="destaque">
                    <span>Índice Académico: ${estudiante.promedio} Ptos</span>
                    <span style="color: ${estudiante.estatus === 'Aprobado' ? '#166534' : '#991b1b'};">${estudiante.estatus}</span>
                </div>
            </div>
        </body>
        </html>
    `);
    ventanaReporte.document.close();
}
