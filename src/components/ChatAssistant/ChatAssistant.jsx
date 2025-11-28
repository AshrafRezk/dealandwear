import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from './ChatAssistant.module.css';
import { brands } from '../../data/brands';
import { hapticMessage, hapticSelect } from '../../utils/haptics';
import { generateAIResponse, generateBrandRecommendations } from '../../services/gemini';
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
  const [conversationStage, setConversationStage] = useState(CONVERSATION_STAGES.WELCOME);
  const [userPreferences, setUserPreferences] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Initial welcome message
    setTimeout(() => {
      addAIMessage({
        text: `Hello, I'm ${AI_NAME}, your personal styling assistant. Let's discover your perfect style together.`,
        options: ['Let\'s start', 'Tell me more'],
        onOptionClick: (option) => {
          hapticSelect();
          if (option === "Let's start") {
            askStylePreference();
          } else {
            addAIMessage({
              text: "I'll ask you a few questions about your style preferences, occasion, and budget to recommend the perfect brands and outfits for you!"
            });
            setTimeout(() => askStylePreference(), 1500);
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
      // Fallback to default message
      addMessage({
        text: `Perfect! Based on your preferences for ${userPreferences.style || 'style'}, ${userPreferences.occasion || 'occasion'}, and ${userPreferences.budget || 'budget'} budget, here are my top brand recommendations:`,
        type: 'brands',
        brands: recommendedBrands.map(b => b.id)
      }, false);
    }
    setIsTyping(false);
    
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
    setIsTyping(true);
    try {
      const searchQuery = extractSearchQuery(query);
      
      if (!searchQuery || searchQuery.length < 2) {
        addMessage({
          text: `Please provide a more specific search query (at least 2 characters). For example: "blue jeans", "dresses", or "winter jackets".`
        }, false);
        setIsTyping(false);
        return;
      }

      const products = await searchProducts(searchQuery, { maxResults: 20 });

      if (products.length > 0) {
        addMessage({
          text: `I found ${products.length} product${products.length > 1 ? 's' : ''} for "${searchQuery}":`,
          type: 'products',
          products: products
        }, false);
      } else {
        addMessage({
          text: `I couldn't find any products for "${searchQuery}". Try:\n• Using different keywords\n• Being more specific (e.g., "blue denim jeans" instead of "jeans")\n• Checking back later as stores update their inventory`
        }, false);
      }
    } catch (error) {
      console.error('Search error:', error);
      
      let errorMessage = `Sorry, I encountered an error while searching for "${extractSearchQuery(query)}". `;
      
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage += 'The search took too long. Please try again with a more specific query.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'There seems to be a network issue. Please check your connection and try again.';
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage += 'The search query might be invalid. Please try rephrasing your search.';
      } else {
        errorMessage += 'Please try again in a moment.';
      }
      
      addMessage({
        text: errorMessage
      }, false);
    } finally {
      setIsTyping(false);
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

    // Check if this is a product search query
    if (isSearchQuery(userInput)) {
      await searchProductsHandler(userInput);
      return;
    }

    // Use AI to generate response
    setIsTyping(true);
    try {
      const conversationHistory = messages.map(msg => ({
        text: msg.text,
        isUser: msg.isUser
      }));
      
      const aiResponse = await generateAIResponse(userInput, conversationHistory, userPreferences);
      
      // Check if user is asking to start over or continue
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('start over') || lowerInput.includes('reset') || lowerInput.includes('new')) {
        resetConversation();
        setIsTyping(false);
        return;
      }
      
      if (lowerInput.includes('continue') || lowerInput.includes('yes') || lowerInput.includes('sure')) {
        if (conversationStage === CONVERSATION_STAGES.WELCOME) {
          setIsTyping(false);
          setTimeout(() => askStylePreference(), 500);
          return;
        }
      }
      
      // Parse markup response and show AI response with potential options
      const parsedMessage = parseMarkupResponse(aiResponse);
      addMessage(parsedMessage, false);
      setIsTyping(false);
      
      // Offer to continue with guided experience if in welcome stage
      if (conversationStage === CONVERSATION_STAGES.WELCOME) {
        setTimeout(() => {
          addAIMessage({
            text: "Would you like to continue with the guided experience to get personalized brand recommendations?",
            options: ['Yes, continue', 'Keep chatting'],
            onOptionClick: (option) => {
              hapticSelect();
              if (option === 'Yes, continue') {
                askStylePreference();
              }
            }
          });
        }, 500);
      }
    } catch (error) {
      console.error('AI error:', error);
      setIsTyping(false);
      // Fallback response
      addAIMessage({
        text: "Thanks for your input! Let me help you find the perfect style. Would you like to continue with the guided experience?",
        options: ['Yes, continue', 'Start over'],
        onOptionClick: (option) => {
          hapticSelect();
          if (option === 'Start over') {
            resetConversation();
          } else {
            if (conversationStage === CONVERSATION_STAGES.WELCOME) {
              askStylePreference();
            }
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
          {isTyping && (
            <div className={styles.typingIndicator}>
              <div className={styles.avatar}>{AI_NAME.charAt(0)}</div>
              <div className={styles.typingDots}>
                <span></span>
                <span></span>
                <span></span>
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

