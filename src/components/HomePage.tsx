import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/HomePage.css'; // We'll create this file next

export function HomePage() {
  const navigate = useNavigate();

  // Add 'home-page' class to body when component mounts
  // Remove it when component unmounts
  useEffect(() => {
    // Add the class when component mounts
    document.body.classList.add('home-page');
    
    // Return cleanup function to remove class when unmounted
    return () => {
      document.body.classList.remove('home-page');
    };
  }, []);

  const handleSelectAssistant = (path: string) => {
    navigate(path);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">Strategy Buddy</h1>
        <p className="home-subtitle">Select an assistant to get started</p>
      </header>

      <div className="assistants-grid">
        <div className="assistant-card strategy1-card">
          <div className="card-content">
            <h2 className="assistant-name">Strategy Test 1</h2>
            <p className="assistant-description">
              General strategy assistant for business planning and analysis.
            </p>
          </div>
          <button 
            className="begin-button" 
            onClick={() => handleSelectAssistant('/strategy1')}
          >
            Begin Strategy
          </button>
        </div>

        <div className="assistant-card market-research-card">
          <div className="card-content">
            <h2 className="assistant-name">Strategy Buddy Market Segmentation Tool</h2>
            <p className="assistant-description">
              Segment your market to customize messaging, offers, and strategies for each audience.
            </p>
          </div>
          <button 
            className="begin-button" 
            onClick={() => handleSelectAssistant('/market-research')}
          >
            Begin Segmentation
          </button>
        </div>

        <div className="assistant-card differentiator-card">
          <div className="card-content">
            <h2 className="assistant-name">Differentiator</h2>
            <p className="assistant-description">
              Specialized assistant for competitive differentiation and positioning.
            </p>
          </div>
          <button 
            className="begin-button" 
            onClick={() => handleSelectAssistant('/chat')}
          >
            Begin Differentiation
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;