(function () {
  "use strict";

  // ✏️ Replace with your Render URL after deploying
  const API_BASE = "https://YOUR_APP_NAME.onrender.com";

  let messageCount = 0;
  let leadCaptured = false;
  let brandColor   = "#1D4ED8";

  fetch(`${API_BASE}/config`)
    .then(r => r.json())
    .then(cfg => { brandColor = cfg.brand_color || brandColor; applyBrand(brandColor); })
    .catch(() => {});

  // ============================================================
  // STYLES
  // ============================================================
  const style = document.createElement("style");
  style.textContent = `
    #rk-widget * { box-sizing:border-box; margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; }

    #rk-bubble {
      position:fixed; bottom:24px; right:24px; z-index:99999;
      width:64px; height:64px; border-radius:50%;
      background:var(--rk-brand,#1D4ED8); border:none; cursor:pointer;
      box-shadow:0 4px 24px rgba(0,0,0,0.22);
      display:flex; align-items:center; justify-content:center;
      transition:transform 0.2s, box-shadow 0.2s;
    }
    #rk-bubble:hover { transform:scale(1.08); box-shadow:0 8px 28px rgba(0,0,0,0.28); }
    #rk-bubble svg   { width:28px; height:28px; fill:#fff; }

    #rk-badge {
      position:absolute; top:2px; right:2px;
      background:#ef4444; color:#fff; font-size:11px; font-weight:700;
      width:18px; height:18px; border-radius:50%;
      display:none; align-items:center; justify-content:center;
    }

    #rk-window {
      position:fixed; bottom:100px; right:24px; z-index:99998;
      width:370px; max-height:580px;
      background:#fff; border-radius:18px;
      box-shadow:0 12px 48px rgba(0,0,0,0.16);
      display:flex; flex-direction:column; overflow:hidden;
      transform:scale(0.88) translateY(20px); opacity:0; pointer-events:none;
      transition:transform 0.28s cubic-bezier(.34,1.56,.64,1), opacity 0.22s;
    }
    #rk-window.rk-open {
      transform:scale(1) translateY(0); opacity:1; pointer-events:all;
    }

    /* Header */
    #rk-header {
      background:var(--rk-brand,#1D4ED8);
      padding:14px 16px; display:flex; align-items:center; gap:12px; color:#fff;
    }
    #rk-avatar {
      width:42px; height:42px; border-radius:50%;
      background:rgba(255,255,255,0.18);
      display:flex; align-items:center; justify-content:center;
      font-size:20px; flex-shrink:0;
    }
    #rk-header-info h3  { font-size:15px; font-weight:700; letter-spacing:0.2px; }
    #rk-header-info p   { font-size:12px; opacity:0.82; margin-top:2px; }
    #rk-online {
      width:8px; height:8px; border-radius:50%;
      background:#22c55e; display:inline-block; margin-right:5px;
    }
    #rk-close {
      margin-left:auto; background:none; border:none;
      color:#fff; cursor:pointer; font-size:24px; opacity:0.8; padding:0 4px;
    }
    #rk-close:hover { opacity:1; }

    /* Messages */
    #rk-messages {
      flex:1; overflow-y:auto; padding:16px 14px;
      display:flex; flex-direction:column; gap:10px;
      background:#f1f5f9;
    }
    #rk-messages::-webkit-scrollbar { width:4px; }
    #rk-messages::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }

    .rk-msg {
      max-width:84%; padding:11px 14px; border-radius:16px;
      font-size:13.5px; line-height:1.55; word-break:break-word;
      animation:rkFade 0.22s ease;
    }
    .rk-msg.bot {
      background:#fff; color:#1e293b;
      border:1px solid #e2e8f0; border-bottom-left-radius:4px;
      align-self:flex-start; box-shadow:0 1px 4px rgba(0,0,0,0.06);
    }
    .rk-msg.user {
      background:var(--rk-brand,#1D4ED8); color:#fff;
      border-bottom-right-radius:4px; align-self:flex-end;
    }
    @keyframes rkFade {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Typing */
    #rk-typing {
      display:none; align-self:flex-start;
      background:#fff; border:1px solid #e2e8f0;
      border-radius:16px; border-bottom-left-radius:4px;
      padding:11px 16px; gap:5px; align-items:center;
      box-shadow:0 1px 4px rgba(0,0,0,0.06);
    }
    #rk-typing span {
      width:7px; height:7px; border-radius:50%; background:#94a3b8;
      display:inline-block; animation:rkBounce 1.2s infinite ease-in-out;
    }
    #rk-typing span:nth-child(2) { animation-delay:0.2s; }
    #rk-typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes rkBounce {
      0%,60%,100% { transform:translateY(0); }
      30% { transform:translateY(-6px); }
    }

    /* Forms */
    .rk-form { padding:14px 16px; background:#fff; border-top:1px solid #f1f5f9; }
    .rk-form p { font-size:13px; color:#334155; font-weight:600; margin-bottom:10px; }
    .rk-form input {
      width:100%; padding:9px 11px; margin-bottom:8px;
      border:1.5px solid #e2e8f0; border-radius:9px;
      font-size:13px; color:#111; transition:border-color 0.15s;
      background:#f8fafc;
    }
    .rk-form input:focus { outline:none; border-color:var(--rk-brand,#1D4ED8); background:#fff; }
    .rk-form button {
      width:100%; padding:10px;
      background:var(--rk-brand,#1D4ED8); color:#fff;
      border:none; border-radius:9px;
      font-size:13px; font-weight:700; cursor:pointer; transition:opacity 0.15s;
    }
    .rk-form button:hover { opacity:0.88; }
    .rk-form .rk-skip {
      background:none; color:#94a3b8;
      font-weight:400; margin-top:5px; font-size:12px;
    }
    .rk-form .rk-skip:hover { color:#64748b; opacity:1; }

    /* Input bar */
    #rk-input-bar {
      display:flex; gap:8px; padding:12px 14px;
      border-top:1px solid #f1f5f9; background:#fff;
    }
    #rk-input {
      flex:1; padding:10px 13px; border:1.5px solid #e2e8f0;
      border-radius:10px; font-size:13.5px; color:#111;
      background:#f8fafc; transition:border-color 0.15s;
    }
    #rk-input:focus { outline:none; border-color:var(--rk-brand,#1D4ED8); background:#fff; }
    #rk-send {
      background:var(--rk-brand,#1D4ED8); color:#fff;
      border:none; border-radius:10px; width:40px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:opacity 0.15s; flex-shrink:0;
    }
    #rk-send:hover { opacity:0.88; }
    #rk-send svg { width:18px; height:18px; fill:#fff; }

    /* Powered by footer */
    #rk-powered {
      text-align:center; padding:7px 0 9px;
      font-size:11px; color:#94a3b8; background:#fff;
      border-top:1px solid #f1f5f9; letter-spacing:0.2px;
    }
    #rk-powered a {
      color:#1D4ED8; text-decoration:none; font-weight:600;
    }
    #rk-powered a:hover { text-decoration:underline; }

    /* Demo banner */
    #rk-demo-bar {
      background:#fef9c3; border-bottom:1px solid #fde68a;
      padding:5px 14px; text-align:center;
      font-size:11.5px; color:#92400e; font-weight:600;
      letter-spacing:0.2px;
    }

    @media (max-width:420px) {
      #rk-window {
        width:100vw; max-height:82vh;
        bottom:0; right:0; border-radius:18px 18px 0 0;
      }
      #rk-bubble { bottom:18px; right:18px; }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // HTML
  // ============================================================
  const container = document.createElement("div");
  container.id = "rk-widget";
  container.innerHTML = `
    <button id="rk-bubble" aria-label="Open chat">
      <div id="rk-badge">1</div>
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
      </svg>
    </button>

    <div id="rk-window" role="dialog" aria-label="ReplyKing Properties Chat">

      <div id="rk-header">
        <div id="rk-avatar">🏠</div>
        <div id="rk-header-info">
          <h3>ReplyKing Properties</h3>
          <p><span id="rk-online"></span>Online — typically replies instantly</p>
        </div>
        <button id="rk-close" aria-label="Close">×</button>
      </div>

      <div id="rk-demo-bar">🔖 DEMO MODE — ReplyKing Properties</div>

      <div id="rk-messages">
        <div id="rk-typing">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div id="rk-form-slot"></div>

      <div id="rk-input-bar">
        <input
          id="rk-input"
          type="text"
          placeholder="Ask about listings, pricing, bookings…"
          autocomplete="off"
          aria-label="Your message"
        />
        <button id="rk-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>

      <div id="rk-powered">
        Powered by <a href="https://replyking.com" target="_blank">ReplyKing AI</a>
      </div>

    </div>
  `;
  document.body.appendChild(container);

  // ============================================================
  // REFERENCES
  // ============================================================
  const bubble   = document.getElementById("rk-bubble");
  const badge    = document.getElementById("rk-badge");
  const chatWin  = document.getElementById("rk-window");
  const messages = document.getElementById("rk-messages");
  const typingEl = document.getElementById("rk-typing");
  const formSlot = document.getElementById("rk-form-slot");
  const inputEl  = document.getElementById("rk-input");
  const sendBtn  = document.getElementById("rk-send");

  function applyBrand(color) {
    document.documentElement.style.setProperty("--rk-brand", color);
  }
  applyBrand(brandColor);

  // ============================================================
  // OPEN / CLOSE
  // ============================================================
  let isOpen = false;

  function openChat() {
    isOpen = true;
    chatWin.classList.add("rk-open");
    badge.style.display = "none";
    inputEl.focus();
    if (messageCount === 0) {
      addBotMessage("👋 Welcome to ReplyKing Properties! I'm your virtual property assistant. How can I help you today? Feel free to ask about our listings, pricing, or book an inspection.");
    }
  }

  function closeChat() {
    isOpen = false;
    chatWin.classList.remove("rk-open");
  }

  bubble.addEventListener("click", () => (isOpen ? closeChat() : openChat()));
  document.getElementById("rk-close").addEventListener("click", closeChat);

  setTimeout(() => { if (!isOpen) badge.style.display = "flex"; }, 3000);

  // ============================================================
  // MESSAGES
  // ============================================================
  function addMessage(text, role) {
    typingEl.style.display = "none";
    const div = document.createElement("div");
    div.className = `rk-msg ${role}`;
    div.textContent = text;
    messages.insertBefore(div, typingEl);
    messages.scrollTop = messages.scrollHeight;
  }

  const addBotMessage  = t => addMessage(t, "bot");
  const addUserMessage = t => addMessage(t, "user");

  function showTyping() {
    typingEl.style.display = "flex";
    messages.scrollTop = messages.scrollHeight;
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = "";
    messageCount++;
    addUserMessage(text);
    showTyping();
    maybeShowBookingForm(text);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, message_count: messageCount }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      addBotMessage(data.reply);

      if (data.collect_lead && !leadCaptured) {
        showLeadForm(text, data.reply);
      }

    } catch (err) {
      addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again shortly or call us on 09059144435.");
      console.error("[ReplyKing widget]", err);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ============================================================
  // LEAD FORM
  // ============================================================
  function showLeadForm(lastMsg, lastReply) {
    formSlot.innerHTML = `
      <div class="rk-form" id="rk-lead-form">
        <p>👤 May I have your contact details to follow up?</p>
        <input type="text"  id="rk-lead-name"  placeholder="Full name"      />
        <input type="email" id="rk-lead-email" placeholder="Email address"  />
        <button id="rk-lead-submit">Save My Details</button>
        <button class="rk-skip" id="rk-lead-skip">Skip for now</button>
      </div>
    `;

    document.getElementById("rk-lead-submit").addEventListener("click", async () => {
      const name  = document.getElementById("rk-lead-name").value.trim();
      const email = document.getElementById("rk-lead-email").value.trim();
      if (!name || !email) { alert("Please enter both your name and email."); return; }

      try {
        await fetch(`${API_BASE}/lead`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message: lastMsg, bot_reply: lastReply }),
        });
        leadCaptured = true;
        formSlot.innerHTML = "";
        addBotMessage(`Thank you, ${name}! Your details have been saved. One of our agents will be in touch shortly. Would you like to book an inspection? Simply say "book inspection" anytime. 🏠`);
      } catch (err) {
        console.error("[widget] lead error:", err);
        formSlot.innerHTML = "";
      }
    });

    document.getElementById("rk-lead-skip").addEventListener("click", () => {
      leadCaptured = true;
      formSlot.innerHTML = "";
    });
  }

  // ============================================================
  // BOOKING FORM
  // ============================================================
  function maybeShowBookingForm(text) {
    const t = text.toLowerCase();
    if (t.includes("book") || t.includes("inspection") || t.includes("schedule") || t.includes("viewing") || t.includes("appointment")) {
      showBookingForm();
    }
  }

  function showBookingForm() {
    if (document.getElementById("rk-booking-form")) return;

    formSlot.innerHTML = `
      <div class="rk-form" id="rk-booking-form">
        <p>📅 Book a Property Inspection</p>
        <input type="text"  id="rk-book-name"    placeholder="Your full name"           />
        <input type="email" id="rk-book-email"   placeholder="Email address"            />
        <input type="text"  id="rk-book-date"    placeholder="Preferred date & time"    />
        <input type="text"  id="rk-book-service" placeholder="Which property?"          />
        <button id="rk-book-submit">Confirm Booking</button>
        <button class="rk-skip" id="rk-book-cancel">Cancel</button>
      </div>
    `;

    document.getElementById("rk-book-submit").addEventListener("click", async () => {
      const name    = document.getElementById("rk-book-name").value.trim();
      const email   = document.getElementById("rk-book-email").value.trim();
      const date    = document.getElementById("rk-book-date").value.trim();
      const service = document.getElementById("rk-book-service").value.trim();

      if (!name || !email || !date || !service) {
        alert("Please complete all fields to confirm your booking.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, date, service }),
        });
        const data = await res.json();
        formSlot.innerHTML = "";
        addBotMessage(data.message || "Your inspection has been booked successfully! Our agent will contact you to confirm. ✅");
      } catch (err) {
        console.error("[widget] booking error:", err);
        addBotMessage("We couldn't process your booking right now. Please call us directly on 09059144435.");
        formSlot.innerHTML = "";
      }
    });

    document.getElementById("rk-book-cancel").addEventListener("click", () => {
      formSlot.innerHTML = "";
    });
  }

})();
