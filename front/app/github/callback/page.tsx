'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      // For the hackathon demo, we'll just store the code in sessionStorage
      // and redirect back to the main page
      sessionStorage.setItem('github_auth_code', code);
      
      // Redirect back to the home page
      router.push('/');
    } else {
      // If no code was received, redirect back with an error
      router.push('/?error=github_auth_failed');
    }
  }, [router, searchParams]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f6f8fa'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        background: 'white'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#2EA043">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .21.15.46.55.38a8.013 8.013 0 005.66-7.74c0-4.42-3.58-8-8-8z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#24292e', marginBottom: '12px' }}>
          Authenticating with GitHub...
        </h2>
        <p style={{ color: '#586069' }}>You will be redirected shortly.</p>
      </div>
    </div>
  );
}
