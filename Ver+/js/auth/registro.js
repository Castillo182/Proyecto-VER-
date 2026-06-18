import { supabase } from "../supabase.js";

const formRegistro = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

const rolSelect = document.getElementById("rol");
const camposDoctor = document.getElementById("camposDoctor");
const especialidadInput = document.getElementById("especialidad");
const cedulaInput = document.getElementById("cedula");

rolSelect.addEventListener("change", () => {
  if (rolSelect.value === "doctor") {
    camposDoctor.style.display = "block";
    especialidadInput.required = true;
    cedulaInput.required = true;
  } else {
    camposDoctor.style.display = "none";
    especialidadInput.required = false;
    cedulaInput.required = false;
    especialidadInput.value = "";
    cedulaInput.value = "";
  }
});

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `auth-message show ${tipo}`;
}

formRegistro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const rol = rolSelect.value;
  const especialidad = especialidadInput.value.trim();
  const cedula_profesional = cedulaInput.value.trim();

  if (!nombre || !email || !password || !rol) {
    mostrarMensaje("Completa todos los campos para continuar.", "error");
    return;
  }

  if (rol === "doctor" && (!especialidad || !cedula_profesional)) {
    mostrarMensaje("Completa los datos profesionales para registrarte como doctor.", "error");
    return;
  }

  mostrarMensaje("Creando tu cuenta...", "info");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        rol
      }
    }
  });

  if (error) {
    console.error("Error de registro:", error);
    mostrarMensaje(error.message, "error");
    return;
  }

  const user = data.user;

  if (!user) {
    mostrarMensaje("No se pudo obtener el usuario registrado.", "error");
    return;
  }

  const estado = rol === "doctor" ? "pendiente" : "aprobado";

  const { error: perfilError } = await supabase
    .from("usuarios")
    .insert([
      {
        id: user.id,
        nombre,
        rol,
        estado,
        especialidad: rol === "doctor" ? especialidad : null,
        cedula_profesional: rol === "doctor" ? cedula_profesional : null
      }
    ]);

  if (perfilError) {
    console.error("Error al crear perfil:", perfilError);
    mostrarMensaje(perfilError.message, "error");
    return;
  }

  if (rol === "doctor") {
    mostrarMensaje("Cuenta profesional creada. Quedará pendiente de aprobación por un administrador.", "success");
  } else {
    mostrarMensaje("Cuenta creada correctamente. Ahora puedes iniciar sesión.", "success");
  }

  formRegistro.reset();
  camposDoctor.style.display = "none";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 2000);
});