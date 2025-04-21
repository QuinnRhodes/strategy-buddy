import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'
import { sendMessage } from './services/openai'
import { useAuth } from './context/AuthContext'
import { PdfDragDrop } from './components/PdfDragDrop'
import { PdfViewer } from './components/PdfViewer'
import './components/PdfDragDrop.css'

// Version 1.3.1 - Added debugging logs
// Version 1.4.0 - Hide PDF drag and drop feature
// Version 1.5.0 - Enable PDF integration with Supabase
// Version 1.5.1 - Fix PDF display and layout issues
// Version 1.5.2 - Add markdown formatting for responses
// Version 1.6.0 - Hide PDF elements (keeping code for future use)

// Flag to enable/disable the PDF feature (set to true to hide)
const HIDE_PDF_DRAG_DROP = true;

type Message = {
  text: string;
  isUser: boolean;
}

type SelectedPdf = {
  id: string;
  path?: string;
  url?: string;
  name?: string;
} | null;

// Define the props type for App
interface AppProps {
  version?: 'strategy1' | 'strategy2';
}

function App({ version }: AppProps) {
  console.log('App component rendering with version:', version);

  const navigate = useNavigate();
  const { loading, signOut } = useAuth();

  console.log('Auth state:', { loading });

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi, I'm Strategy Buddy. How can I help you?", isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [currentPdf, setCurrentPdf] = useState<SelectedPdf>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [appTitle, setAppTitle] = useState('Strategy Buddy');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log('Messages updated, scrolling to bottom');
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  // Set the appropriate title and body class based on version
  useEffect(() => {
    if (version === 'strategy1') {
      setAppTitle('Strategy Test 1');
      // Add strategy1-page class for specific background
      document.body.classList.add('strategy1-page');
      // Remove any other page-specific classes
      document.body.classList.remove('strategy2-page');
      setMessages([{ text: "Hi, I'm Strategy Test 1. How can I help with your business planning?", isUser: false }]);
    } else if (version === 'strategy2') {
      setAppTitle('Strategy Test 2');
      // Add strategy2-page class to body for specific background
      document.body.classList.add('strategy2-page');
      // Remove strategy1-page class
      document.body.classList.remove('strategy1-page');
      setMessages([{ text: "Hi, I'm Strategy Test 2. I can help with advanced market analysis.", isUser: false }]);
    } else {
      setAppTitle('Differentiator');
      // Remove any other page-specific classes
      document.body.classList.remove('strategy2-page');
      document.body.classList.remove('strategy1-page');
      setMessages([{ text: "Hi, I'm the Differentiator. How can I help you stand out from competitors?", isUser: false }]);
    }
    
    // Clean up function to remove page-specific classes when unmounting
    return () => {
      document.body.classList.remove('strategy2-page');
      document.body.classList.remove('strategy1-page');
    };
  }, [version]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
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

  const handlePdfSelection = (pdfIds: string[], pdfDetails?: SelectedPdf) => {
    console.log('PDF selection changed:', pdfIds);
    setSelectedPdfIds(pdfIds);

    if (pdfDetails && pdfIds.includes(pdfDetails.id)) {
      console.log('Setting current PDF:', pdfDetails);
      setCurrentPdf(pdfDetails);
      setIsPdfViewerOpen(true);
    } else if (pdfIds.length === 0) {
      setCurrentPdf(null);
      setIsPdfViewerOpen(false);
    }
  };

  const handleClosePdfViewer = () => {
    setIsPdfViewerOpen(false);
  };

  const handleBackToHome = () => {
    navigate('/');
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

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-left">
          <button onClick={handleBackToHome} className="back-button">
            &larr; Back
          </button>
          <h1 className="app-title">{appTitle}</h1>
        </div>
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      </div>

      <div className="main-content">
        {!HIDE_PDF_DRAG_DROP && (
          <div className="pdf-section">
            <PdfDragDrop 
              onPdfSelection={handlePdfSelection} 
            />
            {isPdfViewerOpen && currentPdf && (
              <div className="pdf-viewer-container">
                <div className="pdf-viewer-header">
                  <h3>PDF Viewer{currentPdf.name ? `: ${currentPdf.name}` : ''}</h3>
                  <button 
                    onClick={handleClosePdfViewer}
                    className="close-pdf-button"
                  >
                    Close
                  </button>
                </div>
                <PdfViewer
                  pdfId={currentPdf.id}
                  pdfPath={currentPdf.path}
                  pdfUrl={currentPdf.url}
                />
              </div>
            )}
          </div>
        )}

        <div className="chat-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-bubble">
                {message.isUser ? (
                  message.text
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
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
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          ref={inputRef}
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
