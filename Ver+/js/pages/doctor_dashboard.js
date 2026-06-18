import { supabase } from "../supabase.js";

const doctorInfo = document.getElementById("doctorInfo");
const totalPacientes = document.getElementById("totalPacientes");
const totalHorarios = document.getElementById("totalHorarios");
const totalCitas = document.getElementById("totalCitas");
const totalPruebas = document.getElementById("totalPruebas");
const pacientesRecientes = document.getElementById("pacientesRecientes");

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

const { data: perfil, error: perfilError } = await supabase
  .from("usuarios")
  .select("nombre, rol, estado, especialidad")
  .eq("id", user.id)
  .single();

if (perfilError || !perfil || perfil.rol !== "doctor" || perfil.estado !== "aprobado") {
  window.location.href = "dashboard.html";
}

doctorInfo.textContent = `${perfil.nombre} · ${perfil.especialidad || "Especialista visual"}`;

async function cargarDashboard() {
  await cargarResumen();
  await cargarPacientesRecientes();
  await cargarCitasDeHoy();
}

async function cargarResumen() {
  const { data, error } = await supabase.rpc("doctor_resumen");

  if (error || !data || data.length === 0) return;

  const resumen = data[0];

  totalPacientes.textContent = resumen.total_pacientes;
  totalHorarios.textContent = resumen.total_horarios;
  totalCitas.textContent = resumen.citas_programadas;
  totalPruebas.textContent = resumen.pruebas_registradas;
}

async function cargarPacientesRecientes() {
  const { data, error } = await supabase.rpc("doctor_pacientes_asignados");

  if (error) {
    pacientesRecientes.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    pacientesRecientes.innerHTML = `<p>No tienes pacientes asignados todavía.</p>`;
    return;
  }

  pacientesRecientes.innerHTML = "";

  data.slice(0, 4).forEach((p) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${p.nombre}</h3>
      <p><strong>Edad:</strong> ${p.edad_meses} meses</p>
      <p><strong>Género:</strong> ${p.genero}</p>
      <p><strong>Historial visual:</strong> ${p.historial_visual || "Sin observaciones"}</p>
    `;

    pacientesRecientes.appendChild(item);
  });
}

async function cargarCitasDeHoy() {
  const { data, error } = await supabase.rpc("doctor_mis_citas");

  const contenedor = document.createElement("div");
  contenedor.className = "panel";
  contenedor.innerHTML = `
    <div class="panel-header">
      <h2>Citas próximas</h2>
    </div>
    <div id="citasHoy" class="timeline-list"></div>
  `;

  document.querySelector(".dashboard-main").appendChild(contenedor);

  const citasHoy = document.getElementById("citasHoy");

  if (error || !data || data.length === 0) {
    citasHoy.innerHTML = `<p>No tienes citas programadas.</p>`;
    return;
  }

  const futuras = data.filter((c) => new Date(c.fecha_cita) >= new Date());

  if (futuras.length === 0) {
    citasHoy.innerHTML = `<p>No hay citas próximas.</p>`;
    return;
  }

  futuras.slice(0, 5).forEach((cita) => {
    const item = document.createElement("div");
    item.className = "timeline-item appointment-card estado-vigente";

    item.innerHTML = `
      <h3>${cita.nino_nombre}</h3>
      <p><strong>Fecha:</strong> ${formatearFechaHora(cita.fecha_cita)}</p>
      <p><strong>Motivo:</strong> ${cita.motivo || "Sin motivo registrado"}</p>
      ${
        cita.meet_link
          ? `<a href="${cita.meet_link}" target="_blank" class="meet-link">Abrir Meet</a>`
          : `<p><strong>Meet:</strong> Sin enlace</p>`
      }
    `;

    citasHoy.appendChild(item);
  });
}

function formatearFechaHora(fecha) {
  return new Date(fecha).toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

cargarDashboard();