import { supabase } from "../supabase.js";

const selectorNino = document.getElementById("selectorNino");
const listaHistorial = document.getElementById("listaHistorial");

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
    cargarHistorial(ninoId);
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

async function cargarHistorial(ninoId) {
  const { data, error } = await supabase
    .from("pruebas_visuales")
    .select("*")
    .eq("nino_id", ninoId)
    .order("fecha_hora", { ascending: false });

  if (error) {
    listaHistorial.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaHistorial.innerHTML = "<p>No hay pruebas registradas.</p>";
    return;
  }

  listaHistorial.innerHTML = "";

  data.forEach((prueba) => {
    const item = document.createElement("div");
    item.className = "timeline-item";

    item.innerHTML = `
      <h3>${prueba.tipo_prueba}</h3>
      <p><strong>Resultado:</strong> ${prueba.resultado}</p>
      <p><strong>Realizado por:</strong> ${prueba.rol_realizador || "tutor"}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(prueba.fecha_hora)}</p>
      <p>${prueba.observaciones || "Sin observaciones."}</p>
    `;

    listaHistorial.appendChild(item);
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