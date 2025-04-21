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
        <div 
          className="assistant-card strategy1-card" 
          onClick={() => handleSelectAssistant('/strategy1')}
        >
          <div className="assistant-icon">🧠</div>
          <h2 className="assistant-name">Strategy Test 1</h2>
          <p className="assistant-description">
            General strategy assistant for business planning and analysis.
          </p>
        </div>

        <div 
          className="assistant-card strategy2-card" 
          onClick={() => handleSelectAssistant('/strategy2')}
        >
          <div className="assistant-icon">📊</div>
          <h2 className="assistant-name">Strategy Test 2</h2>
          <p className="assistant-description">
            Advanced strategy assistant with market analysis capabilities.
          </p>
        </div>

        <div 
          className="assistant-card differentiator-card" 
          onClick={() => handleSelectAssistant('/chat')}
        >
          <div className="assistant-icon">🚀</div>
          <h2 className="assistant-name">Differentiator</h2>
          <p className="assistant-description">
            Specialized assistant for competitive differentiation and positioning.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;