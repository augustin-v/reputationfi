
import ReputationFi from 0xReputationFi


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
