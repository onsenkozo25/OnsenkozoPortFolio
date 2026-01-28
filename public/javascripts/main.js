document.addEventListener("DOMContentLoaded", () => {
  const topics = {
    q1: { label: "趣味", title: "", detail: "温泉とものづくり\n小さい頃から父親にいろんな風呂に連れていかれ、気づいたら大好きになってました。疲れた時や何か行き詰まった時は湯船に浸かります。" },
    q2: { label: "性格", title: "", detail: "お調子者だと思います。人を笑かすのが好きです。でもやるべきことはきちっとやります。メリハリしっかりつけられるタイプです。" },
    q3: { label: "スキル", title: "", detail: "設計・デザイン・人と話すこと\n日常にあるものがどう作られているのか考えたり、調べたりするのが好きです。\n設計が好きで、Blender Fusion Rhinoceros使えます。\nデザインを学校で学んでいるので、イラレ、figmaも使えます。\n人と話すのは大好きで、あまり緊張しないので得意だと思います。" },
    q4: { label: "大切な価値観", title: "", detail: "謙虚でいること\n天狗になったら絶対足元救われると思ってます。正直に、等身大でいろんなことに挑戦したい。面白いものを作りたいです。" },
    q5: { label: "原動力", title: "", detail: "自分の手でものを作りたいという欲求が小さい頃からずっとあります。\n自分で作ったら愛着が湧くし、大事にできます。いろんな人と、いろんな方法で、いろんなものを作りたいです。" },
    q6: { label: "気になること", title: "", detail: "ものづくりの過程で生まれる無駄やゴミというものに関心があります。 \n大好きなものづくりがネガティブな課題を生み出しているというのは心苦しいです。\n流行によって買われる短命のものなく、ずっと大事にされるものを作りたいです。" },
    q7: { label: "顔みせて", title: "", detail: "こんな感じ" },
    q8: { label: "SNS", title: "", detail: "instagramで作ったものとか日常あげてます" },
    contact: {
      label: "コンタクトフィード",
      title: "お問い合わせフォーム",
      detail: ""
    }
  };

  const titleEl = document.getElementById("infoTitle");
  const bodyEl = document.getElementById("infoBody");
  const labelEl = document.getElementById("infoLabel");
  const topicButtons = Array.from(document.querySelectorAll("[data-topic]"));
  const worksContent = document.getElementById("worksContent");
  const tabs = Array.from(document.querySelectorAll(".pill.tab"));
  const workTabs = Array.from(document.querySelectorAll(".work-tab"));
  const worksSection = document.querySelector(".works");
  const worksCarousel = document.querySelector(".works-carousel");
  const worksTrack = document.getElementById("worksTrack");
  const prevBtn = document.querySelector(".work-nav.prev");
  const nextBtn = document.querySelector(".work-nav.next");
  const rotatingTitle = document.getElementById("rotatingTitle");
  const modal = document.getElementById("workModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalTags = document.getElementById("modalTags");
  const modalBody = document.getElementById("modalBody");
  const modalContent = document.getElementById("modalContent");
  const modalClose = document.querySelector(".work-modal__close");
  const modalOverlay = document.querySelector(".work-modal__overlay");

  const headerTitles = ["ISSHIN", "ONSENKOZO"];
  let titleIndex = 0;
  let worksData = [];
  let currentSlide = 0;
  const currentTab = { key: "made" };
  let wheelAccumulator = 0;
  let autoScrollTimer = null;
  const withTimestamp = (url) => `${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`;

  const startTitleRotation = () => {
    if (!rotatingTitle) return;
    setInterval(() => {
      titleIndex = (titleIndex + 1) % headerTitles.length;
      rotatingTitle.textContent = headerTitles[titleIndex];
    }, 5000);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}/${m}/${day}`;
  };

  const formatTags = (tags) => {
    if (!tags) return [];
    const list = Array.isArray(tags) ? tags : [tags];
    return list
      .map((tag) => String(tag || "").trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
  };

  const openModal = (work) => {
    if (!modal) return;
    modalTitle.textContent = work.title || "";
    if (modalTags) {
      const tags = formatTags(work.tags);
      modalTags.innerHTML = tags.length
        ? tags.map((tag) => `<span>${tag}</span>`).join("")
        : "";
    }
    if (modalBody) modalBody.textContent = "";
    if (modalContent) {
      if (window.WorksViewer && typeof window.WorksViewer.render === "function") {
        window.WorksViewer.render(modalContent, work.contentJson || []);
      } else {
        modalContent.textContent = "コンテンツの読み込みに失敗しました。";
      }
    }
    modal.classList.remove("hidden");
  };

  const closeModal = () => {
    if (modalContent && window.WorksViewer && typeof window.WorksViewer.unmount === "function") {
      window.WorksViewer.unmount(modalContent);
    }
    if (modal) modal.classList.add("hidden");
  };
  [modalClose, modalOverlay].forEach((el) => {
    if (el) el.addEventListener("click", closeModal);
  });

  const openModalBySlug = async (slug) => {
    if (!slug) return;
    try {
      const res = await fetch(withTimestamp(`/api/works/${encodeURIComponent(slug)}`));
      if (!res.ok) throw new Error("failed");
      const work = await res.json();
      openModal(work);
    } catch (err) {
      if (modalBody) modalBody.textContent = "詳細の取得に失敗しました。";
      if (modal) modal.classList.remove("hidden");
    }
  };

  const buildCardMarkup = (work) => {
    const tags = formatTags(work.tags);
    const tagsMarkup = tags.length
      ? `<div class="work-tags">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
      : `<div class="work-tags"></div>`;
    const imgBlock = work.coverImage
      ? `<div class="work-thumb"><img src="${work.coverImage}" alt="${work.title || ""}"></div>`
      : `<div class="work-thumb"><div class="placeholder-text">画像なし</div></div>`;
    return `
      ${imgBlock}
      <div class="work-card__info">
        ${tagsMarkup}
        <h4>${work.title || ""}</h4>
      </div>
    `;
  };

  const updateCarousel = (behavior = "smooth") => {
    if (!worksTrack || !worksCarousel) return;
    const cards = Array.from(worksTrack.children);
    if (!cards.length) return;
    const total = cards.length;
    currentSlide = ((currentSlide % total) + total) % total;
    cards.forEach((card, idx) => {
      card.classList.remove("is-center", "is-side");
      card.classList.add(idx === currentSlide ? "is-center" : "is-side");
    });
    const target = cards[currentSlide];
    requestAnimationFrame(() => {
      const offset =
        target.offsetLeft - (worksCarousel.clientWidth - target.offsetWidth) / 2;
      worksCarousel.scrollTo({ left: offset, behavior });
    });
  };

  const renderCarousel = () => {
    if (!worksTrack) return;
    worksTrack.innerHTML = "";
    worksData.forEach((work) => {
      const card = document.createElement("div");
      card.className = "work-card";
      card.innerHTML = buildCardMarkup(work);
      card.dataset.slug = work.slug || "";
      card.addEventListener("click", () => openModalBySlug(work.slug));
      worksTrack.appendChild(card);
    });
    updateCarousel("auto");
    startAutoScroll();
  };

  const nextSlide = () => {
    if (!worksData.length) return;
    currentSlide = (currentSlide + 1) % worksData.length;
    updateCarousel("smooth");
  };

  const prevSlideFn = () => {
    if (!worksData.length) return;
    currentSlide = (currentSlide - 1 + worksData.length) % worksData.length;
    updateCarousel("smooth");
  };

  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlideFn);
  window.addEventListener("resize", () => updateCarousel("auto"));

  const startAutoScroll = () => {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
    if (worksData.length <= 1) return;
    autoScrollTimer = setInterval(() => {
      if (document.hidden) return;
      nextSlide();
    }, 3200);
  };

  const resetAutoScroll = () => {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
    startAutoScroll();
  };

  if (nextBtn) nextBtn.addEventListener("click", resetAutoScroll);
  if (prevBtn) prevBtn.addEventListener("click", resetAutoScroll);

  const loadWorks = async () => {
    try {
      const res = await fetch(
        withTimestamp(`/api/works?kind=${encodeURIComponent(currentTab.key)}`)
      );
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      worksData = Array.isArray(data) ? data : [];
      if (!worksData.length) throw new Error("empty");
    } catch (err) {
      worksData = [
        {
          id: 1,
          title: "サンプル実績",
          slug: "sample-1",
          coverImage: "",
          tags: ["イラスト"],
          kind: currentTab.key
        },
        {
          id: 2,
          title: "サンプル2",
          slug: "sample-2",
          coverImage: "",
          tags: ["インターン"],
          kind: currentTab.key
        },
        {
          id: 3,
          title: "サンプル3",
          slug: "sample-3",
          coverImage: "",
          tags: ["電子工作"],
          kind: currentTab.key
        }
      ];
    }
    currentSlide = worksData.length > 1 ? 1 : 0;
    renderCarousel();
  };

  const setupContactForm = () => {
    if (!bodyEl) return;
    const form = bodyEl.querySelector(".contact-form");
    if (!form) return;
    const statusEl = form.querySelector(".contact-status");
    const submitBtn = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.dataset.submitting === "true") return;
      form.dataset.submitting = "true";
      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) statusEl.textContent = "送信中...";

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch("/api/contact/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "送信に失敗しました。");
        }
        if (statusEl) statusEl.textContent = "送信しました。";
        form.reset();
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = err.message || "送信に失敗しました。";
        }
      } finally {
        form.dataset.submitting = "false";
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  };

  const updatePanel = (key) => {
    const topic = topics[key];
    if (!topic) return;

    titleEl.textContent = topic.title;
    labelEl.textContent = topic.label;

    // q7以外ではアイコンを元に戻す
    if (key !== "q7") {
      const portraitImg = document.querySelector(".floating-portrait");
      if (portraitImg) {
        portraitImg.src = "/images/メインアイコン.svg";
      }
    }

    if (key === "contact") {
      bodyEl.innerHTML = `
        <form class="contact-form">
          <label>お名前<input type="text" name="name" required /></label>
          <label>メール<input type="email" name="email" required /></label>
          <label>メッセージ<textarea name=\"message\" rows=\"2\" required></textarea></label>
          <button type="submit">送信</button>
          <p class="contact-status" aria-live="polite"></p>
        </form>
      `;
      setupContactForm();
    } else if (key === "q7") {
      const portraitImg = document.querySelector(".floating-portrait");
      if (portraitImg) {
        portraitImg.src = "/images/thisface.png";
      }
      bodyEl.textContent = topic.detail || "";
    } else if (key === "q8") {
      bodyEl.innerHTML = `
        <p>${topic.detail || ""}</p>
        <div class="sns-links">
          <a href="https://www.instagram.com/onsenkozo_ra/" target="_blank" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <circle cx="17.5" cy="6.5" r="1.5"></circle>
            </svg>
          </a>
          <a href="https://www.facebook.com/profile.php?id=100093065790018" target="_blank" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 2h-3a6 6 0 0 0-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 0 1 2-2h3z"></path>
            </svg>
          </a>
        </div>
      `;
    } else {
      bodyEl.innerHTML = `<p>${(topic.detail || "").replace(/\n/g, "<br>")}</p>`;
    }

    topicButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.topic === key);
    });
  };

  topicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updatePanel(button.dataset.topic);
    });
  });

  workTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabKey = tab.dataset.tab;
      workTabs.forEach((t) => t.classList.toggle("active", t === tab));
      if (worksSection) {
        worksSection.classList.toggle("did", tabKey === "did");
        worksSection.classList.toggle("made", tabKey === "made");
      }
      currentTab.key = tabKey;
      loadWorks();
    });
  });

  // Set a friendly default state.
  updatePanel("contact");
  if (worksSection) {
    // Default is set in HTML to 'made', and matches currentTab.key
  }
  startTitleRotation();
  loadWorks();
});
