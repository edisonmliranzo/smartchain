
# 🛡️ Wallet Security Best Practices

Protecting your crypto assets is entirely your responsibility. In the world of blockchain, there is no "undo" button. Follow these strict guidelines to keep your funds safe from scammers and hackers.

## 1. The Golden Rule: Your Seed Phrase is EVERYTHING

- **Never Share It:** No support agent, website, or dApp will EVER ask for your 12-24 word seed phrase. If they do, it is a SCAM.
- **Offline Storage:** Never store your seed phrase in a digital file (text file, screenshot, email, cloud notes) that is connected to the internet.
- **Physical Backup:** Write it down on paper (or stamp it into metal) and store it in a fireproof/waterproof safe.
- **Never Type It:** Only type your seed phrase into a hardware wallet or a trusted wallet app during the *initial recovery* process.

## 2. Use Hardware Wallets (Cold Storage)

For any significant amount of funds, use a hardware wallet (e.g., Ledger, Trezor, GridPlus).

- **Isolation:** Private keys never leave the device. Even if your computer has a virus, your funds are safe because the transaction must be physically signed on the device.
- **Verify on Device:** Always verify the address and amount on the device screen before clicking "Confirm". Computers can be compromised to show one thing on screen but send another to the device.

## 3. Beware of Phishing & Social Engineering

- **Check URLs:** Scammers buy ads on Google for "MetaMask" or "Ledger" that lead to fake sites. Always bookmark official URLs.
- **Fake Airdrops:** If you receive a random token in your wallet worth thousands of dollars, DO NOT interact with it. It is likely a trap to drain your wallet when you try to sell it.
- **Discord/Telegram DMs:** Admins will NEVER DM you first. Anyone offering to "sync your wallet" or "rectify an issue" is a scammer.

## 4. Manage Token Approvals

When you use a dApp (like Uniswap), you often grant it permission to spend your tokens.

- **Infinite Approval:** Many dApps ask for "Infinite" approval for convenience. This is risky. If the dApp is hacked, they can drain ALL your tokens.
- **Revoke:** Regularly check and revoke approvals for dApps you no longer use. Tools like [Revoke.cash](https://revoke.cash) are essential for this.
- **Exact Amount:** Only approve the exact amount needed for the transaction, not an unlimited amount.

## 5. Smart Contract Risks

- **Audit:** Before investing in a new project, check if their contracts have been audited by reputable firms (e.g., CertiK, OpenZeppelin).
- **Rug Pulls:** Developers of new, unverified tokens can mint infinite tokens or blacklist you from selling. Use tools like Token Sniffer to check for red flags.

## 6. Operational Security (OpSec)

- **Dedicated Device:** Ideally, use a separate, clean computer or browser for crypto activities.
- **VPN:** Use a VPN to hide your IP address, especially on public Wi-Fi.
- **Antivirus:** Keep your OS and antivirus software up to date.

## 7. Validator Security (Specific to SmartChain)

If you are running a validator node:

- **Firewall:** Only open strictly necessary ports (P2P). Keep RPC ports (8545) closed or strictly allow-listed.
- **Key Management:** Encrypt your keystore files. Do not keep unencrypted private keys in scripts or config files on production servers. Use environment variables or secret managers.
