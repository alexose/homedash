const ewelink = require("ewelink-api");
const config = require("../config.js");

module.exports = {
    auth,
};

let devices = [];
let connection;
let onUpdate;

async function auth(_onUpdate) {
    if (_onUpdate && typeof _onUpdate === "function") onUpdate = _onUpdate;

    connection = new ewelink(config.ewelink);

    devices = await connection.getDevices();
    if (devices.length) {
        console.log(`EweLink connection successful. Found ${devices.length} devices.`);
    } else {
        console.log(`Failed to connect.  Waiting a minute, then trying again...`);
        return;
    }

    onUpdate(mapDevices(devices));

    const socket = await connection.openWebSocket(async data => {
        // data is the message from eWeLink
        if (data.action === "update") {
            const device = devices.find(d => d.deviceid === data.deviceid);
            device.params = {...device.params, ...data.params};
            onUpdate(mapDevices(devices));
        }
    });
}

const abilities = {
    toggle: async function (id, tries = 0) {
        const status = await connection.toggleDevice(id);
        if (status.status !== "ok") {
            if (tries <= 2) {
                await auth();
                toggle(id, (tries += 1));
            } else {
                console.error("Tried to toggle, but couldn't.");
            }
        } else {
            console.log("Successfully toggled " + id + ".");
        }
    },
};

function mapDevices(devices) {
    return devices.map(d => {
        const obj = {platform: "ewelink", settings: {}, values: {}};
        obj.id = d.deviceid;
        obj.name = d.name;
        obj.model = d.productModel;
        obj.settings.power = d.params.switch === "on";

        // Thermostat specific stuff
        if (obj.model === "TS-5000") {
            const targets = d.params.targets;
            obj.settings.maxTemperature = targets.find(d => !!d.targetHigh).targetHigh;
            obj.settings.minTemperature = targets.find(d => !!d.targetLow).targetLow;
            obj.values.temperature = convert(d.params.currentTemperature);
            obj.values.humidity = parseFloat(d.params.currentHumidity);
        }

        obj.abilities = abilities;

        obj.values.online = d.online;
        //console.log(d);
        return obj;
    });
}

function convert(celsius) {
    return (parseFloat(celsius) * (9 / 5) + 32).toFixed(0);
}
