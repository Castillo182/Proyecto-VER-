import { supabase } from "../supabase.js";

const formHorario = document.getElementById("formHorario");
const listaHorarios = document.getElementById("listaHorarios");
const mensaje = document.getElementById("mensaje");

const {
  data: { user }
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "login.html";
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `auth-message show ${tipo}`;
}

async function cargarHorarios() {
  const { data, error } = await supabase.rpc("doctor_mis_horarios");

  if (error) {
    listaHorarios.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaHorarios.innerHTML = `<p>No tienes horarios registrados.</p>`;
    return;
  }

  listaHorarios.innerHTML = "";

  data.forEach((h) => {
    const item = document.createElement("div");
    item.className = "timeline-item";

    item.innerHTML = `
      <h3>${formatearFecha(h.fecha)}</h3>
      <p><strong>Horario:</strong> ${h.hora_inicio} - ${h.hora_fin}</p>
      <p><strong>Estado:</strong> ${h.disponible ? "Disponible" : "Ocupado"}</p>
      ${
        h.disponible
          ? `<button class="btn-delete" data-id="${h.id}">Eliminar</button>`
          : ``
      }
    `;

    listaHorarios.appendChild(item);
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => eliminarHorario(btn.dataset.id));
  });
}

formHorario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fecha = document.getElementById("fecha").value;
  const hora_inicio = document.getElementById("hora_inicio").value;
  const hora_fin = document.getElementById("hora_fin").value;

  if (hora_fin <= hora_inicio) {
    mostrarMensaje("La hora final debe ser mayor a la hora inicial.", "error");
    return;
  }

  const { error } = await supabase.rpc("doctor_crear_horario", {
    fecha_param: fecha,
    hora_inicio_param: hora_inicio,
    hora_fin_param: hora_fin
  });

  if (error) {
    mostrarMensaje(error.message, "error");
    return;
  }

  mostrarMensaje("Horario registrado correctamente.", "success");
  formHorario.reset();
  cargarHorarios();
});

async function eliminarHorario(id) {
  if (!confirm("¿Eliminar este horario disponible?")) return;

  const { error } = await supabase.rpc("doctor_eliminar_horario", {
    horario_id_param: parseInt(id)
  });

  if (error) {
    alert(error.message);
    return;
  }

  cargarHorarios();
}

function formatearFecha(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

cargarHorarios();