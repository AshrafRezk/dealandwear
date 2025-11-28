/**
 * Orchestration Service
 * Analyzes user messages and determines the appropriate action to take
 */

import { detectUserIntent, orchestrateUserMessage as geminiOrchestrate } from './gemini';

// Action types
export const ACTION_TYPES = {
  SEARCH_PRODUCT: 'SEARCH_PRODUCT',
  STYLE_ADVICE: 'STYLE_ADVICE',
  MEMORIZE_PREFERENCE: 'MEMORIZE_PREFERENCE',
  GENERAL_CONVERSATION: 'GENERAL_CONVERSATION',
  ASK_QUESTION: 'ASK_QUESTION'
};

/**
 * Orchestrate user message - determine what action to take
 * @param {string} userMessage - The user's message
 * @param {Object} currentPreferences - Current user preferences from memory
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - Orchestration result with action plan
 */
export const orchestrateUserMessage = async (userMessage, currentPreferences = {}, conversationHistory = []) => {
  try {
    // Try using enhanced AI orchestration first (if available)
    if (geminiOrchestrate) {
      try {
        const aiOrchestration = await geminiOrchestrate(userMessage, currentPreferences, conversationHistory);
        if (aiOrchestration && aiOrchestration.action) {
          // Map action to ACTION_TYPES
          const actionMap = {
            'SEARCH_PRODUCT': ACTION_TYPES.SEARCH_PRODUCT,
            'STYLE_ADVICE': ACTION_TYPES.STYLE_ADVICE,
            'MEMORIZE_PREFERENCE': ACTION_TYPES.MEMORIZE_PREFERENCE,
            'GENERAL_CONVERSATION': ACTION_TYPES.GENERAL_CONVERSATION,
            'ASK_QUESTION': ACTION_TYPES.ASK_QUESTION
          };
          
          return {
            action: actionMap[aiOrchestration.action] || ACTION_TYPES.GENERAL_CONVERSATION,
            parameters: aiOrchestration.extractedData || {},
            confidence: aiOrchestration.confidence || 0.7,
            needsClarification: aiOrchestration.needsClarification || false,
            originalIntent: aiOrchestration.intent
          };
        }
      } catch (error) {
        console.warn('AI orchestration failed, using fallback:', error);
      }
    }
    
    // Fallback to intent detection
    const intentData = await detectUserIntent(userMessage, currentPreferences);
    const { intent, extractedData, confidence } = intentData;

    // Determine action type based on intent
    let action = ACTION_TYPES.GENERAL_CONVERSATION;
    let parameters = {};
    let needsClarification = false;

    // Route based on detected intent
    if (intent === 'product_search') {
      action = ACTION_TYPES.SEARCH_PRODUCT;
      parameters = {
        query: extractedData.searchQuery || userMessage,
        priceRange: extractedData.maxPrice || extractedData.minPrice ? {
          min: extractedData.minPrice,
          max: extractedData.maxPrice
        } : null,
        currency: extractedData.currency || 'EGP'
      };
      
      // Check if query is clear enough
      if (!parameters.query || parameters.query.length < 2) {
        needsClarification = true;
        parameters.clarificationNeeded = 'What product are you looking for?';
      }
    } else if (intent === 'preference_update' || intent === 'style_preference') {
      // Check if user is stating preferences to memorize
      const hasPreferenceData = extractedData.style || extractedData.occasion || extractedData.budget;
      
      if (hasPreferenceData) {
        action = ACTION_TYPES.MEMORIZE_PREFERENCE;
        parameters = {
          style: extractedData.style,
          occasion: extractedData.occasion,
          budget: extractedData.budget,
          // Check if user wants to update or just stating
          isUpdate: userMessage.toLowerCase().includes('prefer') || 
                   userMessage.toLowerCase().includes('like') ||
                   userMessage.toLowerCase().includes('usually')
        };
      } else {
        // Might be asking for advice
        action = ACTION_TYPES.STYLE_ADVICE;
        parameters = {
          context: userMessage,
          useSavedPreferences: true
        };
      }
    } else if (intent === 'question') {
      // Check if it's a style advice question
      const lowerMessage = userMessage.toLowerCase();
      const isStyleQuestion = lowerMessage.includes('wear') || 
                            lowerMessage.includes('outfit') ||
                            lowerMessage.includes('style') ||
                            lowerMessage.includes('fashion') ||
                            lowerMessage.includes('recommend') ||
                            lowerMessage.includes('suggest');
      
      if (isStyleQuestion) {
        action = ACTION_TYPES.STYLE_ADVICE;
        parameters = {
          question: userMessage,
          useSavedPreferences: true
        };
      } else {
        action = ACTION_TYPES.ASK_QUESTION;
        parameters = {
          question: userMessage
        };
      }
    } else {
      // General conversation
      action = ACTION_TYPES.GENERAL_CONVERSATION;
      parameters = {
        message: userMessage
      };
    }

    // Check if we need clarification based on confidence
    if (confidence < 0.6) {
      needsClarification = true;
    }

    return {
      action,
      parameters,
      confidence: confidence || 0.7,
      needsClarification,
      originalIntent: intent,
      extractedData
    };
  } catch (error) {
    console.error('Orchestration error:', error);
    
    // Fallback: try to determine action from message patterns
    return orchestrateFallback(userMessage, currentPreferences);
  }
};

