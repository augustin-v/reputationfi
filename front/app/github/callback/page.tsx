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
      height: '100vh' 
    }}>
      <div>
        <h2>Connecting to GitHub...</h2>
        <p>You will be redirected shortly.</p>
      </div>
    </div>
  );
}
