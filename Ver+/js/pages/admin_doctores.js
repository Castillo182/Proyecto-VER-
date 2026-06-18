import { supabase } from "../supabase.js";

const logout = document.getElementById("logout");
const listaDoctores = document.getElementById("listaDoctores");
const historialAprobaciones = document.getElementById("historialAprobaciones");
const buscarDoctor = document.getElementById("buscarDoctor");

const totalDoctores = document.getElementById("totalDoctores");
const pendientes = document.getElementById("pendientes");
const aprobados = document.getElementById("aprobados");
const rechazados = document.getElementById("rechazados");

const modalDoctor = document.getElementById("modalDoctor");
const modalNombre = document.getElementById("modalNombre");
const modalEstado = document.getElementById("modalEstado");
const modalEspecialidad = document.getElementById("modalEspecialidad");
const modalCedula = document.getElementById("modalCedula");
const cerrarModal = document.getElementById("cerrarModal");
const guardarDoctor = document.getElementById("guardarDoctor");

let doctores = [];
let doctorSeleccionado = null;

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function verificarAdmin() {
  const { data: perfil, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (error || !perfil || perfil.rol !== "admin") {
    window.location.href = "dashboard.html";
  }
}

async function cargarModuloDoctores() {
  await cargarEstadisticas();
  await cargarDoctores();
  await cargarHistorial();
}

async function cargarEstadisticas() {
  const { data, error } = await supabase.rpc("admin_estadisticas_doctores");

  if (error) {
    console.error(error);
    return;
  }

  const stats = data[0];

  totalDoctores.textContent = stats.total_doctores;
  pendientes.textContent = stats.pendientes;
  aprobados.textContent = stats.aprobados;
  rechazados.textContent = stats.rechazados;
}

async function cargarDoctores() {
  const { data, error } = await supabase.rpc("admin_listar_doctores");

  if (error) {
    listaDoctores.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  doctores = data || [];
  renderDoctores(doctores);
}

function renderDoctores(lista) {
  if (lista.length === 0) {
    listaDoctores.innerHTML = "<p>No hay doctores registrados.</p>";
    return;
  }

  listaDoctores.innerHTML = "";

  lista.forEach((doctor) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${doctor.nombre}</h3>
      <p><strong>Especialidad:</strong> ${doctor.especialidad || "No registrada"}</p>
      <p><strong>Cédula:</strong> ${doctor.cedula_profesional || "No registrada"}</p>
      <p><strong>Estado:</strong> ${doctor.estado}</p>

      <div class="child-actions">
        <button class="btn-view" data-id="${doctor.id}">Ver perfil</button>
        <button class="btn-edit" data-id="${doctor.id}">Aprobar</button>
        <button class="btn-delete" data-id="${doctor.id}">Rechazar</button>
      </div>
    `;

    listaDoctores.appendChild(item);
  });

  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalDoctor(btn.dataset.id));
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => aprobarDoctor(btn.dataset.id));
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => rechazarDoctor(btn.dataset.id));
  });
}

async function cargarHistorial() {
  const { data, error } = await supabase.rpc("admin_historial_aprobaciones");

  if (error) {
    historialAprobaciones.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    historialAprobaciones.innerHTML = "<p>No hay historial de aprobaciones.</p>";
    return;
  }

  historialAprobaciones.innerHTML = "";

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "timeline-item";

    div.innerHTML = `
      <h3>${item.accion.toUpperCase()}</h3>
      <p><strong>Doctor:</strong> ${item.doctor_nombre || "Sin nombre"}</p>
      <p><strong>Admin:</strong> ${item.admin_nombre || "Sin nombre"}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(item.fecha)}</p>
    `;

    historialAprobaciones.appendChild(div);
  });
}

function abrirModalDoctor(id) {
  const doctor = doctores.find((d) => String(d.id) === String(id));

  if (!doctor) return;

  doctorSeleccionado = doctor;

  modalNombre.textContent = doctor.nombre;
  modalEstado.textContent = `Estado actual: ${doctor.estado}`;
  modalEspecialidad.value = doctor.especialidad || "";
  modalCedula.value = doctor.cedula_profesional || "";

  modalDoctor.style.display = "flex";
}

guardarDoctor.addEventListener("click", async () => {
  if (!doctorSeleccionado) return;

  const { error } = await supabase.rpc("admin_actualizar_doctor", {
    doctor_id: doctorSeleccionado.id,
    nueva_especialidad: modalEspecialidad.value.trim(),
    nueva_cedula: modalCedula.value.trim()
  });

  if (error) {
    alert(error.message);
    return;
  }

  modalDoctor.style.display = "none";
  await cargarModuloDoctores();
});

cerrarModal.addEventListener("click", () => {
  modalDoctor.style.display = "none";
});

async function aprobarDoctor(id) {
  if (!confirm("¿Deseas aprobar a este doctor?")) return;

  const { error } = await supabase.rpc("admin_aprobar_doctor", {
    doctor_id: id
  });

  if (error) {
    alert(error.message);
    return;
  }

  await cargarModuloDoctores();
}

async function rechazarDoctor(id) {
  if (!confirm("¿Deseas rechazar a este doctor?")) return;

  const { error } = await supabase.rpc("admin_rechazar_doctor", {
    doctor_id: id
  });

  if (error) {
    alert(error.message);
    return;
  }

  await cargarModuloDoctores();
}

buscarDoctor.addEventListener("input", () => {
  const texto = buscarDoctor.value.toLowerCase();

  const filtrados = doctores.filter((doctor) => {
    return (
      doctor.nombre?.toLowerCase().includes(texto) ||
      doctor.especialidad?.toLowerCase().includes(texto) ||
      doctor.cedula_profesional?.toLowerCase().includes(texto)
    );
  });

  renderDoctores(filtrados);
});

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

if (logout) logout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

await verificarAdmin();
cargarModuloDoctores();