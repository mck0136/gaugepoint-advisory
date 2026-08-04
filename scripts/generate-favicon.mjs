import { readFile, writeFile } from "node:fs/promises";

const logo = await readFile("assets/gaugepoint-advisory-lockup.png");
const source = `data:image/png;base64,${logo.toString("base64")}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#ffffff"/>
  <defs>
    <image id="gaugepoint-logo" href="${source}" width="1322" height="514"/>
  </defs>
  <svg x="35" y="84" width="442" height="88" viewBox="110 25 1165 190" preserveAspectRatio="xMidYMid meet">
    <use href="#gaugepoint-logo"/>
  </svg>
  <svg x="164" y="235" width="186" height="194" viewBox="30 285 130 110" preserveAspectRatio="xMidYMid meet">
    <use href="#gaugepoint-logo"/>
  </svg>
</svg>
`;

await writeFile("favicon.svg", svg);
