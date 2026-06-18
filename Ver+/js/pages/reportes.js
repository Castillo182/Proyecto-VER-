import { supabase } from "../supabase.js";

const selectorNino = document.getElementById("selectorNino");
const contenidoReporte = document.getElementById("contenidoReporte");
const btnImprimir = document.getElementById("btnImprimir");

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

let ninos = [];

async function cargarNinos() {
  const { data, error } = await supabase.rpc("paciente_mis_ninos");

  if (error) {
    document.getElementById("selectorNinosCards").innerHTML = `<p>${error.message}</p>`;
    return;
  }

  ninos = data || [];

  renderSelectorNinos(ninos, async (ninoId) => {
    await generarReporte(ninoId);
  });
}

selectorNino.addEventListener("change", async () => {
  if (selectorNino.value) {
    await generarReporte(selectorNino.value);
  } else {
    contenidoReporte.innerHTML = `<p>Selecciona un niño para generar su reporte.</p>`;
  }
});

async function generarReporte(ninoId) {
  const nino = ninos.find((item) => String(item.id) === String(ninoId));

  const { data: pruebas } = await supabase
    .from("pruebas_visuales")
    .select("*")
    .eq("nino_id", ninoId)
    .order("fecha_hora", { ascending: false });

  const { data: citas } = await supabase.rpc("paciente_mis_citas", {
    nino_id_param: parseInt(ninoId)
  });

  const { data: doctor } = await supabase.rpc("paciente_doctor_asignado", {
    nino_id_param: parseInt(ninoId)
  });

  const { data: evaluaciones } = await supabase.rpc("paciente_evaluaciones_medicas", {
    nino_id_param: parseInt(ninoId)
  });

  const doctorInfo = doctor && doctor.length > 0 ? doctor[0] : null;
  const ultimaEvaluacion = evaluaciones && evaluaciones.length > 0 ? evaluaciones[0] : null;

  contenidoReporte.innerHTML = `
    <div class="medical-report">

      <div class="medical-report-header">
        <img src="assets/img/Ver+Logo.png" alt="Ver+" class="report-logo">

        <div>
          <h2>Reporte médico visual infantil</h2>
          <p>Plataforma Ver+ · Monitoreo visual infantil</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString("es-MX")}</p>
        </div>
      </div>

      <hr>

      <section class="report-section">
        <h3>Datos del paciente</h3>

        <div class="report-grid">
          <p><strong>Nombre:</strong> ${nino.nombre}</p>
          <p><strong>Edad:</strong> ${nino.edad_meses} meses</p>
          <p><strong>Género:</strong> ${nino.genero}</p>
          <p><strong>Historial visual:</strong> ${nino.historial_visual || "Sin historial registrado"}</p>
        </div>
      </section>

      <section class="report-section">
        <h3>Doctor asignado</h3>

        ${
          doctorInfo
            ? `
              <p><strong>Doctor:</strong> ${doctorInfo.doctor_nombre}</p>
              <p><strong>Especialidad:</strong> ${doctorInfo.especialidad || "No registrada"}</p>
              <p><strong>Cédula profesional:</strong> ${doctorInfo.cedula_profesional || "No registrada"}</p>
            `
            : `<p>No hay doctor asignado todavía.</p>`
        }
      </section>

      <section class="report-section">
        <h3>Resumen del seguimiento</h3>

        <div class="report-summary-grid">
          <div>
            <strong>${pruebas?.length || 0}</strong>
            <span>Pruebas visuales</span>
          </div>

          <div>
            <strong>${citas?.length || 0}</strong>
            <span>Citas médicas</span>
          </div>

          <div>
            <strong>${evaluaciones?.length || 0}</strong>
            <span>Evaluaciones médicas</span>
          </div>

          <div>
            <strong>${ultimaEvaluacion?.estado_seguimiento || "Sin estado"}</strong>
            <span>Estado actual</span>
          </div>
        </div>
      </section>

      <section class="report-section">
        <h3>Evaluaciones médicas</h3>

        ${
          evaluaciones && evaluaciones.length > 0
            ? evaluaciones.map((ev) => `
              <div class="timeline-item medical-report-card">
                <h4>${ev.tipo_evaluacion || "Consulta médica"}</h4>
                <p><strong>Doctor:</strong> ${ev.doctor_nombre || "Doctor"}</p>
                <p><strong>Diagnóstico:</strong> ${ev.diagnostico || "Sin diagnóstico"}</p>
                <p><strong>Estado de seguimiento:</strong> ${ev.estado_seguimiento || "En seguimiento"}</p>
                <p><strong>Requiere revisión:</strong> ${ev.requiere_revision ? "Sí" : "No"}</p>
                <p><strong>Observaciones:</strong> ${ev.observaciones || "Sin observaciones"}</p>
                <p><strong>Indicaciones:</strong> ${ev.indicaciones || "Sin indicaciones"}</p>
                <p><strong>Medicamentos:</strong> ${ev.medicamentos || "Sin medicamentos"}</p>
                <p><strong>Próxima revisión:</strong> ${ev.proxima_revision || "No definida"}</p>
                <p><strong>Fecha:</strong> ${formatearFecha(ev.creado_en)}</p>
              </div>
            `).join("")
            : `<p>No hay evaluaciones médicas registradas.</p>`
        }
      </section>

      <section class="report-section">
        <h3>Historial de pruebas visuales</h3>

        ${
          pruebas && pruebas.length > 0
            ? pruebas.map((p) => `
              <div class="timeline-item">
                <h4>${p.tipo_prueba}</h4>
                <p><strong>Resultado:</strong> ${p.resultado}</p>
                <p><strong>Realizado por:</strong> ${p.rol_realizador || "tutor"}</p>
                <p><strong>Fecha:</strong> ${formatearFecha(p.fecha_hora)}</p>
                <p>${p.observaciones || "Sin observaciones."}</p>
              </div>
            `).join("")
            : `<p>No hay pruebas registradas.</p>`
        }
      </section>

      <section class="report-section">
        <h3>Citas médicas</h3>

        ${
          citas && citas.length > 0
            ? citas.map((c) => {
              const estadoClase = claseEstadoCita(c.estado);

              return `
                <div class="timeline-item appointment-card ${estadoClase}">
                  <h4>${c.especialista}</h4>
                  <p><strong>Fecha:</strong> ${formatearFecha(c.fecha_cita)}</p>
                  <p><strong>Motivo:</strong> ${c.motivo || "Sin motivo registrado"}</p>
                  <p>
                    <strong>Estado:</strong>
                    <span class="estado-badge ${estadoClase}">
                      ${textoEstadoCita(c.estado)}
                    </span>
                  </p>
                </div>
              `;
            }).join("")
            : `<p>No hay citas registradas.</p>`
        }
      </section>

      <section class="report-section report-warning">
        <h3>Nota médica</h3>
        <p>
          Este reporte resume la información registrada en Ver+.
          No sustituye una valoración médica presencial ni una consulta profesional completa.
        </p>
      </section>

      <section class="report-signature">
        <div>
          <p>________________________________</p>
          <strong>${doctorInfo?.doctor_nombre || "Doctor responsable"}</strong>
          <span>${doctorInfo?.especialidad || "Especialista visual"}</span>
        </div>
      </section>

    </div>
  `;
}

btnImprimir.addEventListener("click", () => {
  window.print();
});

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
      document.querySelectorAll(".child-card-select").forEach((c) => {
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

cargarNinos();