// app/src/flow/config.ts
import * as fcl from '@onflow/fcl';

const setupFCL = () => {
  fcl
    .config()
    .put('flow.network', 'emulator')
    .put('accessNode.api', 'http://localhost:8888')
    .put('discovery.wallet', 'http://localhost:8701/fcl/authn')
    // Add WalletConnect project ID
    .put('walletconnect.projectId', 'acd0d5fc1530dfa2c7b6e2ecb46aa183')
    // App details for better wallet display
    .put('app.detail.title', 'ReputationFi')
    .put('app.detail.icon', 'https://avatars.githubusercontent.com/u/62387156')
    .put('app.detail.description', 'Financial tools powered by developer reputation')
    .put('app.detail.url', 'https://reputationfi.vercel.app')

    .put('0xReputationFi', '0xf8d6e0586b0a20c7');

};

setupFCL();

export default fcl;
