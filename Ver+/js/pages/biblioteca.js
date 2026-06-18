import { supabase } from "../supabase.js";

const listaBiblioteca = document.getElementById("listaBiblioteca");
const buscador = document.getElementById("buscador");

const totalArticulos = document.getElementById("totalArticulos");
const totalGuias = document.getElementById("totalGuias");
const totalConsejos = document.getElementById("totalConsejos");
const totalTemas = document.getElementById("totalTemas");

let contenidos = [];

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function cargarBiblioteca() {
  const { data, error } = await supabase
    .from("biblioteca_educativa")
    .select("*")
    .order("id", { ascending: false });

  if (error || !data || data.length === 0) {
    contenidos = contenidoBase();
  } else {
    contenidos = data;
  }

  actualizarMetricas(contenidos);
  renderBiblioteca(contenidos);
}

function renderBiblioteca(lista) {
  if (lista.length === 0) {
    listaBiblioteca.innerHTML = "<p>No se encontró contenido.</p>";
    return;
  }

  listaBiblioteca.innerHTML = "";

  lista.forEach((item) => {
    const card = document.createElement("article");
    card.className = "library-card";

    card.innerHTML = `
      <div class="library-icon">
        <i data-lucide="${iconoPorTipo(item.tipo_contenido)}"></i>
      </div>

      <div>
        <span class="library-badge">${item.tipo_contenido}</span>
        <h3>${item.titulo}</h3>
        <p><strong>Tema:</strong> ${item.tema}</p>
        <p>${item.descripcion || "Sin descripción disponible."}</p>

        ${
          item.url
            ? `<a href="${item.url}" target="_blank" class="meet-link">Abrir recurso</a>`
            : ""
        }
      </div>
    `;

    listaBiblioteca.appendChild(card);
  });

  lucide.createIcons();
}

buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();

  const filtrados = contenidos.filter((item) => {
    return (
      item.titulo?.toLowerCase().includes(texto) ||
      item.tema?.toLowerCase().includes(texto) ||
      item.tipo_contenido?.toLowerCase().includes(texto) ||
      item.descripcion?.toLowerCase().includes(texto)
    );
  });

  renderBiblioteca(filtrados);
});

function actualizarMetricas(lista) {
  totalArticulos.textContent = lista.filter(i => i.tipo_contenido?.toLowerCase().includes("artículo")).length;
  totalGuias.textContent = lista.filter(i => i.tipo_contenido?.toLowerCase().includes("guía")).length;
  totalConsejos.textContent = lista.filter(i => i.tipo_contenido?.toLowerCase().includes("consejo")).length;

  const temas = new Set(lista.map(i => i.tema));
  totalTemas.textContent = temas.size;
}

function iconoPorTipo(tipo) {
  const t = (tipo || "").toLowerCase();

  if (t.includes("guía")) return "file-text";
  if (t.includes("consejo")) return "lightbulb";
  if (t.includes("video")) return "play-circle";

  return "book-open";
}

function contenidoBase() {
  return [
    {
      titulo: "¿Qué observar en la visión de un bebé?",
      tipo_contenido: "Artículo",
      tema: "Desarrollo visual",
      descripcion: "Explica señales básicas que los padres pueden observar durante los primeros meses."
    },
    {
      titulo: "Guía de estimulación visual en casa",
      tipo_contenido: "Guía",
      tema: "Estimulación visual",
      descripcion: "Actividades sencillas con colores, contraste y seguimiento de objetos."
    },
    {
      titulo: "Señales de alerta visual infantil",
      tipo_contenido: "Artículo",
      tema: "Prevención",
      descripcion: "Orientación sobre signos que pueden requerir valoración médica."
    },
    {
      titulo: "Consejos para pruebas visuales rutinarias",
      tipo_contenido: "Consejo",
      tema: "Pruebas en casa",
      descripcion: "Recomendaciones para realizar observaciones visuales de forma segura."
    },
    {
      titulo: "Importancia de las revisiones oftalmológicas",
      tipo_contenido: "Artículo",
      tema: "Consulta médica",
      descripcion: "Información general sobre la importancia del seguimiento profesional."
    }
  ];
}

cargarBiblioteca();