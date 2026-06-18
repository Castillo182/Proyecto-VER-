import { supabase } from "../supabase.js";

const selectorNino = document.getElementById("selectorNino");
const listaRecomendaciones = document.getElementById("listaRecomendaciones");

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function cargarNinos() {
  const contenedor = document.getElementById("selectorNinosCards");

  const { data, error } = await supabase.rpc("paciente_mis_ninos");

  if (error) {
    contenedor.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  renderSelectorNinos(data || [], (ninoId) => {
    selectorNino.value = ninoId;
    cargarRecomendaciones(ninoId);
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

async function cargarRecomendaciones(ninoId) {
  const { data, error } = await supabase
    .from("recomendaciones")
    .select("*")
    .eq("nino_id", ninoId)
    .order("creado_en", { ascending: false });

  if (error) {
    listaRecomendaciones.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  listaRecomendaciones.innerHTML = "";

  if (!data || data.length === 0) {
    listaRecomendaciones.innerHTML = `
      <div class="timeline-item recommendation-item">
        <h3>Recomendación inicial</h3>
        <p>
          Realiza pruebas visuales rutinarias y observa si el niño sigue objetos,
          responde a colores, fija la mirada y coordina ojo-mano.
        </p>
      </div>

      <div class="timeline-item recommendation-item">
        <h3>Actividad en casa</h3>
        <p>
          Usa un juguete llamativo y muévelo lentamente de izquierda a derecha
          para observar el seguimiento visual.
        </p>
      </div>

      <div class="timeline-item recommendation-item">
        <h3>Cuándo consultar al especialista</h3>
        <p>
          Si notas desviación ocular, falta de seguimiento visual, reacción pobre a la luz
          o movimientos extraños de los ojos, agenda una cita.
        </p>
      </div>
    `;
    return;
  }

  data.forEach((rec) => {
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


function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

cargarNinos();