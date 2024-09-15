const express = require('express');
const shortId = require('shortid');
const createHttpError = require('http-errors');
const path = require('path');

const port = 3000;
const app = express();

// In-memory storage
const urlDatabase = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/', (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      throw createHttpError.BadRequest('Provide a valid url');
    }

    // Check if URL already exists in in-memory storage
    const existingEntry = Object.values(urlDatabase).find(entry => entry.url === url);
    if (existingEntry) {
      res.render('index', {
        short_url: `http://${req.headers.host}/${existingEntry.shortId}`,
      });
      return;
    }

    // Create a new short URL entry
    const shortIdValue = shortId.generate();
    urlDatabase[shortIdValue] = { url, shortId: shortIdValue };

    res.render('index', {
      short_url: `http://${req.headers.host}/${shortIdValue}`,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/:shortId', (req, res, next) => {
  try {
    const { shortId } = req.params;
    const entry = urlDatabase[shortId];
    if (!entry) {
      throw createHttpError.NotFound('Short URL does not exist');
    }
    res.redirect(entry.url);
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('index', { error: err.message });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
