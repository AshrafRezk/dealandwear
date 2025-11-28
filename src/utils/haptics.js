/**
 * Haptic feedback utility
 * Provides vibration feedback for user interactions
 */

// Check if vibration API is supported
const isVibrationSupported = () => {
  return 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback
 * @param {number|number[]} pattern - Vibration pattern (ms duration or array of [vibrate, pause, vibrate, ...])
 */
export const haptic = (pattern = 10) => {
  if (!isVibrationSupported()) {
    return; // Silently fail if not supported
  }

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration fails
    console.debug('Haptic feedback not available');
  }
};

// Predefined haptic patterns
export const hapticPatterns = {
  // Light tap - for buttons, links
  light: 10,
  
  // Medium tap - for important actions
  medium: 20,
  
  // Strong tap - for confirmations
  strong: 30,
  
  // Success pattern - short, medium, short
  success: [10, 50, 20],
  
  // Error pattern - long vibration
  error: 40,
  
  // Selection pattern - for option selection
  selection: 15,
  
  // Navigation pattern - for page transitions
  navigation: [10, 30, 10],
  
  // Message sent - quick double tap
  message: [10, 30, 10],
};

/**
 * Haptic feedback for button clicks
 */
export const hapticButton = () => haptic(hapticPatterns.light);

/**
 * Haptic feedback for important actions
 */
export const hapticAction = () => haptic(hapticPatterns.medium);

/**
 * Haptic feedback for confirmations
 */
export const hapticConfirm = () => haptic(hapticPatterns.strong);

/**
 * Haptic feedback for success
 */
export const hapticSuccess = () => haptic(hapticPatterns.success);

/**
 * Haptic feedback for errors
 */
export const hapticError = () => haptic(hapticPatterns.error);

/**
 * Haptic feedback for selections
 */
export const hapticSelect = () => haptic(hapticPatterns.selection);

/**
 * Haptic feedback for navigation
 */
export const hapticNavigate = () => haptic(hapticPatterns.navigation);

/**
 * Haptic feedback for messages
 */
export const hapticMessage = () => haptic(hapticPatterns.message);

