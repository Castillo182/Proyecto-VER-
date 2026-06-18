import { supabase } from "../supabase.js";

const selectNino = document.getElementById("nino_id");

const panelSolicitud = document.getElementById("panelSolicitud");
const formSolicitudDoctor = document.getElementById("formSolicitudDoctor");
const motivoSolicitud = document.getElementById("motivoSolicitud");
const mensajeSolicitud = document.getElementById("mensajeSolicitud");

const doctorAsignadoInfo = document.getElementById("doctorAsignadoInfo");
const formCita = document.getElementById("formCita");
const selectHorario = document.getElementById("horario_id");
const motivoCita = document.getElementById("motivoCita");
const mensajeCita = document.getElementById("mensajeCita");

const listaCitas = document.getElementById("listaCitas");

let ninoSeleccionado = null;
let doctorAsignado = null;
let horariosDisponibles = [];

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = `auth-message show ${tipo}`;
}

async function cargarNinos() {
  const contenedor = document.getElementById("selectorNinosCards");

  const { data, error } = await supabase.rpc("paciente_mis_ninos");

  if (error) {
    contenedor.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  renderSelectorNinos(data || [], async (ninoId) => {
    ninoSeleccionado = String(ninoId);
    selectNino.value = ninoSeleccionado;
    limpiarMensajes();

    await verificarDoctorAsignado(ninoSeleccionado);
    await cargarCitas(ninoSeleccionado);
  });
}

function renderSelectorNinos(ninos, callback) {
  const contenedor = document.getElementById("selectorNinosCards");
  const inputHidden = document.getElementById("nino_id");

  if (!contenedor || !inputHidden) return;

  contenedor.innerHTML = "";

  if (!ninos || ninos.length === 0) {
    contenedor.innerHTML = "<p>No hay niños registrados.</p>";
    return;
  }

  ninos.forEach((nino) => {
    const card = document.createElement("div");
    card.className = "child-card-select";

    card.innerHTML = `
      <div class="child-card-icon">
        <i data-lucide="baby"></i>
      </div>

      <h3>${nino.nombre}</h3>
      <p>${nino.edad_meses} meses · ${nino.genero || "Sin género"}</p>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll("#selectorNinosCards .child-card-select").forEach((c) => {
        c.classList.remove("active");
      });

      card.classList.add("active");
      inputHidden.value = nino.id;

      callback(nino.id);
    });

    contenedor.appendChild(card);
  });

  lucide.createIcons();
}

async function verificarDoctorAsignado(ninoId) {
  const { data, error } = await supabase.rpc("paciente_doctor_asignado", {
    nino_id_param: parseInt(ninoId)
  });

  if (error) {
    doctorAsignadoInfo.innerHTML = `<p>${error.message}</p>`;
    formCita.style.display = "none";
    return;
  }

  if (!data || data.length === 0) {
    doctorAsignado = null;

    doctorAsignadoInfo.innerHTML = `
      <h3>Sin doctor asignado</h3>
      <p>Envía una solicitud al administrador para que asigne un especialista.</p>
    `;

    panelSolicitud.style.display = "block";
    formCita.style.display = "none";

    await verificarSolicitudPendiente(ninoId);
    return;
  }

  const doctor = data[0];

  doctorAsignado = {
    doctor_id: doctor.doctor_id,
    usuarios: {
      nombre: doctor.doctor_nombre,
      especialidad: doctor.especialidad,
      cedula_profesional: doctor.cedula_profesional
    }
  };

  panelSolicitud.style.display = "none";

  doctorAsignadoInfo.innerHTML = `
    <h3>${doctor.doctor_nombre}</h3>
    <p><strong>Especialidad:</strong> ${doctor.especialidad || "No registrada"}</p>
    <p><strong>Cédula:</strong> ${doctor.cedula_profesional || "No registrada"}</p>
  `;

  await cargarHorariosDisponibles(doctor.doctor_id);
}

async function verificarSolicitudPendiente(ninoId) {
  const { data } = await supabase
    .from("solicitudes_doctor")
    .select("*")
    .eq("nino_id", ninoId)
    .eq("estado", "pendiente")
    .limit(1);

  if (data && data.length > 0) {
    mostrarMensaje(
      mensajeSolicitud,
      "Ya existe una solicitud pendiente para este niño.",
      "info"
    );
  }
}

async function cargarHorariosDisponibles(doctorId) {
  const { data, error } = await supabase.rpc("paciente_horarios_doctor", {
    doctor_id_param: doctorId
  });

  if (error) {
    selectHorario.innerHTML = `<option value="">${error.message}</option>`;
    formCita.style.display = "none";
    return;
  }

  horariosDisponibles = data || [];

  if (horariosDisponibles.length === 0) {
    selectHorario.innerHTML = `<option value="">No hay horarios disponibles</option>`;
    formCita.style.display = "none";
    return;
  }

  selectHorario.innerHTML = `<option value="">Selecciona un horario</option>`;

  horariosDisponibles.forEach((horario) => {
    const option = document.createElement("option");
    option.value = horario.id;
    option.textContent = `${formatearFecha(horario.fecha)} · ${horario.hora_inicio} - ${horario.hora_fin}`;
    selectHorario.appendChild(option);
  });

  formCita.style.display = "block";
}

formSolicitudDoctor.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!ninoSeleccionado) {
    mostrarMensaje(mensajeSolicitud, "Selecciona un niño primero.", "error");
    return;
  }

  const { error } = await supabase.from("solicitudes_doctor").insert([
    {
      nino_id: parseInt(ninoSeleccionado),
      tutor_id: user.id,
      motivo: motivoSolicitud.value.trim(),
      estado: "pendiente"
    }
  ]);

  if (error) {
    mostrarMensaje(mensajeSolicitud, error.message, "error");
    return;
  }

  mostrarMensaje(
    mensajeSolicitud,
    "Solicitud enviada correctamente. El administrador asignará un doctor.",
    "success"
  );

  formSolicitudDoctor.reset();
});

formCita.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!ninoSeleccionado || !doctorAsignado) {
    mostrarMensaje(mensajeCita, "No hay doctor asignado para este paciente.", "error");
    return;
  }

  const horarioId = parseInt(selectHorario.value);
  const horario = horariosDisponibles.find((h) => h.id === horarioId);

  if (!horario) {
    mostrarMensaje(mensajeCita, "Selecciona un horario válido.", "error");
    return;
  }

  const fechaHora = `${horario.fecha}T${horario.hora_inicio}`;

  const { error: citaError } = await supabase.from("citas_especialistas").insert([
    {
      nino_id: parseInt(ninoSeleccionado),
      doctor_id: doctorAsignado.doctor_id,
      horario_id: horario.id,
      especialista: doctorAsignado.usuarios?.nombre || "Doctor asignado",
      fecha_cita: fechaHora,
      motivo: motivoCita.value.trim(),
      estado: "Programada",
      creado_por: user.id
    }
  ]);

  if (citaError) {
    mostrarMensaje(mensajeCita, citaError.message, "error");
    return;
  }

  await supabase
    .from("horarios_doctor")
    .update({ disponible: false })
    .eq("id", horario.id);

  mostrarMensaje(mensajeCita, "Cita agendada correctamente.", "success");

  formCita.reset();

  await cargarHorariosDisponibles(doctorAsignado.doctor_id);
  await cargarCitas(ninoSeleccionado);
});

async function cargarCitas(ninoId) {
  const { data, error } = await supabase.rpc("paciente_mis_citas", {
    nino_id_param: parseInt(ninoId)
  });

  if (error) {
    listaCitas.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaCitas.innerHTML = `<p>No hay citas registradas para este niño.</p>`;
    return;
  }

  listaCitas.innerHTML = "";

  data.forEach((cita) => {
    const item = document.createElement("div");
    const estadoClase = claseEstadoCita(cita.estado);

    const puedeModificar =
      cita.estado !== "Cancelada" &&
      cita.estado !== "Cancelada por doctor" &&
      cita.estado !== "Cambio solicitado por paciente";

    item.className = `timeline-item appointment-card ${estadoClase}`;

    item.innerHTML = `
      <h3>${cita.especialista}</h3>

      <p><strong>Fecha:</strong> ${formatearFechaHora(cita.fecha_cita)}</p>
      <p><strong>Motivo:</strong> ${cita.motivo || "Sin motivo registrado"}</p>

      <p>
        <strong>Estado:</strong>
        <span class="estado-badge ${estadoClase}">
          ${textoEstadoCita(cita.estado)}
        </span>
      </p>

      ${
        cita.meet_link
          ? `
            <p>
              <strong>Consulta en línea:</strong>
              <a href="${cita.meet_link}" target="_blank" class="meet-link">
                Entrar a llamada
              </a>
            </p>
          `
          : `
            <p>
              <strong>Consulta en línea:</strong>
              El doctor aún no ha agregado el enlace.
            </p>
          `
      }

      ${
        puedeModificar
          ? `
            <div class="child-actions">
              <button class="btn-delete btn-cancelar-cita" data-id="${cita.cita_id}">
                Cancelar cita
              </button>

              <button class="btn-edit btn-solicitar-cambio" data-id="${cita.cita_id}">
                Solicitar cambio
              </button>
            </div>
          `
          : ""
      }
    `;

    listaCitas.appendChild(item);
  });

  document.querySelectorAll(".btn-cancelar-cita").forEach((btn) => {
    btn.addEventListener("click", () => cancelarCita(btn.dataset.id));
  });

  document.querySelectorAll(".btn-solicitar-cambio").forEach((btn) => {
    btn.addEventListener("click", () => solicitarCambioCita(btn.dataset.id));
  });
}

async function cancelarCita(citaId) {
  if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;

  const { error } = await supabase.rpc("paciente_cancelar_cita", {
    cita_id_param: parseInt(citaId)
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Cita cancelada correctamente.");

  await cargarCitas(ninoSeleccionado);

  if (doctorAsignado) {
    await cargarHorariosDisponibles(doctorAsignado.doctor_id);
  }
}

async function solicitarCambioCita(citaId) {
  if (!doctorAsignado) {
    alert("No hay doctor asignado.");
    return;
  }

  await cargarHorariosDisponibles(doctorAsignado.doctor_id);

  if (horariosDisponibles.length === 0) {
    alert("No hay horarios disponibles para solicitar cambio.");
    return;
  }

  const opciones = horariosDisponibles
    .map((h) => `${h.id}: ${formatearFecha(h.fecha)} · ${h.hora_inicio} - ${h.hora_fin}`)
    .join("\n");

  const nuevoHorarioId = prompt(
    `Selecciona el ID del nuevo horario:\n\n${opciones}`
  );

  if (!nuevoHorarioId) return;

  const motivo = prompt("Motivo del cambio de cita:") || "";

  const { error } = await supabase.rpc("paciente_solicitar_cambio_cita", {
    cita_id_param: parseInt(citaId),
    nuevo_horario_id_param: parseInt(nuevoHorarioId),
    motivo_param: motivo
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Solicitud de cambio enviada. Espera a que el doctor la acepte.");
  await cargarCitas(ninoSeleccionado);
}

function limpiarMensajes() {
  mensajeSolicitud.className = "auth-message";
  mensajeSolicitud.textContent = "";

  mensajeCita.className = "auth-message";
  mensajeCita.textContent = "";
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
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
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

cargarNinos();