var Twit = require('twit');
var nconf = require('nconf')
const express = require('express')

nconf.file({
  file: 'config.yaml',
  format: require('nconf-yaml')
})

const app = express();
const port = 3000;

var twitter = new Twit({
  consumer_key: nconf.get('consumer_key'),
  consumer_secret: nconf.get('consumer_secret'),
  access_token: nconf.get('access_token'),
  access_token_secret: nconf.get('access_token_secret')
});

var tweets = [];

var tweetStream = twitter.stream('statuses/filter', {
  // track: '@aniclover, #aniclover'
  track: '#news'
});

tweetStream.on('tweet', function (tweet) {
  tweets.push(tweet);
  console.log(`New Tweet. Tweets stored: ${tweets.length}`);
});

app.get('/next', (req, res) => {
  var tweet = tweets.shift();
  if (tweet == null) {
    res.json({ empty: true});
  } else {
    res.json(tweet);
    console.log(`Retrieved Tweet. Tweets stored: ${tweets.length}`);
  }
})

app.use(express.static('html'));
app.listen(port, () => console.log(`Tweetalert listening at http://localhost:${port}`))