/**
 * Preference Memory Service
 * Manages user preferences storage and retrieval using localStorage
 */

const STORAGE_KEY = 'dealandwear_user_preferences';

/**
 * Default preferences structure
 */
const defaultPreferences = {
  style: null,
  occasion: null,
  budget: null,
  favoriteBrands: [],
  size: null,
  colors: [],
  lastUpdated: null
};

/**
 * Get all user preferences
 * @returns {Object} - User preferences object
 */
export const getPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const preferences = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return { ...defaultPreferences, ...preferences };
    }
  } catch (error) {
    console.error('Error reading preferences:', error);
  }
  return { ...defaultPreferences };
};

/**
 * Save user preferences
 * @param {Object} preferences - Preferences to save (partial or full)
 * @returns {Object} - Saved preferences
 */
export const savePreferences = (preferences) => {
  try {
    const current = getPreferences();
    const updated = {
      ...current,
      ...preferences,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return getPreferences();
  }
};

/**
 * Update a specific preference field
 * @param {string} field - Field name to update
 * @param {*} value - Value to set
 * @returns {Object} - Updated preferences
 */
export const updatePreference = (field, value) => {
  return savePreferences({ [field]: value });
};

/**
 * Add to array preferences (like favorite brands or colors)
 * @param {string} field - Field name (e.g., 'favoriteBrands', 'colors')
 * @param {*} value - Value to add
 * @returns {Object} - Updated preferences
 */
export const addToPreference = (field, value) => {
  const current = getPreferences();
  const currentArray = current[field] || [];
  
  // Avoid duplicates
  if (!currentArray.includes(value)) {
    return savePreferences({
      [field]: [...currentArray, value]
    });
  }
  
  return current;
};

/**
 * Remove from array preferences
 * @param {string} field - Field name
 * @param {*} value - Value to remove
 * @returns {Object} - Updated preferences
 */
export const removeFromPreference = (field, value) => {
  const current = getPreferences();
  const currentArray = current[field] || [];
  
  return savePreferences({
    [field]: currentArray.filter(item => item !== value)
  });
};

/**
 * Clear all preferences
 */
export const clearPreferences = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing preferences:', error);
  }
};

/**
 * Check if user has any saved preferences
 * @returns {boolean} - True if user has saved preferences
 */
export const hasPreferences = () => {
  const prefs = getPreferences();
  return prefs.style !== null || 
         prefs.occasion !== null || 
         prefs.budget !== null ||
         prefs.favoriteBrands.length > 0 ||
         prefs.size !== null ||
         prefs.colors.length > 0;
};

/**
 * Get preferences summary for AI context
 * @returns {string} - Formatted preferences summary
 */
export const getPreferencesSummary = () => {
  const prefs = getPreferences();
  const parts = [];
  
  if (prefs.style) parts.push(`Style: ${prefs.style}`);
  if (prefs.occasion) parts.push(`Occasion: ${prefs.occasion}`);
  if (prefs.budget) parts.push(`Budget: ${prefs.budget}`);
  if (prefs.size) parts.push(`Size: ${prefs.size}`);
  if (prefs.favoriteBrands.length > 0) {
    parts.push(`Favorite brands: ${prefs.favoriteBrands.join(', ')}`);
  }
  if (prefs.colors.length > 0) {
    parts.push(`Preferred colors: ${prefs.colors.join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No preferences saved yet';
};
