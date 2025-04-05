// components/GitHubConnect.tsx
import React, { useState, useEffect, useCallback } from 'react';

// Define types for props and GitHub stats
interface GitHubStats {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  stars: number;
  repos: number;
  username: string;
}

interface GitHubConnectProps {
  onStatsReceived: (stats: GitHubStats) => void;
  onError?: (error: string) => void;
  className?: string;
}

const GitHubConnect: React.FC<GitHubConnectProps> = ({ 
  onStatsReceived, 
  onError,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // GitHub OAuth configuration
  const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'your-actual-client-id';
  const REDIRECT_URI = typeof window !== 'undefined' 
    ? `${window.location.origin}/github/callback` 
    : '';
  
  // Function to handle OAuth redirect
  const handleConnect = () => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read:user`;
    window.location.href = githubAuthUrl;
  };
  
  // Process GitHub auth callback - for hackathon, use mock data
  const processCallback = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create deterministic "random" data from the code string
      const codeSum = code.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const mockStats = {
        username: `github-user-${codeSum % 1000}`,
        totalContributions: 500 + (codeSum % 1500),
        commits: 350 + (codeSum % 900),
        pullRequests: 75 + (codeSum % 150),
        stars: 120 + (codeSum % 300),
        repos: 12 + (codeSum % 20)
      };
      
      // Simulate network delay
      setTimeout(() => {
        onStatsReceived(mockStats);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate with GitHub';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      setIsLoading(false);
    }
  }, [onStatsReceived, onError]);
  
  // Check for code in sessionStorage when component mounts
  useEffect(() => {
    const code = sessionStorage.getItem('github_auth_code');
    
    if (code) {
      // Clear the code first to prevent repeated processing
      sessionStorage.removeItem('github_auth_code');
      processCallback(code);
    }
  }, [processCallback]);
  
  return (
    <div className={`github-connect ${className}`}>
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          Error connecting to GitHub: {error}
        </div>
      )}
      
      <button 
        onClick={handleConnect}
        disabled={isLoading}
        className="github-button"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', padding: '10px', borderRadius: '4px' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .21.15.46.55.38a8.013 8.013 0 005.66-7.74c0-4.42-3.58-8-8-8z"/>
        </svg>
        {isLoading ? 'Connecting...' : 'Connect GitHub Account'}
      </button>
    </div>
  );
};

export default GitHubConnect;
