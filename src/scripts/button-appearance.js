import { jQuery as $ } from './globals';

/**
 * Shared CFRD button appearance, scoped to Course Presentation's own buttons.
 * Mirrors the field names used by H5P.QuestionCFRD so authors configure the
 * same options, but keeps the styling local so embedded activities are never
 * affected.
 */

const CUSTOM_CLASS = 'h5p-cp-buttons-custom';
const RADIUS_UNIT = 'em';

const DEFAULTS = {
  useGradientBackground: false,
  gradientBackground: {
    angle: 180,
    colorStart: '#1a73d9',
    colorEnd: '#1a73d9'
  },
  backgroundColor: '#1a73d9',
  textColor: '#ffffff',
  hoverBackgroundColor: '#1356a3',
  hoverTextColor: '#ffffff',
  useBorder: false,
  borderSettings: {
    borderColor: '#1a73d9',
    hoverBorderColor: '#1356a3'
  },
  borderRadius: '2em'
};

const isTruthy = (value) => value === true || value === 1 || value === '1' || value === 'true';

const pickString = (value, fallback) => (
  (value === undefined || value === null || value === '') ? fallback : String(value)
);

const pickBoolean = (value, fallback) => (
  (value === undefined || value === null || value === '') ? fallback : isTruthy(value)
);

const normalizeAngle = (value, fallback) => {
  const angle = parseInt(value, 10);

  return Math.max(0, Math.min(360, isNaN(angle) ? fallback : angle));
};

const normalizeGradient = (gradient, fallback) => {
  const normalized = $.extend({}, fallback, gradient || {});
  normalized.angle = normalizeAngle(normalized.angle, fallback.angle);
  normalized.colorStart = pickString(normalized.colorStart, fallback.colorStart);
  normalized.colorEnd = pickString(normalized.colorEnd, normalized.colorStart);

  return normalized;
};

const normalizeRadius = (value, fallback) => {
  let radius = (value === undefined || value === null || value === '') ? fallback : value;

  if (typeof radius === 'number' && !isNaN(radius)) {
    return radius + RADIUS_UNIT;
  }

  radius = String(radius).trim();

  if (!radius) {
    return fallback;
  }

  return /^-?\d+(\.\d+)?$/.test(radius) ? radius + RADIUS_UNIT : radius;
};

/**
 * Fill in every value the author left untouched.
 *
 * @param {object} [appearance] Authored appearance settings.
 * @returns {object} Complete appearance settings.
 */
export const normalizeButtonAppearance = (appearance) => {
  const normalized = $.extend(true, {}, DEFAULTS, appearance || {});

  normalized.backgroundColor = pickString(normalized.backgroundColor, DEFAULTS.backgroundColor);
  normalized.textColor = pickString(normalized.textColor, DEFAULTS.textColor);
  normalized.hoverBackgroundColor = pickString(
    normalized.hoverBackgroundColor,
    DEFAULTS.hoverBackgroundColor
  );
  normalized.hoverTextColor = pickString(normalized.hoverTextColor, DEFAULTS.hoverTextColor);
  normalized.useBorder = pickBoolean(normalized.useBorder, DEFAULTS.useBorder);
  normalized.borderSettings.borderColor = pickString(
    normalized.borderSettings.borderColor,
    DEFAULTS.borderSettings.borderColor
  );
  normalized.borderSettings.hoverBorderColor = pickString(
    normalized.borderSettings.hoverBorderColor,
    DEFAULTS.borderSettings.hoverBorderColor
  );
  normalized.borderRadius = normalizeRadius(normalized.borderRadius, DEFAULTS.borderRadius);
  normalized.useGradientBackground = pickBoolean(
    normalized.useGradientBackground,
    DEFAULTS.useGradientBackground
  );
  normalized.gradientBackground = normalizeGradient(
    normalized.gradientBackground,
    DEFAULTS.gradientBackground
  );

  if (normalized.useGradientBackground) {
    const gradient = normalized.gradientBackground;
    normalized.backgroundColor = 'linear-gradient(' + gradient.angle + 'deg, ' +
      gradient.colorStart + ', ' + gradient.colorEnd + ')';
  }

  return normalized;
};

/**
 * Expose the authored appearance as CSS custom properties on a container.
 *
 * @param {H5P.jQuery} $container Element holding the buttons.
 * @param {object} [appearance] Authored appearance settings.
 */
export const applyButtonAppearance = ($container, appearance) => {
  if (!$container || !$container.length || !appearance) {
    return;
  }

  const element = $container.get(0);
  if (!element || !element.style) {
    return;
  }

  const normalized = normalizeButtonAppearance(appearance);

  element.classList.add(CUSTOM_CLASS);
  element.style.setProperty('--h5p-cp-btn-bg', normalized.backgroundColor);
  element.style.setProperty('--h5p-cp-btn-text', normalized.textColor);
  element.style.setProperty('--h5p-cp-btn-hover-bg', normalized.hoverBackgroundColor);
  element.style.setProperty('--h5p-cp-btn-hover-text', normalized.hoverTextColor);
  element.style.setProperty('--h5p-cp-btn-border-color', normalized.borderSettings.borderColor);
  element.style.setProperty(
    '--h5p-cp-btn-hover-border-color',
    normalized.borderSettings.hoverBorderColor
  );
  element.style.setProperty('--h5p-cp-btn-border-width', normalized.useBorder ? '2px' : '0');
  element.style.setProperty('--h5p-cp-btn-radius', normalized.borderRadius);
};
