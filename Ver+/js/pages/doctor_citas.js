import { supabase } from "../supabase.js";

const listaCitas = document.getElementById("listaCitas");

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function cargarCitas() {
  const { data, error } = await supabase.rpc("doctor_mis_citas");

  if (error) {
    listaCitas.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  const { data: cambios, error: cambiosError } = await supabase.rpc(
    "doctor_solicitudes_cambio_cita"
  );

  let html = "";

  if (cambiosError) {
    html += `<p>${cambiosError.message}</p>`;
  } else if (cambios && cambios.length > 0) {
    html += `<h2>Solicitudes de cambio pendientes</h2>`;

    cambios.forEach((solicitud) => {
      html += `
        <div class="timeline-item alert-item appointment-card estado-modificando">
          <h3>${solicitud.paciente}</h3>
          <p><strong>Fecha actual:</strong> ${formatearFecha(solicitud.fecha_actual)}</p>
          <p><strong>Nueva fecha:</strong> ${formatearFechaSimple(solicitud.nueva_fecha)} · ${solicitud.nueva_hora_inicio} - ${solicitud.nueva_hora_fin}</p>
          <p><strong>Motivo:</strong> ${solicitud.motivo || "Sin motivo registrado"}</p>

          <div class="child-actions">
            <button class="btn-edit btn-aceptar-cambio" data-id="${solicitud.solicitud_id}">
              Aceptar cambio
            </button>

            <button class="btn-delete btn-rechazar-cambio" data-id="${solicitud.solicitud_id}">
              Rechazar cambio
            </button>
          </div>
        </div>
      `;
    });
  }

  html += `<h2 style="margin-top:24px;">Agenda</h2>`;

  if (!data || data.length === 0) {
    html += `<p>No tienes citas programadas.</p>`;
    listaCitas.innerHTML = html;
    activarBotonesCambio();
    return;
  }

  data.forEach((cita) => {
    const estadoClase = claseEstadoCita(cita.estado);

    const puedeCancelar =
      cita.estado !== "Cancelada" &&
      cita.estado !== "Cancelada por doctor";

    html += `
      <div class="timeline-item appointment-card ${estadoClase}">
        <h3>${cita.nino_nombre}</h3>

        <p><strong>Fecha:</strong> ${formatearFecha(cita.fecha_cita)}</p>
        <p><strong>Motivo:</strong> ${cita.motivo || "Sin motivo registrado"}</p>

        <p>
          <strong>Estado:</strong>
          <span class="estado-badge ${estadoClase}">
            ${textoEstadoCita(cita.estado)}
          </span>
        </p>

        <p>
          <strong>Meet:</strong>
          ${
            cita.meet_link
              ? `<a href="${cita.meet_link}" target="_blank" class="meet-link">Abrir enlace</a>`
              : "Sin enlace"
          }
        </p>

        ${
          puedeCancelar
            ? `
              <div class="form-group">
                <label>Link de Google Meet</label>
                <input
                  type="url"
                  class="meet-input"
                  data-id="${cita.cita_id}"
                  value="${cita.meet_link || ""}"
                  placeholder="https://meet.google.com/..."
                >
              </div>

              <div class="child-actions">
                <button class="btn-edit btn-guardar-meet" data-id="${cita.cita_id}">
                  Guardar link Meet
                </button>

                <button class="btn-delete btn-cancelar-doctor" data-id="${cita.cita_id}">
                  Cancelar cita
                </button>
              </div>
            `
            : ""
        }
      </div>
    `;
  });

  listaCitas.innerHTML = html;

  activarBotonesCambio();
  activarBotonesCitas();
}

function activarBotonesCambio() {
  document.querySelectorAll(".btn-aceptar-cambio").forEach((btn) => {
    btn.addEventListener("click", () => responderCambio(btn.dataset.id, true));
  });

  document.querySelectorAll(".btn-rechazar-cambio").forEach((btn) => {
    btn.addEventListener("click", () => responderCambio(btn.dataset.id, false));
  });
}

function activarBotonesCitas() {
  document.querySelectorAll(".btn-cancelar-doctor").forEach((btn) => {
    btn.addEventListener("click", () => cancelarCitaDoctor(btn.dataset.id));
  });

  document.querySelectorAll(".btn-guardar-meet").forEach((btn) => {
    btn.addEventListener("click", () => guardarMeetLink(btn.dataset.id));
  });
}

async function guardarMeetLink(citaId) {
  const input = document.querySelector(`.meet-input[data-id="${citaId}"]`);
  const meetLink = input.value.trim();

  if (!meetLink) {
    alert("Ingresa un link de Meet.");
    return;
  }

  if (!meetLink.startsWith("https://")) {
    alert("El link debe iniciar con https://");
    return;
  }

  const { error } = await supabase.rpc("doctor_actualizar_meet_link", {
    cita_id_param: parseInt(citaId),
    meet_link_param: meetLink
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Link de Meet guardado.");
  await cargarCitas();
}

async function responderCambio(solicitudId, aceptar) {
  const confirmar = confirm(
    aceptar
      ? "¿Aceptar cambio de cita?"
      : "¿Rechazar cambio de cita?"
  );

  if (!confirmar) return;

  const { error } = await supabase.rpc("doctor_responder_cambio_cita", {
    solicitud_id_param: parseInt(solicitudId),
    aceptar
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert(aceptar ? "Cambio aceptado." : "Cambio rechazado.");
  await cargarCitas();
}

async function cancelarCitaDoctor(citaId) {
  if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;

  const { error } = await supabase.rpc("doctor_cancelar_cita", {
    cita_id_param: parseInt(citaId)
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Cita cancelada correctamente.");
  await cargarCitas();
}

function claseEstadoCita(estado) {
  const e = (estado || "").toLowerCase();

  if (e.includes("cancelada")) return "estado-cancelada";
  if (e.includes("cambio") || e.includes("reprogramada")) return "estado-modificando";
  if (e.includes("completada") || e.includes("atendida")) return "estado-completada";

  return "estado-vigente";
}

function textoEstadoCita(estado) {
  const e = (estado || "").toLowerCase();

  if (e.includes("cancelada")) return "Cancelada";
  if (e.includes("cambio")) return "Cambio solicitado";
  if (e.includes("reprogramada")) return "Reprogramada";
  if (e.includes("completada") || e.includes("atendida")) return "Completada";

  return "Vigente";
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatearFechaSimple(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

cargarCitas();