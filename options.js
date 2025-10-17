// Fonction pour obtenir les styles par défaut avec i18n
function getDefaultBorderStyles() {
  return {
    simple: {
      name: browser.i18n.getMessage("borderSimple"),
      style: "1px solid #000000"
    },
    thick: {
      name: browser.i18n.getMessage("borderThick"),
      style: "4px solid #000000"
    },
    thin: {
      name: browser.i18n.getMessage("borderThin"),
      style: "1px solid #cccccc"
    },
    double: {
      name: browser.i18n.getMessage("borderDouble"),
      style: "3px double #000000"
    },
    dashed: {
      name: browser.i18n.getMessage("borderDashed"),
      style: "2px dashed #000000"
    },
    colored: {
      name: browser.i18n.getMessage("borderColored"),
      style: "3px solid #ff6b6b"
    },
    rounded: {
      name: browser.i18n.getMessage("borderRounded"),
      style: "2px solid #000000",
      borderRadius: "8px"
    },
    shadow: {
      name: browser.i18n.getMessage("borderShadow"),
      style: "2px solid #000000",
      boxShadow: "3px 3px 8px rgba(0,0,0,0.3)"
    }
  };
}

let currentStyles = {};

// Charger les styles sauvegardés
async function loadStyles() {
  const result = await browser.storage.local.get("borderStyles");
  const defaultStyles = getDefaultBorderStyles();
  
  if (result.borderStyles) {
    // Fusionner avec les traductions actuelles
    currentStyles = mergeStylesWithTranslations(result.borderStyles, defaultStyles);
  } else {
    currentStyles = { ...defaultStyles };
  }
  renderStyles();
}

// Fusionner les styles sauvegardés avec les nouvelles traductions
function mergeStylesWithTranslations(savedStyles, defaultStyles) {
  const merged = { ...savedStyles };
  
  // Mettre à jour les noms des styles par défaut
  for (const [key, defaultStyle] of Object.entries(defaultStyles)) {
    if (merged[key] && merged[key].style === defaultStyle.style) {
      merged[key].name = defaultStyle.name;
    }
  }
  
  return merged;
}

// Afficher les styles
function renderStyles() {
  const container = document.getElementById("styles-list");
  container.innerHTML = "";
  
  for (const [key, style] of Object.entries(currentStyles)) {
    const styleDiv = createStyleElement(key, style);
    container.appendChild(styleDiv);
  }
}

