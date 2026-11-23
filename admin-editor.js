(function () {
  "use strict";

  var config = window.PORTFOLIO_AI_CONFIG || {};
  var root = document.getElementById("ai-admin-root");
  if (!root) return;

  var toggle = document.getElementById("ai-admin-toggle");
  var panel = document.getElementById("ai-admin-panel");
  var close = document.getElementById("ai-admin-close");
  var messageInput = document.getElementById("ai-admin-message");
  var sendButton = document.getElementById("ai-admin-send");
  var undoButton = document.getElementById("ai-admin-undo");
  var applyButton = document.getElementById("ai-admin-apply");
  var status = document.getElementById("ai-admin-status");
  var debugDetails = document.createElement("details");
  debugDetails.className = "ai-admin-debug";
  debugDetails.innerHTML = "<summary>Diagnostic technique</summary><pre></pre>";
  status.insertAdjacentElement("afterend", debugDetails);
  var debugOutput = debugDetails.querySelector("pre");

  function showDiagnostic(title, details) {
    var safeDetails = String(details || "").slice(0, 5000);
    debugOutput.textContent = title + (safeDetails ? "\\n\\n" + safeDetails : "");
    debugDetails.open = true;
    console.error("[Portfolio AI] " + title, safeDetails);
  }
  var resultBox = document.getElementById("ai-admin-result");
  var replyBox = document.getElementById("ai-admin-reply");
  var proposalsBox = document.getElementById("ai-admin-proposals");

  var conversation = [];
  var pendingActions = [];
  var undoStack = [];
  var targetCounter = 0;

  var STYLE_ALLOWLIST = ["color", "backgroundColor", "fontSize", "fontWeight", "textAlign", "borderRadius", "borderColor", "padding"];
  var TEXT_TAGS = ["H1", "H2", "H3", "P", "SPAN"];

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? "#b42318" : "";
  }

  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) messageInput.focus();
  }

  toggle.addEventListener("click", function () { openPanel(panel.hidden); });
  close.addEventListener("click", function () { openPanel(false); });
  messageInput.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") sendRequest();
  });

  function collectTargets() {
    var selectors = "main h1, main h2, main h3, main p, main .eyebrow, main .kicker, main .tagline, main .lede, main .brand-name, main .btn, main .card, main .group-head, main .avatar-badge";
    var elements = Array.prototype.slice.call(document.querySelectorAll(selectors));
    return elements.filter(function (el) {
      return !el.closest("#ai-admin-root") && el.getClientRects().length > 0;
    }).map(function (el) {
      var id = el.getAttribute("data-ai-target");
      if (!id) {
        targetCounter += 1;
        id = "ai-target-" + targetCounter;
        el.setAttribute("data-ai-target", id);
      }
      return {
        id: id,
        tag: el.tagName.toLowerCase(),
        classes: String(el.className && typeof el.className === "string" ? el.className : "").slice(0, 140),
        text: String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 220),
        editableText: TEXT_TAGS.indexOf(el.tagName) !== -1
      };
    }).filter(function (target) { return target.text; }).slice(0, 90);
  }

  function describeAction(action) {
    if (action.type === "set_text") return "Remplacer le texte de « " + action.targetId + " »";
    if (action.type === "set_style") return "Modifier " + action.property + " de « " + action.targetId + " » : " + action.value;
    if (action.type === "add_section") return "Ajouter une section : « " + action.title + " »";
    return "Action non reconnue";
  }

  function renderProposals(actions) {
    proposalsBox.textContent = "";
    actions.forEach(function (action) {
      var item = document.createElement("div");
      item.className = "ai-admin-proposal";
      item.textContent = describeAction(action);
      proposalsBox.appendChild(item);
    });
    applyButton.hidden = actions.length === 0;
    applyButton.textContent = actions.length ? "Appliquer " + actions.length + " changement(s)" : "Appliquer";
  }

  function validateStyleValue(property, value) {
    if (typeof value !== "string" || value.length > 80 || /url\s*\(|expression\s*\(|javascript:/i.test(value)) return false;
    if (STYLE_ALLOWLIST.indexOf(property) === -1) return false;
    if (property === "fontWeight") return /^(400|500|600|700|800|900|normal|bold)$/.test(value);
    if (property === "textAlign") return /^(left|right|center|justify)$/.test(value);
    if (["fontSize", "borderRadius", "padding"].indexOf(property) !== -1) {
      var match = value.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)$/);
      if (!match) return false;
      var amount = Number(match[1]);
      return amount >= 0 && amount <= (property === "fontSize" ? 80 : 100);
    }
    return window.CSS && CSS.supports(property.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); }), value);
  }

  function findTarget(targetId) {
    if (typeof targetId !== "string" || !/^ai-target-\d+$/.test(targetId)) return null;
    return document.querySelector('[data-ai-target="' + targetId + '"]');
  }

  function applyActions(actions) {
    var applied = 0;
    actions.forEach(function (action) {
      if (!action || typeof action !== "object") return;
      if (action.type === "set_text") {
        var textTarget = findTarget(action.targetId);
        if (!textTarget || TEXT_TAGS.indexOf(textTarget.tagName) === -1 || typeof action.text !== "string" || action.text.length > 500) return;
        var oldText = textTarget.textContent;
        textTarget.textContent = action.text;
        undoStack.push(function () { textTarget.textContent = oldText; });
        applied += 1;
      } else if (action.type === "set_style") {
        var styleTarget = findTarget(action.targetId);
        if (!styleTarget || !validateStyleValue(action.property, action.value)) return;
        var cssName = action.property.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
        var oldValue = styleTarget.style.getPropertyValue(cssName);
        styleTarget.style.setProperty(cssName, action.value);
        undoStack.push(function () {
          if (oldValue) styleTarget.style.setProperty(cssName, oldValue);
          else styleTarget.style.removeProperty(cssName);
        });
        applied += 1;
      } else if (action.type === "add_section") {
        if (typeof action.title !== "string" || action.title.length > 100 || !Array.isArray(action.paragraphs) || action.paragraphs.length > 4) return;
        var main = document.querySelector("main#contenu");
        if (!main) return;
        var section = document.createElement("section");
        section.className = "container ai-added-section";
        var heading = document.createElement("h2");
        heading.textContent = action.title;
        section.appendChild(heading);
        action.paragraphs.forEach(function (paragraph) {
          if (typeof paragraph !== "string" || paragraph.length > 500) return;
          var p = document.createElement("p");
          p.textContent = paragraph;
          section.appendChild(p);
        });
        main.appendChild(section);
        undoStack.push(function () { section.remove(); });
        applied += 1;
      }
    });
    undoButton.disabled = undoStack.length === 0;
    return applied;
  }

  applyButton.addEventListener("click", function () {
    var count = applyActions(pendingActions);
    pendingActions = [];
    renderProposals([]);
    setStatus(count ? count + " changement(s) appliqué(s) dans cette session. Pense à les exporter ou à modifier les fichiers pour les conserver." : "Aucun changement valide à appliquer.", !count);
    applyButton.hidden = true;
  });

  undoButton.addEventListener("click", function () {
    var undo = undoStack.pop();
    if (undo) undo();
    undoButton.disabled = undoStack.length === 0;
    setStatus("Dernière modification annulée.");
  });

  async function sendRequest() {
    var message = messageInput.value.trim();
    var apiUrl = String(config.apiUrl || "");
    var apiKey = String(config.apiKey || "");
    var model = String(config.model || "");
    if (!message) { setStatus("Écris d'abord une demande.", true); return; }
    if (!apiUrl || !apiKey || !model) {
      setStatus("Configuration incomplète : vérifie apiUrl, apiKey et model dans admin-config.js.", true);
      return;
    }

    sendButton.disabled = true;
    setStatus("L'assistant analyse la page et prépare une proposition…");
    resultBox.hidden = true;
    pendingActions = [];

    try {
      var targets = collectTargets();
      var systemPrompt = "Tu es l'assistant administrateur d'un portfolio étudiant en français. Réponds UNIQUEMENT avec un objet JSON valide : {\"reply\":\"explication courte\",\"actions\":[...]}. Maximum 8 actions. Types : {\"type\":\"set_text\",\"targetId\":\"ID\",\"text\":\"nouveau texte\"} uniquement pour editableText=true ; {\"type\":\"set_style\",\"targetId\":\"ID\",\"property\":\"color|backgroundColor|fontSize|fontWeight|textAlign|borderRadius|borderColor|padding\",\"value\":\"valeur CSS simple\"} ; {\"type\":\"add_section\",\"title\":\"Titre\",\"paragraphs\":[\"texte\"]}. Choisis uniquement des IDs fournis. Ne génère jamais de HTML, JavaScript ou CSS arbitraire. Si la demande est ambiguë, pose une question dans reply et renvoie actions: []. Cibles visibles : " + JSON.stringify(targets);
      var messages = [{ role: "system", content: systemPrompt }].concat(conversation.slice(-8), [{ role: "user", content: message }]);
      var response;
      var rawBody = "";
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
          body: JSON.stringify({ model: model, temperature: 0.2, max_tokens: 1400, messages: messages })
        });
      } catch (networkError) {
        var networkMessage = networkError && networkError.message ? networkError.message : String(networkError);
        var networkHelp = "Le navigateur n'a reçu aucune réponse HTTP. Causes possibles : CORS refusé par le fournisseur, URL incorrecte, DNS/connexion, certificat TLS ou requête OPTIONS (preflight) refusée. Vérifie aussi que le fournisseur autorise les appels depuis https://testingforsigma.github.io.";
        showDiagnostic("ÉCHEC RÉSEAU / CORS", "URL : " + apiUrl + "\\nModèle : " + model + "\\nErreur navigateur : " + networkMessage + "\\n\\n" + networkHelp);
        throw new Error("Échec réseau/CORS : " + networkMessage + ". Ouvre « Diagnostic technique » pour les détails.");
      }

      rawBody = await response.text();
      var data = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        data = null;
      }

      console.info("[Portfolio AI] HTTP", response.status, response.statusText, "content-type:", response.headers.get("content-type"));
      if (!response.ok) {
        var apiError = data && data.error ? (data.error.message || JSON.stringify(data.error)) : rawBody;
        if (!apiError) apiError = response.statusText || "Réponse vide";
        showDiagnostic("ERREUR API HTTP " + response.status, "URL : " + apiUrl + "\\nModèle demandé : " + model + "\\nContent-Type : " + (response.headers.get("content-type") || "absent") + "\\nMessage API : " + apiError);
        throw new Error("API HTTP " + response.status + " : " + String(apiError).slice(0, 500) + ". Voir Diagnostic technique.");
      }
      if (!data) {
        showDiagnostic("RÉPONSE JSON INVALIDE", "HTTP : " + response.status + "\\nContent-Type : " + (response.headers.get("content-type") || "absent") + "\\nCorps reçu : " + rawBody);
        throw new Error("Le serveur a répondu, mais son contenu n'est pas du JSON valide. Voir Diagnostic technique.");
      }
      var content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
      content = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      var first = content.indexOf("{");
      var last = content.lastIndexOf("}");
      if (first < 0 || last <= first) {
        showDiagnostic("FORMAT DE RÉPONSE INATTENDU", "HTTP : " + response.status + "\\nModèle : " + model + "\\nContenu du modèle : " + content + "\\nRéponse brute : " + rawBody);
        throw new Error("Le modèle n'a pas renvoyé le JSON attendu. Voir Diagnostic technique.");
      }
      var parsed;
      try {
        parsed = JSON.parse(content.slice(first, last + 1));
      } catch (jsonError) {
        showDiagnostic("JSON DU MODÈLE INVALIDE", "Erreur : " + jsonError.message + "\\nContenu : " + content);
        throw new Error("Le JSON renvoyé par le modèle est invalide. Voir Diagnostic technique.");
      }
      var reply = typeof parsed.reply === "string" ? parsed.reply : "Réponse reçue.";
      var actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      conversation.push({ role: "user", content: message });
      conversation.push({ role: "assistant", content: reply });
      pendingActions = actions;
      replyBox.textContent = reply;
      renderProposals(pendingActions);
      resultBox.hidden = false;
      debugOutput.textContent = "Dernière requête réussie. HTTP " + response.status + "\\nURL : " + apiUrl + "\\nModèle : " + model + "\\nActions proposées : " + pendingActions.length;
      debugDetails.open = false;
      setStatus(pendingActions.length ? "Proposition prête : vérifie les changements avant de les appliquer." : "Réponse reçue. Aucune modification n'a été proposée.");
      messageInput.value = "";
    } catch (error) {
      setStatus(error && error.message ? error.message : "Impossible de contacter l'assistant. Ouvre Diagnostic technique.", true);
      console.error("[Portfolio AI] Request failed:", error);
    } finally {
      sendButton.disabled = false;
    }
  }

  sendButton.addEventListener("click", sendRequest);
})();
