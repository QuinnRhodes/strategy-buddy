import { useState, useRef, useEffect } from 'react'
import './App.css'
import { sendMessage } from './services/openai'
import { useAuth } from './context/AuthContext'
import { PdfDragDrop } from './components/PdfDragDrop'
import './components/PdfDragDrop.css'

// Version 1.3.1 - Added debugging logs
// Version 1.4.0 - Hide PDF drag and drop feature

// Flag to hide the PDF drag and drop feature
const HIDE_PDF_DRAG_DROP = true;

type Message = {
  text: string;
  isUser: boolean;
}

function App() {
  console.log('App component rendering');
  
  // Only keep the variables we're actually using
  const { loading, signOut } = useAuth();
  
  console.log('Auth state:', { loading });
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi, I'm Strategy Buddy. How can I help you?", isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log('Messages updated, scrolling to bottom');
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response, passing selected PDFs
      const response = await sendMessage(input, selectedPdfIds);
      const aiMessage: Message = { text: response || 'No response', isUser: false };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { 
        text: 'Sorry, there was an error processing your request.',
        isUser: false 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfSelection = (pdfIds: string[]) => {
    setSelectedPdfIds(pdfIds);
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Strategy Buddy...</p>
      </div>
    );
  }

  console.log('Rendering main app interface');
  
  // Auth bypass - skip all authentication checks and go straight to the chat UI
  // Show chat interface for all cases
  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">Strategy Buddy</h1>
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
      {/* PDF drag and drop component - conditionally rendered based on HIDE_PDF_DRAG_DROP flag */}
      {!HIDE_PDF_DRAG_DROP && <PdfDragDrop onPdfSelection={handlePdfSelection} />}
      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-bubble">{message.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="loading">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          disabled={isLoading}
          className="message-input"
          aria-label="Message input"
        />
        <button 
          type="submit" 
          disabled={isLoading} 
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default App
