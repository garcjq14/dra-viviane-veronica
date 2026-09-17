(function () {
  const cfg = window.SITE_CONFIG || {};

  function initSeoIntegrations() {
    const gsc = (cfg.gscVerification || "").trim();
    if (gsc) {
      const meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = gsc;
      document.head.appendChild(meta);
    }

    const gaId = (cfg.gaMeasurementId || "").trim();
    if (!gaId) return;

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", gaId);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
    document.head.appendChild(script);
  }

  initSeoIntegrations();

  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const faqItems = document.querySelectorAll(".faq-item");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-question");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqItems.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const quotesTrack = document.querySelector(".quotes__track");
  if (quotesTrack) {
    const prev = document.querySelector(".quotes__nav--prev");
    const next = document.querySelector(".quotes__nav--next");
    if (prev) {
      prev.addEventListener("click", () => {
        const last = quotesTrack.lastElementChild;
        if (last) quotesTrack.insertBefore(last, quotesTrack.firstElementChild);
      });
    }
    if (next) {
      next.addEventListener("click", () => {
        const first = quotesTrack.firstElementChild;
        if (first) quotesTrack.appendChild(first);
      });
    }
  }

  const form = document.getElementById("contato-form");
  if (form) {
    const fields = {
      nome: form.querySelector("#nome"),
      telefone: form.querySelector("#telefone"),
      email: form.querySelector("#email"),
      mensagem: form.querySelector("#mensagem"),
      aceite: form.querySelector("#aceite"),
    };

    function setError(field, message) {
      const wrap = field.closest(".form-field");
      if (!wrap) return;
      wrap.classList.add("is-invalid");
      const err = wrap.querySelector(".form-field__error");
      if (err) err.textContent = message;
      field.setAttribute("aria-invalid", "true");
    }

    function clearError(field) {
      const wrap = field.closest(".form-field");
      if (!wrap) return;
      wrap.classList.remove("is-invalid");
      const err = wrap.querySelector(".form-field__error");
      if (err) err.textContent = "";
      field.removeAttribute("aria-invalid");
    }

    function onlyDigits(value) {
      return String(value || "").replace(/\D/g, "");
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
    }

    function validate() {
      let ok = true;
      Object.values(fields).forEach((f) => f && clearError(f));

      if (!fields.nome.value.trim() || fields.nome.value.trim().length < 2) {
        setError(fields.nome, "Informe seu nome completo.");
        ok = false;
      }

      const phone = onlyDigits(fields.telefone.value);
      if (phone.length < 10 || phone.length > 11) {
        setError(fields.telefone, "Informe um WhatsApp válido com DDD.");
        ok = false;
      }

      if (fields.email.value.trim() && !isValidEmail(fields.email.value)) {
        setError(fields.email, "E-mail inválido. Deixe em branco ou corrija.");
        ok = false;
      }

      if (!fields.mensagem.value.trim() || fields.mensagem.value.trim().length < 10) {
        setError(fields.mensagem, "Escreva uma mensagem com pelo menos 10 caracteres.");
        ok = false;
      }

      if (!fields.aceite.checked) {
        setError(fields.aceite, "É necessário aceitar a Política de Privacidade.");
        ok = false;
      }

      return ok;
    }

    Object.values(fields).forEach((field) => {
      if (!field) return;
      const eventName = field.type === "checkbox" ? "change" : "input";
      field.addEventListener(eventName, () => clearError(field));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate()) {
        const firstInvalid = form.querySelector(".is-invalid input, .is-invalid textarea, .is-invalid");
        firstInvalid?.querySelector?.("input, textarea")?.focus?.() ||
          form.querySelector(".is-invalid input, .is-invalid textarea")?.focus();
        return;
      }

      const wa = (cfg.whatsapp || "5534992665656").replace(/\D/g, "");
      const nome = fields.nome.value.trim();
      const telefone = fields.telefone.value.trim();
      const email = fields.email.value.trim();
      const mensagem = fields.mensagem.value.trim();
      const text = [
        "Olá, gostaria de agendar uma consulta com a Dra. Viviane Verônica.",
        "",
        "Nome: " + nome,
        "Telefone: " + telefone,
        email ? "E-mail: " + email : null,
        "",
        "Mensagem:",
        mensagem,
      ]
        .filter(Boolean)
        .join("\n");

      window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
      form.reset();
      Object.values(fields).forEach((f) => f && clearError(f));
    });
  }
})();
