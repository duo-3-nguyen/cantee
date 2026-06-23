import { randomUUID } from 'node:crypto';
import { Cart } from './cart.model.js';
import { Product } from '../products/products.model.js';
import { CanteenSettings } from '../settings/settings.model.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/index.js';
import { PRODUCT_STATUSES } from '../../shared/types/index.js';

export async function getCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], subtotalAmount: 0 });
  }
  return cart;
}

export async function addCartItem(userId, { productId, quantity, selectedModifierGroups }) {
  const product = await Product.findById(productId);
  if (!product || product.status !== PRODUCT_STATUSES.AVAILABLE) {
    throw new NotFoundError('Product not found or unavailable');
  }

  // Validate modifier selections
  validateModifierSelections(product.modifierGroups, selectedModifierGroups);

  // Build snapshots
  const modifierGroupSnapshots = buildModifierGroupSnapshots(product.modifierGroups, selectedModifierGroups);

  // Calculate item subtotal
  const modifierTotal = modifierGroupSnapshots.reduce(
    (sum, mg) => sum + mg.selectedModifiers.reduce((s, m) => s + m.priceAmountSnapshot, 0),
    0
  );
  const itemSubtotalAmount = quantity * (product.basePriceAmount + modifierTotal);

  const cartItemId = randomUUID();

  const cartItem = {
    cartItemId,
    productId: product._id,
    productNameSnapshot: product.name,
    basePriceAmountSnapshot: product.basePriceAmount,
    quantity,
    selectedModifierGroups: modifierGroupSnapshots,
    itemSubtotalAmount,
  };

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [cartItem], subtotalAmount: itemSubtotalAmount });
  } else {
    cart.items.push(cartItem);
    cart.subtotalAmount = calculateSubtotal(cart.items);
    await cart.save();
  }

  return cart;
}

export async function updateCartItem(userId, cartItemId, updates) {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  const itemIndex = cart.items.findIndex((item) => item.cartItemId === cartItemId);
  if (itemIndex === -1) {
    throw new NotFoundError('Cart item not found');
  }

  const item = cart.items[itemIndex];

  if (updates.quantity !== undefined) {
    item.quantity = updates.quantity;
  }

  if (updates.selectedModifierGroups !== undefined) {
    const product = await Product.findById(item.productId);
    if (!product || product.status !== PRODUCT_STATUSES.AVAILABLE) {
      throw new BadRequestError('Product is no longer available');
    }

    validateModifierSelections(product.modifierGroups, updates.selectedModifierGroups);
    item.selectedModifierGroups = buildModifierGroupSnapshots(product.modifierGroups, updates.selectedModifierGroups);
    item.productNameSnapshot = product.name;
    item.basePriceAmountSnapshot = product.basePriceAmount;
  }

  // Recalculate item subtotal
  const modifierTotal = item.selectedModifierGroups.reduce(
    (sum, mg) => sum + mg.selectedModifiers.reduce((s, m) => s + m.priceAmountSnapshot, 0),
    0
  );
  item.itemSubtotalAmount = item.quantity * (item.basePriceAmountSnapshot + modifierTotal);

  cart.subtotalAmount = calculateSubtotal(cart.items);
  await cart.save();

  return cart;
}

export async function removeCartItem(userId, cartItemId) {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  const itemIndex = cart.items.findIndex((item) => item.cartItemId === cartItemId);
  if (itemIndex === -1) {
    throw new NotFoundError('Cart item not found');
  }

  cart.items.splice(itemIndex, 1);
  cart.subtotalAmount = calculateSubtotal(cart.items);
  await cart.save();

  return cart;
}

export async function clearCart(userId) {
  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = [];
    cart.subtotalAmount = 0;
    cart.diningMode = null;
    cart.pickupTime = null;
    await cart.save();
  }
  return cart || { items: [], subtotalAmount: 0 };
}

