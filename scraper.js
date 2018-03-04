const { URL } = require('url');
const cheerio = require('cheerio');
const request = require('request-promise');
const moment = require('moment');
const fs = require('fs');

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
  const filename = `${Date.now()}-data.csv`;
  const stream = fs.createWriteStream(`./csv/${filename}`, { flags: 'a' });

  let gameNumber = 1;
  while (await fetchAndWriteData(stream, gameNumber)) {
    console.log(`Finish ${gameNumber}`)
    gameNumber += 1;
  }

  stream.end();
}

async function fetchAndWriteData(stream, gameNumber) {
  const page = await fetchGameData(gameNumber);

  if (isValidPage(page)) {
    writeCsv(stream, parsePage(gameNumber, page))
    return true;
  } else return false;
}

function writeCsv(stream, data) {
  stream.write(data.join(',') + "\n");
}

function isValidPage(page) {
  return page('#jeopardy_round').length > 0;
}

function parsePage(gameNumber, page) {
  const jeopardyTable = page('#jeopardy_round > .round');
  const doubleJeopardyTable = page('#double_jeopardy_round > .round');

  return [
    gameNumber,
    findGameDate(page),
    monospace(findDailyDoubleIndices(jeopardyTable), 1, ''),
    ...monospace(findDailyDoubleIndices(doubleJeopardyTable), 2, ''),
  ];
}

function findGameDate(page) {
  const dateContent = page('#game_title h1').first().text();
  const datePart = dateContent.split(' - ')[1];

  return new Date(Date.parse(datePart)).toISOString().slice(0, 10);
}

function findDailyDoubleIndices(round) {
  const dailyDoubles = round.find('.clue_value_daily_double');
  return dailyDoubles.toArray().map(dailyDouble => parseClueId(dailyDouble.prev.prev.attribs.id))
}

function parseClueId(clueId) {
  const cs = clueId.split('_');
  return [parseInt(cs[3]), parseInt(cs[2])];
}

function monospace(a, num, fill) {
  let b = new Array(num);

  for (let i = 0; i < num; i++) {
    b[i] = i < a.length ? a[i] : fill;
  }

  return b;
}

fetchData();
