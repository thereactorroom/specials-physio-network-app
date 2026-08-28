/**
 * Reads a URL query parameter case-insensitively.
 * e.g. ?Business=... and ?business=... both resolve to the same value.
 */
export function getParamCaseInsensitive(name) {
  const params = new URLSearchParams(window.location.search);
  const lower = name.toLowerCase();
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

/**
 * Reads a numeric URL parameter, defaulting to 0 if missing or invalid.
 */
export function getNumericParam(name) {
  const value = getParamCaseInsensitive(name);
  if (!value) return 0;
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Reads the Admin URL parameter.
 * Returns true, false, or null (when blank or not supplied).
 */
export function getAdminParam() {
  const value = getParamCaseInsensitive('Admin');
  if (value === null || value === '') {
    // Fall back to the fusion bridge-derived admin status (set by App-level
    // check via getUserCommunityGroups) when the host hasn't passed an explicit
    // Admin param.
    try {
      const cached = sessionStorage.getItem('__fusion_admin');
      if (cached !== null) return cached === 'true';
    } catch {}
    return null;
  }
  return value.toLowerCase() === 'true';
}

/**
 * Reads business context from URL: fID, BusinessName, BusinessID.
 * - fID and BusinessID default to 0 if not supplied.
 * - If BusinessID is 0, BusinessName is forced to "Test Business".
 * - Falls back to legacy 'business' param if BusinessName is not provided.
 */
export function getBusinessContext() {
  const fId = getNumericParam('fID');
  const businessId = getNumericParam('BusinessID');
  let businessName = getParamCaseInsensitive('BusinessName');

  if (!businessName) {
    const legacy = getParamCaseInsensitive('business');
    businessName = legacy ? legacy.split('?')[0].split('&')[0].trim() : null;
  }

  if (businessId === 0) {
    businessName = 'Test Business';
  }

  return { fId, businessId, businessName: businessName || '' };
}