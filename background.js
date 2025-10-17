// Styles de bordures par défaut avec support i18n
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

let borderStyles = getDefaultBorderStyles();
let lastClickedImageSrc = null;

// Charger les styles personnalisés au démarrage
browser.storage.local.get("borderStyles").then((result) => {
  if (result.borderStyles) {
    // Fusionner les styles sauvegardés avec les traductions actuelles
    borderStyles = mergeStylesWithTranslations(result.borderStyles);
  }
  createContextMenus();
});

// Fonction pour fusionner les styles sauvegardés avec les nouvelles traductions
function mergeStylesWithTranslations(savedStyles) {
  const defaultStyles = getDefaultBorderStyles();
  const merged = { ...savedStyles };
  
  // Mettre à jour les noms des styles par défaut avec les traductions actuelles
  for (const [key, defaultStyle] of Object.entries(defaultStyles)) {
    if (merged[key] && merged[key].style === defaultStyle.style) {
      merged[key].name = defaultStyle.name;
    }
  }
  
  return merged;
}

// Créer les menus contextuels
function createContextMenus() {
  // Supprimer les menus existants
  browser.menus.removeAll();
  
  // Créer le menu parent
  browser.menus.create({
    id: "image-border-parent",
    title: browser.i18n.getMessage("menuAddBorder"),
    contexts: ["image"]
  });
  
  // Ajouter chaque style de bordure
  for (const [key, style] of Object.entries(borderStyles)) {
    browser.menus.create({
      id: `border-${key}`,
      parentId: "image-border-parent",
      title: style.name,
      contexts: ["image"]
    });
  }
  
  // Ajouter un séparateur
  browser.menus.create({
    id: "separator",
    parentId: "image-border-parent",
    type: "separator",
    contexts: ["image"]
  });
  
  // Option pour retirer la bordure
  browser.menus.create({
    id: "border-remove",
    parentId: "image-border-parent",
    title: browser.i18n.getMessage("menuRemoveBorder"),
    contexts: ["image"]
  });
  
  // Option pour ouvrir les paramètres
  browser.menus.create({
    id: "border-settings",
    parentId: "image-border-parent",
    title: browser.i18n.getMessage("menuSettings"),
    contexts: ["image"]
  });
}

// Gérer les clics sur le menu contextuel
browser.menus.onClicked.addListener(async (info, tab) => {
  // Stocker l'URL de l'image cliquée
  if (info.srcUrl) {
    lastClickedImageSrc = info.srcUrl;
  }
  
  if (info.menuItemId === "border-settings") {
    browser.runtime.openOptionsPage();
    return;
  }
  
  if (info.menuItemId === "border-remove") {
    await applyBorderToImage(tab.id, null);
    return;
  }
  
  if (info.menuItemId.startsWith("border-")) {
    const styleKey = info.menuItemId.replace("border-", "");
    const style = borderStyles[styleKey];
    if (style) {
      await applyBorderToImage(tab.id, style);
    }
  }
});

// Appliquer la bordure à l'image
async function applyBorderToImage(tabId, style) {
  try {
    // Injecter un script dans la fenêtre de composition
    await browser.tabs.executeScript(tabId, {
      code: `
        (function() {
          const imageSrc = ${JSON.stringify(lastClickedImageSrc)};
          const style = ${JSON.stringify(style)};
          
          // Trouver toutes les images dans l'éditeur
          const editor = document.querySelector('body') || document;
          const images = editor.querySelectorAll('img');
          
          // Trouver l'image qui correspond à celle cliquée
          let targetImage = null;
          for (let img of images) {
            if (img.src === imageSrc || img.getAttribute('src') === imageSrc) {
              targetImage = img;
              break;
            }
          }
          
          // Si on ne trouve pas par src, prendre l'image sélectionnée
          if (!targetImage) {
            const selection = window.getSelection();
            if (selection.anchorNode) {
              if (selection.anchorNode.nodeName === 'IMG') {
                targetImage = selection.anchorNode;
              } else if (selection.anchorNode.parentNode && selection.anchorNode.parentNode.nodeName === 'IMG') {
                targetImage = selection.anchorNode.parentNode;
              }
            }
          }
          
          if (targetImage) {
            if (style === null) {
              targetImage.style.border = '';
              targetImage.style.borderRadius = '';
              targetImage.style.boxShadow = '';
              targetImage.removeAttribute('border');
            } else {
              targetImage.style.border = style.style;
              if (style.borderRadius) {
                targetImage.style.borderRadius = style.borderRadius;
              } else {
                targetImage.style.borderRadius = '';
              }
              if (style.boxShadow) {
                targetImage.style.boxShadow = style.boxShadow;
              } else {
                targetImage.style.boxShadow = '';
              }
            }
            return true;
          }
          return false;
        })();
      `
    });
  } catch (error) {
    console.error("Erreur lors de l'application de la bordure:", error);
  }
}

// Écouter les changements de styles et regénérer les menus
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.borderStyles) {
    borderStyles = mergeStylesWithTranslations(changes.borderStyles.newValue);
    createContextMenus();
  }
});

// Fonction pour exposer les styles par défaut aux autres scripts
async function getDefaultStylesForOptions() {
  return getDefaultBorderStyles();
}

// Exposer la fonction pour la page d'options
if (typeof window !== 'undefined') {
  window.getDefaultBorderStyles = getDefaultBorderStyles;
}
