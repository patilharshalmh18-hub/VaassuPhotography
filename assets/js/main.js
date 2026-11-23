/* Vassu's Photography — site behaviour (no dependencies) */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const CONFIG = window.SITE_CONFIG || {};

  /* ---------- header: border on scroll ---------- */
  const header = $(".site-header");
  if (header) {
    // Over the full-frame hero the header stays transparent until the photo scrolls away.
    const heroEl = $(".has-hero .hero");
    const limit = () => (heroEl ? heroEl.offsetHeight - header.offsetHeight - 8 : 8);
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > limit());
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

  /* ---------- motion: scroll reveals + parallax ---------- */
  const root = document.documentElement;
  const MOTION = root.classList.contains("motion");
  window.__motionReady = true;

  // Reveal [data-reveal] elements as they scroll in; ones arriving together stagger.
  const revealer = (() => {
    if (!MOTION) return { observe() {}, replay() {} };
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e) => {
          const el = proxies.get(e.target) || e.target;
          proxies.delete(e.target);
          el.style.setProperty("--d", `${Math.min(n++ * 0.09, 0.54)}s`);
          el.classList.add("is-in");
          io.unobserve(e.target);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    // A fully clipped element has no visible area, so the observer would never
    // see it arrive: watch its parent instead.
    const proxies = new Map();
    const observe = (el) => {
      if (el.dataset.reveal === "img" && el.parentElement) {
        proxies.set(el.parentElement, el);
        io.observe(el.parentElement);
      } else io.observe(el);
    };
    // Hide again instantly, then let the observer bring it back in.
    const replay = (el) => {
      el.classList.add("no-anim");
      el.classList.remove("is-in");
      void el.offsetWidth;
      el.classList.remove("no-anim");
      observe(el);
    };
    return { observe, replay };
  })();

  // Parallax: oversized images drift gently against the scroll direction.
  if (MOTION) {
    const heroSlides = $(".hero__slides");
    const hero = $(".hero");
    $$(".shot, .kind__img").forEach((el) => el.classList.add("px"));
    const visible = new Set();
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      queue();
    }, { rootMargin: "15% 0px" });
    $$(".px").forEach((el) => vio.observe(el));

    let ticking = false;
    const frame = () => {
      ticking = false;
      const vh = window.innerHeight;
      const reads = [...visible].map((el) => {
        const r = el.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        return [el, Math.max(-1, Math.min(1, p))];
      });
      reads.forEach(([el, p]) => {
        const img = $("img", el);
        if (img) img.style.translate = `0 ${(p * -5).toFixed(2)}%`;
      });
      if (heroSlides && hero) {
        const p = Math.max(0, Math.min(1, window.scrollY / hero.offsetHeight));
        heroSlides.style.translate = `0 ${(p * 22).toFixed(2)}%`;
      }
    };
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    queue();
  }

  $$("[data-reveal]").forEach((el) => revealer.observe(el));

  /* ---------- recent moments: prints hanging on ribbons, swaying in a breeze ---------- */
  // Each print is a damped pendulum on its own ribbon. A travelling wind field
  // (steady breeze + turbulence + occasional gusts) pushes them; the print lags
  // behind its ribbon, twists on it, and casts a shadow on the wall behind.
  const strip = $(".strip");
  if (strip && root.classList.contains("js")) {
    const items = $$(".strip-item", strip);
    const still = !MOTION;
    const LABEL = { maternity: "Maternity", newborn: "Newborn", family: "Family", kids: "Kids & pets" };
    const BOW = `<svg class="print__bow" viewBox="0 0 44 28" aria-hidden="true"><path class="bow__tail" d="M20 13 L13 27 M24 13 L31 27"/><path d="M22 12 C14 1 3 3 5 12 C3 21 14 23 22 12 Z"/><path d="M22 12 C30 1 41 3 39 12 C41 21 30 23 22 12 Z"/><path class="bow__fold" d="M8 9 C12 8 17 10 20 12 M36 9 C32 8 27 10 24 12"/><ellipse cx="22" cy="12" rx="3.6" ry="4.2"/></svg>`;
    strip.classList.add("is-wall");
    const shadowLayer = document.createElement("div");
    shadowLayer.className = "wall__shadows";
    strip.prepend(shadowLayer);

    const nodes = items.map((a, i) => {
      const hang = document.createElement("div");
      hang.className = "hang";
      hang.innerHTML = `<svg class="hang__ribbon" aria-hidden="true"><path class="r1"/><path class="r2"/><ellipse class="knot" cx="0" cy="0" rx="5" ry="6.5"/></svg>`;
      const cat = (a.getAttribute("href").split("#")[1] || "");
      a.classList.add("print");
      a.insertAdjacentHTML("beforeend", `<span class="print__label" aria-hidden="true">${LABEL[cat] || ""}</span>${BOW}<span class="print__sheen" aria-hidden="true"></span>`);
      hang.appendChild(a);
      strip.appendChild(hang);
      const shadow = document.createElement("div");
      shadow.className = "hang__shadow";
      shadowLayer.appendChild(shadow);
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const rnd = seed - Math.floor(seed);
      return {
        i, a, hang, shadow, rnd,
        r1: $(".r1", hang), r2: $(".r2", hang),
        ang: (rnd - 0.5) * 0.12, va: 0, d: 0, vd: 0, tw: (rnd - 0.5) * 0.3, vt: 0, push: 0,
        px: 0, py: 0, L: 100, leff: 200, w: 180, h: 260, F: 0
      };
    });

    let rails = [];
    const layout = () => {
      const W = strip.clientWidth;
      const pw = Math.round(Math.max(128, Math.min(210, W * 0.17)));
      const ph = Math.round((pw - 20) * 1.25 + 52);
      const N = Math.min(nodes.length, Math.max(2, Math.floor((W - pw) / (pw * 0.55)) + 1));
      const rows = Math.ceil(nodes.length / N);
      const short = Math.round(ph * 0.1) + 26;
      const long = short + ph + 16;
      const rowH = 22 + long + ph + 56;
      rails.forEach((r) => r.remove());
      rails = [];
      for (let r = 0; r < rows; r++) {
        const rail = document.createElement("div");
        rail.className = "wall__rail";
        rail.style.top = `${r * rowH + 14}px`;
        strip.insertBefore(rail, shadowLayer.nextSibling);
        rails.push(rail);
      }
      nodes.forEach((n) => {
        const r = Math.floor(n.i / N);
        const c = n.i % N;
        const inRow = Math.min(N, nodes.length - r * N);
        n.px = inRow === 1 ? W / 2 : pw / 2 + ((W - pw) * c) / (inRow - 1);
        n.py = r * rowH + 18;
        n.L = (c % 2 ? long : short) + Math.round(n.rnd * 18);
        // long ribbons hang behind their short neighbours, as they would on a real rail
        n.hang.style.zIndex = c % 2 ? 2 : 3;
        n.w = pw; n.h = ph;
        n.leff = n.L + ph * 0.55;
        Object.assign(n.a.style, { width: `${pw}px`, left: `${-pw / 2}px`, top: `${n.L}px` });
        Object.assign(n.shadow.style, { width: `${pw}px`, height: `${ph}px`, left: `${-pw / 2}px` });
      });
      strip.style.height = `${rows * rowH}px`;
    };

    // wind: a steady breeze that wanders, travelling left to right, plus gusts
    const gusts = [];
    let nextGust = 3;
    const wind = (x, t) => {
      const u = t * 0.35 - x / 900;
      const n = (Math.sin(u * 2.1) + 0.5 * Math.sin(u * 3.7 + 1.3) + 0.3 * Math.sin(u * 7.3 + 0.7)) / 1.8;
      let f = 120 + 150 * n;
      for (const g of gusts) {
        const k = t - g.t0 - x / g.v;
        f += g.a * Math.exp(-(k * k) / (2 * g.s * g.s));
      }
      return f;
    };

    const G = 4200;
    const step = (dt, t) => {
      if (t > nextGust) {
        gusts.push({ t0: t, a: 180 + Math.random() * 300, v: 700 + Math.random() * 600, s: 0.35 + Math.random() * 0.5 });
        nextGust = t + 4 + Math.random() * 7;
      }
      while (gusts.length && t - gusts[0].t0 > 8) gusts.shift();
      for (const n of nodes) {
        const F = wind(n.px, t) + 70 * Math.sin(t * (1.1 + n.i * 0.23) + n.i * 1.7);
        n.F = F;
        // ribbon + print as one pendulum: gravity, air damping, wind
        const aa = -(G / n.leff) * Math.sin(n.ang) - 0.55 * n.va + (F * Math.cos(n.ang)) / n.leff + n.push;
        n.va += aa * dt;
        n.ang += n.va * dt;
        n.push *= Math.exp(-dt * 10);
        // the print hangs from a bow, so it trails the ribbon and catches more wind
        const ad = -70 * n.d - 5 * n.vd - aa * 1.5 + (F - 180) * 0.018;
        n.vd += ad * dt;
        n.d += n.vd * dt;
        // twisting on the ribbon
        const at = -8 * n.tw - 0.9 * n.vt + 1.6 * Math.sin(t * (0.7 + n.i * 0.11) + n.i * 2.3) + (F - 180) * 0.004 * (n.i % 2 ? 1 : -1);
        n.vt += at * dt;
        n.tw = Math.max(-0.7, Math.min(0.7, n.tw + n.vt * dt));
      }
    };

    const render = () => {
      for (const n of nodes) {
        n.hang.style.transform = `translate(${n.px.toFixed(1)}px,${n.py.toFixed(1)}px) rotate(${n.ang.toFixed(4)}rad)`;
        n.a.style.transform = `rotate(${n.d.toFixed(4)}rad) rotateY(${n.tw.toFixed(3)}rad)`;
        n.a.style.setProperty("--tw", n.tw.toFixed(3));
        // ribbon bows slightly with the wind and with the print's lag
        const cx = (-n.d * n.L * 0.9 + (n.F - 180) * 0.03).toFixed(1);
        const dpath = `M0 0 Q ${cx} ${(n.L * 0.5).toFixed(1)} 0 ${n.L}`;
        n.r1.setAttribute("d", dpath);
        n.r2.setAttribute("d", dpath);
        const ax = n.px - Math.sin(n.ang) * n.L;
        const ay = n.py + Math.cos(n.ang) * n.L;
        n.shadow.style.transform = `translate(${(ax + 12).toFixed(1)}px,${(ay + 22).toFixed(1)}px) rotate(${(n.ang + n.d).toFixed(4)}rad) scaleX(${Math.cos(n.tw).toFixed(3)})`;
      }
    };

    layout();
    render();
    new ResizeObserver(() => { layout(); render(); }).observe(strip);

    if (!still) {
      let running = false;
      let started = false;
      let last = 0;
      let t = 0;
      let acc = 0;
      const H = 1 / 120;
      const tick = (now) => {
        if (!running) return;
        acc += Math.min(0.05, (now - last) / 1000);
        last = now;
        while (acc >= H) { step(H, t); t += H; acc -= H; }
        render();
        requestAnimationFrame(tick);
      };
      new IntersectionObserver(([e]) => {
        running = e.isIntersecting;
        if (!running) return;
        if (!started) {
          started = true;
          // a first gust sweeps across as the wall comes into view
          gusts.push({ t0: t + 0.15, a: 520, v: 1000, s: 0.45 });
        }
        last = performance.now();
        requestAnimationFrame(tick);
      }, { rootMargin: "100px 0px" }).observe(strip);

      // brushing past a print with the pointer sets it swinging
      let lx = null;
      let lt = 0;
      strip.addEventListener("pointermove", (e) => {
        const now = performance.now();
        if (lx !== null && now > lt) {
          const vx = Math.max(-3000, Math.min(3000, ((e.clientX - lx) / (now - lt)) * 1000));
          const box = strip.getBoundingClientRect();
          const x = e.clientX - box.left;
          const y = e.clientY - box.top;
          for (const n of nodes) {
            const ax = n.px - Math.sin(n.ang) * n.L;
            const ay = n.py + Math.cos(n.ang) * n.L;
            if (x > ax - n.w / 2 && x < ax + n.w / 2 && y > ay && y < ay + n.h) {
              n.push = Math.max(-9, Math.min(9, n.push + (vx * 0.9) / n.leff));
              n.vt += vx * 0.0006 * (x < ax ? -1 : 1);
            }
          }
        }
        lx = e.clientX;
        lt = now;
      });
      strip.addEventListener("pointerleave", () => { lx = null; });
    }
  }

  /* ---------- camera intro ---------- */
  // The timeline itself is CSS; the inline <head> script marks it done after the
  // flash. Here: let people skip it, and tidy the overlay away afterwards.
  const intro = $("#intro");
  if (intro) {
    const finish = () => {
      clearTimeout(window.__introTimer);
      root.classList.add("intro-done");
    };
    $(".intro__skip", intro).addEventListener("click", finish);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") finish(); });
    const cleanup = () => setTimeout(() => intro.remove(), 1000);
    if (!root.classList.contains("intro")) intro.remove();
    else if (root.classList.contains("intro-done")) cleanup();
    else new MutationObserver((_, mo) => {
      if (root.classList.contains("intro-done")) { mo.disconnect(); cleanup(); }
    }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- hero carousel ---------- */
  const carousel = $(".hero[data-carousel]");
  if (carousel) {
    const slides = $$(".slide", carousel);
    const dots = $$(".hero__dot", carousel);
    const caption = $(".hero__caption", carousel);
    const count = $(".hero__count b", carousel);
    const pauseBtn = $(".hero__pause", carousel);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;

    const render = () => {
      dots.forEach((d, j) => {
        d.setAttribute("aria-current", String(j === i));
        d.classList.toggle("is-done", j < i);
      });
      const span = document.createElement("span");
      span.textContent = slides[i].dataset.caption || "";
      caption.replaceChildren(span);
      count.textContent = String(i + 1).padStart(2, "0");
    };

    const go = (n, dir = 1) => {
      n = (n + slides.length) % slides.length;
      if (n === i) return;
      const prev = slides[i];
      const next = slides[n];
      i = n;
      slides.forEach((s) => { if (s !== prev) s.classList.remove("is-leaving"); });
      prev.classList.remove("is-active", "is-entering");
      prev.classList.add("is-leaving");
      prev.setAttribute("aria-hidden", "true");
      next.dataset.dir = String(dir);
      next.classList.remove("is-leaving");
      next.classList.add("is-active");
      if (!still) next.classList.add("is-entering");
      next.removeAttribute("aria-hidden");
      setTimeout(() => { if (!prev.classList.contains("is-active")) prev.classList.remove("is-leaving"); }, 1800);
      // warm up the photo after this one so its sweep never shows a blank frame
      const after = $("img", slides[(i + 1) % slides.length]);
      if (after) after.loading = "eager";
      render();
    };

    slides.forEach((s) => s.addEventListener("animationend", (e) => {
      if (e.target === s && e.animationName.startsWith("wipe")) s.classList.remove("is-entering");
    }));
    // Each progress bar is a CSS animation; when the current one fills, move on.
    dots.forEach((d, j) => {
      $("span", d).addEventListener("animationend", () => { if (j === i) go(i + 1, 1); });
      d.addEventListener("click", () => go(j, j > i ? 1 : -1));
    });
    $(".hero__prev", carousel).addEventListener("click", () => go(i - 1, -1));
    $(".hero__next", carousel).addEventListener("click", () => go(i + 1, 1));

    const setPaused = (p) => {
      carousel.classList.toggle("is-paused", p);
      pauseBtn.setAttribute("aria-label", p ? "Play slideshow" : "Pause slideshow");
    };
    pauseBtn.addEventListener("click", () => setPaused(!carousel.classList.contains("is-paused")));
    if (still) setPaused(true);

    $(".hero__ui", carousel).addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(i - 1, -1);
      if (e.key === "ArrowRight") go(i + 1, 1);
    });
    let sx = null;
    carousel.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      sx = null;
    });
    render();
  }

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

    // Hover captions (decorative: the link already carries the description)
    const labels = Object.fromEntries(buttons.map((b) => [b.dataset.filter, b.textContent.trim()]));
    shots.forEach((s) => {
      const a = $("a", s);
      const alt = $("img", s).alt;
      a.insertAdjacentHTML("beforeend",
        `<span class="shot__zoom" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5M7 4.5v5M4.5 7h5"/></svg></span>` +
        `<span class="shot__cap" aria-hidden="true"><span class="shot__tag"></span><span class="shot__alt"></span></span>`);
      $(".shot__tag", a).textContent = labels[s.dataset.cat] || "";
      $(".shot__alt", a).textContent = alt;
      if (MOTION) { s.setAttribute("data-reveal", ""); revealer.observe(s); }
    });
    // Hover depth: the focused photo tilts toward the pointer, a glare follows it,
    // and the darkened backdrop keeps a pool of light centred on it.
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      let cur = null;
      gallery.addEventListener("pointermove", (e) => {
        const s = e.target.closest(".shot");
        if (!s) return;
        if (cur && cur !== s) { cur.style.removeProperty("--rx"); cur.style.removeProperty("--ry"); }
        cur = s;
        const r = s.getBoundingClientRect();
        const fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        const fy = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        s.style.setProperty("--rx", `${((0.5 - fy) * 9).toFixed(2)}deg`);
        s.style.setProperty("--ry", `${((fx - 0.5) * 11).toFixed(2)}deg`);
        s.style.setProperty("--gx", `${(fx * 100).toFixed(1)}%`);
        s.style.setProperty("--gy", `${(fy * 100).toFixed(1)}%`);
        gallery.style.setProperty("--mx", `${(r.left + r.width / 2).toFixed(0)}px`);
        gallery.style.setProperty("--my", `${(r.top + r.height / 2).toFixed(0)}px`);
      });
      gallery.addEventListener("pointerleave", () => {
        if (cur) { cur.style.removeProperty("--rx"); cur.style.removeProperty("--ry"); cur = null; }
      });
    }

    buttons.forEach((b) => {
      const f = b.dataset.filter;
      const n = f === "all" ? shots.length : shots.filter((s) => s.dataset.cat === f).length;
      b.insertAdjacentHTML("beforeend", `<span class="count">${n}</span>`);
    });
    const apply = (f, push) => {
      if (!buttons.some((b) => b.dataset.filter === f)) f = "all";
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
      shots.forEach((s) => { s.hidden = f !== "all" && s.dataset.cat !== f; });
      if (push) {
        history.replaceState(null, "", f === "all" ? location.pathname : `#${f}`);
        if (MOTION) shots.filter((s) => !s.hidden).forEach((s) => revealer.replay(s));
      }
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

    img.addEventListener("load", () => img.classList.add("is-in"));
    const show = (dir = 0) => {
      const a = list[idx];
      const thumb = $("img", a);
      img.classList.remove("is-in");
      img.style.setProperty("--dx", dir);
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
    const step = (d) => { idx = (idx + d + list.length) % list.length; show(d); };

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