// Créer un élément de style
function createStyleElement(key, style) {
  const div = document.createElement("div");
  div.className = "style-item";
  div.dataset.key = key;
  
  // Parser le style CSS pour extraire les valeurs
  const parsed = parseBorderStyle(style.style);
  
  // Créer les éléments de manière sécurisée
  const styleHeader = document.createElement("div");
  styleHeader.className = "style-header";
  
  const styleName = document.createElement("span");
  styleName.className = "style-name";
  styleName.textContent = style.name;
  
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-delete";
  deleteBtn.textContent = browser.i18n.getMessage("btnDelete");
  deleteBtn.onclick = () => deleteStyle(key);
  
  styleHeader.appendChild(styleName);
  styleHeader.appendChild(deleteBtn);
  
  // Créer les champs
  const styleFields = document.createElement("div");
  styleFields.className = "style-fields";
  
  // Créer chaque champ de manière sécurisée avec i18n
  const fieldNameDiv = createField("full-width", browser.i18n.getMessage("fieldStyleName"), 
    createInput("text", "style-name-input", escapeHtml(style.name)));
  
  const fieldWidthDiv = createField("", browser.i18n.getMessage("fieldBorderWidth"), 
    createNumberInput("border-width", parsed.width, 1, 20));
  
  const fieldTypeDiv = createField("", browser.i18n.getMessage("fieldBorderType"), 
    createBorderTypeSelect("border-type", parsed.type));
  
  const fieldColorDiv = createField("", browser.i18n.getMessage("fieldBorderColor"), 
    createColorInput("border-color", parsed.color));
  
  const fieldColorTextDiv = createField("", browser.i18n.getMessage("fieldColorCode"), 
    createInput("text", "border-color-text", escapeHtml(parsed.color)));
  
  styleFields.appendChild(fieldNameDiv);
  styleFields.appendChild(fieldWidthDiv);
  styleFields.appendChild(fieldTypeDiv);
  styleFields.appendChild(fieldColorDiv);
  styleFields.appendChild(fieldColorTextDiv);
  
  const toggleLink = document.createElement("a");
  toggleLink.className = "toggle-advanced";
  toggleLink.textContent = browser.i18n.getMessage("toggleAdvanced") + " ▼";
  toggleLink.onclick = function() { toggleAdvanced(this); };
  
  const advancedOptions = document.createElement("div");
  advancedOptions.className = "advanced-options";
  advancedOptions.style.display = "none";
  
  const advancedFields = document.createElement("div");
  advancedFields.className = "style-fields";
  
  const fieldRadiusDiv = createField("", browser.i18n.getMessage("fieldBorderRadius"), 
    createInput("text", "border-radius", escapeHtml(style.borderRadius || '')));
  
  const fieldShadowDiv = createField("", browser.i18n.getMessage("fieldBoxShadow"), 
    createInput("text", "border-shadow", escapeHtml(style.boxShadow || '')));
  
  advancedFields.appendChild(fieldRadiusDiv);
  advancedFields.appendChild(fieldShadowDiv);
  advancedOptions.appendChild(advancedFields);
  
  const preview = document.createElement("div");
  preview.className = "preview";
  const previewImage = document.createElement("div");
  previewImage.className = "preview-image";
  previewImage.style.border = style.style;
  if (style.borderRadius) previewImage.style.borderRadius = style.borderRadius;
  if (style.boxShadow) previewImage.style.boxShadow = style.boxShadow;
  preview.appendChild(previewImage);
  
  div.appendChild(styleHeader);
  div.appendChild(styleFields);
  div.appendChild(toggleLink);
  div.appendChild(advancedOptions);
  div.appendChild(preview);
  
  // Ajouter les écouteurs d'événements pour la prévisualisation en temps réel
  const inputs = div.querySelectorAll("input, select");
  inputs.forEach(input => {
    input.addEventListener("input", () => updatePreview(div));
    input.addEventListener("change", () => updatePreview(div));
  });
  
  return div;
}

// Fonction pour échapper le HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Fonctions helper pour créer des éléments de manière sécurisée
function createField(className, labelText, inputElement) {
  const div = document.createElement("div");
  div.className = "field" + (className ? " " + className : "");
  
  const label = document.createElement("label");
  label.textContent = labelText;
  
  div.appendChild(label);
  div.appendChild(inputElement);
  return div;
}

function createInput(type, className, value) {
  const input = document.createElement("input");
  input.type = type;
  input.className = className;
  input.value = value;
  return input;
}

function createNumberInput(className, value, min, max) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = className;
  input.value = value;
  input.min = min;
  input.max = max;
  return input;
}

function createColorInput(className, value) {
  const input = document.createElement("input");
  input.type = "color";
  input.className = className;
  input.value = value;
  return input;
}

