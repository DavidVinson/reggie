const app = require('./app');
const { startScheduler } = require('./scheduler');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Reggie server running on port ${PORT}`);
  startScheduler();
});
