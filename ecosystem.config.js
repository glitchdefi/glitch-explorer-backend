module.exports = {
  apps: [{
    name: "fetch",
    script: "yarn fetch",
    cron_restart: "0 */2 * * *"
  }, {
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
  }]
};
