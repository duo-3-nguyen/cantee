import { CanteenSettings } from './settings.model.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/index.js';

const VALID_TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : null;

export async function getSettings() {
  const settings = await CanteenSettings.findOne();
  if (!settings) {
    throw new NotFoundError('Canteen settings not configured');
  }
  return settings;
}

export async function updateSettings(data) {
  // Validate timezone
  if (VALID_TIMEZONES && !VALID_TIMEZONES.includes(data.timezone)) {
    throw new BadRequestError(`Invalid timezone: ${data.timezone}`);
  }

  // Validate opening hours
  validateOpeningHours(data.openingHours);

  let settings = await CanteenSettings.findOne();
  if (!settings) {
    settings = await CanteenSettings.create(data);
  } else {
    Object.assign(settings, data);
    await settings.save();
  }

  return settings;
}

function validateOpeningHours(openingHours) {
  // SETTINGS-API-001: Must have all days 0-6
  const days = openingHours.map((d) => d.dayOfWeek).sort((a, b) => a - b);
  for (let i = 0; i <= 6; i++) {
    if (!days.includes(i)) {
      throw new BadRequestError(`Opening hours must include day ${i}`);
    }
  }

  // Validate each day
  for (const day of openingHours) {
    if (day.isOpen) {
      if (!day.openTime || !day.closeTime) {
        throw new BadRequestError(`Day ${day.dayOfWeek}: openTime and closeTime required when isOpen=true`);
      }

      // Validate HH:mm format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(day.openTime)) {
        throw new BadRequestError(`Day ${day.dayOfWeek}: openTime must be HH:mm format`);
      }
      if (!timeRegex.test(day.closeTime)) {
        throw new BadRequestError(`Day ${day.dayOfWeek}: closeTime must be HH:mm format`);
      }

      // SETTINGS-004: openTime must be earlier than closeTime
      const [openH, openM] = day.openTime.split(':').map(Number);
      const [closeH, closeM] = day.closeTime.split(':').map(Number);
      if (openH * 60 + openM >= closeH * 60 + closeM) {
        throw new BadRequestError(`Day ${day.dayOfWeek}: openTime must be before closeTime`);
      }
    }
  }
}