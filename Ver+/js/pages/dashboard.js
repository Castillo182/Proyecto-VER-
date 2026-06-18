import { supabase } from "../supabase.js";

const usuarioTexto = document.getElementById("usuario");
const selectorContainer = document.getElementById("selectorContainer");
const selectorNino = document.getElementById("selectorNino");
const sinNinos = document.getElementById("sinNinos");
const expedientePaciente = document.getElementById("expedientePaciente");

const tituloDashboard = document.getElementById("tituloDashboard");
const nombreNino = document.getElementById("nombreNino");
const datosNino = document.getElementById("datosNino");
const historialNino = document.getElementById("historialNino");
const historialMedicoTexto = document.getElementById("historialMedicoTexto");

const estadoVisual = document.getElementById("estadoVisual");
const ultimaEvaluacion = document.getElementById("ultimaEvaluacion");

const totalPruebas = document.getElementById("totalPruebas");
const ultimoResultado = document.getElementById("ultimoResultado");
const totalAlertas = document.getElementById("totalAlertas");
const proximaCita = document.getElementById("proximaCita");

const listaPruebas = document.getElementById("listaPruebas");
const listaCitas = document.getElementById("listaCitas");
const listaAlertas = document.getElementById("listaAlertas");
const listaRecomendaciones = document.getElementById("listaRecomendaciones");

let ninosUsuario = [];

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

usuarioTexto.textContent = `Correo: ${user.email}`;

async function cargarNinos() {
  const contenedor = document.getElementById("selectorNinosCards");

  const { data, error } = await supabase.rpc("paciente_mis_ninos");

  if (error) {
    contenedor.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  ninosUsuario = data || [];

  if (ninosUsuario.length === 0) {
    selectorContainer.style.display = "none";
    expedientePaciente.style.display = "none";
    sinNinos.style.display = "block";
    lucide.createIcons();
    return;
  }

  sinNinos.style.display = "none";

  if (ninosUsuario.length === 1) {
    selectorContainer.style.display = "none";
    mostrarExpediente(ninosUsuario[0].id);
  } else {
    selectorContainer.style.display = "block";

    renderSelectorNinos(ninosUsuario, (ninoId) => {
      selectorNino.value = ninoId;
      mostrarExpediente(ninoId);
    });
  }
}

function renderSelectorNinos(ninos, callback) {
  const contenedor = document.getElementById("selectorNinosCards");
  const inputHidden = document.getElementById("selectorNino");

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

async function mostrarExpediente(ninoId) {
  const nino = ninosUsuario.find((item) => String(item.id) === String(ninoId));
  if (!nino) return;

  expedientePaciente.style.display = "block";

  tituloDashboard.textContent = `Expediente de ${nino.nombre}`;
  nombreNino.textContent = nino.nombre;
  datosNino.textContent = `${nino.edad_meses} meses · ${nino.genero}`;
  historialNino.textContent = nino.historial_visual || "Sin historial visual registrado.";
  historialMedicoTexto.textContent = nino.historial_visual || "Sin observaciones médicas visuales registradas.";

  await cargarEvaluaciones(nino.id);
  await cargarPruebas(nino.id);
  await cargarCitas(nino.id);
  await cargarRecomendaciones(nino.id);
  await cargarAlertas(nino.id);

  lucide.createIcons();
}

async function cargarEvaluaciones(ninoId) {
  const { data } = await supabase.rpc("paciente_evaluaciones_medicas", {
    nino_id_param: parseInt(ninoId)
  });

  const ultima = data && data.length > 0 ? data[0] : null;

  if (!ultima) {
    estadoVisual.textContent = "Sin evaluación";
    estadoVisual.className = "clinical-status estado-neutro";
    ultimaEvaluacion.textContent = "Sin evaluación médica registrada";
    return;
  }

  estadoVisual.textContent = ultima.estado_seguimiento || "En seguimiento";
  estadoVisual.className = `clinical-status ${claseClinica(ultima.estado_seguimiento)}`;
  ultimaEvaluacion.textContent = `Última evaluación médica: ${formatearFecha(ultima.creado_en)}`;
}

async function cargarPruebas(ninoId) {
  const { data, error } = await supabase
    .from("pruebas_visuales")
    .select("*")
    .eq("nino_id", ninoId)
    .order("fecha_hora", { ascending: false });

  if (error || !data || data.length === 0) {
    totalPruebas.textContent = "0";
    ultimoResultado.textContent = "N/A";
    listaPruebas.innerHTML = `<p>No hay pruebas visuales registradas.</p>`;
    return;
  }

  totalPruebas.textContent = data.length;
  ultimoResultado.textContent = data[0].resultado;

  listaPruebas.innerHTML = "";

  data.slice(0, 4).forEach((prueba) => {
    const item = document.createElement("div");
    item.className = "timeline-item";

    item.innerHTML = `
      <h3>${prueba.tipo_prueba}</h3>
      <p><strong>Resultado:</strong> ${prueba.resultado}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(prueba.fecha_hora)}</p>
      <p>${prueba.observaciones || "Sin observaciones."}</p>
    `;

    listaPruebas.appendChild(item);
  });
}

async function cargarCitas(ninoId) {
  const { data, error } = await supabase.rpc("paciente_mis_citas", {
    nino_id_param: parseInt(ninoId)
  });

  if (error || !data || data.length === 0) {
    proximaCita.textContent = "Sin cita";
    listaCitas.innerHTML = `<p>No hay citas registradas.</p>`;
    return;
  }

  const futuras = data.filter((c) => new Date(c.fecha_cita) >= new Date());

  proximaCita.textContent = futuras.length > 0
    ? formatearFechaCorta(futuras[0].fecha_cita)
    : "Sin cita";

  listaCitas.innerHTML = "";

  data.slice(0, 4).forEach((cita) => {
    const estadoClase = claseEstadoCita(cita.estado);
    const item = document.createElement("div");
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
    `;

    listaCitas.appendChild(item);
  });
}

async function cargarRecomendaciones(ninoId) {
  const { data } = await supabase
    .from("recomendaciones")
    .select("*")
    .eq("nino_id", ninoId)
    .order("creado_en", { ascending: false });

  if (!data || data.length === 0) {
    listaRecomendaciones.innerHTML = `
      <div class="timeline-item recommendation-item">
        <h3>Recomendación inicial</h3>
        <p>Realiza pruebas visuales rutinarias y consulta al especialista si notas cambios importantes.</p>
      </div>
    `;
    return;
  }

  listaRecomendaciones.innerHTML = "";

  data.slice(0, 3).forEach((rec) => {
    const item = document.createElement("div");
    item.className = "timeline-item recommendation-item";

    item.innerHTML = `
      <h3>Recomendación médica</h3>
      <p>${rec.recomendacion}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(rec.creado_en)}</p>
    `;

    listaRecomendaciones.appendChild(item);
  });
}

async function cargarAlertas() {
  totalAlertas.textContent = "0";
  listaAlertas.innerHTML = `<p>No hay alertas pendientes.</p>`;
}

function claseClinica(estado) {
  const e = (estado || "").toLowerCase();

  if (e.includes("adecuado")) return "estado-clinico-verde";
  if (e.includes("observación") || e.includes("seguimiento")) return "estado-clinico-amarillo";
  if (e.includes("prioritaria") || e.includes("atención")) return "estado-clinico-rojo";

  return "estado-neutro";
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
  return new Date(fecha).toLocaleDateString("es-MX", {
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

function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short"
  });
}

cargarNinos();