/**
 * Fallback orchestration using pattern matching
 * @param {string} userMessage - The user's message
 * @param {Object} currentPreferences - Current preferences
 * @returns {Object} - Orchestration result
 */
const orchestrateFallback = (userMessage, currentPreferences) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for product search keywords
  const searchKeywords = ['find', 'search', 'show', 'looking for', 'need', 'want', 'buy', 'where can i'];
  const productKeywords = ['shirt', 'jeans', 'dress', 'jacket', 'shoes', 'pants', 'top', 'bottom', 'outfit'];
  
  const isSearch = searchKeywords.some(kw => lowerMessage.includes(kw)) &&
                   productKeywords.some(kw => lowerMessage.includes(kw));
  
  if (isSearch) {
    return {
      action: ACTION_TYPES.SEARCH_PRODUCT,
      parameters: {
        query: userMessage.replace(/^(find|search|show|looking for|need|want|buy|where can i)\s+/i, '').trim()
      },
      confidence: 0.7,
      needsClarification: false
    };
  }
  
  // Check for preference statements
  const preferenceKeywords = ['prefer', 'like', 'usually', 'always', 'favorite', 'love'];
  if (preferenceKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      action: ACTION_TYPES.MEMORIZE_PREFERENCE,
      parameters: {
        style: extractStyleFromMessage(userMessage),
        occasion: extractOccasionFromMessage(userMessage),
        budget: extractBudgetFromMessage(userMessage)
      },
      confidence: 0.6,
      needsClarification: false
    };
  }
  
  // Check for advice questions
  const adviceKeywords = ['what should', 'what to wear', 'recommend', 'suggest', 'advice'];
  if (adviceKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      action: ACTION_TYPES.STYLE_ADVICE,
      parameters: {
        question: userMessage,
        useSavedPreferences: true
      },
      confidence: 0.7,
      needsClarification: false
    };
  }
  
  // Default to general conversation
  return {
    action: ACTION_TYPES.GENERAL_CONVERSATION,
    parameters: {
      message: userMessage
    },
    confidence: 0.5,
    needsClarification: false
  };
};

/**
 * Extract style from message (fallback)
 */
const extractStyleFromMessage = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('casual')) return 'casual';
  if (lower.includes('formal')) return 'formal';
  if (lower.includes('smart casual')) return 'smart casual';
  if (lower.includes('streetwear')) return 'streetwear';
  if (lower.includes('business')) return 'business';
  if (lower.includes('sporty')) return 'sporty';
  if (lower.includes('minimalist')) return 'minimalist';
  return null;
};

/**
 * Extract occasion from message (fallback)
 */
const extractOccasionFromMessage = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('work') || lower.includes('office')) return 'work';
  if (lower.includes('date')) return 'date';
  if (lower.includes('party') || lower.includes('event')) return 'party';
  if (lower.includes('everyday') || lower.includes('daily')) return 'everyday';
  return null;
};

/**
 * Extract budget from message (fallback)
 */
const extractBudgetFromMessage = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('budget') || lower.includes('affordable') || lower.includes('cheap')) return '$';
  if (lower.includes('moderate') || lower.includes('mid')) return '$$';
  if (lower.includes('premium') || lower.includes('high end')) return '$$$';
  if (lower.includes('luxury') || lower.includes('designer')) return '$$$$';
  return null;
};
