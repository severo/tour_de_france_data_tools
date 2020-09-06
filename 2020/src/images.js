const fs = require("fs");
const fetch = require("node-fetch");

// async function fetchRelativeRiderUrlList() {
//   const startListUrl = forgeUrl("en/riders");
//   const dom = await JSDOM.fromURL(startListUrl);
//   return (riderUrlList = [
//     ...dom.window.document.querySelectorAll(".runner__link"),
//   ].map((r) => r.getAttribute("href")));
// }

async function main() {
  const jsonDir = process.env["JSON_DIR"] || "./";
  const imagesDir = process.env["IMAGES_DIR"] || "./";
  const teams = JSON.parse(fs.readFileSync(`${jsonDir}teams.json`));
  for (const team of teams) {
    const res = await fetch(team.logoImg);
    const dest = fs.createWriteStream(`${imagesDir}logo-team-${team.code}.png`);
    res.body.pipe(dest);
  }

  for (const team of teams) {
    const res = await fetch(team.jerseyImg);
    const dest = fs.createWriteStream(
      `${imagesDir}jersey-team-${team.code}.png`
    );
    res.body.pipe(dest);
  }

  const riders = JSON.parse(fs.readFileSync(`${jsonDir}riders.json`));
  for (const rider of riders) {
    const res = await fetch(rider.profileImg);
    const dest = fs.createWriteStream(
      `${imagesDir}profile-rider-${rider.bibNumber}.png`
    );
    res.body.pipe(dest);
  }
}

main();
