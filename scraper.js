const { URL } = require('url');
const cheerio = require('cheerio');
const request = require('request-promise');

const baseUrl = 'http://www.j-archive.com';

async function fetchGameData(gameId) {
  const gameUrl = new URL('/showgame.php', baseUrl)
  gameUrl.search = `game_id=${gameId}`

  return request({
    transform: cheerio.load,
    uri: gameUrl.toString(),
  });
}

async function fetchData() {
  const page = await fetchGameData(1);

  if (isValidPage(page)) return parsePage(page);
  else console.log('not valid page');
}

function isValidPage(page) {
  return page('#jeopardy_round').length > 0;
}

function parsePage(page) {
  console.log('valid page');
}

fetchData();
