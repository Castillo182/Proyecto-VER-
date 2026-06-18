async function cargarComponente(id, archivo) {

    try {

        const respuesta = await fetch(archivo);

        const html = await respuesta.text();

        document.getElementById(id).innerHTML = html;

    }

    catch(error){

        console.error(
            `Error cargando ${archivo}`,
            error
        );
    }
}

async function iniciarPagina() {

    await cargarComponente(
        "navbar",
        "components/navbar.html"
    );

    await cargarComponente(
        "hero",
        "components/hero.html"
    );

    await cargarComponente(
        "features",
        "components/features.html"
    );

    await cargarComponente(
        "dashboard",
        "components/dashboard.html"
    );

    await cargarComponente(
        "footer",
        "components/footer.html"
    );

    lucide.createIcons();
}

iniciarPagina();