import { supabase } from "../supabase.js";

const form = document.getElementById("formRegistroDoctor");
const mensaje = document.getElementById("mensaje");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `auth-message show ${tipo}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const especialidad = document.getElementById("especialidad").value.trim();
  const cedula_profesional = document.getElementById("cedula").value.trim();

  mostrarMensaje("Creando cuenta profesional...", "info");

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    mostrarMensaje(error.message, "error");
    return;
  }

  const user = data.user;

  const { error: perfilError } = await supabase
    .from("usuarios")
    .insert([
      {
        id: user.id,
        nombre,
        rol: "doctor",
        especialidad,
        cedula_profesional,
        estado: "pendiente"
      }
    ]);

  if (perfilError) {
    mostrarMensaje(perfilError.message, "error");
    return;
  }

  mostrarMensaje("Cuenta profesional creada correctamente.", "success");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
});