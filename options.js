const defaultBorderStyles = {
  simple: {
    name: "Bordure simple",
    style: "1px solid #000000"
  },
  thick: {
    name: "Bordure épaisse",
    style: "4px solid #000000"
  },
  thin: {
    name: "Bordure fine",
    style: "1px solid #cccccc"
  },
  double: {
    name: "Double bordure",
    style: "3px double #000000"
  },
  dashed: {
    name: "Bordure pointillée",
    style: "2px dashed #000000"
  },
  colored: {
    name: "Bordure colorée",
    style: "3px solid #ff6b6b"
  },
  rounded: {
    name: "Bordure arrondie",
    style: "2px solid #000000",
    borderRadius: "8px"
  },
  shadow: {
    name: "Avec ombre",
    style: "2px solid #000000",
    boxShadow: "3px 3px 8px rgba(0,0,0,0.3)"
  }
};

let currentStyles = {};

// Charger les styles sauvegardés
async function loadStyles() {
  const result = await browser.storage.local.get("borderStyles");
  currentStyles = result.borderStyles || { ...defaultBorderStyles };
  renderStyles();
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
  deleteBtn.textContent = "🗑️ Supprimer";
  deleteBtn.onclick = () => deleteStyle(key);
  
  styleHeader.appendChild(styleName);
  styleHeader.appendChild(deleteBtn);
  
  // Créer les champs
  const styleFields = document.createElement("div");
  styleFields.className = "style-fields";
  
  // Créer chaque champ de manière sécurisée
  const fieldNameDiv = createField("full-width", "Nom du style", 
    createInput("text", "style-name-input", escapeHtml(style.name)));
  
  const fieldWidthDiv = createField("", "Épaisseur (px)", 
    createNumberInput("border-width", parsed.width, 1, 20));
  
  const fieldTypeDiv = createField("", "Type de bordure", 
    createBorderTypeSelect("border-type", parsed.type));
  
  const fieldColorDiv = createField("", "Couleur", 
    createColorInput("border-color", parsed.color));
  
  const fieldColorTextDiv = createField("", "Code couleur", 
    createInput("text", "border-color-text", escapeHtml(parsed.color)));
  
  styleFields.appendChild(fieldNameDiv);
  styleFields.appendChild(fieldWidthDiv);
  styleFields.appendChild(fieldTypeDiv);
  styleFields.appendChild(fieldColorDiv);
  styleFields.appendChild(fieldColorTextDiv);
  
  const toggleLink = document.createElement("a");
  toggleLink.className = "toggle-advanced";
  toggleLink.textContent = "Options avancées ▼";
  toggleLink.onclick = function() { toggleAdvanced(this); };
  
  const advancedOptions = document.createElement("div");
  advancedOptions.className = "advanced-options";
  advancedOptions.style.display = "none";
  
  const advancedFields = document.createElement("div");
  advancedFields.className = "style-fields";
  
  const fieldRadiusDiv = createField("", "Rayon des coins (ex: 8px)", 
    createInput("text", "border-radius", escapeHtml(style.borderRadius || '')));
  
  const fieldShadowDiv = createField("", "Ombre (ex: 3px 3px 8px rgba(0,0,0,0.3))", 
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
    { value: "solid", label: "Solide" },
    { value: "dashed", label: "Pointillée" },
    { value: "dotted", label: "Points" },
    { value: "double", label: "Double" },
    { value: "groove", label: "Rainure" },
    { value: "ridge", label: "Crête" },
    { value: "inset", label: "Inset" },
    { value: "outset", label: "Outset" }
  ];
  
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
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
  if (advanced.style.display === "none") {
    advanced.style.display = "block";
    element.textContent = "Options avancées ▲";
  } else {
    advanced.style.display = "none";
    element.textContent = "Options avancées ▼";
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
  showMessage("✅ Styles sauvegardés avec succès !", "success");
}

// Ajouter un nouveau style
function addNewStyle() {
  const key = `custom_${Date.now()}`;
  currentStyles[key] = {
    name: "Nouveau style",
    style: "2px solid #000000"
  };
  renderStyles();
  
  // Faire défiler vers le bas
  const newItem = document.querySelector(`[data-key="${key}"]`);
  newItem.scrollIntoView({ behavior: "smooth" });
}

// Supprimer un style
function deleteStyle(key) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce style ?")) {
    delete currentStyles[key];
    renderStyles();
  }
}

// Réinitialiser aux valeurs par défaut
async function resetToDefaults() {
  if (confirm("Êtes-vous sûr de vouloir réinitialiser tous les styles aux valeurs par défaut ? Tous vos styles personnalisés seront perdus.")) {
    currentStyles = { ...defaultBorderStyles };
    await browser.storage.local.set({ borderStyles: currentStyles });
    renderStyles();
    showMessage("🔄 Styles réinitialisés aux valeurs par défaut", "success");
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

// Écouteurs d'événements
document.getElementById("save-btn").addEventListener("click", saveStyles);
document.getElementById("add-style-btn").addEventListener("click", addNewStyle);
document.getElementById("reset-btn").addEventListener("click", resetToDefaults);

// Rendre les fonctions accessibles globalement pour les onclick inline
window.toggleAdvanced = toggleAdvanced;
window.deleteStyle = deleteStyle;

// Charger les styles au démarrage
loadStyles();