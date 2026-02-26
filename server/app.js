if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: process.env.NODE_ENV === 'test' });
}

const path = require('path');
const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');

const app = express();

app.use(require('morgan')('dev'));
app.use(cors());
app.use(express.json());
app.use(auth);

app.use('/api/setup', require('./routes/setup'));
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/sites', require('./routes/sites'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/watch-rules', require('./routes/watchRules'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

module.exports = app;
