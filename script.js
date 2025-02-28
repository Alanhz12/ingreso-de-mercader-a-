// Función para obtener la fecha actual en formato YYYY-MM-DD
function obtenerFechaActual() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

// Cargar la fecha automáticamente al cargar la página
let fechaActual = obtenerFechaActual();
document.getElementById('fecha').value = fechaActual;

// Verificar si la fecha ha cambiado y limpiar datos del día anterior
function verificarFecha() {
  const nuevaFecha = obtenerFechaActual();
  if (nuevaFecha !== fechaActual) {
    // Guardar los datos del día anterior en un PDF
    guardarPDF();

    // Limpiar los datos del día anterior
    localStorage.removeItem(fechaActual);

    // Limpiar la tabla en pantalla
    const tbody = document.getElementById('tablaRegistros').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    // Actualizar la fecha actual
    fechaActual = nuevaFecha;
    document.getElementById('fecha').value = fechaActual;

    // Mostrar un mensaje de confirmación
    alert(`Los datos del ${fechaActual} se han guardado en un PDF.`);
  }
}

// Cargar datos guardados en LocalStorage al cargar la página
function cargarDatos() {
  const datos = JSON.parse(localStorage.getItem(fechaActual)) || [];
  const tbody = document.getElementById('tablaRegistros').getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

  datos.forEach((dato, index) => {
    const nuevaFila = tbody.insertRow();
    nuevaFila.insertCell(0).textContent = dato.fecha;
    nuevaFila.insertCell(1).textContent = dato.envia;
    nuevaFila.insertCell(2).textContent = dato.recibe;
    nuevaFila.insertCell(3).textContent = dato.bultos;
    nuevaFila.insertCell(4).textContent = dato.palets;

    // Celda para el botón de eliminar
    const celdaAcciones = nuevaFila.insertCell(5);
    const botonEliminar = document.createElement('button');
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.classList.add('eliminar-btn'); // Clase para estilos
    botonEliminar.addEventListener('click', () => eliminarRegistro(index)); // Asignar evento
    celdaAcciones.appendChild(botonEliminar);
  });
}

// Función para eliminar un registro
function eliminarRegistro(index) {
  const datos = JSON.parse(localStorage.getItem(fechaActual)) || [];

  // Eliminar el registro en la posición `index`
  datos.splice(index, 1);

  // Guardar los datos actualizados en el localStorage
  localStorage.setItem(fechaActual, JSON.stringify(datos));

  // Recargar la tabla para reflejar los cambios
  cargarDatos();

  // Mostrar un mensaje de confirmación
  alert('Registro eliminado correctamente.');
}

// Guardar datos en LocalStorage
function guardarDatos(datos) {
  localStorage.setItem(fechaActual, JSON.stringify(datos));
}

// Validar campos del formulario
function validarCampos() {
  const campos = ['envia', 'recibe', 'bultos', 'palets'];
  let valido = true;

  campos.forEach((campo) => {
    const input = document.getElementById(campo);
    if (!input.value.trim()) {
      input.classList.add('error');
      valido = false;
    } else {
      input.classList.remove('error');
    }
  });

  return valido;
}

// Manejar el envío del formulario
document.getElementById('registroForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Evita que el formulario se envíe

  // Validar campos antes de continuar
  if (!validarCampos()) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  // Obtener los valores del formulario
  const fecha = document.getElementById('fecha').value;
  const envia = document.getElementById('envia').value;
  const recibe = document.getElementById('recibe').value;
  const bultos = document.getElementById('bultos').value;
  const palets = document.getElementById('palets').value;

  // Crear un objeto con los datos
  const nuevoRegistro = { fecha, envia, recibe, bultos, palets };

  // Obtener los datos existentes de LocalStorage
  const datos = JSON.parse(localStorage.getItem(fechaActual)) || [];

  // Agregar el nuevo registro
  datos.push(nuevoRegistro);

  // Guardar los datos actualizados en LocalStorage
  guardarDatos(datos);

  // Recargar la tabla
  cargarDatos();

  // Limpiar el formulario (excepto la fecha)
  document.getElementById('envia').value = '';
  document.getElementById('recibe').value = '';
  document.getElementById('bultos').value = '';
  document.getElementById('palets').value = '';

  // Mostrar animación de éxito
  const botonEnviar = document.querySelector('#registroForm button');
  botonEnviar.classList.add('success');
  setTimeout(() => botonEnviar.classList.remove('success'), 1000);
});