export async function setCheckoutDetails(userId, { diningMode, pickupTime }) {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  if (cart.items.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  // Validate pickup time
  const pickupDate = new Date(pickupTime);
  if (isNaN(pickupDate.getTime())) {
    throw new BadRequestError('Invalid pickup time');
  }

  await validatePickupTime(pickupDate);

  cart.diningMode = diningMode;
  cart.pickupTime = pickupDate;
  await cart.save();

  return cart;
}

// --- Helper functions ---

function validateModifierSelections(productModifierGroups, selectedGroups) {
  for (const productGroup of productModifierGroups) {
    const selectedGroup = selectedGroups.find((sg) => sg.groupId === productGroup.groupId);

    if (!selectedGroup) {
      // MOD-008: Apply defaults if omitted
      if (productGroup.defaultModifierIds.length > 0) {
        // Defaults are applied by the caller; here we just check that the group exists
        throw new BadRequestError(
          `Modifier group "${productGroup.name}" is required. Please select modifiers.`
        );
      }
      // If minSelected=0 and no defaults, it's fine to omit
      if (productGroup.minSelected > 0) {
        throw new BadRequestError(
          `Modifier group "${productGroup.name}" requires at least ${productGroup.minSelected} selection(s)`
        );
      }
      continue;
    }

    // MOD-007: No duplicate modifier IDs
    const selectedIds = selectedGroup.selectedModifiers.map((m) => m.modifierId);
    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size !== selectedIds.length) {
      throw new BadRequestError(`Duplicate modifier selection in group "${productGroup.name}"`);
    }

    // MOD-002, MOD-003: min/max check
    if (selectedIds.length < productGroup.minSelected) {
      throw new BadRequestError(
        `Group "${productGroup.name}" requires at least ${productGroup.minSelected} selection(s)`
      );
    }
    if (selectedIds.length > productGroup.maxSelected) {
      throw new BadRequestError(
        `Group "${productGroup.name}" allows at most ${productGroup.maxSelected} selection(s)`
      );
    }

    // MOD-005, MOD-006: Validate each selected modifier
    for (const selMod of selectedGroup.selectedModifiers) {
      const productMod = productGroup.modifiers.find((m) => m.modifierId === selMod.modifierId);
      if (!productMod) {
        throw new BadRequestError(
          `Unknown modifier "${selMod.modifierId}" in group "${productGroup.name}"`
        );
      }
      if (!productMod.isActive) {
        throw new BadRequestError(
          `Modifier "${productMod.name}" in group "${productGroup.name}" is not available`
        );
      }
    }
  }

  // MOD-004: Check for unknown groupIds
  const productGroupIds = productModifierGroups.map((g) => g.groupId);
  for (const sg of selectedGroups) {
    if (!productGroupIds.includes(sg.groupId)) {
      throw new BadRequestError(`Unknown modifier group "${sg.groupId}"`);
    }
  }
}

function buildModifierGroupSnapshots(productModifierGroups, selectedGroups) {
  return productModifierGroups.map((productGroup) => {
    const selectedGroup = selectedGroups.find((sg) => sg.groupId === productGroup.groupId);

    let selectedModifierIds;
    if (!selectedGroup || selectedGroup.selectedModifiers.length === 0) {
      // Apply defaults
      selectedModifierIds = productGroup.defaultModifierIds;
    } else {
      selectedModifierIds = selectedGroup.selectedModifiers.map((m) => m.modifierId);
    }

    const selectedModifiers = selectedModifierIds.map((modId) => {
      const mod = productGroup.modifiers.find((m) => m.modifierId === modId);
      return {
        modifierId: mod.modifierId,
        nameSnapshot: mod.name,
        priceAmountSnapshot: mod.priceAmount,
      };
    });

    return {
      groupId: productGroup.groupId,
      groupNameSnapshot: productGroup.name,
      selectedModifiers,
    };
  });
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.itemSubtotalAmount, 0);
}

async function validatePickupTime(pickupDate) {
  const settings = await CanteenSettings.findOne();
  if (!settings) {
    throw new BadRequestError('Canteen settings not configured');
  }

  // Check not in past
  if (pickupDate <= new Date()) {
    throw new BadRequestError('Pickup time must be in the future');
  }

  // Convert to canteen timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: settings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(pickupDate);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const dayOfWeekMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const localDayOfWeek = dayOfWeekMap[getPart('weekday')];
  const localHour = parseInt(getPart('hour'), 10);
  const localMinute = parseInt(getPart('minute'), 10);
  const localTimeMinutes = localHour * 60 + localMinute;

  const daySchedule = settings.openingHours.find((d) => d.dayOfWeek === localDayOfWeek);
  if (!daySchedule) {
    throw new BadRequestError('No opening hours configured for this day');
  }

  if (!daySchedule.isOpen) {
    throw new BadRequestError('Canteen is closed on this day');
  }

  const [openH, openM] = daySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = daySchedule.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (localTimeMinutes < openMinutes) {
    throw new BadRequestError(`Pickup time is before opening time (${daySchedule.openTime})`);
  }

  if (localTimeMinutes > closeMinutes) {
    throw new BadRequestError(`Pickup time is after closing time (${daySchedule.closeTime})`);
  }
}