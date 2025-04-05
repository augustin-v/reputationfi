"use client";

import { useState, useEffect } from 'react';
import * as fcl from "@onflow/fcl";
import Head from 'next/head';
import "./src/flow/config";

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

export default function Home() {
  const [user, setUser] = useState<User>({ loggedIn: false });
  const [githubUsername, setGithubUsername] = useState("");
  const [commits, setCommits] = useState(0);
  const [pullRequests, setPullRequests] = useState(0);
  const [stars, setStars] = useState(0);
  const [tokens, setTokens] = useState<ReputationToken[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user.loggedIn && user.addr) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    if (!user.addr) return;
    
    try {
      setLoading(true);
      const result = await fcl.query({
        cadence: `
          import ReputationFi from 0x06

          access(all) fun main(address: Address): {UInt64: {String: AnyStruct}} {
            let account = getAccount(address)
            
            let vaultCap = account.capabilities.get<&ReputationFi.ReputationVault>(
                /public/ReputationVault
            )
            
            let vault = vaultCap.borrow() ?? panic("ReputationVault not found for this address")
            
            let results: {UInt64: {String: AnyStruct}} = {}
            
            for id in vault.tokens.keys {
              if let token = vault.tokens[id] {
                results[id] = {
                  "github": token.githubUsername,
                  "score": token.reputationScore,
                  "createdAt": token.createdAt
                }
              }
            }
            
            return results
          }
        `,
        args: (arg: any, t: any) => [arg(user.addr, t.Address)]
      });
      
      const tokenList: ReputationToken[] = [];
      for (const [id, data] of Object.entries(result)) {
        tokenList.push({
          id: parseInt(id),
          github: data.github as string,
          score: data.score as number,
          createdAt: data.createdAt as number
        });
      }
      
      setTokens(tokenList);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const createVault = async () => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import ReputationFi from 0x06 

          transaction {
            prepare(signer: auth(Storage, Capabilities) &Account) {
              if signer.storage.borrow<auth(Storage) &ReputationFi.ReputationVault>(from: /storage/ReputationVault) == nil {
                let vault <- ReputationFi.createVault()
                signer.storage.save(<-vault, to: /storage/ReputationVault)
                
                let capability = signer.capabilities.storage.issue<&ReputationFi.ReputationVault>(/storage/ReputationVault)
                
                signer.capabilities.publish(capability, at: /public/ReputationVault)
                
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
    
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import ReputationFi from 0x06

          transaction(githubUsername: String, commits: UInt64, pullRequests: UInt64, stars: UInt64) {
            prepare(signer: auth(Storage) &Account) {
              // Get a reference to the vault
              let vaultRef = signer.storage.borrow<auth(Storage) &ReputationFi.ReputationVault>(
                  from: /storage/ReputationVault
              ) ?? panic("ReputationVault not found. Please create one first.")
              
              // Mint a new reputation token
              let token <- ReputationFi.mintRepToken(
                  githubUsername: githubUsername,
                  commits: commits,
                  pullRequests: pullRequests,
                  stars: stars
              )
              
              log("Created reputation token with score: ".concat(token.reputationScore.toString()))
              
              // Deposit the token into the vault
              vaultRef.deposit(token: <-token)
              
              log("Token deposited successfully")
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
      alert("Reputation minted! Transaction ID: " + transactionId);
      
      // Reset form
      setGithubUsername("");
      setCommits(0);
      setPullRequests(0);
      setStars(0);
      
      // Refresh tokens
      setTimeout(fetchTokens, 5000);
    } catch (error) {
      console.error("Error minting reputation:", error);
      alert("Error minting reputation: " + error);
    }
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
              
              <div className="input-group">
                <label htmlFor="github">GitHub Username</label>
                <input
                  id="github"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g., octocat"
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