// Función para generar y descargar el PDF (Réplica exacta de la tabla)
function guardarPDF() {
  const { jsPDF } = window.jspdf; // Acceder a la librería jsPDF

  // Capturar la tabla como imagen usando html2canvas
  html2canvas(document.getElementById('tablaRegistros')).then((canvas) => {
    const imgData = canvas.toDataURL('image/png'); // Convertir la imagen a base64
    const pdf = new jsPDF('p', 'mm', 'a4'); // Crear un PDF en formato A4

    // Obtener las dimensiones de la imagen y la página
    const imgWidth = 190; // Ancho máximo de la imagen en el PDF (190mm para A4)
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // Calcular altura proporcional

    // Agregar un título al PDF
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(37, 117, 252); // Azul moderno
    pdf.text(`Registro de Envíos - ${fechaActual}`, 10, 20);

    // Agregar la imagen de la tabla
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);

    // Guardar el PDF
    pdf.save(`registro_envios_${fechaActual}.pdf`);
  });
}

// Botón para descargar PDF
document.getElementById('descargarPDF').addEventListener('click', function () {
  guardarPDF();
});

// Función para filtrar registros por fecha
function filtrarPorFecha(fecha) {
  const tbody = document.getElementById('tablaRegistros').getElementsByTagName('tbody')[0];
  const datos = JSON.parse(localStorage.getItem(fechaActual)) || [];
  tbody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos filtrados

  // Filtrar los registros que coincidan con la fecha
  const registrosFiltrados = datos.filter((dato) => dato.fecha === fecha);

  if (registrosFiltrados.length === 0) {
    // Mostrar un mensaje si no hay registros
    const filaVacia = tbody.insertRow();
    const celdaVacia = filaVacia.insertCell(0);
    celdaVacia.colSpan = 6;
    celdaVacia.textContent = 'No hay registros para esta fecha.';
    celdaVacia.style.textAlign = 'center';
    celdaVacia.style.color = '#888';
  } else {
    // Mostrar los registros filtrados
    registrosFiltrados.forEach((dato, index) => {
      const nuevaFila = tbody.insertRow();
      nuevaFila.insertCell(0).textContent = dato.fecha;
      nuevaFila.insertCell(1).textContent = dato.envia;
      nuevaFila.insertCell(2).textContent = dato.recibe;
      nuevaFila.insertCell(3).textContent = dato.bultos;
      nuevaFila.insertCell(4).textContent = dato.palets;

      // Celda para el botón de eliminar
      const celdaAcciones = nuevaFila.insertCell(5);
      const botonEliminar = document.createElement('button');
      botonEliminar.textContent = 'Eliminar';
      botonEliminar.classList.add('eliminar-btn');
      botonEliminar.addEventListener('click', () => eliminarRegistro(index));
      celdaAcciones.appendChild(botonEliminar);
    });
  }
}

// Evento para el botón de búsqueda
document.getElementById('buscarFecha').addEventListener('click', function () {
  const fechaFiltro = document.getElementById('filtroFecha').value;

  if (!fechaFiltro) {
    alert('Por favor, selecciona una fecha para buscar.');
    return;
  }

  filtrarPorFecha(fechaFiltro);
});

// Evento para limpiar el filtro
document.getElementById('limpiarFiltro').addEventListener('click', function () {
  document.getElementById('filtroFecha').value = ''; // Limpiar el campo de fecha
  cargarDatos(); // Recargar todos los registros
});

// Verificar la fecha cada minuto
setInterval(verificarFecha, 60000); // 60000 ms = 1 minuto

// Cargar datos al iniciar la página
cargarDatos();