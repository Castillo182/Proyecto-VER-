import { supabase } from "../supabase.js";

const listaUsuarios = document.getElementById("listaUsuarios");
const logout = document.getElementById("logout");

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

async function verificarAdmin() {
  const { data: perfil, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (error || !perfil || perfil.rol !== "admin") {
    window.location.href = "dashboard.html";
  }
}

async function cargarUsuarios() {
  const { data, error } = await supabase.rpc("admin_listar_usuarios");

  if (error) {
    listaUsuarios.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaUsuarios.innerHTML = "<p>No hay usuarios registrados.</p>";
    return;
  }

  listaUsuarios.innerHTML = "";

  data.forEach((usuario) => {
    const item = document.createElement("div");
    item.className = "child-item";

    item.innerHTML = `
      <h3>${usuario.nombre}</h3>
      <p><strong>Rol:</strong> ${usuario.rol}</p>
      <p><strong>Estado:</strong> ${usuario.estado}</p>
      <p><strong>Especialidad:</strong> ${usuario.especialidad || "No aplica"}</p>
    `;

    listaUsuarios.appendChild(item);
  });
}

if (logout) logout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

await verificarAdmin();
cargarUsuarios();