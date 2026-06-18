import { supabase } from "../supabase.js";

const selectNino = document.getElementById("nino_id");
const selectTipo = document.getElementById("tipo_prueba");
const formPrueba = document.getElementById("formPrueba");
const mensaje = document.getElementById("mensaje");
const tituloPrueba = document.getElementById("tituloPrueba");
const contenidoPrueba = document.getElementById("contenidoPrueba");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `auth-message show ${tipo}`;
}

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

const pruebas = {
  "Seguimiento visual": {
    icono: "👀",
    titulo: "Prueba de seguimiento visual",
    objetivo: "Observar si el niño sigue con la mirada un objeto en movimiento.",
    materiales: [
      "Un objeto llamativo",
      "Un juguete pequeño",
      "Buena iluminación",
      "Distancia aproximada de 30 a 40 cm"
    ],
    pasos: [
      "Coloca al niño sentado o recostado en una posición cómoda.",
      "Muestra el objeto frente a su rostro.",
      "Mueve el objeto lentamente de izquierda a derecha.",
      "Luego muévelo de arriba hacia abajo.",
      "Observa si sigue el objeto con ambos ojos."
    ],
    evaluar: [
      "Adecuado: sigue el objeto de forma continua.",
      "Requiere observación: lo sigue por momentos o se distrae demasiado.",
      "Posible anomalía: no sigue el objeto o un ojo se desvía."
    ]
  },

  "Estímulos de colores": {
    icono: "🎨",
    titulo: "Prueba de estímulos de colores",
    objetivo: "Observar la reacción del niño ante colores llamativos.",
    materiales: [
      "Tarjetas de colores",
      "Juguetes rojo, azul, amarillo o verde",
      "Ambiente con buena luz"
    ],
    pasos: [
      "Muestra un color llamativo frente al niño.",
      "Cambia lentamente entre diferentes colores.",
      "Observa si fija la mirada en los estímulos.",
      "Identifica si muestra preferencia o reacción ante algún color."
    ],
    evaluar: [
      "Adecuado: observa y reacciona ante varios colores.",
      "Requiere observación: responde poco o solo a algunos colores.",
      "Posible anomalía: no muestra reacción visual clara."
    ]
  },

  "Formas y contraste": {
    icono: "◐",
    titulo: "Prueba de formas y contraste",
    objetivo: "Evaluar si el niño reacciona ante formas simples y contrastes fuertes.",
    materiales: [
      "Tarjetas blanco y negro",
      "Figuras grandes",
      "Objetos con bordes definidos"
    ],
    pasos: [
      "Muestra una tarjeta con contraste alto.",
      "Acércala y aléjala lentamente.",
      "Cambia entre figuras simples como círculo, cuadrado o líneas.",
      "Observa si el niño fija la mirada en la figura."
    ],
    evaluar: [
      "Adecuado: fija la mirada en figuras contrastantes.",
      "Requiere observación: observa solo por poco tiempo.",
      "Posible anomalía: no responde a contrastes o formas."
    ]
  },

  "Coordinación ojo-mano": {
    icono: "🧸",
    titulo: "Prueba de coordinación ojo-mano",
    objetivo: "Observar si el niño intenta alcanzar objetos que ve.",
    materiales: [
      "Juguete pequeño y seguro",
      "Superficie cómoda",
      "Acompañamiento de un adulto"
    ],
    pasos: [
      "Coloca un juguete visible frente al niño.",
      "Muévelo lentamente dentro de su campo visual.",
      "Observa si intenta tocarlo o alcanzarlo.",
      "Repite el ejercicio en ambos lados."
    ],
    evaluar: [
      "Adecuado: intenta alcanzar el objeto de forma coordinada.",
      "Requiere observación: intenta alcanzarlo con dificultad.",
      "Posible anomalía: no intenta alcanzar objetos visibles."
    ]
  }
};

async function cargarNinos() {
  const contenedor = document.getElementById("selectorNinosCards");

  const { data, error } = await supabase.rpc("paciente_mis_ninos");

  if (error) {
    console.error(error);
    contenedor.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  renderSelectorNinos(data || [], (ninoId) => {
    selectNino.value = ninoId;
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

selectTipo.addEventListener("change", () => {
  const tipo = selectTipo.value;

  if (!tipo || !pruebas[tipo]) {
    tituloPrueba.textContent = "Selecciona una prueba";
    contenidoPrueba.innerHTML = `
      <div class="test-empty">
        <i data-lucide="eye"></i>
        <p>Cuando selecciones una prueba, aquí aparecerán las instrucciones paso a paso.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const prueba = pruebas[tipo];

  tituloPrueba.textContent = prueba.titulo;

  contenidoPrueba.innerHTML = `
    <div class="test-icon">${prueba.icono}</div>

    <div class="test-section">
      <h3>Objetivo</h3>
      <p>${prueba.objetivo}</p>
    </div>

    <div class="test-section">
      <h3>Materiales</h3>
      <ul>
        ${prueba.materiales.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div class="test-section">
      <h3>Pasos para realizarla</h3>
      <ol>
        ${prueba.pasos.map(item => `<li>${item}</li>`).join("")}
      </ol>
    </div>

    <div class="test-section result-guide">
      <h3>Cómo interpretar el resultado</h3>
      <ul>
        ${prueba.evaluar.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
});

formPrueba.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nino_id = parseInt(document.getElementById("nino_id").value);
  const tipo_prueba = document.getElementById("tipo_prueba").value;
  const resultado = document.getElementById("resultado").value;
  const observaciones = document.getElementById("observaciones").value.trim();

  if (!nino_id || !tipo_prueba || !resultado) {
    mostrarMensaje("Completa los campos obligatorios.", "error");
    return;
  }

  mostrarMensaje("Guardando prueba visual...", "info");

  const { error } = await supabase
  .from("pruebas_visuales")
  .insert([
    {
      nino_id,
      realizado_por: user.id,
      rol_realizador: "tutor",
      tipo_prueba,
      resultado,
      observaciones
    }
  ]);

  if (error) {
    console.error(error);
    mostrarMensaje(error.message, "error");
    return;
  }

  mostrarMensaje("Prueba visual guardada correctamente.", "success");
  formPrueba.reset();
  document.querySelectorAll("#selectorNinosCards .child-card-select").forEach((c) => c.classList.remove("active"));

  tituloPrueba.textContent = "Selecciona una prueba";
  contenidoPrueba.innerHTML = `
    <div class="test-empty">
      <i data-lucide="eye"></i>
      <p>Cuando selecciones una prueba, aquí aparecerán las instrucciones paso a paso.</p>
    </div>
  `;
  lucide.createIcons();
});

cargarNinos();