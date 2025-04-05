access(all) contract ReputationFi {
    // Token to represent developer reputation
    access(all) resource RepToken {
        access(all) let id: UInt64
        access(all) let githubUsername: String
        access(all) let reputationScore: UInt64
        access(all) let createdAt: UFix64
        
        access(all) init(id: UInt64, githubUsername: String, reputationScore: UInt64) {
            self.id = id
            self.githubUsername = githubUsername
            self.reputationScore = reputationScore
            self.createdAt = getCurrentBlock().timestamp
        }
    }
    
    access(all) resource ReputationVault {
        access(all) var tokens: @{UInt64: RepToken}
        access(all) var totalStaked: UInt64
        
        access(all) init() {
            self.tokens <- {}
            self.totalStaked = 0
        }
        
        access(all) fun deposit(token: @RepToken) {
            self.tokens[token.id] <-! token
        }
        
        access(all) fun stake(tokenID: UInt64, amount: UInt64) {
            pre {
                self.tokens[tokenID] != nil: "Token does not exist"
                amount <= self.tokens[tokenID]?.reputationScore!: "Insufficient reputation"
            }
            
            self.totalStaked = self.totalStaked + amount
        }
        
    }
    
    // Variables to track reputation data
    access(all) var nextTokenID: UInt64
    access(all) var totalReputation: UInt64
    
    // Create a new reputation token based on GitHub stats
    access(all) fun mintRepToken(
        githubUsername: String, 
        commits: UInt64, 
        pullRequests: UInt64, 
        stars: UInt64
    ): @RepToken {
        // Simple formula: commits + (PRs * 3) + (stars * 2)
        let score = commits + (pullRequests * 3) + (stars * 2)
        
        let token <- create RepToken(
            id: self.nextTokenID,
            githubUsername: githubUsername,
            reputationScore: score
        )
        
        self.nextTokenID = self.nextTokenID + 1
        self.totalReputation = self.totalReputation + score
        
        return <- token
    }
    
    access(all) fun createVault(): @ReputationVault {
        return <- create ReputationVault()
    }
    
    access(all) init() {
        self.nextTokenID = 1
        self.totalReputation = 0
    }
}

