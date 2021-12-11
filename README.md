# Homedash

A simple, hackable dashboard for your home's IoT devices.

## Reason

Although there are several impressive home IoT management platforms, none of them are particularly usable. I found
myself spending much more time trying to figure out how to manage user accounts or add plugins than I actually did
configuring my devices.

More importantly, none of them provided what I actually want: A simple, remote-control style interface that anyone can
use without logging in or downloading an app.

Homedash sets out to solve these problems by pairing a minimalist UI with simple plugin framework. At less than 500 LoC,
it's small enough to hack on without embarking on a days-long software odyssey.

## Plugins

A plugin is an interface to a particular IoT platform.

(My house only uses EweLink and SmartCielo, a.k.a MRCOOL, devices, so that's all I've written so far.)

A plugin exports one method: `auth`. This method handles everything needed to log into the platform. It takes a single
argument, `onUpdate`, which is called whenever the device list updates.

Homedash is totally agnostic as to _how_ a login should work. It could use an established API (like ewelink.js), or some
janky headless browser magic (like smartcielo.js).

## Devices

A device is an object with a `name`, an `id`, a list of `settings`, a list of `values`, and a list of `abilites`.

A simple switch, for instance, might have the following structure:

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
            toggle: function() { ... }
        }
    }

A thermostat may look more like this:

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
        },
        abilities: {
            changeMode: function() { ... }
            changeTargetTemperature: function() { ... }
            toggleFreezeProtect: function() { ... }
        }
    }
