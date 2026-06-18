import { supabase } from "../supabase.js";

const listaPacientes = document.getElementById("listaPacientes");

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function cargarPacientes() {
  const { data, error } = await supabase.rpc("doctor_pacientes_asignados");

  if (error) {
    listaPacientes.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaPacientes.innerHTML = `<p>No tienes pacientes asignados.</p>`;
    return;
  }

  listaPacientes.innerHTML = "";

  data.forEach((p) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${p.nombre}</h3>
      <p><strong>Edad:</strong> ${p.edad_meses} meses</p>
      <p><strong>Género:</strong> ${p.genero}</p>
      <p><strong>Historial visual:</strong> ${p.historial_visual || "Sin observaciones"}</p>
      <p><strong>Asignado:</strong> ${formatearFecha(p.asignado_en)}</p>
    `;

    listaPacientes.appendChild(item);
  });
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX");
}

cargarPacientes();