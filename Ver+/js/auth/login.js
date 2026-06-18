import { supabase } from "../supabase.js";

const formLogin = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `auth-message show ${tipo}`;
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    mostrarMensaje("Ingresa tu correo y contraseña.", "error");
    return;
  }

  mostrarMensaje("Verificando credenciales...", "info");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);

    if (error.message.includes("Email not confirmed")) {
      mostrarMensaje("Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.", "error");
    } else {
      mostrarMensaje("Correo o contraseña incorrectos.", "error");
    }

    return;
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("usuarios")
    .select("rol, estado")
    .eq("id", data.user.id)
    .single();

  if (perfilError || !perfil) {
  console.error("Perfil error:", perfilError);
  mostrarMensaje(perfilError.message, "error");
  return;
}

  if (perfil.rol === "doctor" && perfil.estado !== "aprobado") {
    mostrarMensaje("Tu cuenta profesional está pendiente de aprobación por un administrador.", "error");
    await supabase.auth.signOut();
    return;
  }

  mostrarMensaje("Inicio de sesión correcto. Redirigiendo...", "success");

  setTimeout(() => {
    if (perfil.rol === "admin") {
      window.location.href = "admin_dashboard.html";
    } else if (perfil.rol === "doctor") {
      window.location.href = "doctor_dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  }, 1000);
});