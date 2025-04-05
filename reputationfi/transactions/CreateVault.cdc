import ReputationFi from 0xReputationFi

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

