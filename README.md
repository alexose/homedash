# Homedash

A simple, hackable dashboard for your home's IoT devices.

## Reason

Although there are several impressive home IoT management platforms, none of them are particularly usable. I found myself
spending much more time trying to navigate the plugin system, for instance, than I actually did getting

Most importantly, none of them provided what I actually want: A simple, remote-control style interface that anyone can use
without logging in or downloading an app.

Homedash sets out to solve these problems by pairing a minimalist UI with a minimalist plugin framework. At less than 500 LoC,
it's small enough to hack on without embarking on a massive software journey.

## Plugins

A plugin is an interface to a particular IoT platform.

(My house only uses EweLink and SmartCielo (MRCOOL) devices, so that's all I've written so far.)

Each plugin exports one method, `auth`, which handles everything needed to log into the platform. It takes a single argument,
`onUpdate`, which is called whenever the device list updates.

## Devices

A device is an object with an `id`, a `name`, a list of `settings`, a list of `values`, and a list of `abilites`.

the following structure:

    {
        name: "My switch",
        id: "2m49xk2",
        settings: {
            power: true
        },
        values: {
            online: true
        },
        abilities: {
            toggle: function() { // logic }
        }
    }

`settings` represents all of the values that can be changed. A thermostat for example, may look more like this:

    {
        name: "My thermostat",
        id: "2m49xk2",
        settings: {
            power: true,
            temperature: 65,
            dehumidify: false,
            freezeProtect: false,
        },
        values: {
            temperature: 64,
            humidity: 44,
        }
    }
