module.exports = {
  apps: [{
    name: "fetchLastBlock",
    script: "npx ts-node sync_data/cli.fetchLatestBlocks.ts",
    cron_restart: "0 */2 * * *"
  }, {
    name: "fetchOldBlock",
    script: "npx ts-node sync_data/cli.fetchOldBlocks.ts",
    cron_restart: "0 */2 * * *"
  },{
    name: "fetchBalance",
    script: "npx ts-node sync_data/cli.fetchBalanceHistory.ts",
    cron_restart: "0 0 * * *"
  },
  {
    name: "fetchFee",
    script: "npx ts-node sync_data/cli.fetchTransactionFee.ts",
    cron_restart: "0 0 * * *"
  }, {
    name: "fetchDailyCron",
    script: "npx ts-node sync_data/cli.fetchDailySummary.ts",
    cron_restart: "0 0 * * *"
    }
    ]
};
