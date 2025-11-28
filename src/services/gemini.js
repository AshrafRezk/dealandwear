/**
 * Google Gemini API Service
 * Handles AI-powered conversations for the styling assistant
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Validate API key is available
if (!GEMINI_API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. AI features may not work properly.');
}

/**
 * Generate AI response using Gemini API
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Object} userPreferences - User's style preferences
 * @returns {Promise<string>} - AI response text
 */
export const generateAIResponse = async (userMessage, conversationHistory = [], userPreferences = {}) => {
  try {
    // Build context for the AI
    const systemContext = `You are Aria, a sophisticated AI styling assistant for Deal & Wear, a premium fashion brand. 
You help users discover their perfect style through personalized recommendations. 
Be concise, elegant, and fashion-forward in your responses. 
Keep responses under 150 words unless the user asks for detailed advice.
${userPreferences.style ? `The user prefers ${userPreferences.style} style.` : ''}
${userPreferences.occasion ? `They're looking for ${userPreferences.occasion} outfits.` : ''}
${userPreferences.budget ? `Their budget is ${userPreferences.budget}.` : ''}`;

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
  const prompt = `Based on these preferences:
- Style: ${preferences.style || 'not specified'}
- Occasion: ${preferences.occasion || 'not specified'}
- Budget: ${preferences.budget || 'not specified'}

Provide a brief, elegant recommendation (under 100 words) for fashion brands that would suit this user. Be specific and mention why these brands work.`;

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

