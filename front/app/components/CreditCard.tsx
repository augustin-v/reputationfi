// not a credit card but a credit card component
import React, { useState } from 'react';

interface ReputationToken {
  id: number;
  github: string;
  score: number;
  createdAt: number;
}

interface CreditCardProps {
  tokens: ReputationToken[];
}

const CreditCard: React.FC<CreditCardProps> = ({ tokens }) => {
  const [borrowAmounts, setBorrowAmounts] = useState<{[key: number]: number}>({});
  const [borrowingInProgress, setBorrowingInProgress] = useState<{[key: number]: boolean}>({});
  const [borrowedTokens, setBorrowedTokens] = useState<{[key: number]: number}>({});

  // Credit limit formula based on reputation score
  const calculateBorrowableAmount = (reputationScore: number): number => {
    // Minimum threshold for borrowing eligibility
    const minThreshold = 1000;
    
    if (reputationScore < minThreshold) {
      return 0;
    }
    
    // Base formula: logarithmic scale to prevent excessive borrowing
    // while still rewarding higher reputation
    const baseAmount = 100;
    const scaleFactor = 0.5;
    
    // Formula: base amount + scale factor * log of score above threshold
    const borrowableAmount = baseAmount + 
      (scaleFactor * Math.log10(reputationScore - minThreshold + 100) * 100);
    
    // Round to nearest whole number
    return Math.round(borrowableAmount);
  };

  const handleAmountChange = (tokenId: number, amount: number) => {
    setBorrowAmounts(prev => ({
      ...prev,
      [tokenId]: amount
    }));
  };

  const handleBorrow = (tokenId: number, maxAmount: number) => {
    const amount = borrowAmounts[tokenId] || 0;
    
    if (amount <= 0) {
      alert("Please enter a valid amount to borrow");
      return;
    }
    
    if (amount > maxAmount) {
      alert(`You can only borrow up to ${maxAmount} FLOW with your current reputation`);
      return;
    }
    
    // Simulate borrowing process
    setBorrowingInProgress(prev => ({ ...prev, [tokenId]: true }));
    
    setTimeout(() => {
      setBorrowingInProgress(prev => ({ ...prev, [tokenId]: false }));
      setBorrowedTokens(prev => ({ ...prev, [tokenId]: amount }));
      setBorrowAmounts(prev => ({ ...prev, [tokenId]: 0 }));
      alert(`Successfully borrowed ${amount} FLOW against your reputation token!`);
    }, 1500);
  };

  const minThreshold = 1000; // Minimum reputation score required

  return (
    <div className="card">
      <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>
        Reputation-Backed Credit
      </h2>
      <p style={{ marginBottom: '24px', opacity: 0.8 }}>
        Use your developer reputation as collateral to access credit lines on Flow.
      </p>
      
      {tokens.length > 0 ? (
        <div>
          {tokens.map((token) => {
            // Calculate borrowable amount based on reputation score
            const borrowableAmount = calculateBorrowableAmount(token.score);
            const isEligible = token.score >= minThreshold;
            const isBorrowed = borrowedTokens[token.id] > 0;
            
            return (
              <div key={token.id} style={{ 
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {token.github}
                      <span className="badge" style={{ marginLeft: '8px' }}>#{token.id}</span>
                    </div>
                    <div>Reputation Score: {token.score}</div>
                  </div>
                  <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: '4px',
                    backgroundColor: isEligible ? 'rgba(46, 160, 67, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                    color: isEligible ? 'var(--github-green)' : '#f85149',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>
                    {isEligible ? 'Credit Eligible' : 'Not Eligible'}
                  </div>
                </div>
                
                {isEligible ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '4px' }}>
                        Available Credit Line
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                        {borrowableAmount} FLOW
                      </div>
                    </div>
                    
                    {isBorrowed ? (
                      <div style={{ 
                        backgroundColor: 'rgba(46, 160, 67, 0.1)', 
                        padding: '12px', 
                        borderRadius: '4px', 
                        color: 'var(--github-green)'
                      }}>
                        You've borrowed {borrowedTokens[token.id]} FLOW. 
                        Repayment due in 7 days.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="number" 
                          placeholder="Amount to borrow"
                          min="0"
                          max={borrowableAmount}
                          value={borrowAmounts[token.id] || ''}
                          onChange={(e) => handleAmountChange(token.id, parseFloat(e.target.value) || 0)}
                          style={{ flex: 1 }}
                          disabled={borrowingInProgress[token.id]}
                        />
                        <button 
                          onClick={() => handleBorrow(token.id, borrowableAmount)}
                          disabled={borrowingInProgress[token.id]}
                        >
                          {borrowingInProgress[token.id] ? 'Processing...' : 'Borrow'}
                        </button>
                      </div>
                    )}
                    
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      backgroundColor: 'rgba(0,0,0,0.03)', 
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Credit Terms</div>
                      <ul style={{ marginLeft: '16px', listStyleType: 'disc' }}>
                        <li>7-day loan term</li>
                        <li>5% interest rate</li>
                        <li>Your reputation token is locked as collateral</li>
                        <li>Defaulting impacts your reputation score</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    You need at least {minThreshold} reputation points to be eligible for credit.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
          No reputation tokens found. Create a reputation token to access credit.
        </div>
      )}
      
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          How Reputation Credit Works
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px' 
        }}>
          <div className="credit-factor" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Character</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Your GitHub history and consistent contribution patterns demonstrate reliability.</p>
          </div>
          <div className="credit-factor" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Capacity</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Your level of activity indicates your capacity to maintain development contributions.</p>
          </div>
          <div className="credit-factor" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Capital</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Your reputation score represents your "developer capital" in the ecosystem.</p>
          </div>
          <div className="credit-factor" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Collateral</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Your reputation token is locked during the loan period as intangible collateral.</p>
          </div>
          <div className="credit-factor" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Conditions</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loan terms are optimized for short-term developer funding needs on Flow.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCard;