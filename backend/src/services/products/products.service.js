import { Product } from './products.model.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/index.js';
import { PRODUCT_STATUSES, ROLES } from '../../shared/types/index.js';

export async function listProducts({ page, limit, role }) {
  const filter = {};
  if (role === ROLES.USER) {
    filter.status = PRODUCT_STATUSES.AVAILABLE;
  } else {
    filter.status = { $in: [PRODUCT_STATUSES.AVAILABLE, PRODUCT_STATUSES.UNAVAILABLE, PRODUCT_STATUSES.HIDDEN] };
  }

  const totalItems = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { products, totalItems };
}

export async function getProduct(productId, role) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (role === ROLES.USER && product.status !== PRODUCT_STATUSES.AVAILABLE) {
    throw new NotFoundError('Product not found');
  }

  if (role !== ROLES.USER && product.status === PRODUCT_STATUSES.DELETED) {
    throw new NotFoundError('Product not found');
  }

  return product;
}

export async function createProduct(data, userId) {
  validateModifierGroups(data.modifierGroups);
  const product = await Product.create({
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
  return product;
}

export async function updateProduct(productId, data, userId) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  validateModifierGroups(data.modifierGroups);

  Object.assign(product, data);
  product.updatedBy = userId;
  await product.save();

  return product;
}

export async function updateProductStatus(productId, status, userId) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (status === PRODUCT_STATUSES.DELETED) {
    throw new BadRequestError('Cannot set product to deleted status via API');
  }

  product.status = status;
  product.updatedBy = userId;
  await product.save();

  return product;
}

function validateModifierGroups(groups) {
  const groupIds = new Set();
  for (const group of groups) {
    // PRODUCT-007: groupId unique within product
    if (groupIds.has(group.groupId)) {
      throw new BadRequestError(`Duplicate modifier group ID: ${group.groupId}`);
    }
    groupIds.add(group.groupId);

    // PRODUCT-008: modifierId unique within group
    const modifierIds = new Set();
    for (const mod of group.modifiers) {
      if (modifierIds.has(mod.modifierId)) {
        throw new BadRequestError(`Duplicate modifier ID in group ${group.groupId}: ${mod.modifierId}`);
      }
      modifierIds.add(mod.modifierId);
    }

    // PRODUCT-012: maxSelected=0 means no modifiers
    if (group.maxSelected === 0) {
      if (group.defaultModifierIds.length > 0) {
        throw new BadRequestError(`Group ${group.groupId}: defaultModifierIds must be empty when maxSelected=0`);
      }
    }

    // PRODUCT-009: defaultModifierIds must reference active modifiers
    const activeModifierIds = group.modifiers.filter((m) => m.isActive).map((m) => m.modifierId);
    for (const defId of group.defaultModifierIds) {
      if (!activeModifierIds.includes(defId)) {
        throw new BadRequestError(`Group ${group.groupId}: default modifier ${defId} is not an active modifier`);
      }
    }

    // PRODUCT-010: defaultModifierIds length between minSelected and maxSelected
    if (group.defaultModifierIds.length < group.minSelected || group.defaultModifierIds.length > group.maxSelected) {
      throw new BadRequestError(
        `Group ${group.groupId}: defaultModifierIds count must be between minSelected and maxSelected`
      );
    }
  }
}