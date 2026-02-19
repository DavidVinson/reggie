require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(auth);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/watch-rules', require('./routes/watchRules'));
app.use('/api/notifications', require('./routes/notifications'));

const { startScheduler } = require('./scheduler');

app.listen(PORT, () => {
  console.log(`Reggie server running on port ${PORT}`);
  startScheduler();
});
