const fs = require("fs");
const { JSDOM } = require("jsdom");
const { mainColors } = require("./colors");

function forgeUrl(relativeUrl) {
  return `https://www.letour.fr${relativeUrl}`;
}

async function fetchRelativeRiderUrlList() {
  const startListUrl = forgeUrl("/en/riders");
  const dom = await JSDOM.fromURL(startListUrl);
  return (riderUrlList = [
    ...dom.window.document.querySelectorAll(".runner__link"),
  ].map((r) => r.getAttribute("href")));
}

async function fetchRider(relativeRiderUrl) {
  const dom = await JSDOM.fromURL(forgeUrl(relativeRiderUrl));
  const firstName = dom.window.document
    .querySelector(".riderInfos__firstName")
    .innerHTML.trim();
  const fullName = dom.window.document
    .querySelector(".riderInfos__fullName")
    .innerHTML.trim();
  const profileImg = dom.window.document
    .querySelector(".riderProfile__img")
    .getAttribute("data-src");
  const bibNumber = dom.window.document
    .querySelector(".riderInfos__bib__number")
    .innerHTML.trim()
    .substring(2);
  const countryName = dom.window.document
    .querySelector(".riderInfos__country__name")
    .innerHTML.trim()
    .slice(1, -1);
  const birthStr = dom.window.document
    .querySelector(".riderInfos__birth")
    .innerHTML.trim()
    .match(/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/)[0];
  const birth = `${birthStr.slice(6, 10)}${birthStr.slice(
    3,
    5
  )}${birthStr.slice(0, 2)}`;
  const relativeTeamUrl = dom.window.document
    .querySelector(".pageIntroJerseys__link")
    .getAttribute("href")
    .trim();
  const teamCode = relativeTeamUrl.slice(9, 12).toLowerCase();

  return {
    bibNumber,
    birth,
    countryName,
    firstName,
    fullName,
    profileImg,
    relativeRiderUrl,
    relativeTeamUrl,
    teamCode,
  };
}
async function fetchTeam(relativeTeamUrl) {
  const dom = await JSDOM.fromURL(forgeUrl(relativeTeamUrl));
  const name = dom.window.document
    .querySelector(".pageHeader__heading")
    .innerHTML.trim();
  const code = relativeTeamUrl.slice(9, 12).toLowerCase();
  const longCode = relativeTeamUrl.slice(13);
  const [logoImg, jerseyImg] = [
    ...dom.window.document.querySelectorAll(".pageIntroJerseys__img"),
  ].map((e) => e.getAttribute("src"));

  const colorsLogo = await mainColors(logoImg, {
    maxColors: 3,
    minOpacity: 0.9,
    minDistance: 20,
  });
  const colorsJersey = await mainColors(jerseyImg, {
    maxColors: 3,
    minOpacity: 0.9,
    minDistance: 20,
  });

  return {
    code,
    longCode,
    name,
    jerseyImg,
    logoImg,
    relativeTeamUrl,
    colorsLogo,
    colorsJersey,
  };
}

async function main() {
  const relativeRiderUrlList = await fetchRelativeRiderUrlList();
  const riders = [];
  for (const relativeRiderUrl of relativeRiderUrlList) {
    riders.push(await fetchRider(relativeRiderUrl));
  }

  const relativeTeamUrlList = new Set(riders.map((r) => r.relativeTeamUrl));
  const teams = [];
  for (const relativeTeamUrl of relativeTeamUrlList) {
    teams.push(await fetchTeam(relativeTeamUrl));
  }

  const jsonDir = process.env["JSON_DIR"] || "./";
  fs.writeFileSync(`${jsonDir}riders.json`, JSON.stringify(riders, null, 2));
  fs.writeFileSync(`${jsonDir}teams.json`, JSON.stringify(teams, null, 2));
}

main();
