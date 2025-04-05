// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import * as fcl from "@onflow/fcl";
import Head from 'next/head';
import "./src/flow/config";
import GitHubConnect from './components/GitHubConnect';
import CreditCard from './components/CreditCard';

type User = {
  loggedIn: boolean;
  addr?: string;
};

type ReputationToken = {
  id: number;
  github: string;
  score: number;
  createdAt: number;
};

type GitHubStats = {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  stars: number;
  repos: number;
  username: string;
};

export default function Home() {
  const [user, setUser] = useState<User>({ loggedIn: false });
  const [githubUsername, setGithubUsername] = useState("");
  const [commits, setCommits] = useState(0);
  const [pullRequests, setPullRequests] = useState(0);
  const [stars, setStars] = useState(0);
  const [tokens, setTokens] = useState<ReputationToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [stakedTokens, setStakedTokens] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
    
    // Check for URL error parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      if (error === 'github_auth_failed') {
        alert('GitHub authentication failed. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (user.loggedIn && user.addr) {
      fetchTokens();
    }
  }, [user]);

  // Handle GitHub stats received from the connect component
  const handleGitHubStats = (stats: GitHubStats) => {
    setGithubStats(stats);
    setGithubUsername(stats.username);
    setCommits(stats.commits);
    setPullRequests(stats.pullRequests);
    setStars(stats.stars);
    console.log("GitHub stats received:", stats);
  };

  const fetchTokens = async () => {
    if (!user.addr) return;
    
    try {
      setLoading(true);
      // Simple script to check if the account even has the capability
      const hasVault = await fcl.query({
        cadence: `
          import ReputationFi from 0xf8d6e0586b0a20c7
          
          pub fun main(address: Address): Bool {
            let account = getAccount(address)
            return account.getCapability(/public/ReputationVault).check()
          }
        `,
        args: (arg: any, t: any) => [arg(user.addr, t.Address)]
      });
      
      if (!hasVault) {
        setTokens([]);
        setLoading(false);
        return;
      }
      
      // If vault exists, try to get the tokens
      const result = await fcl.query({
        cadence: `
          import ReputationFi from 0xf8d6e0586b0a20c7
          
          pub fun main(address: Address): {UInt64: {String: AnyStruct}} {
            let account = getAccount(address)
            
            let vault = account.getCapability(/public/ReputationVault)
                .borrow<&ReputationFi.ReputationVault>()
                ?? panic("ReputationVault not found for this address")
            
            let results: {UInt64: {String: AnyStruct}} = {}
            
            for id in vault.tokens.keys {
              if let tokenRef = &vault.tokens[id] as &ReputationFi.RepToken? {
                results[id] = {
                  "github": tokenRef.githubUsername,
                  "score": tokenRef.reputationScore,
                  "createdAt": tokenRef.createdAt
                }
              }
            }
            
            return results
          }
        `,
        args: (arg: any, t: any) => [arg(user.addr, t.Address)]
      });
      
      // Process tokens as before
      const tokenList = [];
      for (const [id, data] of Object.entries(result)) {
        tokenList.push({
          id: parseInt(id),
          github: data.github,
          score: data.score,
          createdAt: data.createdAt
        });
      }
      
      setTokens(tokenList);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      // Fallback to demo data if we can't fetch real tokens
      if (process.env.NODE_ENV !== 'production') {
        setTokens([
          { id: 1, github: "demo-user", score: 1250, createdAt: Math.floor(Date.now()/1000) - 86400 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createVault = async () => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import ReputationFi from 0xf8d6e0586b0a20c7

          transaction {
            prepare(signer: AuthAccount) {
              // Direct access to storage without the .storage member
              if signer.borrow<&ReputationFi.ReputationVault>(from: /storage/ReputationVault) == nil {
                let vault <- ReputationFi.createVault()
                signer.save(<-vault, to: /storage/ReputationVault)
                
                // Create and link the capability (note we're using link instead of capabilities API)
                signer.link<&ReputationFi.ReputationVault>(/public/ReputationVault, target: /storage/ReputationVault)
                
                log("ReputationVault created successfully")
              } else {
                log("ReputationVault already exists")
              }
            }
          }
        `,
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 100
      });
      
      console.log("Transaction ID:", transactionId);
      alert("Vault created! Transaction ID: " + transactionId);
    } catch (error) {
      console.error("Error creating vault:", error);
      alert("Error creating vault: " + error);
    }
  };

  const mintReputation = async () => {
    if (!githubUsername) {
      alert("Please enter a GitHub username");
      return;
    }
    
    // Enforce that users can only mint tokens for their verified GitHub account
    if (githubStats && githubStats.username !== githubUsername) {
      alert("You can only mint reputation tokens for your own GitHub account that you've verified.");
      return;
    }
    
    try {
      // First check if a token for this GitHub username already exists
      const existingToken = tokens.find(token => token.github === githubUsername);
      
      // If a token exists, update it instead of creating a new one
      const transactionId = await fcl.mutate({
        cadence: `
          import ReputationFi from 0xf8d6e0586b0a20c7

          transaction(githubUsername: String, commits: UInt64, pullRequests: UInt64, stars: UInt64) {
            prepare(signer: AuthAccount) {
              // Get a reference to the vault
              let vaultRef = signer.borrow<&ReputationFi.ReputationVault>(
                  from: /storage/ReputationVault
              ) ?? panic("ReputationVault not found. Please create one first.")
              
              // Check if a token for this GitHub username already exists
              var existingTokenID: UInt64? = nil
              for tokenID in vaultRef.tokens.keys {
                if let token = &vaultRef.tokens[tokenID] as &ReputationFi.RepToken? {
                  if token.githubUsername == githubUsername {
                    existingTokenID = tokenID
                    break
                  }
                }
              }
              
              if existingTokenID != nil {
                // Update existing token (in a real implementation we would modify the token)
                // For the hackathon, we'll just remove and replace it
                log("Updating existing reputation token for: ".concat(githubUsername))
                
                // Mint a new token
                let token <- ReputationFi.mintRepToken(
                    githubUsername: githubUsername,
                    commits: commits,
                    pullRequests: pullRequests,
                    stars: stars
                )
                
                log("Created updated reputation token with score: ".concat(token.reputationScore.toString()))
                
                // Deposit the new token
                vaultRef.deposit(token: <-token)
              } else {
                // Mint a new token
                let token <- ReputationFi.mintRepToken(
                    githubUsername: githubUsername,
                    commits: commits,
                    pullRequests: pullRequests,
                    stars: stars
                )
                
                log("Created new reputation token with score: ".concat(token.reputationScore.toString()))
                
                // Deposit the token into the vault
                vaultRef.deposit(token: <-token)
              }
              
              log("Token operation completed successfully")
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(githubUsername, t.String),
          arg(commits.toString(), t.UInt64),
          arg(pullRequests.toString(), t.UInt64),
          arg(stars.toString(), t.UInt64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 100
      });
      
      console.log("Transaction ID:", transactionId);
      
      if (existingToken) {
        alert("Reputation updated! Transaction ID: " + transactionId);
      } else {
        alert("Reputation minted! Transaction ID: " + transactionId);
      }
      
      // Reset form
      setGithubUsername("");
      setCommits(0);
      setPullRequests(0);
      setStars(0);
      setGithubStats(null);
      
      // Refresh tokens
      setTimeout(fetchTokens, 5000);
    } catch (error) {
      console.error("Error minting reputation:", error);
      alert("Error minting reputation: " + error);
    }
  };

  // Simulate token staking
  const stakeToken = (tokenId: number) => {
    setStakedTokens(prev => ({
      ...prev,
      [tokenId]: true
    }));
    alert(`Token #${tokenId} staked successfully! You will earn 12% APY.`);
  };

  return (
    <>
      <Head>
        <title>ReputationFi</title>
        <meta name="description" content="Financial tools powered by developer reputation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            <span style={{ color: 'var(--github-green)' }}>Reputation</span>
            <span style={{ color: 'var(--github-yellow)' }}>Fi</span>
          </h1>
          
          {!user.loggedIn ? (
            <button onClick={fcl.authenticate}>Connect Wallet</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '16px', opacity: 0.8 }}>
                {user.addr?.slice(0, 6)}...{user.addr?.slice(-4)}
              </span>
              <button onClick={fcl.unauthenticate} style={{ backgroundColor: 'transparent', border: '1px solid var(--border)' }}>
                Disconnect
              </button>
            </div>
          )}
        </header>

        {user.loggedIn ? (
          <div>
            <div className="card">
              <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>
                Repository Vault
              </h2>
              <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                Create a vault to store your reputation tokens.
              </p>
              <button onClick={createVault}>Create Vault</button>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>
                Mint Reputation
              </h2>
              <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                Convert your GitHub contributions into reputation tokens.
              </p>
              
              {/* GitHub Connect Component */}
              {!githubStats ? (
                <div style={{ marginBottom: '20px' }}>
                  <GitHubConnect onStatsReceived={handleGitHubStats} />
                </div>
              ) : (
                <div className="github-verified" style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  backgroundColor: 'rgba(46, 160, 67, 0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(46, 160, 67, 0.3)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '10px', 
                    fontWeight: 'bold', 
                    color: 'var(--github-green)' 
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                    GitHub Verified
                  </div>
                  <p style={{ margin: '0 0 10px 0' }}>Stats fetched for <strong>{githubStats.username}</strong>:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>Contributions: <strong>{githubStats.totalContributions}</strong></div>
                    <div>Commits: <strong>{githubStats.commits}</strong></div>
                    <div>Pull Requests: <strong>{githubStats.pullRequests}</strong></div>
                    <div>Stars: <strong>{githubStats.stars}</strong></div>
                  </div>
                </div>
              )}
              
              <div className="input-group">
                <label htmlFor="github">GitHub Username</label>
                <input
                  id="github"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g., octocat"
                  disabled={!!githubStats}
                />
              </div>


              <div className="input-group">
                <label htmlFor="commits">Commits</label>
                <input
                  id="commits"
                  type="number"
                  value={commits}
                  onChange={(e) => setCommits(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={!!githubStats}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="prs">Pull Requests</label>
                <input
                  id="prs"
                  type="number"
                  value={pullRequests}
                  onChange={(e) => setPullRequests(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={!!githubStats}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="stars">Repository Stars</label>
                <input
                  id="stars"
                  type="number"
                  value={stars}
                  onChange={(e) => setStars(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={!!githubStats}
                />
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <button onClick={mintReputation}>Mint Reputation</button>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Your Reputation Tokens
                <button 
                  onClick={fetchTokens} 
                  style={{ 
                    fontSize: '0.9rem', 
                    padding: '4px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border)'
                  }}
                >
                  Refresh
                </button>
              </h2>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading tokens...</div>
              ) : tokens.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                  No reputation tokens found. Create a vault and mint some tokens!
                </div>
              ) : (
                <div>
                  {tokens.map((token) => (
                    <div key={token.id} className="reputation-token">
                      <div>
                        <div style={{ marginBottom: '4px' }}>
                          <span className="badge">ID #{token.id}</span>
                          <span style={{ fontWeight: 600 }}>{token.github}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                          Created: {new Date(token.createdAt * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="reputation-score">{token.score}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add the new Credit Card component */}
            <CreditCard tokens={tokens} />

            {/* DeFi Feature: Staking */}
            <div className="card">
              <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>
                Reputation Staking
              </h2>
              <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                Stake your reputation tokens to earn yield and demonstrate commitment to your projects.
              </p>
              
              {tokens.length > 0 ? (
                <div>
                  {tokens.map((token) => (
                    <div key={token.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '16px',
                      borderBottom: '1px solid var(--border)',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          {token.github}
                          <span className="badge" style={{ marginLeft: '8px' }}>#{token.id}</span>
                        </div>
                        <div>Reputation: {token.score}</div>
                      </div>
                      <div>
                        {stakedTokens[token.id] ? (
                          <div style={{ 
                            color: 'var(--github-green)',
                            padding: '8px 16px',
                            border: '1px solid var(--github-green)',
                            borderRadius: '4px'
                          }}>
                            Staked (12% APY)
                          </div>
                        ) : (
                          <button 
                            onClick={() => stakeToken(token.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid var(--border)',
                              padding: '8px 16px'
                            }}
                          >
                            Stake for 12% APY
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                  No tokens available for staking. Mint reputation tokens first!
                </div>
              )}
            </div>

            <div className="stats-container">
              <div className="stat-card">
                <div style={{ opacity: 0.7 }}>Total Tokens</div>
                <div className="stat-value">{tokens.length}</div>
              </div>
              
              <div className="stat-card">
                <div style={{ opacity: 0.7 }}>Total Reputation</div>
                <div className="stat-value">
                  {tokens.reduce((sum, token) => sum + token.score, 0)}
                </div>
              </div>
              
              <div className="stat-card">
                <div style={{ opacity: 0.7 }}>Average Score</div>
                <div className="stat-value">
                  {tokens.length > 0 
                    ? Math.round(tokens.reduce((sum, token) => sum + token.score, 0) / tokens.length) 
                    : 0}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>
              Welcome to <span style={{ color: 'var(--github-green)' }}>Reputation</span><span style={{ color: 'var(--github-yellow)' }}>Fi</span>
            </h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6, opacity: 0.8 }}>
              Convert your GitHub contributions into on-chain reputation tokens. Stake your reputation for rewards or use it as collateral for loans.
            </p>
            <button onClick={fcl.authenticate} style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
              Connect Flow Wallet
            </button>
          </div>
        )}
      </main>
    </>
  );
}
