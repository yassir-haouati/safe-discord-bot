require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const checkInterval = 720 * 60 * 1000;

async function checkAndSendPendingTransactions() {
    try {
        let safeName;
        const safeAddresses = [
            process.env.SAFE_ADDRESS_TREASURY,
            process.env.SAFE_ADDRESS_FEE_RECEIVER,
            process.env.SAFE_ADDRESS_STRATEGIC_ROUND,
            process.env.SAFE_ADDRESS_PUBLIC_SALE,
            process.env.SAFE_ADDRESS_TREASURY_BNB,
            process.env.SAFE_ADDRESS_FEE_RECEIVER_BNB,
            process.env.SAFE_ADDRESS_PROTOCOL,
            process.env.SAFE_ADDRESS_PROTOCOL_BNB
        ];

        for (const safeAddress of safeAddresses) {
            let channelId;

            const apiUrl = `https://safe-transaction-mainnet.safe.global/api/v1/safes/${safeAddress}/multisig-transactions/`;

            // Make the API call to get multisig transactions
            const response = await axios.get(apiUrl);

            if (response.status === 200) {
                const allTxs = response.data.results;
                const pendingTxs = allTxs.filter(tx => {
                    const confirmationsRequired = tx.confirmationsRequired;
                    const confirmationsCount = tx.confirmations ? tx.confirmations.length : 0;
                    const submissionDate = new Date(tx.submissionDate);
                    const initialDate = new Date('2024-02-02');
                
                    // Check if confirmations are less than required and submission date is after 2024-01-01
                    return confirmationsCount < confirmationsRequired && submissionDate > initialDate;
                });

                if (pendingTxs.length > 0) {
                    const transactionList = pendingTxs.map((tx) => {
                        const confirmationsRequired = tx.confirmationsRequired;
                        const confirmationsCount = tx.confirmations ? tx.confirmations.length : 0;
                        const remainingConfirmations = confirmationsRequired - confirmationsCount;
    
                        return `- **Tx Hash:** ${tx.safeTxHash}\n` +
                               `- **To:** ${tx.to}\n` +
                               `- **Value:** ${tx.value}\n` +
                               `- **Submission Date:** ${tx.submissionDate}\n` +
                               `- **Confirmations Required:** ${confirmationsRequired}\n` +
                               `- **Confirmations Done:** ${confirmationsCount}\n` +
                               `- **Remaining Confirmations:** ${remainingConfirmations}\n\n`;
                    });

                    channelId = 
                        safeAddress === process.env.SAFE_ADDRESS_TREASURY ? process.env.DISCORD_CHANNEL_ID_TREASURY : 
                        safeAddress === process.env.SAFE_ADDRESS_FEE_RECEIVER ? process.env.DISCORD_CHANNEL_ID_TREASURY : 
                        safeAddress === process.env.SAFE_ADDRESS_STRATEGIC_ROUND ? process.env.DISCORD_CHANNEL_ID_TREASURY : 
                        safeAddress === process.env.SAFE_ADDRESS_PUBLIC_SALE ? process.env.DISCORD_CHANNEL_ID_TREASURY : 
                        safeAddress === process.env.SAFE_ADDRESS_TREASURY_BNB ? process.env.DISCORD_CHANNEL_ID_TREASURY : 
                        safeAddress === process.env.SAFE_ADDRESS_FEE_RECEIVER_BNB ? process.env.DISCORD_CHANNEL_ID_TREASURY : 
                        safeAddress === process.env.SAFE_ADDRESS_PROTOCOL ? process.env.DISCORD_CHANNEL_ID_PROTOCOL : 
                        safeAddress === process.env.SAFE_ADDRESS_PROTOCOL_BNB ? process.env.DISCORD_CHANNEL_ID_PROTOCOL : 
                        process.env.DISCORD_CHANNEL_ID_TREASURY;

                    const channel = await client.channels.fetch(channelId);

                    safeName = 
                        safeAddress === process.env.SAFE_ADDRESS_TREASURY ? `Treasury Multisig on ETH (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_FEE_RECEIVER ? `Fee Receiver Multisig on ETH (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_STRATEGIC_ROUND ? `Strategic Round Multisig on ETH (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_PUBLIC_SALE ? `Public Sale Multisig on ETH (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_TREASURY_BNB ? `Treasury Multisig on BNB (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_FEE_RECEIVER_BNB ? `Fee Receiver Multisig on BNB (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_PROTOCOL ? `Protocol Multisig on ETH (${safeAddress})` : 
                        safeAddress === process.env.SAFE_ADDRESS_PROTOCOL_BNB ? `Protocol Multisig on BNB (${safeAddress})` : 
                        `Unknown Multisig (${safeAddress})`;

                    await channel.send(`**NEW REMINDER :\n-------------\n\n Pending Transactions for ${safeName}:**\n${transactionList.join('\n')}\n[Sign and Execute Txs >>](https://app.safe.global/transactions/queue?safe=eth:${safeAddress})`);
                } else {
                    console.log(`No pending transactions for ${safeName}`);
                }
            } else {
                console.error(`Failed to fetch transactions for ${safeAddress}. Status: ${response.status}`);
            }
        }
    } catch (error) {
        console.error('Error checking and sending pending transactions:', error.message);
    }
}

checkAndSendPendingTransactions();

setInterval(checkAndSendPendingTransactions, checkInterval);

// Event listener for Discord ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Login to Discord (online status)
client.login(process.env.DISCORD_TOKEN);
console.log('Online on Discord !');
