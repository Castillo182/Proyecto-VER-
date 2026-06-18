document.addEventListener("DOMContentLoaded", () => {
  iniciarIndex();
});

function iniciarIndex() {
  esperarComponentes(() => {
    activarIconos();
    activarScrollInterno();
    activarBotonesIndex();
    activarMenuMovil();
  });
}

function esperarComponentes(callback) {
  let intentos = 0;

  const intervalo = setInterval(() => {
    const navbar = document.getElementById("navbar")?.children.length > 0;
    const hero = document.getElementById("hero")?.children.length > 0;
    const features = document.getElementById("features")?.children.length > 0;
    const dashboard = document.getElementById("dashboard")?.children.length > 0;
    const footer = document.getElementById("footer")?.children.length > 0;

    intentos++;

    if ((navbar && hero && features && dashboard && footer) || intentos > 20) {
      clearInterval(intervalo);
      callback();
    }
  }, 100);
}

function activarIconos() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function activarScrollInterno() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      const target = document.querySelector(id);

      if (!target) return;

      e.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      cerrarMenuMovil();
    });
  });
}

function activarBotonesIndex() {
  document.querySelectorAll("a, button").forEach((elemento) => {
    const texto = elemento.textContent.trim().toLowerCase();

    if (texto.includes("comenzar") || texto.includes("crear cuenta")) {
      elemento.addEventListener("click", () => {
        window.location.href = "registro.html";
      });
    }

    if (texto.includes("iniciar sesión")) {
      elemento.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }

    if (texto.includes("ver demo")) {
      elemento.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector("#dashboard-demo")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  });
}

function activarMenuMovil() {
  const menuBtn = document.getElementById("menuToggle");
  const nav = document.querySelector(".navbar-menu, .home-nav, nav");

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("show");
  });
}

function cerrarMenuMovil() {
  const nav = document.querySelector(".navbar-menu, .home-nav, nav");

  if (nav) {
    nav.classList.remove("show");
  }
}