function createBorderTypeSelect(className, selectedValue) {
  const select = document.createElement("select");
  select.className = className;
  
  const options = [
    { value: "solid", messageKey: "borderTypeSolid" },
    { value: "dashed", messageKey: "borderTypeDashed" },
    { value: "dotted", messageKey: "borderTypeDotted" },
    { value: "double", messageKey: "borderTypeDouble" },
    { value: "groove", messageKey: "borderTypeGroove" },
    { value: "ridge", messageKey: "borderTypeRidge" },
    { value: "inset", messageKey: "borderTypeInset" },
    { value: "outset", messageKey: "borderTypeOutset" }
  ];
  
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = browser.i18n.getMessage(opt.messageKey);
    if (opt.value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  
  return select;
}

// Basculer les options avancées
function toggleAdvanced(element) {
  const advanced = element.nextElementSibling;
  const baseText = browser.i18n.getMessage("toggleAdvanced");
  
  if (advanced.style.display === "none") {
    advanced.style.display = "block";
    element.textContent = baseText + " ▲";
  } else {
    advanced.style.display = "none";
    element.textContent = baseText + " ▼";
  }
}

// Parser un style CSS de bordure
function parseBorderStyle(styleStr) {
  const parts = styleStr.trim().split(/\s+/);
  return {
    width: parseInt(parts[0]) || 1,
    type: parts[1] || "solid",
    color: parts[2] || "#000000"
  };
}

// Mettre à jour la prévisualisation
function updatePreview(styleDiv) {
  const width = styleDiv.querySelector(".border-width").value;
  const type = styleDiv.querySelector(".border-type").value;
  const color = styleDiv.querySelector(".border-color").value;
  const colorText = styleDiv.querySelector(".border-color-text");
  const radius = styleDiv.querySelector(".border-radius").value;
  const shadow = styleDiv.querySelector(".border-shadow").value;
  
  // Synchroniser les champs de couleur
  colorText.value = color;
  
  const borderStyle = `${width}px ${type} ${color}`;
  const preview = styleDiv.querySelector(".preview-image");
  
  preview.style.border = borderStyle;
  preview.style.borderRadius = radius;
  preview.style.boxShadow = shadow;
}

// Collecter les styles depuis le formulaire
function collectStyles() {
  const styles = {};
  const styleItems = document.querySelectorAll(".style-item");
  
  styleItems.forEach(item => {
    const key = item.dataset.key;
    const name = item.querySelector(".style-name-input").value;
    const width = item.querySelector(".border-width").value;
    const type = item.querySelector(".border-type").value;
    const color = item.querySelector(".border-color").value;
    const radius = item.querySelector(".border-radius").value;
    const shadow = item.querySelector(".border-shadow").value;
    
    styles[key] = {
      name: name,
      style: `${width}px ${type} ${color}`
    };
    
    if (radius) styles[key].borderRadius = radius;
    if (shadow) styles[key].boxShadow = shadow;
  });
  
  return styles;
}

// Sauvegarder les styles
async function saveStyles() {
  const styles = collectStyles();
  await browser.storage.local.set({ borderStyles: styles });
  currentStyles = styles;
  showMessage(browser.i18n.getMessage("messageStylesSaved"), "success");
}

// Ajouter un nouveau style
function addNewStyle() {
  const key = `custom_${Date.now()}`;
  currentStyles[key] = {
    name: browser.i18n.getMessage("newStyleName"),
    style: "2px solid #000000"
  };
  renderStyles();
  
  // Faire défiler vers le bas
  const newItem = document.querySelector(`[data-key="${key}"]`);
  newItem.scrollIntoView({ behavior: "smooth" });
}

// Supprimer un style
function deleteStyle(key) {
  if (confirm(browser.i18n.getMessage("confirmDelete"))) {
    delete currentStyles[key];
    renderStyles();
  }
}

// Réinitialiser aux valeurs par défaut
async function resetToDefaults() {
  if (confirm(browser.i18n.getMessage("confirmReset"))) {
    currentStyles = { ...getDefaultBorderStyles() };
    await browser.storage.local.set({ borderStyles: currentStyles });
    renderStyles();
    showMessage(browser.i18n.getMessage("messageStylesReset"), "success");
  }
}

// Afficher un message
function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";
  
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

// Initialiser la page avec les traductions
function initializePage() {
  // Mettre à jour le titre et sous-titre
  document.title = browser.i18n.getMessage("optionsTitle");
  document.querySelector("h1").textContent = "⚙️ " + browser.i18n.getMessage("optionsTitle");
  document.querySelector(".subtitle").textContent = browser.i18n.getMessage("optionsSubtitle");
  
  // Mettre à jour les boutons
  document.getElementById("save-btn").textContent = browser.i18n.getMessage("btnSave");
  document.getElementById("add-style-btn").textContent = browser.i18n.getMessage("btnAddStyle");
  document.getElementById("reset-btn").textContent = browser.i18n.getMessage("btnReset");
}

// Écouteurs d'événements
document.getElementById("save-btn").addEventListener("click", saveStyles);
document.getElementById("add-style-btn").addEventListener("click", addNewStyle);
document.getElementById("reset-btn").addEventListener("click", resetToDefaults);

// Rendre les fonctions accessibles globalement pour les onclick inline
window.toggleAdvanced = toggleAdvanced;
window.deleteStyle = deleteStyle;

// Initialiser la page et charger les styles au démarrage
document.addEventListener("DOMContentLoaded", () => {
  initializePage();
  loadStyles();
});
