document.addEventListener("DOMContentLoaded", () => {
  const topics = {
    contact: {
      label: "コンタクトフィード",
      title: "お問い合わせフォーム",
      detail: ""
    },
    q1: { label: "暇な時間があったら？", title: "", detail: "Pinterestで、グラフィックとか3Dモデリングとかのデザイン見る" },
    q2: { label: "趣味は？", title: "", detail: "ものづくり" },
    q3: { label: "何が得意？", title: "", detail: "手を動かすことならなんでも Fusion Rhinoceros blender使える" },
    q4: { label: "大事にしている価値観", title: "", detail: "謙虚さ。天狗になると絶対どこかで失敗するので、等身大で正直にやっていきたいです。" },
    q5: { label: "SNS", title: "", detail: "InstagramとTwitter" },
    q6: { label: "質問6", title: "", detail: "" },
    q7: { label: "質問7", title: "", detail: "" },
    q8: { label: "質問8", title: "", detail: "" }
  };

  const titleEl = document.getElementById("infoTitle");
  const bodyEl = document.getElementById("infoBody");
  const labelEl = document.getElementById("infoLabel");
  const topicButtons = Array.from(document.querySelectorAll("[data-topic]"));
  const worksContent = document.getElementById("worksContent");
  const tabs = Array.from(document.querySelectorAll(".pill.tab"));
  const workTabs = Array.from(document.querySelectorAll(".work-tab"));
  const worksSection = document.querySelector(".works");
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
  const currentTab = { key: "did" };
  let wheelAccumulator = 0;
  let autoScrollTimer = null;
  const slotOrder = ["left", "center", "right"];
  let slotCards = [];

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
      const res = await fetch(`/api/works/${encodeURIComponent(slug)}`);
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

  const ensureSlots = () => {
    if (!worksTrack || slotCards.length) return;
    worksTrack.innerHTML = "";
    slotCards = slotOrder.map((pos) => {
      const card = document.createElement("div");
      card.className = `work-card work-card--${pos}`;
      card.addEventListener("click", () => {
        const slug = card.dataset.slug;
        if (slug) openModalBySlug(slug);
      });
      worksTrack.appendChild(card);
      return card;
    });
  };

  const updateCard = (card, work, role, hide) => {
    card.classList.remove("is-center", "is-side", "is-hidden");
    card.classList.add(role === "center" ? "is-center" : "is-side");
    if (hide) {
      card.classList.add("is-hidden");
      card.innerHTML = "";
      card.dataset.slug = "";
      return;
    }
    card.innerHTML = buildCardMarkup(work);
    card.dataset.slug = work.slug || "";
  };

  const updateCarousel = () => {
    if (!worksTrack) return;
    ensureSlots();
    if (!worksData.length) return;
    const total = worksData.length;
    const centerIndex = ((currentSlide % total) + total) % total;
    const leftIndex = (centerIndex - 1 + total) % total;
    const rightIndex = (centerIndex + 1) % total;
    const showSides = total > 1;
    updateCard(slotCards[0], worksData[leftIndex], "side", !showSides);
    updateCard(slotCards[1], worksData[centerIndex], "center", false);
    updateCard(slotCards[2], worksData[rightIndex], "side", total <= 2);
  };

  const renderCarousel = () => {
    if (!worksTrack) return;
    ensureSlots();
    updateCarousel();
    startAutoScroll();
  };

  const nextSlide = () => {
    if (!worksData.length) return;
    if (worksTrack.classList.contains("is-animating")) return;
    worksTrack.classList.add("is-animating", "is-next");
    setTimeout(() => {
      currentSlide = (currentSlide + 1) % worksData.length;
      updateCarousel();
      worksTrack.classList.remove("is-animating", "is-next");
    }, 420);
  };

  const prevSlideFn = () => {
    if (!worksData.length) return;
    if (worksTrack.classList.contains("is-animating")) return;
    worksTrack.classList.add("is-animating", "is-prev");
    setTimeout(() => {
      currentSlide = (currentSlide - 1 + worksData.length) % worksData.length;
      updateCarousel();
      worksTrack.classList.remove("is-animating", "is-prev");
    }, 420);
  };

  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlideFn);
  window.addEventListener("resize", updateCarousel);

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
      const res = await fetch(`/api/works?kind=${currentTab.key}`);
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
        const res = await fetch("/api/contact", {
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

    if (key === "contact") {
      bodyEl.innerHTML = `
        <form class="contact-form">
          <label>お名前<input type="text" name="name" required /></label>
          <label>メール<input type="email" name="email" required /></label>
          <label>メッセージ<textarea name="message" rows="4" required></textarea></label>
          <button type="submit">送信</button>
          <p class="contact-status" aria-live="polite"></p>
        </form>
      `;
      setupContactForm();
    } else {
      bodyEl.textContent = topic.detail || "";
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

  if (worksContent) {
    worksContent.addEventListener(
      "wheel",
      (e) => {
        const atFirst = currentSlide === 0 && e.deltaY < 0;
        const atLast = currentSlide === worksData.length - 1 && e.deltaY > 0;
        if (!worksData.length || atFirst || atLast) return; // allow normal scroll out
        e.preventDefault();
        wheelAccumulator += e.deltaY;
        if (wheelAccumulator > 80) {
          nextSlide();
          wheelAccumulator = 0;
          resetAutoScroll();
        } else if (wheelAccumulator < -80) {
          prevSlideFn();
          wheelAccumulator = 0;
          resetAutoScroll();
        }
      },
      { passive: false }
    );
  }

  // Set a friendly default state.
  updatePanel("contact");
  if (worksSection) {
    worksSection.classList.add("did");
  }
  startTitleRotation();
  loadWorks();
});
