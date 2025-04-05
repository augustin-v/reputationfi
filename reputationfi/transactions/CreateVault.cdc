import ReputationFi from 0xf8d6e0586b0a20c7

transaction {
    prepare(signer: AuthAccount) {
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
