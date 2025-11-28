/**
 * Markup Parser Utility
 * Parses JSON markup from Gemini responses into UI-compatible message format
 */

/**
 * Parse JSON markup response from Gemini into message format
 * @param {string} responseText - Raw response text from Gemini (may contain JSON)
 * @returns {Object} - Parsed message object compatible with MessageBubble component
 */
export const parseMarkupResponse = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    return { text: responseText || '' };
  }

  // Try to extract JSON from response (may be wrapped in markdown code blocks or plain JSON)
  let jsonText = responseText.trim();
  
  // Remove markdown code blocks if present
  jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/g, '');
  
  // Try to parse as JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    // If not valid JSON, treat as plain text
    return { text: responseText };
  }

  // Validate parsed structure
  if (!parsed || typeof parsed !== 'object') {
    return { text: responseText };
  }

  // Build message object
  const message = {
    text: parsed.text || '',
  };

  // Handle options (for carousel/buttons)
  if (parsed.options && Array.isArray(parsed.options) && parsed.options.length > 0) {
    message.options = parsed.options.slice(0, 4); // Limit to 4 options
  }

  // Handle list
  if (parsed.list && typeof parsed.list === 'object') {
    if (parsed.list.items && Array.isArray(parsed.list.items)) {
      message.list = {
        type: parsed.list.type || 'bullet',
        items: parsed.list.items
      };
    }
  }

  // Handle recommendations
  if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
    message.recommendations = parsed.recommendations;
  }

  // Handle brands
  if (parsed.brands && Array.isArray(parsed.brands) && parsed.brands.length > 0) {
    message.brands = parsed.brands;
  }

  // If no text but has structured content, provide default text
  if (!message.text && (message.options || message.list || message.recommendations)) {
    message.text = '';
  }

  return message;
};

/**
 * Format list items for display
 * @param {Object} list - List object with type and items
 * @returns {string} - Formatted text representation
 */
export const formatListForDisplay = (list) => {
  if (!list || !list.items || !Array.isArray(list.items)) {
    return '';
  }

  if (list.type === 'numbered') {
    return list.items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  } else {
    return list.items.map(item => `• ${item}`).join('\n');
  }
};

/**
 * Check if response contains structured markup
 * @param {string} responseText - Response text to check
 * @returns {boolean} - True if response appears to contain JSON markup
 */
export const hasMarkup = (responseText) => {
  if (!responseText) return false;
  
  const trimmed = responseText.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('```json') || trimmed.startsWith('```');
};

