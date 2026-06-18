import { supabase } from "../supabase.js";

const form = document.getElementById("formAdminPerfil");
const mensaje = document.getElementById("mensaje");
const logout = document.getElementById("logout");

const inputNombre = document.getElementById("nombre");
const inputTelefono = document.getElementById("telefono");
const inputRol = document.getElementById("rol");

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

const { data: perfil, error } = await supabase
  .from("usuarios")
  .select("*")
  .eq("id", user.id)
  .single();

if (error || !perfil || perfil.rol !== "admin") {
  window.location.href = "dashboard.html";
}

inputNombre.value = perfil.nombre || "";
inputTelefono.value = perfil.telefono || "";
inputRol.value = perfil.rol;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const telefono = inputTelefono.value.trim();

  const { error: updateError } = await supabase
    .from("usuarios")
    .update({
      nombre,
      telefono
    })
    .eq("id", user.id);

  if (updateError) {
    mostrarMensaje(updateError.message, "error");
    return;
  }

  mostrarMensaje("Perfil actualizado correctamente.", "success");
});

if (logout) logout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});