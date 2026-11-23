/* Vassu's Photography — site behaviour (no dependencies) */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const CONFIG = window.SITE_CONFIG || {};

  /* ---------- header: border on scroll ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  const toggle = $(".menu-toggle");
  if (toggle) {
    const setOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    $$(".nav a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- contact links from config ---------- */
  const reach = $("#reach");
  if (reach) {
    const items = [];
    if (CONFIG.email) items.push(`Email <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`);
    if (CONFIG.phone) items.push(`Phone <a href="tel:${CONFIG.phone.replace(/\s/g, "")}">${CONFIG.phone}</a>`);
    if (CONFIG.whatsapp) items.push(`WhatsApp <a href="https://wa.me/${CONFIG.whatsapp}">Send a message</a>`);
    if (CONFIG.instagram) items.push(`Instagram <a href="https://instagram.com/${CONFIG.instagram.replace("@", "")}">@${CONFIG.instagram.replace("@", "")}</a>`);
    reach.innerHTML = items.map((i) => `<li>${i}</li>`).join("");
    reach.hidden = items.length === 0;
  }

  /* ---------- portfolio: filters ---------- */
  const gallery = $("#gallery");
  if (gallery) {
    const shots = $$(".shot", gallery);
    const buttons = $$(".filters button");
    buttons.forEach((b) => {
      const f = b.dataset.filter;
      const n = f === "all" ? shots.length : shots.filter((s) => s.dataset.cat === f).length;
      b.insertAdjacentHTML("beforeend", `<span class="count">${n}</span>`);
    });
    const apply = (f, push) => {
      if (!buttons.some((b) => b.dataset.filter === f)) f = "all";
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
      shots.forEach((s) => { s.hidden = f !== "all" && s.dataset.cat !== f; });
      if (push) history.replaceState(null, "", f === "all" ? location.pathname : `#${f}`);
      $("#gallery-status").textContent = `Showing ${shots.filter((s) => !s.hidden).length} photos`;
    };
    buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter, true)));
    apply(location.hash.slice(1) || "all", false);
    window.addEventListener("hashchange", () => apply(location.hash.slice(1) || "all", false));

    /* ---------- lightbox ---------- */
    const lb = $("#lightbox");
    const img = $("img", lb);
    const caption = $(".lightbox__caption", lb);
    const counter = $(".lightbox__count", lb);
    let list = [];
    let idx = 0;
    let lastFocus = null;

    const show = () => {
      const a = list[idx];
      const thumb = $("img", a);
      img.src = a.getAttribute("href");
      img.alt = thumb.alt;
      caption.textContent = thumb.alt;
      counter.textContent = `${idx + 1} of ${list.length}`;
      // preload neighbours
      [idx + 1, idx - 1].forEach((j) => {
        const n = list[(j + list.length) % list.length];
        if (n) new Image().src = n.getAttribute("href");
      });
    };
    const open = (a) => {
      list = $$(".shot:not([hidden]) a", gallery);
      idx = Math.max(0, list.indexOf(a));
      lastFocus = a;
      show();
      lb.showModal();
    };
    const step = (d) => { idx = (idx + d + list.length) % list.length; show(); };

    gallery.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();
      open(a);
    });
    $(".lightbox__close", lb).addEventListener("click", () => lb.close());
    $(".lightbox__prev", lb).addEventListener("click", () => step(-1));
    $(".lightbox__next", lb).addEventListener("click", () => step(1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lightbox__stage")) lb.close(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    lb.addEventListener("close", () => { img.removeAttribute("src"); lastFocus && lastFocus.focus(); });
    let tx = null;
    lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
      tx = null;
    });
  }

  /* ---------- packages → contact: preselect session ---------- */
  const form = $("#enquiry");
  if (form) {
    const params = new URLSearchParams(location.search);
    const session = params.get("session");
    if (session && form.session) {
      const opt = [...form.session.options].find((o) => o.value === session);
      if (opt) form.session.value = session;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (form.date) form.date.min = today;

    const notice = $("#notice");
    const setError = (field, msg) => {
      const err = $(`#${field.id}-error`);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
    };
    const validate = () => {
      let first = null;
      const name = form.name;
      const reachField = form.reach;
      if (!name.value.trim()) { setError(name, "Enter your name so I know who to reply to."); first = first || name; }
      else setError(name, "");
      const r = reachField.value.trim();
      const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r);
      const looksPhone = /^[+\d][\d\s()-]{6,}$/.test(r);
      if (!r) { setError(reachField, "Add an email or phone number so I can reply."); first = first || reachField; }
      else if (!looksEmail && !looksPhone) { setError(reachField, "That doesn't look like an email or phone number."); first = first || reachField; }
      else setError(reachField, "");
      if (first) first.focus();
      return !first;
    };
    const summary = () => {
      const d = form.date.value;
      const msg = form.message.value.trim();
      const lines = [
        "Hi Vaishnavi,",
        "",
        `I'd love to book a ${form.session.value.toLowerCase()}.`,
        "",
        `Name: ${form.name.value.trim()}`,
        `Contact: ${form.reach.value.trim()}`
      ];
      if (d) lines.push(`Preferred date: ${new Date(d).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}`);
      if (msg) lines.push("", msg);
      return lines.join("\n");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.website && form.website.value) return; // spam honeypot
      if (!validate()) return;
      const btn = $("button[type=submit]", form);
      const text = summary();

      if (CONFIG.formEndpoint) {
        btn.disabled = true;
        btn.textContent = "Sending…";
        try {
          const reachValue = form.reach.value.trim();
          const payload = {
            Name: form.name.value.trim(),
            "Email or phone": reachValue,
            Session: form.session.value,
            "Preferred date": form.date.value || "Not given",
            Message: form.message.value.trim() || "—",
            _subject: `New enquiry: ${form.session.value} – ${form.name.value.trim()}`,
            _template: "table",
            _captcha: "false"
          };
          if (reachValue.includes("@")) payload._replyto = reachValue;
          const res = await fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || String(data.success) === "false") throw new Error(data.message || String(res.status));
          form.hidden = true;
          notice.innerHTML = `<h3>Enquiry sent</h3><p>Thank you, ${form.name.value.trim().split(" ")[0]}. I'll reply within two days to talk dates and ideas.</p>`;
          notice.hidden = false;
          notice.focus();
        } catch {
          btn.disabled = false;
          btn.textContent = "Send enquiry";
          showFallback(text, "The form couldn't send just now. Copy your message below and send it directly instead.");
        }
        return;
      }
      showFallback(text, "Your message is ready. Send it with one of the options below.");
    });

    function showFallback(text, intro) {
      form.hidden = true;
      const subject = encodeURIComponent(`Photography enquiry – ${form.name.value.trim()}`);
      const body = encodeURIComponent(text);
      const actions = [`<button class="btn" type="button" id="copy-msg">Copy message</button>`];
      if (CONFIG.email) actions.push(`<a class="btn btn--line" href="mailto:${CONFIG.email}?subject=${subject}&body=${body}">Open in email</a>`);
      if (CONFIG.whatsapp) actions.push(`<a class="btn btn--line" href="https://wa.me/${CONFIG.whatsapp}?text=${body}">Send on WhatsApp</a>`);
      notice.innerHTML = `<h3>Almost there</h3><p>${intro}</p><pre></pre><div class="btn-row">${actions.join("")}</div>`;
      $("pre", notice).textContent = text;
      notice.hidden = false;
      notice.focus();
      $("#copy-msg").addEventListener("click", async (ev) => {
        try { await navigator.clipboard.writeText(text); ev.target.textContent = "Copied"; }
        catch { ev.target.textContent = "Select the text above to copy"; }
      });
    }
  }
})();
