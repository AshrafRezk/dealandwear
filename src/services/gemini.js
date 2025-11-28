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
 * Get user-friendly error message for API errors
 */
const getErrorMessage = (status, statusText) => {
  switch (status) {
    case 400:
      return 'Invalid request. Please try rephrasing your message.';
    case 401:
      return 'API authentication failed. Please check your API key configuration.';
    case 403:
      return 'API access forbidden. The API key may be invalid, restricted, or the service may not be available in your region.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'The AI service is temporarily unavailable. Please try again later.';
    case 503:
      return 'The AI service is currently overloaded. Please try again in a moment.';
    default:
      return `AI service error (${status}). Please try again.`;
  }
};

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
  const prefs = [];
  if (userPreferences.style) {
    prefs.push(`${userPreferences.style} style`);
  }
  if (userPreferences.occasion) {
    prefs.push(`${userPreferences.occasion} occasions`);
  }
  if (userPreferences.budget) {
    prefs.push(`${userPreferences.budget === '$' ? 'budget-friendly' : userPreferences.budget === '$$' ? 'moderate' : userPreferences.budget === '$$$' ? 'premium' : 'luxury'} budget`);
  }
  if (userPreferences.favoriteBrands && userPreferences.favoriteBrands.length > 0) {
    prefs.push(`favorite brands: ${userPreferences.favoriteBrands.join(', ')}`);
  }
  if (userPreferences.size) {
    prefs.push(`size: ${userPreferences.size}`);
  }
  if (userPreferences.colors && userPreferences.colors.length > 0) {
    prefs.push(`preferred colors: ${userPreferences.colors.join(', ')}`);
  }
  
  if (prefs.length > 0) {
    context += `\n\nUser's saved preferences: ${prefs.join(', ')}. Use these preferences to provide personalized recommendations.`;
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

    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return getFallbackResponse(userMessage, userPreferences);
    }

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
      const errorMessage = getErrorMessage(response.status, response.statusText);
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorDetails = errorData.error.message;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      throw new Error(`${errorMessage}${errorDetails ? ` Details: ${errorDetails}` : ''}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      // Check for safety ratings or blocked content
      if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
        const finishReason = data.candidates[0].finishReason;
        if (finishReason !== 'STOP') {
          console.warn(`Gemini API finish reason: ${finishReason}`);
          if (finishReason === 'SAFETY') {
            throw new Error('Your message was blocked by content safety filters. Please try rephrasing.');
          }
        }
      }
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // If it's a network error, provide helpful message
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - check internet connection');
      return getFallbackResponse(userMessage, userPreferences);
    }
    
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
 * Orchestrate user message - comprehensive analysis for action planning
 * @param {string} userMessage - The user's message
 * @param {Object} currentPreferences - Current user preferences
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - Detailed orchestration result
 */
export const orchestrateUserMessage = async (userMessage, currentPreferences = {}, conversationHistory = []) => {
  try {
    if (!GEMINI_API_KEY) {
      return orchestrateFallback(userMessage, currentPreferences);
    }

    const prompt = `Analyze this user message in the context of a fashion styling assistant. Determine the user's intent and extract all relevant information. Respond ONLY with valid JSON in this exact format:
{
  "intent": "product_search" | "style_preference" | "preference_update" | "style_advice" | "question" | "conversation",
  "confidence": 0.0-1.0,
  "action": "SEARCH_PRODUCT" | "STYLE_ADVICE" | "MEMORIZE_PREFERENCE" | "GENERAL_CONVERSATION" | "ASK_QUESTION",
  "extractedData": {
    "searchQuery": "string or null (product to search for)",
    "style": "string or null (e.g., 'smart casual', 'formal', 'streetwear')",
    "occasion": "string or null (e.g., 'work', 'date', 'party')",
    "budget": "string or null (e.g., '$', '$$', '$$$', '$$$$')",
    "priceRange": {"min": number or null, "max": number or null},
    "currency": "string or null",
    "colors": ["array of color names"],
    "size": "string or null",
    "brands": ["array of brand names"],
    "needsClarification": boolean
  },
  "reasoning": "brief explanation of why this action was chosen"
}

User message: "${userMessage}"
Current preferences: ${JSON.stringify(currentPreferences)}
Recent conversation: ${conversationHistory.slice(-3).map(m => `${m.isUser ? 'User' : 'AI'}: ${m.text}`).join('\n')}

Examples:
- "find me blue jeans" → {"intent": "product_search", "action": "SEARCH_PRODUCT", "extractedData": {"searchQuery": "blue jeans"}}
- "I prefer casual style" → {"intent": "preference_update", "action": "MEMORIZE_PREFERENCE", "extractedData": {"style": "casual"}}
- "What should I wear for a date?" → {"intent": "style_advice", "action": "STYLE_ADVICE", "extractedData": {"occasion": "date"}}
- "Show me dresses under 500 EGP" → {"intent": "product_search", "action": "SEARCH_PRODUCT", "extractedData": {"searchQuery": "dresses", "priceRange": {"max": 500}, "currency": "EGP"}}`;

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
      console.warn('Orchestration API error, using fallback');
      return orchestrateFallback(userMessage, currentPreferences);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from response
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      try {
        const orchestrationData = JSON.parse(jsonText);
        return {
          intent: orchestrationData.intent || 'conversation',
          action: orchestrationData.action || 'GENERAL_CONVERSATION',
          confidence: orchestrationData.confidence || 0.7,
          extractedData: orchestrationData.extractedData || {},
          reasoning: orchestrationData.reasoning,
          needsClarification: orchestrationData.extractedData?.needsClarification || false
        };
      } catch (parseError) {
        console.warn('Failed to parse orchestration response, using fallback');
        return orchestrateFallback(userMessage, currentPreferences);
      }
    } else {
      return orchestrateFallback(userMessage, currentPreferences);
    }
  } catch (error) {
    console.error('Orchestration error:', error);
    return orchestrateFallback(userMessage, currentPreferences);
  }
};

/**
 * Fallback orchestration function
 */
const orchestrateFallback = (userMessage, currentPreferences) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for product search
  const searchKeywords = ['find', 'search', 'show', 'looking for', 'need', 'want', 'buy'];
  const productKeywords = ['shirt', 'jeans', 'dress', 'jacket', 'shoes', 'pants', 'top'];
  
  if (searchKeywords.some(kw => lowerMessage.includes(kw)) && 
      productKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      intent: 'product_search',
      action: 'SEARCH_PRODUCT',
      confidence: 0.7,
      extractedData: {
        searchQuery: userMessage.replace(/^(find|search|show|looking for|need|want|buy)\s+/i, '').trim()
      },
      needsClarification: false
    };
  }
  
  // Check for preference statements
  if (lowerMessage.includes('prefer') || lowerMessage.includes('like') || lowerMessage.includes('usually')) {
    return {
      intent: 'preference_update',
      action: 'MEMORIZE_PREFERENCE',
      confidence: 0.6,
      extractedData: {
        style: extractStyle(lowerMessage),
        occasion: extractOccasion(lowerMessage),
        budget: extractBudget(lowerMessage)
      },
      needsClarification: false
    };
  }
  
  // Default
  return {
    intent: 'conversation',
    action: 'GENERAL_CONVERSATION',
    confidence: 0.5,
    extractedData: {},
    needsClarification: false
  };
};

const extractStyle = (message) => {
  if (message.includes('smart casual')) return 'smart casual';
  if (message.includes('casual')) return 'casual';
  if (message.includes('formal')) return 'formal';
  if (message.includes('streetwear')) return 'streetwear';
  return null;
};

const extractOccasion = (message) => {
  if (message.includes('work') || message.includes('office')) return 'work';
  if (message.includes('date')) return 'date';
  if (message.includes('party')) return 'party';
  return null;
};

const extractBudget = (message) => {
  if (message.includes('budget') || message.includes('affordable')) return '$';
  if (message.includes('luxury') || message.includes('designer')) return '$$$$';
  return null;
};

/**
 * Detect user intent and extract preferences from natural language
 * @param {string} userMessage - The user's message
 * @param {Object} currentPreferences - Current user preferences
 * @returns {Promise<Object>} - Intent classification and extracted data
 */
export const detectUserIntent = async (userMessage, currentPreferences = {}) => {
  try {
    if (!GEMINI_API_KEY) {
      // Fallback to simple pattern matching
      return detectIntentFallback(userMessage, currentPreferences);
    }

    const prompt = `Analyze this user message and classify the intent. Respond ONLY with valid JSON in this exact format:
{
  "intent": "style_preference" | "product_search" | "conversation" | "question" | "preference_update",
  "confidence": 0.0-1.0,
  "extractedData": {
    "style": "string or null (e.g., 'smart casual', 'formal', 'streetwear')",
    "occasion": "string or null (e.g., 'work', 'date', 'party')",
    "budget": "string or null (e.g., '$', '$$', '$$$', '$$$$')",
    "searchQuery": "string or null (if intent is product_search)",
    "needsClarification": boolean
  }
}

User message: "${userMessage}"
Current preferences: ${JSON.stringify(currentPreferences)}

Examples:
- "I need something smart casual" → {"intent": "style_preference", "extractedData": {"style": "smart casual"}}
- "find me blue jeans" → {"intent": "product_search", "extractedData": {"searchQuery": "blue jeans"}}
- "what brands do you recommend?" → {"intent": "question"}
- "I need formal wear for work under 500 EGP" → {"intent": "preference_update", "extractedData": {"style": "formal", "occasion": "work", "budget": "$$"}}`;

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
      console.warn('Intent detection API error, using fallback');
      return detectIntentFallback(userMessage, currentPreferences);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from response (might have markdown code blocks)
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      try {
        const intentData = JSON.parse(jsonText);
        return {
          intent: intentData.intent || 'conversation',
          confidence: intentData.confidence || 0.5,
          extractedData: intentData.extractedData || {},
          ...intentData
        };
      } catch (parseError) {
        console.warn('Failed to parse intent detection response, using fallback');
        return detectIntentFallback(userMessage, currentPreferences);
      }
    } else {
      return detectIntentFallback(userMessage, currentPreferences);
    }
  } catch (error) {
    console.error('Intent detection error:', error);
    return detectIntentFallback(userMessage, currentPreferences);
  }
};

/**
 * Fallback intent detection using pattern matching
 * @param {string} userMessage - The user's message
 * @param {Object} currentPreferences - Current user preferences
 * @returns {Object} - Intent classification
 */
const detectIntentFallback = (userMessage, currentPreferences = {}) => {
  const lowerMessage = userMessage.toLowerCase().trim();
  const extractedData = {};
  
  // Detect style preferences
  const stylePatterns = {
    'smart casual': /smart\s+casual|business\s+casual/i,
    'casual': /\bcasual\b/i,
    'formal': /\bformal\b/i,
    'streetwear': /\bstreetwear|street\s+wear\b/i,
    'business': /\bbusiness\b/i,
    'sporty': /\bsporty|athletic\b/i,
    'elegant': /\belegant\b/i,
    'minimalist': /\bminimalist\b/i
  };
  
  for (const [style, pattern] of Object.entries(stylePatterns)) {
    if (pattern.test(lowerMessage)) {
      extractedData.style = style;
      break;
    }
  }
  
  // Detect occasion
  const occasionPatterns = {
    'work': /\bwork|office|professional\b/i,
    'date': /\bdate|romantic\b/i,
    'party': /\bparty|celebration|event\b/i,
    'everyday': /\beveryday|daily|casual\b/i,
    'special event': /\bspecial\s+event|wedding|formal\s+event\b/i
  };
  
  for (const [occasion, pattern] of Object.entries(occasionPatterns)) {
    if (pattern.test(lowerMessage)) {
      extractedData.occasion = occasion;
      break;
    }
  }
  
  // Detect budget
  if (/\bunder\s+\d+|below\s+\d+|budget|affordable|cheap\b/i.test(lowerMessage)) {
    extractedData.budget = '$';
  } else if (/\bmoderate|mid\s+range|medium\b/i.test(lowerMessage)) {
    extractedData.budget = '$$';
  } else if (/\bpremium|high\s+end|expensive\b/i.test(lowerMessage)) {
    extractedData.budget = '$$$';
  } else if (/\bluxury|designer|exclusive\b/i.test(lowerMessage)) {
    extractedData.budget = '$$$$';
  }
  
  // Detect product search
  const searchKeywords = ['find', 'search', 'show me', 'looking for', 'need', 'want', 'buy', 'where can i'];
  const isSearch = searchKeywords.some(keyword => lowerMessage.includes(keyword)) &&
                   (lowerMessage.includes('shirt') || lowerMessage.includes('jeans') || 
                    lowerMessage.includes('dress') || lowerMessage.includes('jacket') ||
                    lowerMessage.includes('shoes') || lowerMessage.includes('pants'));
  
  if (isSearch) {
    // Extract search query
    const searchQuery = userMessage
      .replace(/^(find|search|show me|looking for|need|want|buy|where can i)\s+/i, '')
      .trim();
    extractedData.searchQuery = searchQuery || userMessage;
    
    return {
      intent: 'product_search',
      confidence: 0.7,
      extractedData
    };
  }
  
  // If style/occasion/budget detected, it's a preference update
  if (extractedData.style || extractedData.occasion || extractedData.budget) {
    return {
      intent: 'preference_update',
      confidence: 0.8,
      extractedData
    };
  }
  
  // Check if it's a question
  if (lowerMessage.startsWith('what') || lowerMessage.startsWith('how') || 
      lowerMessage.startsWith('why') || lowerMessage.startsWith('when') ||
      lowerMessage.includes('?')) {
    return {
      intent: 'question',
      confidence: 0.6,
      extractedData: {}
    };
  }
  
  // Default to conversation
  return {
    intent: 'conversation',
    confidence: 0.5,
    extractedData: {}
  };
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
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured');
      return `Based on your preferences for ${preferences.style || 'style'}, ${preferences.occasion || 'occasion'}, and ${preferences.budget || 'budget'} budget, I have some excellent brand recommendations for you.`;
    }

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
      const errorMessage = getErrorMessage(response.status, response.statusText);
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      throw new Error(errorMessage);
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

