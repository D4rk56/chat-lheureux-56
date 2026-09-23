/**
 * Compresse une image côté client via un élément Canvas pour réduire son poids
 * et garantir la conformité avec les limites Firestore (1 Mo max par document).
 * @param {File} file
 * @param {number} maxDimension - Dimension max en pixels (largeur ou hauteur)
 * @param {number} quality - Qualité JPEG (0 à 1)
 * @returns {Promise<string>} Data URL base64 compressé
 */
export function compressImageFile(file, maxDimension = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error("Le fichier fourni n'est pas une image valide."));
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Impossible d'initialiser le contexte canvas 2D."));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
