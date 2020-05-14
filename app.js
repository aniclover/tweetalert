const Twit = require('twit');
const nconf = require('nconf');
const express = require('express');
const gfm = require("gofundme");

nconf.file({
  file: 'config.yaml',
  format: require('nconf-yaml')
})

const app = express();
const port = 3000;

var donations = [];
var lastDonationFetched = null;

function updateGFM() {
  gfm.getLatestDonations((err,result) => {
    if(err) return console.log(err);

    if (result.length > 0) {
      for (let donation of result) {
        if (lastDonationFetched == null) {
          // First time retrieval during session. Don't update.
          break;
        }
        if (donation.name == lastDonationFetched.name
          && donation.amt == lastDonationFetched.amt) {
          // We have reached a previously fetched donation
          break;
        }
        console.log(`New donation from ${donation.name}. Last donation fetched from: ${lastDonationFetched.name}`);
        donations.push(donation);
        console.log(`New Donation. Donations stored: ${donations.length}`);
      }
      lastDonationFetched = result[0];  
    }
  });
}

if (nconf.get('gfm_campaign_uri')) {
  console.log(`GFM Campaign Enabled. Campaign is ${nconf.get('gfm_campaign_uri')}`);
  gfm.setCampaignUrl(nconf.get('gfm_campaign_uri'));
  var gfmRefreshTimer = setInterval(updateGFM, 5000);
}

var twitter = new Twit({
  consumer_key: nconf.get('consumer_key'),
  consumer_secret: nconf.get('consumer_secret'),
  access_token: nconf.get('access_token'),
  access_token_secret: nconf.get('access_token_secret')
});

var tweets = [];

var tweetStream = twitter.stream('statuses/filter', {
  track: '@aniclover, #aniclover, #aniunison, #anikuraunison',
  follow: '1145783232824147968'
});
tweetStream.on('tweet', function (tweet) {
  tweets.push(tweet);
  console.log(`New Tweet. Tweets stored: ${tweets.length}`);
});

app.get('/nextTweet', (req, res) => {
  var tweet = tweets.shift();
  if (tweet == null) {
    res.json({ empty: true});
  } else {
    res.json(tweet);
    console.log(`Retrieved Tweet. Tweets stored: ${tweets.length}`);
  }
});

app.get('/nextDonation', (req, res) => {
  var donation = donations.shift();
  if (donation == null) {
    res.json({ empty: true});
  } else {
    res.json(donation);
    console.log(`Retrieved donation. Donations stored: ${donations.length}`);
  }
});

app.get('/triggerTestDonations', (req, res) => {
  lastDonationFetched = { name: 'Test', amt: '$XXX', time: 'Eternity Ago' };
  res.json({ success: true});
});

app.use(express.static('html'));
app.listen(port, () => console.log(`Tweetalert listening at http://localhost:${port}`))