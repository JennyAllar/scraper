const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch =  require('node-fetch');
const cheerio = require('cheerio');

const app = express();

app.use(cors());
app.use(morgan('tiny'));


function getResults(body) {
  // parses HTML and turns into jquery document
  const $ = cheerio.load(body);
  const rows  = $('li.result-row');
  const results = []


  rows.each((index, element) => {
    const result = $(element);
    const title = result.find('.result-title').text();
    const price = result.find('a span.result-price').text();
    const imageData = result.find('a.result-image').attr('data-ids');
    let images = []
    if (imageData) {
      const parts = imageData.split(',');
      images = parts.map((id) => {
        return `https://images.craigslist.org/${id.split(':')[1]}_300x300.jpg`;
      })
    }

    results.push({
      title,
      price,
      images
    })
  })

  return results;
}
// request handler
app.get('/', (request, response) => {
  response.json({
    message: 'Hello World'
  });
})

// https://denver.craigslist.org/search/cta?query=lexus&sort=date

app.get('/search/:location/:search_term', (request, response) => {
  // destructuring - syntactic sugar
  const { location, search_term } = request.params
  const url = `https://${location}.craigslist.org/search/cta?query=${search_term}&sort=date`

  // makes call to url
  fetch(url)
    // turns html from call into big string
    .then(response => response.text())
    .then(body => {
      const results = getResults(body);
      response.json({
        results
      });
    });
  // response.json({
  //   results: [],
  //   url
  // })
});

app.use((request, response, next) => {
  const error = new Error('Not found, boo.');
  response.status(404);
  next(error);
});

app.use((error, request, response, next) => {
  response.status(response.statusCode || 500)
  response.json({
    message: error.message
  })
})

app.listen(5000, () => {
  console.log('Listening on port 5000!');
})