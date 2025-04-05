import ReputationFi from 0xf8d6e0586b0a20c7

access(all) fun main(address: Address): {UInt64: {String: AnyStruct}} {
    let account = getAccount(address)
    
    // Try to borrow the vault capability
    let vaultCap = account.capabilities.get<&ReputationFi.ReputationVault>(
        /public/ReputationVault
    )
    
    let vault = vaultCap.borrow() ?? panic("ReputationVault not found for this address")
    
    // Prepare results dictionary
    let results: {UInt64: {String: AnyStruct}} = {}
  
    // Get token data
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

