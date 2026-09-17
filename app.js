/* Antikythera shipwreck gallery — client-side search, filters, modal. */
(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.querySelector("[data-theme-toggle]");
  var rootEl = document.documentElement;
  var theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  rootEl.setAttribute("data-theme", theme);
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      theme = theme === "dark" ? "light" : "dark";
      rootEl.setAttribute("data-theme", theme);
      themeBtn.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
      themeBtn.innerHTML = theme === "dark"
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });
  }

  /* ---------- Helpers ---------- */
  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function commonsPage(file) {
    return "https://commons.wikimedia.org/wiki/File:" + file.replace(/ /g, "_");
  }
  function commonsThumb(file, w) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file) + "?width=" + (w || 640);
  }
  function external(a, url, label) {
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  }
  var STATUS_LABEL = {
    "high-res": "high-res image",
    "moderate": "image (moderate res)",
    "photo at source": "photo at source page",
    none: "no image located"
  };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function link(href, cls, text) {
    var a = document.createElement("a");
    external(a, href);
    if (cls) a.className = cls;
    a.textContent = text;
    return a;
  }

  /* ---------- Build page data ---------- */
  var data = ARTIFACTS.map(function (a) {
    var d = Object.assign({}, a);
    d.search = norm([a.name, a.inv, a.group, a.matDetail, a.notes, MATERIAL_LABELS[a.material]].join(" "));
    return d;
  });
  var totalCount = data.length;

  /* ---------- State ---------- */
  var state = { q: "", cat: "all", mat: "all", campaign: "all" };

  /* ---------- Gallery DOM ---------- */
  var galleryRoot = document.getElementById("gallery-root");
  var sections = {};

  CATEGORIES.forEach(function (cat) {
    var sec = el("section", "cat-section");
    sec.id = "cat-" + cat.id;
    var head = el("header");
    var eyebrow = el("div", "cat-eyebrow");
    eyebrow.appendChild(el("span", null, "Part " + (CATEGORIES.indexOf(cat) + 1) + " of " + CATEGORIES.length));
    eyebrow.appendChild(el("span", "cat-count"));
    head.appendChild(eyebrow);
    head.appendChild(el("h2", null, cat.label));
    head.appendChild(el("p", "cat-blurb", cat.blurb));
    sec.appendChild(head);
    var count = el("input", "sr-only");
    count.type = "hidden";
    sections[cat.id] = { sec: sec, head: head, countEl: eyebrow.querySelector(".cat-count"), groups: {} };
    galleryRoot.appendChild(sec);
  });

  data.forEach(function (a) {
    var s = sections[a.cat];
    if (!s.sec.querySelector("#grp-" + a.cat + "-" + norm(a.group).replace(/[^a-z0-9]+/g, "-"))) {
      var gh = el("h3", "group-header");
      gh.id = "grp-" + a.cat + "-" + norm(a.group).replace(/[^a-z0-9]+/g, "-");
      gh.appendChild(el("span", null, a.group));
      gh.appendChild(el("span", "g-count"));
      s.sec.appendChild(gh);
      s.groups[a.group] = { el: gh, cards: [] };
    }
    s.groups[a.group].cards.push(a);
  });

  /* ---------- Card rendering ---------- */
  function cardFor(a) {
    var card = el("article", "card");
    card.dataset.id = a.id;

    var media = el("div", "card-media");
    var camp = el("span", "card-campaign", CAMPAIGN_LABELS[a.campaign]);
    media.appendChild(camp);

    var hasImg = a.imgKind === "commons" || a.imgKind === "local" || a.imgKind === "external";
    if (hasImg) {
      var img = el("img");
      img.loading = "lazy"; img.decoding = "async";
      img.alt = a.imgAlt || a.name;
      if (a.imgKind === "commons") { img.src = commonsThumb(a.imgFile, 640); }
      else if (a.imgKind === "local") { img.src = a.imgSrc; }
      else { img.src = a.imgSrc; }
      img.onerror = function () {
        var ph = placeholderFor(a);
        media.replaceChild(ph, img);
      };
      media.appendChild(img);
    } else {
      media.appendChild(placeholderFor(a));
    }

    var body = el("div", "card-body");
    var titleBtn = el("button", "card-title-btn", a.name);
    titleBtn.setAttribute("aria-haspopup", "dialog");
    titleBtn.addEventListener("click", function () { openModal(a); });
    body.appendChild(titleBtn);

    var meta = el("div", "card-meta");
    meta.appendChild(el("span", "badge inv", a.inv ? a.inv.replace(/^NAM (Xρ?\.? ?)?/, "") : "n.a."));
    meta.appendChild(el("span", "badge mat", MATERIAL_LABELS[a.material]));
    meta.appendChild(el("span", "badge", a.date));
    body.appendChild(meta);

    var links = el("div", "card-links");
    if (a.imgKind === "commons") {
      links.appendChild(link(commonsPage(a.imgFile), null, "High-res image \u2197"));
    } else if (a.imgStatus === "high-res" && a.imgLink && a.imgKind !== null) {
      links.appendChild(link(a.imgLink, null, "High-res image \u2197"));
    } else if (a.imgLink) {
      links.appendChild(link(a.imgLink, null, "Photo at source \u2197"));
    }
    var status = el("span", "status-note", STATUS_LABEL[a.imgStatus]);
    links.appendChild(status);
    body.appendChild(links);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function placeholderFor(a) {
    var ph = el("div", "media-placeholder");
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", a.imgAlt || a.name + " — no image available");
    ph.innerHTML =
      '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
      '<path d="M8 3c-1.5 3-1.5 6 0 9s1.5 6 0 9M16 3c-1.5 3-1.5 6 0 9s1.5 6 0 9M12 4v16" stroke-linecap="round"/></svg>';
    ph.appendChild(el("span", null, "No open-licence image located"));
    return ph;
  }

  /* Append cards to group containers */
  Object.keys(sections).forEach(function (catId) {
    var s = sections[catId];
    Object.keys(s.groups).forEach(function (g) {
      var grp = s.groups[g];
      var grid = el("div", "card-grid");
      grp.cards.forEach(function (a) {
        a._card = cardFor(a);
        grid.appendChild(a._card);
      });
      grp.el.insertAdjacentElement("afterend", grid);
      grp.grid = grid;
    });
  });

  /* ---------- Filtering ---------- */
  function matches(a) {
    if (state.cat !== "all" && a.cat !== state.cat) return false;
    if (state.mat !== "all" && a.material !== state.mat) return false;
    if (state.campaign !== "all" && a.campaign !== state.campaign) return false;
    if (state.q && a.search.indexOf(norm(state.q)) === -1) return false;
    return true;
  }

  function applyFilters() {
    var shown = 0;
    Object.keys(sections).forEach(function (catId) {
      var s = sections[catId];
      var catShown = 0;
      Object.keys(s.groups).forEach(function (g) {
        var grp = s.groups[g];
        var gShown = 0;
        grp.cards.forEach(function (a) {
          var m = matches(a);
          a._card.style.display = m ? "" : "none";
          if (m) { gShown++; }
        });
        grp.el.style.display = gShown ? "" : "none";
        grp.grid.style.display = gShown ? "" : "none";
        grp.el.querySelector(".g-count").textContent = gShown + " of " + grp.cards.length;
        catShown += gShown;
      });
      s.sec.style.display = catShown ? "" : "none";
      s.countEl.textContent = catShown + " of " + catShown0(catId) + " objects";
      shown += catShown;
    });
    var rc = document.getElementById("result-count");
    rc.textContent = shown + " of " + totalCount + " objects";
    var empty = document.getElementById("empty-state");
    empty.style.display = shown ? "none" : "";
  }
  function catShown0(catId) {
    return data.filter(function (a) { return a.cat === catId; }).length;
  }

  /* ---------- Controls wiring ---------- */
  var searchInput = document.getElementById("search-input");
  var t = null;
  searchInput.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () { state.q = searchInput.value.trim(); applyFilters(); }, 120);
  });

  function chipRow(containerId, options, key) {
    var c = document.getElementById(containerId);
    options.forEach(function (opt) {
      var b = el("button", "chip", opt.label);
      b.type = "button";
      b.dataset.value = opt.value;
      b.setAttribute("aria-pressed", state[key] === opt.value ? "true" : "false");
      b.addEventListener("click", function () {
        state[key] = opt.value;
        Array.prototype.forEach.call(c.querySelectorAll(".chip"), function (x) {
          x.setAttribute("aria-pressed", x.dataset.value === opt.value ? "true" : "false");
        });
        applyFilters();
      });
      c.appendChild(b);
    });
  }
  chipRow("cat-chips", [{ value: "all", label: "All" }].concat(
    CATEGORIES.map(function (c) { return { value: c.id, label: c.label.split(" &")[0].replace("Jewellery", "Jewellery").replace("Cargo", "Cargo & ship")}; })
  ), "cat");
  chipRow("mat-chips", [{ value: "all", label: "All" }].concat(
    ["bronze", "marble", "glass", "ceramic", "gold", "silver", "lead", "stone", "wood", "organic", "mixed"]
      .map(function (m) { return { value: m, label: MATERIAL_LABELS[m] }; })
  ), "mat");
  chipRow("camp-chips", [{ value: "all", label: "All" }].concat(
    ["1900-01", "1976", "2012-14", "2015-22"].map(function (c) { return { value: c, label: CAMPAIGN_LABELS[c] }; })
  ), "campaign");

  document.getElementById("clear-filters").addEventListener("click", function () {
    state = { q: "", cat: "all", mat: "all", campaign: "all" };
    searchInput.value = "";
    document.querySelectorAll(".chip").forEach(function (x) {
      x.setAttribute("aria-pressed", x.dataset.value === "all" ? "true" : "false");
    });
    applyFilters();
  });

  document.getElementById("empty-reset").addEventListener("click", function () {
    document.getElementById("clear-filters").click();
  });

  /* ---------- Modal ---------- */
  var modal = document.getElementById("detail-modal");
  function openModal(a) {
    var grid = modal.querySelector(".modal-grid");
    grid.innerHTML = "";

    var mediaBox = el("div", "modal-media");
    var hasImg = a.imgKind === "commons" || a.imgKind === "local" || a.imgKind === "external";
    if (hasImg) {
      var img = el("img");
      img.alt = a.imgAlt || a.name;
      if (a.imgKind === "commons") { img.src = commonsThumb(a.imgFile, 1024); }
      else { img.src = a.imgSrc; }
      mediaBox.appendChild(img);
    } else {
      mediaBox.appendChild(placeholderFor(a));
    }

    var body = el("div", "modal-body");
    body.appendChild(el("h3", null, a.name));

    var dl = el("dl", "modal-fields");
    function row(term, def) {
      dl.appendChild(el("dt", null, term));
      dl.appendChild(el("dd", null, def));
    }
    row("Object type", a.group);
    row("Material", a.matDetail);
    row("Date", a.date);
    row("Recovery", CAMPAIGN_LABELS[a.campaign] + " campaign");
    row("Holding", "National Archaeological Museum, Athens" + (a.inv && a.inv.indexOf("Ephorate") === 0 ? "" : ""));
    row("Catalogue no.", a.inv || "n.a.");
    if (a.invNote) row("", a.invNote);
    row("Image status", STATUS_LABEL[a.imgStatus]);
    body.appendChild(dl);

    var notes = el("p", "modal-notes", a.notes);
    body.appendChild(notes);

    var ml = el("div", "modal-links");
    ml.appendChild(el("div", "ml-title", "Provenance & image records"));
    a.prov.forEach(function (p) { ml.appendChild(link(p.url, null, p.label + " \u2197")); });
    if (a.imgKind === "commons") {
      ml.appendChild(link(commonsPage(a.imgFile), null, "High-resolution image (Wikimedia Commons) \u2197"));
    } else if (a.imgLink && a.imgStatus === "high-res") {
      ml.appendChild(link(a.imgLink, null, "High-resolution image (official project photo) \u2197"));
    } else if (a.imgLink) {
      ml.appendChild(link(a.imgLink, null, "Photograph at source page \u2197"));
    }
    body.appendChild(ml);

    grid.appendChild(mediaBox);
    grid.appendChild(body);

    var old = modal.querySelector(".modal-close");
    if (old) old.remove();
    var closeBtn = document.createElement("button");
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "Close details");
    closeBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    closeBtn.addEventListener("click", function () { modal.close(); });
    modal.appendChild(closeBtn);

    modal.showModal();
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.close();
  });

  /* ---------- Init ---------- */
  applyFilters();
})();
