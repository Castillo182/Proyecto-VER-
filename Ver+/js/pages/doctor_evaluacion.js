import { supabase } from "../supabase.js";

const selectorPaciente = document.getElementById("selectorPaciente");
const datosPaciente = document.getElementById("datosPaciente");
const historialEvaluaciones = document.getElementById("historialEvaluaciones");

const formEvaluacion = document.getElementById("formEvaluacion");
const tipoEvaluacionInput = document.getElementById("tipoEvaluacion");
const estadoSeguimientoInput = document.getElementById("estadoSeguimiento");
const requiereRevisionInput = document.getElementById("requiereRevision");
const diagnosticoInput = document.getElementById("diagnostico");
const observacionesInput = document.getElementById("observaciones");
const indicacionesInput = document.getElementById("indicaciones");
const medicamentosInput = document.getElementById("medicamentos");
const proximaRevisionInput = document.getElementById("proximaRevision");
const mensaje = document.getElementById("mensaje");

let pacientes = [];
let pacienteSeleccionado = null;

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `auth-message show ${tipo}`;
}

async function cargarPacientes() {
  const contenedor = document.getElementById("selectorPacientesCards");

  const { data, error } = await supabase.rpc("doctor_pacientes_asignados");

  if (error) {
    contenedor.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  pacientes = data || [];

  renderSelectorPacientes(pacientes, async (ninoId) => {
    selectorPaciente.value = ninoId;

    pacienteSeleccionado = pacientes.find((p) => String(p.nino_id) === String(ninoId));

    mostrarDatosPaciente(pacienteSeleccionado);
    await cargarHistorialEvaluaciones(ninoId);
  });
}

function renderSelectorPacientes(pacientesLista, callback) {
  const contenedor = document.getElementById("selectorPacientesCards");
  const inputHidden = document.getElementById("selectorPaciente");

  if (!contenedor || !inputHidden) return;

  contenedor.innerHTML = "";

  if (!pacientesLista || pacientesLista.length === 0) {
    contenedor.innerHTML = "<p>No tienes pacientes asignados.</p>";
    return;
  }

  pacientesLista.forEach((paciente) => {
    const card = document.createElement("div");
    card.className = "child-card-select";

    card.innerHTML = `
      <div class="child-card-icon">
        <i data-lucide="baby"></i>
      </div>

      <h3>${paciente.nombre}</h3>
      <p>${paciente.edad_meses} meses · ${paciente.genero || "Sin género"}</p>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll("#selectorPacientesCards .child-card-select").forEach((c) => {
        c.classList.remove("active");
      });

      card.classList.add("active");
      inputHidden.value = paciente.nino_id;

      callback(paciente.nino_id);
    });

    contenedor.appendChild(card);
  });

  lucide.createIcons();
}

function mostrarDatosPaciente(paciente) {
  datosPaciente.innerHTML = `
    <h3>${paciente.nombre}</h3>
    <p><strong>Edad:</strong> ${paciente.edad_meses} meses</p>
    <p><strong>Género:</strong> ${paciente.genero}</p>
    <p><strong>Historial visual:</strong> ${paciente.historial_visual || "Sin observaciones registradas"}</p>
    <p><strong>Asignado:</strong> ${formatearFecha(paciente.asignado_en)}</p>
  `;
}

async function cargarHistorialEvaluaciones(ninoId) {
  const { data, error } = await supabase.rpc("doctor_historial_evaluaciones", {
    nino_id_param: parseInt(ninoId)
  });

  if (error) {
    historialEvaluaciones.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    historialEvaluaciones.innerHTML = `<p>No hay evaluaciones médicas registradas.</p>`;
    return;
  }

  historialEvaluaciones.innerHTML = "";

  data.forEach((ev) => {
    const item = document.createElement("div");
    item.className = "timeline-item medical-report-card";

    item.innerHTML = `
      <h3>${ev.diagnostico}</h3>
      <p><strong>Tipo:</strong> ${ev.tipo_evaluacion || "Consulta médica"}</p>
      <p><strong>Seguimiento:</strong> ${ev.estado_seguimiento || "En seguimiento"}</p>
      <p><strong>Requiere revisión:</strong> ${ev.requiere_revision ? "Sí" : "No"}</p>
      <p><strong>Observaciones:</strong> ${ev.observaciones || "Sin observaciones"}</p>
      <p><strong>Indicaciones:</strong> ${ev.indicaciones || "Sin indicaciones"}</p>
      <p><strong>Medicamentos:</strong> ${ev.medicamentos || "Sin medicamentos"}</p>
      <p><strong>Próxima revisión:</strong> ${ev.proxima_revision || "No definida"}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(ev.creado_en)}</p>
    `;

    historialEvaluaciones.appendChild(item);
  });
}

formEvaluacion.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!pacienteSeleccionado) {
    mostrarMensaje("Selecciona un paciente primero.", "error");
    return;
  }

  const diagnostico = diagnosticoInput.value.trim();

  if (!diagnostico) {
    mostrarMensaje("El diagnóstico es obligatorio.", "error");
    return;
  }

  mostrarMensaje("Guardando evaluación médica...", "info");

  const { error } = await supabase.rpc("doctor_guardar_evaluacion", {
    nino_id_param: parseInt(pacienteSeleccionado.nino_id),
    tipo_evaluacion_param: tipoEvaluacionInput.value,
    estado_seguimiento_param: estadoSeguimientoInput.value,
    requiere_revision_param: requiereRevisionInput.checked,
    diagnostico_param: diagnostico,
    observaciones_param: observacionesInput.value.trim(),
    indicaciones_param: indicacionesInput.value.trim(),
    medicamentos_param: medicamentosInput.value.trim(),
    proxima_revision_param: proximaRevisionInput.value || null
  });

  if (error) {
    mostrarMensaje(error.message, "error");
    return;
  }

  mostrarMensaje("Evaluación médica guardada correctamente.", "success");

  formEvaluacion.reset();

  await cargarHistorialEvaluaciones(pacienteSeleccionado.nino_id);
});

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

cargarPacientes();