import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from './ChatAssistant.module.css';
import { brands } from '../../data/brands';
import { hapticMessage, hapticSelect } from '../../utils/haptics';

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

  const addAIMessage = (message) => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage(message, false);
      setIsTyping(false);
    }, 800);
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

  const showRecommendations = () => {
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
    
    addAIMessage({
      text: `Perfect! Based on your preferences for ${userPreferences.style || 'style'}, ${userPreferences.occasion || 'occasion'}, and ${userPreferences.budget || 'budget'} budget, here are my top brand recommendations:`,
      type: 'brands',
      brands: recommendedBrands.map(b => b.id)
    });
    
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

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    hapticMessage();
    const userMessage = { text: inputValue };
    addMessage(userMessage, true);
    setInputValue('');

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
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
    }, 1000);
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

