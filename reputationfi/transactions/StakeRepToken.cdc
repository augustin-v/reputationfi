import ReputationFi from 0xf8d6e0586b0a20c7

transaction(tokenID: UInt64, amount: UInt64) {
    prepare(signer: auth(Storage) &Account) {
        let vaultRef = signer.storage.borrow<auth(Storage) &ReputationFi.ReputationVault>(
            from: /storage/ReputationVault
        ) ?? panic("ReputationVault not found. Please create one first.")
        
        vaultRef.stake(tokenID: tokenID, amount: amount)
        
        log("Successfully staked ".concat(amount.toString()).concat(" reputation points"))
    }
}

