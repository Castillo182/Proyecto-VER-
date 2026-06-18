import { supabase } from "../supabase.js";

const adminInfo = document.getElementById("adminInfo");
const logout = document.getElementById("logout");

const totalUsuarios = document.getElementById("totalUsuarios");
const doctoresPendientes = document.getElementById("doctoresPendientes");
const totalPacientes = document.getElementById("totalPacientes");
const totalPruebas = document.getElementById("totalPruebas");

const listaDoctoresPendientes = document.getElementById("listaDoctoresPendientes");
const listaUsuarios = document.getElementById("listaUsuarios");

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

const { data: perfil, error: perfilError } = await supabase
  .from("usuarios")
  .select("nombre, rol, estado")
  .eq("id", user.id)
  .single();

if (perfilError || !perfil || perfil.rol !== "admin") {
  window.location.href = "dashboard.html";
}

adminInfo.textContent = `${perfil.nombre} · Administrador del sistema`;

async function cargarDashboardAdmin() {
  await cargarResumen();
  await cargarDoctoresPendientes();
  await cargarUsuariosRecientes();
}

async function cargarResumen() {
  const { data, error } = await supabase.rpc("admin_resumen");

  if (error) {
    console.error(error);
    return;
  }

  const resumen = data[0];

  totalUsuarios.textContent = resumen.total_usuarios;
  doctoresPendientes.textContent = resumen.doctores_pendientes;
  totalPacientes.textContent = resumen.total_pacientes;
  totalPruebas.textContent = resumen.total_pruebas;
}

async function cargarDoctoresPendientes() {
  const { data, error } = await supabase.rpc("admin_doctores_pendientes");

  if (error) {
    listaDoctoresPendientes.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaDoctoresPendientes.innerHTML = "<p>No hay doctores pendientes.</p>";
    return;
  }

  listaDoctoresPendientes.innerHTML = "";

  data.forEach((doctor) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${doctor.nombre}</h3>
      <p><strong>Especialidad:</strong> ${doctor.especialidad || "No registrada"}</p>
      <p><strong>Cédula:</strong> ${doctor.cedula_profesional || "No registrada"}</p>
      <p><strong>Estado:</strong> ${doctor.estado}</p>

      <div class="child-actions">
        <button class="btn-edit" data-id="${doctor.id}">Aprobar</button>
        <button class="btn-delete" data-id="${doctor.id}">Rechazar</button>
      </div>
    `;

    listaDoctoresPendientes.appendChild(item);
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => aprobarDoctor(btn.dataset.id));
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => rechazarDoctor(btn.dataset.id));
  });
}

async function cargarUsuariosRecientes() {
  const { data, error } = await supabase.rpc("admin_usuarios_recientes");

  if (error) {
    listaUsuarios.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaUsuarios.innerHTML = "<p>No hay usuarios registrados.</p>";
    return;
  }

  listaUsuarios.innerHTML = "";

  data.slice(0, 3).forEach((usuario) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${usuario.nombre}</h3>
      <p><strong>Rol:</strong> ${usuario.rol}</p>
      <p><strong>Estado:</strong> ${usuario.estado}</p>
      <p><strong>Especialidad:</strong> ${usuario.especialidad || "No aplica"}</p>
    `;

    listaUsuarios.appendChild(item);
  });
}

async function aprobarDoctor(id) {
  if (!confirm("¿Deseas aprobar a este doctor?")) return;

  const { error } = await supabase.rpc("admin_aprobar_doctor", {
    doctor_id: id
  });

  if (error) {
    alert(error.message);
    return;
  }

  cargarDashboardAdmin();
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

  cargarDashboardAdmin();
}

if (logout) logout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

cargarDashboardAdmin();