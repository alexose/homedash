// Plugin for SmartCielo (a.k.a., MRCOOL) devices
// They don't provide an API, and their web app is a mess.  Easiest just to use puppeteer.

const puppeteer = require("puppeteer");
const config = require("../config.js");

module.exports = {auth};

let onUpdate;
let page;

async function auth(_onUpdate) {
    if (_onUpdate && typeof _onUpdate === "function") onUpdate = _onUpdate;

    const url = "https://home.cielowigle.com/auth/login";
    const username = config.smartcielo.username;
    const password = config.smartcielo.password;

    const browser = await puppeteer.launch();
    page = await browser.newPage();
    const client = page._client;

    // TODO: this
    client.on("Network.webSocketFrameReceived", ({requestId, timestamp, response}) => {
        console.log("Network.webSocketFrameReceived", requestId, timestamp, response.payloadData);
    });

    await page.setViewport({width: 1366, height: 768});
    await page.goto("https://home.cielowigle.com/");
    await page.type("#txtUserID", username);
    await page.type("#txtPassword", password);
    page.$eval("#btnLogin", elem => elem.click());

    await page.waitForNavigation();
    await page.waitForSelector("#deviceContainer");

    const devices = await mapDevices(page);

    console.log(`Smartcielo connection successful. Found ${devices.length} devices.`);
    onUpdate(devices);
}

// Toggle FP mode for device
async function toggle(id) {
    await page.$eval('[title="Lounge"]', el => el.click());
    await page.waitForSelector(".room-temp-style");
    await page.$eval(".icon-fp-mode", el => el.click());

    const devices = await mapDevices(page);
    onUpdate(devices);
}

// Extract device information from the page
async function mapDevices(page) {
    const result = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll(".row.device-row"));
        const data = rows.map(element => {
            const obj = {platform: "smartcielo", settings: {}, values: {}};
            obj.id = obj.name = element.querySelector("label").innerText;

            // I don't love the silliness of how "FP" is a temperature here.  Course correcting...
            const temp = element.querySelector(".tempStyle").innerText;
            obj.settings.mode = temp === "FP" ? "fp" : element.querySelector(".tempStyle span").className;
            obj.settings.power = temp === "FP" ? false : element.querySelector(".powerButtonControl").title === "ON";
            obj.settings.temperature = temp === "FP" ? 45 : parseInt(temp);

            //obj.values.temperature = parseFloat(d.latEnv.temp);
            // humidity doesn't seem to work?
            obj.values.online = element.querySelector("span").className.includes("icon-online");
            return obj;
        });
        return JSON.stringify(data);
    });

    const devices = JSON.parse(result);
    return devices.map(d => ({abilities: {toggle}, ...d}));
}
