(function () {
  const form = document.getElementById("zenixContactForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  const startedAt = form.querySelector('input[name="_startedAt"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton ? submitButton.textContent : "Enviar consulta →";

  function refreshStartedAt() {
    if (startedAt) startedAt.value = String(Date.now());
  }

  refreshStartedAt();

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }
    status.textContent = "";

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const response = await fetch("/api/contact", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo enviar la consulta.");
      }

      status.textContent = "Consulta enviada. Te respondemos a la brevedad.";
      form.reset();
      refreshStartedAt();
    } catch (error) {
      status.textContent = error && error.message
        ? error.message
        : "No se pudo enviar desde el formulario. Podés usar el botón de email.";
      refreshStartedAt();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
})();
