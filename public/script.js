// Importar Firebase y Firestore desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCIWXe35A9stt_72qRcYTTIq3HCCsIyHz4",
  authDomain: "ingreso-de-mercaderia.firebaseapp.com",
  databaseURL: "https://ingreso-de-mercaderia-default-rtdb.firebaseio.com",
  projectId: "ingreso-de-mercaderia",
  storageBucket: "ingreso-de-mercaderia.firebasestorage.app",
  messagingSenderId: "571797344617",
  appId: "1:571797344617:web:159653dae7a6140939adf8",
  measurementId: "G-ZDVMY9N45S"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Inicializar Firestore

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

// Cargar datos guardados en Firestore al cargar la página
async function cargarDatos() {
  const tbody = document.getElementById('tablaRegistros').getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

  try {
    const querySnapshot = await getDocs(collection(db, "registros"));
    querySnapshot.forEach((doc, index) => {
      const dato = doc.data();
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
      botonEliminar.addEventListener('click', () => eliminarRegistro(doc.id)); // Asignar evento
      celdaAcciones.appendChild(botonEliminar);
    });
  } catch (error) {
    console.error("Error al cargar datos desde Firestore:", error);
  }
}

// Función para eliminar un registro de Firestore
async function eliminarRegistro(id) {
  try {
    await deleteDoc(doc(db, "registros", id));
    console.log("Registro eliminado de Firestore");
    cargarDatos(); // Recargar la tabla después de eliminar
  } catch (error) {
    console.error("Error al eliminar registro:", error);
  }
}

// Guardar datos en Firestore
async function guardarDatos(datos) {
  try {
    const docRef = await addDoc(collection(db, "registros"), datos);
    console.log("Registro guardado con ID:", docRef.id);
    cargarDatos(); // Recargar la tabla después de guardar
  } catch (error) {
    console.error("Error al guardar en Firestore:", error);
  }
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

  // Guardar los datos en Firestore
  guardarDatos(nuevoRegistro);

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
async function filtrarPorFecha(fecha) {
  const tbody = document.getElementById('tablaRegistros').getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos filtrados

  try {
    const querySnapshot = await getDocs(collection(db, "registros"));
    const registrosFiltrados = [];

    querySnapshot.forEach((doc) => {
      const dato = doc.data();
      if (dato.fecha === fecha) {
        registrosFiltrados.push({ id: doc.id, ...dato });
      }
    });

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
      registrosFiltrados.forEach((dato) => {
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
        botonEliminar.addEventListener('click', () => eliminarRegistro(dato.id));
        celdaAcciones.appendChild(botonEliminar);
      });
    }
  } catch (error) {
    console.error("Error al filtrar registros:", error);
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

// Cargar datos al iniciar la página
cargarDatos();