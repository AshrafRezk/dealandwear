/**
 * Google Gemini API Service
 * Handles AI-powered conversations for the styling assistant
 */

import personaConfig from './gemini-persona.json';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Validate API key is available
if (!GEMINI_API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. AI features may not work properly.');
}

/**
 * Build system context from persona configuration
 * @param {Object} userPreferences - User's style preferences
 * @returns {string} - Formatted system context
 */
const buildSystemContext = (userPreferences = {}) => {
  const persona = personaConfig.persona;
  const format = personaConfig.responseFormat;
  
  let context = `You are ${persona.name}, a ${persona.role} for Deal & Wear. `;
  context += `Your tone should be ${persona.tone} - ${persona.style}. `;
  
  // Add guidelines
  context += `\n\nGuidelines:\n`;
  persona.guidelines.forEach(guideline => {
    context += `- ${guideline}\n`;
  });
  
  // Add things to avoid
  context += `\nAvoid:\n`;
  persona.avoid.forEach(item => {
    context += `- ${item}\n`;
  });
  
  // Add response format requirements
  context += `\n\nCRITICAL: You MUST respond in valid JSON format matching this schema:\n`;
  context += JSON.stringify(format.schema, null, 2);
  context += `\n\nThe 'text' field should be natural and conversational. Never mention JSON or markup to the user. `;
  context += `When presenting options, lists, or recommendations, use the structured format instead of plain text. `;
  context += `Always include a 'text' field with your main response. `;
  context += `\n\nExample format:\n`;
  context += JSON.stringify(personaConfig.examples.simple, null, 2);
  
  // Add user preferences if available
  if (userPreferences.style) {
    context += `\n\nThe user prefers ${userPreferences.style} style.`;
  }
  if (userPreferences.occasion) {
    context += ` They're looking for ${userPreferences.occasion} outfits.`;
  }
  if (userPreferences.budget) {
    context += ` Their budget is ${userPreferences.budget}.`;
  }
  
  // Add product search capabilities
  context += `\n\nIMPORTANT: You can help users search for clothing and fashion products across Egyptian stores. `;
  context += `If a user asks to find, search, or buy products (e.g., "find me blue jeans", "show me dresses under 500 EGP", "where can I buy a jacket"), `;
  context += `you should acknowledge their request and suggest they use the search feature. `;
  context += `You can also help refine their search query by extracting key terms like product type, color, size, price range, etc. `;
  context += `When users mention specific products, prices, or shopping needs, guide them to search for those items.`;
  
  return context;
};

/**
 * Generate AI response using Gemini API
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Object} userPreferences - User's style preferences
 * @returns {Promise<string>} - AI response text
 */
export const generateAIResponse = async (userMessage, conversationHistory = [], userPreferences = {}) => {
  try {
    // Build system context from persona configuration
    const systemContext = buildSystemContext(userPreferences);

    // Build conversation history
    const contents = [];
    
    // Add conversation history (last 6 messages for context)
    conversationHistory.slice(-6).forEach(msg => {
      contents.push({
        parts: [{ text: msg.text }],
        role: msg.isUser ? 'user' : 'model'
      });
    });

    // Add system context and current user message combined
    const fullUserMessage = `${systemContext}\n\nUser: ${userMessage}`;
    contents.push({
      parts: [{ text: fullUserMessage }],
      role: 'user'
    });

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: contents
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return fallback response
    return getFallbackResponse(userMessage, userPreferences);
  }
};

/**
 * Get fallback response when API fails
 * @param {string} userMessage - The user's message
 * @param {Object} userPreferences - User's style preferences
 * @returns {string} - Fallback response
 */
const getFallbackResponse = (userMessage, userPreferences) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for product search queries
  if (lowerMessage.includes('find') || lowerMessage.includes('search') || 
      lowerMessage.includes('buy') || lowerMessage.includes('purchase') ||
      lowerMessage.includes('where can i') || lowerMessage.includes('looking for')) {
    return "I can help you search for products! Try asking me to find specific items like 'find me blue jeans' or 'show me dresses under 500 EGP'. I'll search across Egyptian stores for you.";
  }
  
  if (lowerMessage.includes('style') || lowerMessage.includes('fashion')) {
    return "I'd love to help you discover your perfect style. Let's start by understanding your preferences. What occasion are you dressing for?";
  }
  
  if (lowerMessage.includes('brand') || lowerMessage.includes('recommend')) {
    return "Based on your preferences, I can recommend some excellent brands. Would you like to explore options for your style and budget?";
  }
  
  if (lowerMessage.includes('budget') || lowerMessage.includes('price')) {
    return "I can help you find great style options within your budget. What price range are you comfortable with?";
  }
  
  return "I'm here to help you find your perfect style. Could you tell me more about what you're looking for?";
};

/**
 * Generate brand recommendations based on preferences
 * @param {Object} preferences - User preferences
 * @returns {Promise<string>} - AI recommendation text
 */
export const generateBrandRecommendations = async (preferences) => {
  const systemContext = buildSystemContext(preferences);
  const prompt = `${systemContext}\n\nBased on these preferences:
- Style: ${preferences.style || 'not specified'}
- Occasion: ${preferences.occasion || 'not specified'}
- Budget: ${preferences.budget || 'not specified'}

Provide brand recommendations in the required JSON format. Be specific and mention why these brands work.`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
          role: 'user'
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return `Based on your preferences for ${preferences.style || 'style'}, ${preferences.occasion || 'occasion'}, and ${preferences.budget || 'budget'} budget, I have some excellent brand recommendations for you.`;
  }
};

