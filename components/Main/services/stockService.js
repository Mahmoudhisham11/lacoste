import {
  collection,
  query,
  where,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import dataLayer from "@/lib/DataLayer";
import dataReader from "@/lib/DataReader";
import { computeNewTotalQuantity, getAvailableQuantity } from "@/utils/productHelpers";

const getProductData = async (productId, shop) => {
  try {
    return await dataReader.getById("lacosteProducts", productId);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};

export const stockService = {
  async restoreStock(item) {
    try {
      const product = await getProductData(item.originalProductId || item.productId, item.shop);
      if (!product) {
        throw new Error(`Product not found: ${item.code}`);
      }

      const updatedColors = product.colors ? [...product.colors] : [];
      const updatedSizes = product.sizes ? [...product.sizes] : [];

      if (item.color && updatedColors.length > 0) {
        const colorIdx = updatedColors.findIndex((c) => c.color === item.color);
        if (colorIdx !== -1) {
          const color = { ...updatedColors[colorIdx] };
          if (item.size) {
            const colorSizes = Array.isArray(color.sizes) ? [...color.sizes] : [];
            const sizeIdx = colorSizes.findIndex((s) => s.size === item.size);
            if (sizeIdx !== -1) {
              colorSizes[sizeIdx] = {
                ...colorSizes[sizeIdx],
                qty: (colorSizes[sizeIdx].qty || 0) + item.quantity,
              };
            } else {
              colorSizes.push({ size: item.size, qty: item.quantity });
            }
            color.sizes = colorSizes;
          } else {
            color.quantity = (color.quantity || 0) + item.quantity;
          }
          updatedColors[colorIdx] = color;
        }
      } else if (item.size && updatedSizes.length > 0) {
        const sizeIdx = updatedSizes.findIndex((s) => s.size === item.size);
        if (sizeIdx !== -1) {
          const newSizes = [...updatedSizes];
          newSizes[sizeIdx] = {
            ...newSizes[sizeIdx],
            qty: (newSizes[sizeIdx].qty || 0) + item.quantity,
          };
          updatedSizes.splice(sizeIdx, 1, newSizes[sizeIdx]);
        }
      }

      const newTotalQty = computeNewTotalQuantity(updatedColors, updatedSizes, product.quantity || 0);

      const updateData = {
        quantity: newTotalQty,
        ...(updatedColors.length > 0 && { colors: updatedColors }),
        ...(updatedSizes.length > 0 && { sizes: updatedSizes }),
      };

      await dataLayer.update("lacosteProducts", item.originalProductId || item.productId, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error restoring stock:", error);
      return { success: false, error };
    }
  },

  async updateStockAfterSale(cartItems) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;

    const batch = writeBatch(db);

    for (const item of cartItems) {
      try {
        const product = await getProductData(item.originalProductId || item.productId, item.shop);
        if (!product) {
          console.warn(`Product not found for stock update: ${item.code}`);
          continue;
        }

        const colors = product.colors ? JSON.parse(JSON.stringify(product.colors)) : [];
        const sizes = product.sizes ? JSON.parse(JSON.stringify(product.sizes)) : [];

        let colorModified = false;
        let sizeModified = false;

        if (item.color) {
          const colorIdx = colors.findIndex((c) => c.color === item.color);
          if (colorIdx !== -1) {
            const color = colors[colorIdx];
            if (item.size && Array.isArray(color.sizes)) {
              const sizeIdx = color.sizes.findIndex((s) => s.size === item.size);
              if (sizeIdx !== -1) {
                color.sizes[sizeIdx] = {
                  ...color.sizes[sizeIdx],
                  qty: Math.max(0, (color.sizes[sizeIdx].qty || 0) - item.quantity),
                };
                colorModified = true;
              }
            } else {
              color.quantity = Math.max(0, (color.quantity || 0) - item.quantity);
              colorModified = true;
            }
          }
        } else if (item.size) {
          const sizeIdx = sizes.findIndex((s) => s.size === item.size);
          if (sizeIdx !== -1) {
            sizes[sizeIdx] = {
              ...sizes[sizeIdx],
              qty: Math.max(0, (sizes[sizeIdx].qty || 0) - item.quantity),
            };
            sizeModified = true;
          }
        }

        // Clean up empty entries in color sizes
        if (colorModified) {
          colors.forEach((c) => {
            if (Array.isArray(c.sizes)) {
              c.sizes = c.sizes.filter((s) => (s.qty || 0) > 0);
            }
          });
        }
        if (sizeModified) {
          const cleanSizes = sizes.filter((s) => (s.qty || 0) > 0);
          sizes.length = 0;
          sizes.push(...cleanSizes);
        }

        const newTotalQty = Math.max(0, computeNewTotalQuantity(colors, sizes, product.quantity || 0));

        const prodRef = doc(db, "lacosteProducts", item.originalProductId || item.productId);
        batch.update(prodRef, {
          quantity: newTotalQty,
          ...(colorModified && { colors }),
          ...(sizeModified && { sizes }),
        });
      } catch (err) {
        console.error(`Error preparing stock update for ${item.code}:`, err);
      }
    }

    await batch.commit();
  },

  async handleStockAfterSale(cartItems, parentProductId, shop) {
    if (!parentProductId) return;

    try {
      const product = await getProductData(parentProductId, shop);
      if (!product) {
        console.warn("Parent product not found for stock update");
        return;
      }

      const colors = product.colors ? JSON.parse(JSON.stringify(product.colors)) : [];
      const sizes = product.sizes ? JSON.parse(JSON.stringify(product.sizes)) : [];

      for (const item of cartItems) {
        if (item.color) {
          const colorIdx = colors.findIndex((c) => c.color === item.color);
          if (colorIdx !== -1) {
            const color = colors[colorIdx];
            if (item.size && Array.isArray(color.sizes)) {
              const sizeIdx = color.sizes.findIndex((s) => s.size === item.size);
              if (sizeIdx !== -1) {
                color.sizes[sizeIdx] = {
                  ...color.sizes[sizeIdx],
                  qty: Math.max(0, (color.sizes[sizeIdx].qty || 0) - item.quantity),
                };
              }
            } else {
              color.quantity = Math.max(0, (color.quantity || 0) - item.quantity);
            }
          }
        } else if (item.size) {
          const sizeIdx = sizes.findIndex((s) => s.size === item.size);
          if (sizeIdx !== -1) {
            sizes[sizeIdx] = {
              ...sizes[sizeIdx],
              qty: Math.max(0, (sizes[sizeIdx].qty || 0) - item.quantity),
            };
          }
        }
      }

      const newTotalQty = computeNewTotalQuantity(colors, sizes, product.quantity || 0);

      await dataLayer.update("lacosteProducts", parentProductId, {
        quantity: newTotalQty,
        colors,
        sizes,
      });
    } catch (error) {
      console.error("Error updating stock after sale:", error);
    }
  },

  async addNewProduct(productData) {
    try {
      const result = await dataLayer.add("lacosteProducts", productData);
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Error adding product:", error);
      return { success: false, error };
    }
  },

  async deleteProduct(productId) {
    try {
      await dataLayer.delete("lacosteProducts", productId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      return { success: false, error };
    }
  },

  async updateProduct(productId, updateData) {
    try {
      await dataLayer.update("lacosteProducts", productId, updateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating product:", error);
      return { success: false, error };
    }
  },
};
