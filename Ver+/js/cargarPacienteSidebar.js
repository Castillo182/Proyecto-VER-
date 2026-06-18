async function cargarPacienteSidebar() {
  const contenedor = document.getElementById("pacienteSidebar");

  if (!contenedor) return;

  const respuesta = await fetch("components/paciente_sidebar.html");
  const html = await respuesta.text();

  contenedor.innerHTML = html;

  const paginaActual = document.body.dataset.page;

  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    if (link.dataset.page === paginaActual) {
      link.classList.add("active");
    }
  });

  const logout = document.getElementById("logout");

  if (logout) {
    logout.addEventListener("click", async () => {
      const { supabase } = await import("./supabase.js");
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }

  lucide.createIcons();
}

cargarPacienteSidebar();