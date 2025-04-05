# ReputationFi

ReputationFi transforms GitHub contributions into on-chain reputation tokens that serve as collateral for DeFi activities, bridging developer activity with financial utility on Flow.

## Project Overview

ReputationFi addresses a fundamental challenge in Web3: how to value developer contributions in financial terms. By tokenizing GitHub activity (commits, pull requests, and repository stars) into verifiable on-chain assets, ReputationFi creates a new form of reputation-based collateral that can be staked, lended against, and utilized across DeFi applications.

### Key Features

- **GitHub Verification**: Connect your GitHub account to verify your identity and contributions
- **Reputation Tokenization**: Mint reputation tokens backed by your actual GitHub contributions
- **Secure Storage**: Store tokens in secure, resource-oriented ReputationVaults
- **DeFi Utilities**: Stake reputation tokens to earn yield and demonstrate project commitment
- **Quadratic Scoring**: Score calculation that properly weights different contribution types

## Flow Integration

ReputationFi is built entirely on Flow blockchain, leveraging Cadence's resource-oriented programming model to create a secure, scalable reputation system:

### Smart Contract Architecture

- **ReputationFi Contract**: Implemented in Cadence, this contract manages the creation of reputation tokens and vaults, ensuring secure ownership and transfer.
- **Resource Safety**: Utilizes Cadence's resource model to ensure tokens cannot be duplicated or lost.
- **Capability-Based Security**: Uses Flow's capability-based security model for controlled access to reputation tokens.

### Implementation Details

- **Custom Resource Types**:
  - `RepToken`: Contains verified GitHub contribution metrics and calculated reputation score
  - `ReputationVault`: Securely stores reputation tokens with capability-based access control

- **Flow Blockchain Benefits**:
  - Transaction atomicity ensures reputation calculations are accurate and tamper-proof
  - Low gas fees make reputation updates financially viable
  - Fast transaction finality provides immediate verification of GitHub contributions

## Technical Architecture

ReputationFi follows a modular architecture:

1. **Frontend Layer**: React-based UI with FCL integration for Flow wallet connectivity
2. **Authentication Layer**: Dual authentication system combining Flow wallet and GitHub OAuth
3. **Blockchain Layer**: Cadence smart contracts deployed on Flow blockchain
4. **Data Layer**: Storage of reputation tokens and their associated metadata

### Smart Contract Overview

The ReputationFi contract implements:

- Token minting with quadratic scoring based on GitHub metrics
- Secure vault creation and management
- Reputation staking with yield generation
- Token metadata storage and retrieval

## DeFi Integration

ReputationFi introduces novel DeFi primitives based on developer reputation:

- **Reputation Staking**: Stake reputation tokens to earn yield while signaling commitment
- **Social Collateral**: Use reputation as collateral for loans, reducing reliance on traditional collateral
- **Reputation Markets**: Enable price discovery for developer contributions

This approach makes DeFi more accessible by allowing developers to leverage their work history rather than requiring significant capital upfront.

## Cadence Advantages

Our implementation leverages several Cadence-specific advantages:

- **Resource-Oriented Programming**: Ensures tokens exist in exactly one location and cannot be duplicated
- **Capability-Based Security**: Provides fine-grained control over token access
- **Composability**: Enables reputation tokens to integrate with other Flow DeFi protocols
- **Transaction Atomicity**: Guarantees consistency in reputation calculations

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm run dev`
4. Connect Flow wallet
5. Link GitHub account to verify your contributions
6. Create a vault and mint your reputation token
7. Explore DeFi features like staking and borrowing

## Future Roadmap

- Reputation-backed lending protocol
- Integration with major DeFi protocols on Flow
- Cross-chain reputation bridging
- DAO voting power based on reputation
- GitHub webhook integration for real-time reputation updates

## Team

- **Augustin Villetard** - blockchain developer with experience in DeFi protocols. 
  - GitHub: [@augustin](https://github.com/augustin)
  - Twitter: [@augustinv_dev](https://twitter.com/augustinv_dev)


