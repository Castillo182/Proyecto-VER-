import { supabase } from "../supabase.js";

const listaSolicitudes = document.getElementById("listaSolicitudes");

let doctores = [];

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function cargarDoctores() {
  const { data, error } = await supabase.rpc("admin_doctores_aprobados");

  if (error) {
    console.error(error);
    doctores = [];
    return;
  }

  doctores = data || [];
}

async function cargarSolicitudes() {
  const { data, error } = await supabase.rpc("admin_solicitudes_doctor");

  if (error) {
    listaSolicitudes.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaSolicitudes.innerHTML = "<p>No hay solicitudes pendientes.</p>";
    return;
  }

  listaSolicitudes.innerHTML = "";

  data.forEach((solicitud) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${solicitud.nino_nombre}</h3>
      <p><strong>Edad:</strong> ${solicitud.edad_meses} meses</p>
      <p><strong>Motivo:</strong> ${solicitud.motivo || "Sin motivo registrado"}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(solicitud.creado_en)}</p>

      <div class="form-group">
        <label>Asignar doctor</label>
        <select class="doctor-select" data-id="${solicitud.solicitud_id}">
          <option value="">Selecciona un doctor</option>
          ${doctores.map(d => `
            <option value="${d.id}">
              ${d.nombre} - ${d.especialidad || "Sin especialidad"}
            </option>
          `).join("")}
        </select>
      </div>

      <button class="btn btn-primary asignar-btn" data-id="${solicitud.solicitud_id}">
        Asignar doctor
      </button>
    `;

    listaSolicitudes.appendChild(item);
  });

  document.querySelectorAll(".asignar-btn").forEach((btn) => {
    btn.addEventListener("click", () => asignarDoctor(btn.dataset.id));
  });
}

async function asignarDoctor(solicitudId) {
  const select = document.querySelector(`.doctor-select[data-id="${solicitudId}"]`);
  const doctorId = select.value;

  if (!doctorId) {
    alert("Selecciona un doctor.");
    return;
  }

  const { error } = await supabase.rpc("admin_asignar_doctor", {
    solicitud_id_param: parseInt(solicitudId),
    doctor_id_param: doctorId
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Doctor asignado correctamente.");
  await cargarSolicitudes();
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

await cargarDoctores();
await cargarSolicitudes();