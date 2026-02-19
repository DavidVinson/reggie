const cron = require('node-cron');
const { checkAllRules } = require('./watcher');

function startScheduler() {
  cron.schedule('*/5 * * * *', () => {
    console.log('Reggie: checking watch rules...');
    checkAllRules();
  });
  console.log('Reggie: scheduler started (watch rules checked every 5 min)');
}

module.exports = { startScheduler };
