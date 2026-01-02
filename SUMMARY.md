# SmartChain Fixes & Validator Status

## Work Completed

We successfully debugged and fixed several critical issues preventing the Validator nodes from syncing and operating correctly.

### 1. **P2P Network Fixes**

- **Infinite Loop / Duplicate Peers**: Fixed a bug where peers were duplicated indefinitely due to incorrect map key checks. Nodes now correctly identify and deduplicate connections.
- **Sync Recovery**: Added logic to detect block gaps. If a node falls behind (recv block > current + 1), it now triggers a `getBlocks` request to sync the missing range.

### 2. **Serialization Fixes (Critical)**

- **BigInt Support**: Blockchain data uses `BigInt` (e.g. balances, gas). These were being converted to strings during P2P transmission but not revived correctly, causing block validation failures ("Invalid timestamp", "Invalid difficulty").
- **Fix**: Implemented robust serializer/reviver logic in `p2p.ts` to preserve BigInts (`"100n"`) across the network.

### 3. **RPC & CLI Fixes**

- **Batch Requests**: Updated RPC server to handle batched JSON-RPC requests (required by `ethers.js`).
- **Peer Count**: Implemented the `net_peerCount` RPC method so the CLI correctly reports the number of connected peers.

## How to Run Validator

### Check Status

To verify if your validator is running, properly connected, and synced:

```bash
cd /opt/smartchain
npm run validator status
```

Successful output should show:

- **Block Height**: matching the network (currently 1 or higher).
- **Peers**: > 0 (e.g. "1 connected").
- **Sync Status**: Synced.

### Troubleshooting

If the nodes get stuck or fork (different heights):

**On Main Node & Validator Node:**

```bash
# Reset Chain Data (Fresh Start)
pm2 stop smartchain
rm -rf /opt/smartchain/data /opt/smartchain/chain_data
pm2 restart smartchain
```

**Kickstart Network (Send First Tx):**

```bash
npx ts-node scripts/fund_wallet.ts <address> 1
```

## Next Steps

- **Monitoring**: Watch logs using `pm2 logs smartchain`.
- **Scaling**: Add more validators by adding their addresses to `src/config.ts` and distributing keys.
