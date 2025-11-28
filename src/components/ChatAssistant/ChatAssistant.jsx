import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from './ChatAssistant.module.css';
import { brands } from '../../data/brands';
import { hapticMessage, hapticSelect } from '../../utils/haptics';
import { generateAIResponse, generateBrandRecommendations, detectUserIntent } from '../../services/gemini';
import { parseMarkupResponse } from '../../utils/markupParser';
import { searchProducts, isSearchQuery, extractSearchQuery } from '../../services/productSearch';

const AI_NAME = 'Aria';

const CONVERSATION_STAGES = {
  WELCOME: 'welcome',
  STYLE_PREFERENCE: 'style_preference',
  OCCASION: 'occasion',
  BUDGET: 'budget',
  RECOMMENDATIONS: 'recommendations'
};

function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationStage, setConversationStage] = useState(CONVERSATION_STAGES.WELCOME);
  const [userPreferences, setUserPreferences] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Initial welcome message - more inviting and less prescriptive
    setTimeout(() => {
      addAIMessage({
        text: `Hi! I'm ${AI_NAME}, your personal styling assistant. I'm here to help you discover your perfect style. You can tell me what you're looking for, ask me to find products, or we can chat about your style preferences. What would you like to explore today?`,
        options: ['Find products', 'Get style advice', 'Browse brands'],
        onOptionClick: (option) => {
          hapticSelect();
          if (option === 'Find products') {
            addMessage({ text: 'Find products' }, true);
            addAIMessage({
              text: "Great! Just tell me what you're looking for. For example, you could say 'find me blue jeans' or 'show me dresses under 500 EGP'."
            });
          } else if (option === 'Get style advice') {
            addMessage({ text: 'Get style advice' }, true);
            setTimeout(() => askStylePreference(), 500);
          } else {
            addMessage({ text: 'Browse brands' }, true);
            setTimeout(() => showRecommendations(), 500);
          }
        }
      });
    }, 500);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message, isUser = false) => {
    const newMessage = {
      ...message,
      id: Date.now(),
      isUser,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addAIMessage = (message, useAI = false, userInput = '') => {
    setIsTyping(true);
    
    if (useAI && userInput) {
      // Use real AI for response
      const conversationHistory = messages.map(msg => ({
        text: msg.text,
        isUser: msg.isUser
      }));
      
      generateAIResponse(userInput, conversationHistory, userPreferences)
        .then(aiResponse => {
          // Parse markup response into message format
          const parsedMessage = parseMarkupResponse(aiResponse);
          addMessage(parsedMessage, false);
          setIsTyping(false);
        })
        .catch(error => {
          console.error('AI error:', error);
          // Fallback to original message if AI fails
          addMessage(message, false);
          setIsTyping(false);
        });
    } else {
      // Use predefined message
      setTimeout(() => {
        addMessage(message, false);
        setIsTyping(false);
      }, 800);
    }
  };

  const askStylePreference = () => {
    setConversationStage(CONVERSATION_STAGES.STYLE_PREFERENCE);
    addAIMessage({
      text: "What's your style preference?",
      options: ['Casual', 'Formal', 'Streetwear', 'Business', 'Sporty'],
      onOptionClick: (option) => {
        hapticSelect();
        setUserPreferences(prev => ({ ...prev, style: option.toLowerCase() }));
        addMessage({ text: option }, true);
        setTimeout(() => askOccasion(), 500);
      }
    });
  };

  const askOccasion = () => {
    setConversationStage(CONVERSATION_STAGES.OCCASION);
    addAIMessage({
      text: "What's the occasion?",
      options: ['Work', 'Date', 'Party', 'Everyday', 'Special Event'],
      onOptionClick: (option) => {
        hapticSelect();
        setUserPreferences(prev => ({ ...prev, occasion: option.toLowerCase() }));
        addMessage({ text: option }, true);
        setTimeout(() => askBudget(), 500);
      }
    });
  };

  const askBudget = () => {
    setConversationStage(CONVERSATION_STAGES.BUDGET);
    addAIMessage({
      text: "What's your budget range?",
      options: ['Budget-friendly ($)', 'Moderate ($$)', 'Premium ($$$)', 'Luxury ($$$$)'],
        onOptionClick: (option) => {
        hapticSelect();
        const budgetMap = {
          'Budget-friendly ($)': '$',
          'Moderate ($$)': '$$',
          'Premium ($$$)': '$$$',
          'Luxury ($$$$)': '$$$$'
        };
        setUserPreferences(prev => ({ ...prev, budget: budgetMap[option] }));
        addMessage({ text: option }, true);
        setTimeout(() => showRecommendations(), 500);
      }
    });
  };

  const showRecommendations = async () => {
    setConversationStage(CONVERSATION_STAGES.RECOMMENDATIONS);
    
    // Filter brands based on preferences
    let recommendedBrands = brands;
    
    if (userPreferences.budget) {
      recommendedBrands = recommendedBrands.filter(b => b.priceRange === userPreferences.budget);
    }
    
    if (userPreferences.style === 'luxury' || userPreferences.budget === '$$$$') {
      recommendedBrands = recommendedBrands.filter(b => b.category === 'luxury');
    } else if (userPreferences.style === 'sporty') {
      recommendedBrands = recommendedBrands.filter(b => b.category === 'sportswear');
    }
    
    // Take top 6 brands
    recommendedBrands = recommendedBrands.slice(0, 6);
    
    // Use AI to generate personalized recommendation text
    setIsTyping(true);
    try {
      const aiRecommendation = await generateBrandRecommendations(userPreferences);
      // Parse markup response
      const parsedMessage = parseMarkupResponse(aiRecommendation);
      // Merge with brand data
      addMessage({
        ...parsedMessage,
        type: 'brands',
        brands: recommendedBrands.map(b => b.id)
      }, false);
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Fallback to default message - this is fine, we still show brands
      addMessage({
        text: `Perfect! Based on your preferences for ${userPreferences.style || 'style'}, ${userPreferences.occasion || 'occasion'}, and ${userPreferences.budget || 'budget'} budget, here are my top brand recommendations:`,
        type: 'brands',
        brands: recommendedBrands.map(b => b.id)
      }, false);
    } finally {
      setIsTyping(false);
    }
    
    setTimeout(() => {
      addAIMessage({
        text: "Would you like to explore more options or start a new style consultation?",
        options: ['Explore more', 'New consultation', 'I\'m good, thanks!'],
        onOptionClick: (option) => {
          hapticSelect();
          if (option === 'New consultation') {
            resetConversation();
          } else if (option === 'Explore more') {
            addAIMessage({
              text: "Great! Let me show you more brands that might interest you.",
              type: 'brands',
              brands: brands.slice(6, 12).map(b => b.id)
            });
          } else {
            addAIMessage({
              text: "Perfect! Feel free to return anytime for personalized style guidance."
            });
          }
        }
      });
    }, 1000);
  };

  const resetConversation = () => {
    setMessages([]);
    setUserPreferences({});
    setConversationStage(CONVERSATION_STAGES.WELCOME);
    setTimeout(() => {
      addAIMessage({
        text: "Let's start fresh! What style are you looking for today?",
        options: ['Let\'s start!'],
        onOptionClick: () => {
          hapticSelect();
          askStylePreference();
        }
      });
    }, 500);
  };

  const searchProductsHandler = async (query) => {
    const extractedQuery = extractSearchQuery(query);
    
    if (!extractedQuery || extractedQuery.length < 2) {
      addMessage({
        text: `Please provide a more specific search query (at least 2 characters). For example: "blue jeans", "dresses", or "winter jackets".`
      }, false);
      return;
    }

    setIsSearching(true);
    setSearchQuery(extractedQuery);
    
    // Show searching message
    const searchingMessageId = Date.now();
    addMessage({
      id: searchingMessageId,
      text: `Searching for "${extractedQuery}" across stores...`,
      type: 'searching',
      isSearching: true
    }, false);

    try {
      const products = await searchProducts(extractedQuery, { maxResults: 20 });

      // Remove searching message
      setMessages(prev => prev.filter(msg => msg.id !== searchingMessageId));

      if (products.length > 0) {
        addMessage({
          text: `Found ${products.length} product${products.length > 1 ? 's' : ''} for "${extractedQuery}":`,
          type: 'products',
          products: products
        }, false);
      } else {
        addMessage({
          text: `I couldn't find any products for "${extractedQuery}". Try:\n• Using different keywords\n• Being more specific (e.g., "blue denim jeans" instead of "jeans")\n• Checking back later as stores update their inventory`,
          options: ['Try different keywords', 'Search something else'],
          onOptionClick: (option) => {
            hapticSelect();
            if (option === 'Search something else') {
              addAIMessage({
                text: "What would you like to search for?"
              });
            }
          }
        }, false);
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Remove searching message
      setMessages(prev => prev.filter(msg => msg.id !== searchingMessageId));
      
      let errorMessage = `Sorry, I encountered an error while searching for "${extractedQuery}". `;
      let showRetry = false;
      
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage += 'The search took too long. Please try again with a more specific query.';
        showRetry = true;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'There seems to be a network issue. Please check your connection and try again.';
        showRetry = true;
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage += 'The search query might be invalid. Please try rephrasing your search.';
      } else if (error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
        errorMessage += 'The search service is temporarily unavailable. Please try again in a moment.';
        showRetry = true;
      } else {
        errorMessage += 'Please try again in a moment.';
        showRetry = true;
      }
      
      addMessage({
        text: errorMessage,
        options: showRetry ? ['Retry search', 'Try different query'] : [],
        onOptionClick: (option) => {
          hapticSelect();
          if (option === 'Retry search') {
            searchProductsHandler(query);
          } else if (option === 'Try different query') {
            addAIMessage({
              text: "What would you like to search for instead?"
            });
          }
        }
      }, false);
    } finally {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    hapticMessage();
    const userMessage = { text: inputValue };
    const userInput = inputValue.trim();
    addMessage(userMessage, true);
    setInputValue('');

    setIsTyping(true);

    try {
      // Detect user intent first
      const intentData = await detectUserIntent(userInput, userPreferences);
      const { intent, extractedData } = intentData;

      // Handle different intents
      if (intent === 'product_search') {
        setIsTyping(false);
        const searchQuery = extractedData.searchQuery || extractSearchQuery(userInput);
        if (searchQuery) {
          await searchProductsHandler(searchQuery);
        } else {
          addMessage({
            text: "I'd be happy to help you search! What product are you looking for? For example, 'blue jeans', 'winter jackets', or 'dresses under 500 EGP'."
          }, false);
        }
        return;
      }

      // Handle preference updates (style, occasion, budget)
      if (intent === 'preference_update' || intent === 'style_preference') {
        const updatedPreferences = { ...userPreferences };
        let hasUpdates = false;

        if (extractedData.style) {
          updatedPreferences.style = extractedData.style;
          hasUpdates = true;
        }
        if (extractedData.occasion) {
          updatedPreferences.occasion = extractedData.occasion;
          hasUpdates = true;
        }
        if (extractedData.budget) {
          updatedPreferences.budget = extractedData.budget;
          hasUpdates = true;
        }

        if (hasUpdates) {
          setUserPreferences(updatedPreferences);
          
          // Check if we have enough info for recommendations
          const hasStyle = updatedPreferences.style;
          const hasOccasion = updatedPreferences.occasion;
          const hasBudget = updatedPreferences.budget;

          if (hasStyle && hasOccasion && hasBudget) {
            // We have all preferences, show recommendations
            setIsTyping(false);
            setTimeout(() => showRecommendations(), 500);
            return;
          } else {
            // Ask for missing information naturally
            setIsTyping(false);
            const missing = [];
            if (!hasStyle) missing.push('style preference');
            if (!hasOccasion) missing.push('occasion');
            if (!hasBudget) missing.push('budget range');

            let followUpText = "Got it! ";
            if (extractedData.style) followUpText += `I see you're looking for ${extractedData.style} style. `;
            if (extractedData.occasion) followUpText += `For ${extractedData.occasion}, `;
            if (extractedData.budget) followUpText += `with a ${extractedData.budget === '$' ? 'budget-friendly' : extractedData.budget === '$$' ? 'moderate' : extractedData.budget === '$$$' ? 'premium' : 'luxury'} budget. `;
            
            if (missing.length > 0) {
              followUpText += `To give you the best recommendations, could you tell me ${missing.length === 1 ? 'your ' + missing[0] : 'about ' + missing.join(' and ')}?`;
            }

            addAIMessage({
              text: followUpText,
              options: missing.includes('style preference') ? ['Casual', 'Formal', 'Smart Casual', 'Streetwear'] : 
                       missing.includes('occasion') ? ['Work', 'Date', 'Party', 'Everyday'] :
                       missing.includes('budget range') ? ['Budget-friendly ($)', 'Moderate ($$)', 'Premium ($$$)', 'Luxury ($$$$)'] : [],
              onOptionClick: (option) => {
                hapticSelect();
                const newPrefs = { ...updatedPreferences };
                if (missing.includes('style preference')) {
                  newPrefs.style = option.toLowerCase();
                } else if (missing.includes('occasion')) {
                  newPrefs.occasion = option.toLowerCase();
                } else if (missing.includes('budget range')) {
                  const budgetMap = {
                    'Budget-friendly ($)': '$',
                    'Moderate ($$)': '$$',
                    'Premium ($$$)': '$$$',
                    'Luxury ($$$$)': '$$$$'
                  };
                  newPrefs.budget = budgetMap[option];
                }
                setUserPreferences(newPrefs);
                addMessage({ text: option }, true);
                setTimeout(() => {
                  if (newPrefs.style && newPrefs.occasion && newPrefs.budget) {
                    showRecommendations();
                  } else {
                    // Ask for remaining missing info
                    const stillMissing = [];
                    if (!newPrefs.style) stillMissing.push('style preference');
                    if (!newPrefs.occasion) stillMissing.push('occasion');
                    if (!newPrefs.budget) stillMissing.push('budget range');
                    
                    if (stillMissing.length > 0) {
                      addAIMessage({
                        text: `Great! ${stillMissing.length === 1 ? 'What about your ' + stillMissing[0] + '?' : 'Could you also tell me about ' + stillMissing.join(' and ') + '?'}`,
                        options: stillMissing.includes('style preference') ? ['Casual', 'Formal', 'Smart Casual', 'Streetwear'] : 
                                 stillMissing.includes('occasion') ? ['Work', 'Date', 'Party', 'Everyday'] :
                                 stillMissing.includes('budget range') ? ['Budget-friendly ($)', 'Moderate ($$)', 'Premium ($$$)', 'Luxury ($$$$)'] : []
                      });
                    }
                  }
                }, 500);
              }
            });
            return;
          }
        }
      }

      // Check if user is asking to start over or reset
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('start over') || lowerInput.includes('reset') || lowerInput.includes('new consultation')) {
        resetConversation();
        setIsTyping(false);
        return;
      }

      // Use AI to generate conversational response
      const conversationHistory = messages.map(msg => ({
        text: msg.text,
        isUser: msg.isUser
      }));
      
      const aiResponse = await generateAIResponse(userInput, conversationHistory, userPreferences);
      
      // Parse markup response and show AI response
      const parsedMessage = parseMarkupResponse(aiResponse);
      addMessage(parsedMessage, false);
      setIsTyping(false);

      // If we're in welcome stage and user hasn't provided preferences, suggest getting recommendations
      if (conversationStage === CONVERSATION_STAGES.WELCOME && 
          !userPreferences.style && !userPreferences.occasion && !userPreferences.budget) {
        setTimeout(() => {
          addAIMessage({
            text: "I can help you find the perfect brands and outfits! Would you like to tell me about your style preferences, or would you prefer to search for specific products?",
            options: ['Tell me about style', 'Search products', 'Browse brands'],
            onOptionClick: (option) => {
              hapticSelect();
              if (option === 'Tell me about style') {
                askStylePreference();
              } else if (option === 'Search products') {
                addAIMessage({
                  text: "Just tell me what you're looking for! For example: 'find me blue jeans' or 'show me dresses under 500 EGP'."
                });
              } else {
                showRecommendations();
              }
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.error('AI error:', error);
      setIsTyping(false);
      
      // Provide helpful error message based on error type
      let errorMessage = "I'm having trouble connecting right now. ";
      
      if (error.message && error.message.includes('403')) {
        errorMessage += "The API key may need to be configured. ";
      } else if (error.message && error.message.includes('network')) {
        errorMessage += "Please check your internet connection. ";
      } else if (error.message && error.message.includes('timeout')) {
        errorMessage += "The request took too long. ";
      }
      
      errorMessage += "But I can still help you!";
      
      // Fallback response with helpful options
      addAIMessage({
        text: errorMessage,
        options: ['Get style advice', 'Search products', 'Start over'],
        onOptionClick: (option) => {
          hapticSelect();
          if (option === 'Start over') {
            resetConversation();
          } else if (option === 'Get style advice') {
            askStylePreference();
          } else if (option === 'Search products') {
            addAIMessage({
              text: "What would you like to search for? Just describe the product you're looking for."
            });
          }
        }
      });
    }
  };

  return (
    <div className={styles.chatAssistant}>
      <div className={styles.chatContainer} ref={chatContainerRef}>
        <div className={styles.messages}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.isUser}
            />
          ))}
          {isTyping && !isSearching && (
            <div className={styles.typingIndicator}>
              <div className={styles.avatar}>{AI_NAME.charAt(0)}</div>
              <div className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          {isSearching && (
            <div className={styles.searchingIndicator}>
              <div className={styles.avatar}>{AI_NAME.charAt(0)}</div>
              <div className={styles.searchingMessage}>
                <div className={styles.searchingSpinner}></div>
                <span>Searching across stores...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form className={styles.inputForm} onSubmit={handleSend}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className={styles.input}
          disabled={isTyping}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!inputValue.trim() || isTyping}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default ChatAssistant;

