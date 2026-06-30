export const getAvailableQuantity = (product, color, size) => {
  if (!product) return 0;

  if (color) {
    const colorObj = Array.isArray(product.colors)
      ? product.colors.find((c) => c.color === color)
      : null;

    if (!colorObj) return 0;

    if (Array.isArray(colorObj.sizes) && colorObj.sizes.length) {
      if (size) {
        const sizeObj = colorObj.sizes.find((s) => s.size === size);
        return sizeObj ? Number(sizeObj.qty || sizeObj.quantity || 0) : 0;
      } else {
        return colorObj.sizes.reduce(
          (sum, s) => sum + Number(s.qty || s.quantity || 0),
          0
        );
      }
    }

    return Number(colorObj.quantity || 0);
  }

  if (size) {
    const sizeObj = Array.isArray(product.sizes)
      ? product.sizes.find((s) => s.size === size)
      : null;
    return sizeObj ? Number(sizeObj.qty || sizeObj.quantity || 0) : 0;
  }

  return Number(product.quantity || 0);
};

export const sumColorsQty = (colors = []) => {
  return colors.reduce((sum, c) => {
    if (Array.isArray(c.sizes)) {
      return sum + c.sizes.reduce(
        (s, it) => s + Number(it.qty || it.quantity || 0),
        0
      );
    }
    return sum + Number(c.quantity || 0);
  }, 0);
};

export const sumSizesQty = (sizes = []) => {
  return sizes.reduce((sum, s) => sum + Number(s.qty || s.quantity || 0), 0);
};

export const computeNewTotalQuantity = (colors, sizes, fallbackOldQuantity = 0) => {
  const cSum = Array.isArray(colors) ? sumColorsQty(colors) : 0;
  const sSum = Array.isArray(sizes) ? sumSizesQty(sizes) : 0;

  if (cSum > 0 && sSum > 0) {
    return Math.max(cSum, sSum);
  }
  if (cSum > 0) return cSum;
  if (sSum > 0) return sSum;
  return fallbackOldQuantity;
};

export const validatePrice = (price, product) => {
  const finalPrice = Number(product.finalPrice || 0);
  const sellPrice = Number(product.sellPrice || 0);
  const inputPrice = Number(price || 0);

  if (inputPrice <= 0) {
    return { valid: false, message: 'السعر يجب أن يكون أكبر من صفر' };
  }

  if (inputPrice > sellPrice) {
    return {
      valid: false,
      message: `السعر الذي أدخلته أكبر من السعر الافتراضي: ${sellPrice}`
    };
  }

  return { valid: true };
};
