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
    q4: { label: "大事にしている価値観", title: "", detail: "誠実さと創造性" },
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
  const modalDate = document.getElementById("modalDate");
  const modalBody = document.getElementById("modalBody");
  const modalImage = document.getElementById("modalImage");
  const modalClose = document.querySelector(".work-modal__close");
  const modalOverlay = document.querySelector(".work-modal__overlay");

  const headerTitles = ["ISSHIN", "ONSENKOZO"];
  let titleIndex = 0;
  let worksData = [];
  let currentSlide = 0;
  const currentTab = { key: "did" };
  let wheelAccumulator = 0;

  const startTitleRotation = () => {
    if (!rotatingTitle) return;
    setInterval(() => {
      titleIndex = (titleIndex + 1) % headerTitles.length;
      rotatingTitle.textContent = headerTitles[titleIndex];
    }, 5000);
  };

  const truncate = (text = "", max = 140) => {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}/${m}/${day}`;
  };

  const openModal = (work) => {
    if (!modal) return;
    modalTitle.textContent = work.title || "";
    modalDate.textContent = formatDate(work.date);
    modalBody.textContent = work.body || work.excerpt || "";
    if (work.imageUrl) {
      modalImage.innerHTML = `<img src="${work.imageUrl}" alt="${work.title}">`;
    } else {
      modalImage.innerHTML = "";
    }
    modal.classList.remove("hidden");
  };

  const closeModal = () => modal && modal.classList.add("hidden");
  [modalClose, modalOverlay].forEach((el) => {
    if (el) el.addEventListener("click", closeModal);
  });

  const renderCarousel = () => {
    if (!worksTrack) return;
    worksTrack.innerHTML = "";
    worksData.forEach((work) => {
      const card = document.createElement("div");
      card.className = "work-card";
      const imgBlock = work.imageUrl
        ? `<div class="work-thumb"><img src="${work.imageUrl}" alt="${work.title || ""}"></div>`
        : `<div class="work-thumb"><div class="placeholder-text">画像なし</div></div>`;
      card.innerHTML = `
        ${imgBlock}
        <h4>${work.title || ""}</h4>
        <p class="work-date">${formatDate(work.date)}</p>
        <p class="work-excerpt">${truncate(work.excerpt || work.body || "", 140)}</p>
      `;
      card.addEventListener("click", () => openModal(work));
      worksTrack.appendChild(card);
    });
    updateCarousel();
  };

  const updateCarousel = () => {
    if (!worksTrack) return;
    const cards = Array.from(worksTrack.children);
    if (!cards.length) return;
    const cardWidth = cards[0].getBoundingClientRect().width + 32; // includes gap
    const offset = cardWidth * currentSlide;
    worksTrack.style.transform = `translateX(-${offset}px)`;
    cards.forEach((card, idx) => {
      card.classList.remove("is-center", "is-side");
      if (idx === currentSlide) {
        card.classList.add("is-center");
      } else {
        card.classList.add("is-side");
      }
    });
  };

  const nextSlide = () => {
    if (!worksData.length) return;
    currentSlide = (currentSlide + 1) % worksData.length;
    updateCarousel();
  };

  const prevSlideFn = () => {
    if (!worksData.length) return;
    currentSlide = (currentSlide - 1 + worksData.length) % worksData.length;
    updateCarousel();
  };

  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlideFn);
  window.addEventListener("resize", updateCarousel);

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
          date: new Date().toISOString(),
          excerpt: "ここに抜粋テキストが入ります。管理画面から実績を追加してください。",
          body: "ここに本文が入ります。管理画面から差し替えてください。",
          imageUrl: "",
          kind: currentTab.key
        },
        {
          id: 2,
          title: "サンプル2",
          date: new Date().toISOString(),
          excerpt: "もう一つの実績サンプルです。",
          body: "本文を追加してください。",
          imageUrl: "",
          kind: currentTab.key
        },
        {
          id: 3,
          title: "サンプル3",
          date: new Date().toISOString(),
          excerpt: "3件目のサンプル。",
          body: "本文を追加してください。",
          imageUrl: "",
          kind: currentTab.key
        }
      ];
    }
    currentSlide = 0;
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
        } else if (wheelAccumulator < -80) {
          prevSlideFn();
          wheelAccumulator = 0;
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
