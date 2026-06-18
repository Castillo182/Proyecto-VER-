import { supabase } from "../supabase.js";

const formNino = document.getElementById("formNino");
const mensaje = document.getElementById("mensaje");
const listaNinos = document.getElementById("listaNinos");
const tituloFormulario = document.getElementById("tituloFormulario");
const btnCancelar = document.getElementById("btnCancelar");

const inputId = document.getElementById("nino_id");
const inputNombre = document.getElementById("nombre");
const inputEdad = document.getElementById("edad_meses");
const inputGenero = document.getElementById("genero");
const inputHistorial = document.getElementById("historial_visual");

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

async function cargarNinos() {
  const { data, error } = await supabase
    .from("perfiles_ninos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    listaNinos.innerHTML = `<p>Error al cargar perfiles.</p>`;
    console.error(error);
    return;
  }

  if (data.length === 0) {
    listaNinos.innerHTML = `<p>No hay niños registrados todavía.</p>`;
    return;
  }

  listaNinos.innerHTML = "";

  data.forEach((nino) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${nino.nombre}</h3>
      <p><strong>Edad:</strong> ${nino.edad_meses} meses</p>
      <p><strong>Género:</strong> ${nino.genero}</p>
      <p><strong>Historial visual:</strong> ${nino.historial_visual || "Sin observaciones registradas"}</p>

      <div class="child-actions">
        <button class="btn-edit" data-id="${nino.id}">Editar</button>
        <button class="btn-delete" data-id="${nino.id}">Eliminar</button>
      </div>
    `;

    listaNinos.appendChild(item);
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => editarNino(btn.dataset.id));
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => eliminarNino(btn.dataset.id));
  });
}

async function editarNino(id) {
  const { data, error } = await supabase
    .from("perfiles_ninos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    mostrarMensaje("No se pudo cargar el perfil.", "error");
    return;
  }

  inputId.value = data.id;
  inputNombre.value = data.nombre;
  inputEdad.value = data.edad_meses;
  inputGenero.value = data.genero;
  inputHistorial.value = data.historial_visual || "";

  tituloFormulario.textContent = "Editar perfil del niño";
  btnCancelar.style.display = "block";
}

async function eliminarNino(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar este perfil?");

  if (!confirmar) return;

  const { error } = await supabase
    .from("perfiles_ninos")
    .delete()
    .eq("id", id);

  if (error) {
    mostrarMensaje("No se pudo eliminar el perfil.", "error");
    console.error(error);
    return;
  }

  mostrarMensaje("Perfil eliminado correctamente.", "success");
  cargarNinos();
}

formNino.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = inputId.value;
  const nombre = inputNombre.value.trim();
  const edad_meses = parseInt(inputEdad.value);
  const genero = inputGenero.value;
  const historial_visual = inputHistorial.value.trim();

  if (!nombre || edad_meses < 0 || edad_meses > 36 || !genero) {
    mostrarMensaje("Verifica los datos. La edad debe estar entre 0 y 36 meses.", "error");
    return;
  }

  if (id) {
    const { error } = await supabase
      .from("perfiles_ninos")
      .update({
        nombre,
        edad_meses,
        genero,
        historial_visual
      })
      .eq("id", id);

    if (error) {
      mostrarMensaje("No se pudo actualizar el perfil.", "error");
      console.error(error);
      return;
    }

    mostrarMensaje("Perfil actualizado correctamente.", "success");
  } else {
    const { error } = await supabase
      .from("perfiles_ninos")
      .insert([
        {
          usuario_id: user.id,
          nombre,
          edad_meses,
          genero,
          historial_visual
        }
      ]);

    if (error) {
      mostrarMensaje(error.message, "error");
      console.error(error);
      return;
    }

    mostrarMensaje("Perfil registrado correctamente.", "success");
  }

  formNino.reset();
  inputId.value = "";
  tituloFormulario.textContent = "Registrar niño";
  btnCancelar.style.display = "none";

  cargarNinos();
});

btnCancelar.addEventListener("click", () => {
  formNino.reset();
  inputId.value = "";
  tituloFormulario.textContent = "Registrar niño";
  btnCancelar.style.display = "none";
});

cargarNinos();