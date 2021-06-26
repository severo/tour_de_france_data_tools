const fs = require("fs");
const { JSDOM } = require("jsdom");
const { mainColors } = require("./colors");

function forgeUrl(relativeUrl) {
  return `https://www.letour.fr${relativeUrl}`;
}

function parseDateStr(str) {
  return "2021" + str.replace(/-/g, "").trim().split("/").join("");
}

async function fetchRelativeStageUrlList() {
  const url = forgeUrl("/en/rankings/stage-1");
  const dom = await JSDOM.fromURL(url);
  const first = {
    url: "/en/stage-1",
    date: parseDateStr(
      dom.window.document.querySelector(
        ".simple-dropdown__head .stage-select__option__date"
      ).innerHTML
    ),
  };
  const elements = dom.window.document.querySelectorAll(
    ".simple-dropdown__options .simple-dropdown__option"
  );
  const others = [...elements].map((element) => {
    return {
      url: `/en/stage-${element.getAttribute("href").split("-")[1]}`,
      date: parseDateStr(
        element.querySelector(".stage-select__option__date").innerHTML
      ),
    };
  });
  return [first, ...others].map((d, i) => ({ id: `stage-${i + 1}`, ...d }));
}

async function addStageDetails(stage) {
  const dom = await JSDOM.fromURL(forgeUrl(stage.url));
  const route = dom.window.document
    .querySelector(".stageHeader__stage--main .stageHeader__infos__route")
    .innerHTML.trim();
  stage.startCity = route.split("<").shift();
  stage.endCity = route.split(">").pop();
  stage.length = +dom.window.document
    .querySelector(".stageHeader__stage--main .stageHeader__length__text")
    .innerHTML.trim()
    .split(">")
    .pop()
    .split("\n")
    .pop()
    .trim()
    .split("km")
    .shift()
    .trim();
  stage.type = [
    ...dom.window.document.querySelectorAll(
      ".stageHeader__stage--main .stageHeader__bottom .stageHeader__length"
    ),
  ]
    .pop()
    .querySelector(".stageHeader__length__text")
    .innerHTML.trim()
    .split(">")
    .pop()
    .trim();
  stage.mountains = [
    ...dom.window.document.querySelectorAll(
      "#mountain .mountain__item .mountain__infos"
    ),
  ].map((element) => {
    const km = element.querySelector(".km").innerHTML.trim();
    const start = +km.split(" ")[1];
    const height = +km.split(" ").pop().split("m").shift();

    const pct = element
      .querySelector(".percent")
      .innerHTML.trim()
      .split("kilometre-long climb at ");
    const length = +pct[0].replace(",", ".").trim();
    const percent = +pct[1].split("%").shift().trim();

    return {
      name: element
        .querySelector("h3")
        .innerHTML.trim()
        .split("(")
        .shift()
        .trim(),
      start,
      height,
      length,
      percent,
      category: element
        .querySelector(".category")
        .innerHTML.trim()
        .split("Category ")
        .pop(),
    };
  });
}

async function main() {
  const stages = await fetchRelativeStageUrlList();
  for (const stage of stages) {
    await addStageDetails(stage);
  }

  const jsonDir = process.env["JSON_DIR"] || "./";
  fs.writeFileSync(`${jsonDir}stages.json`, JSON.stringify(stages, null, 2));
}

main();
