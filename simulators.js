const execa = require('execa');
const core = require('@actions/core');

/**
 * Transforms given destination string into JSON object
 * 
 * ### Example
 * Given `platform=iOS Simulator,name=iPhone 11 Pro,OS=14.5`
 * Returns:
 * ```
 * {
 *  'platform': 'iOS Simulator',
 *  'name': 'iPhone 11 Pro',
 *  'OS': '14-5'
 * }
 * ```
 * 
 * @param {*} destination String with params of simulator
 * @returns JSON object
 */
const parseDestination = (destination) => {
    let splitted = String(destination).split(',')
    let destinationJSON = {}
    
    splitted.forEach(element => {
        let pair = element.split('=')
        let key = String(pair[0])
        let value = String(pair[1]).replace('.', '-');
        destinationJSON[key] = value
    });

    return destinationJSON
}

/**
 * Return device UDID with given OS and name
 * 
 * @param {String} devices List of devices with specific OS
 * @param {String} os Reqiured OS
 * @param {String} simulatorName Required simlator name
 * @returns 
 */
const findDeviceUDID = (devices, os, simulatorName) => {
    var udid = ''
    for (key in devices) {
        if (key.endsWith('iOS-'+os)) {
            let simulatorsWithOS = devices[key]
            simulatorsWithOS.forEach(function(simulator, i, arr) {
                core.info(`Compare ${simulator['name']} and ${simulatorName}`)
                if (simulator['name'] == simulatorName) {
                    udid = simulator['udid'] 
                    core.info(`Did found simlator with UDID ${udid}`)
                } 
            })   
        }
    }
    return udid
}

/**
 * Boot simulator with given destination
 * 
 * @param {String} destination String with params of simulator
 */
const bootSimulator = async (destination) => {
    const xcrunDevices = execa('xcrun', ['simctl','list', '-j', '-v', 'devices']);

    const { stdout } = await xcrunDevices
    
    let destinationJSON = parseDestination(destination)

    let devices = JSON.parse(stdout)['devices']
    let os = destinationJSON['OS']
    let udid = findDeviceUDID(devices, os, destinationJSON['name'])

    if (udid == '') {
        core.info('Device UDID was not found!')
        return
    }

    const deviceBoot = execa('xcrun', ['simctl', 'boot', udid])
    deviceBoot.stdout.pipe(process.stdout);
    deviceBoot.stderr.pipe(process.stderr);

    await boot;

    core.info(`Did boot simulator with udid ${udid}`)

    const openSimulator = execa('open', ['/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/'])

    openSimulator.stdout.pipe(process.stdout);
    openSimulator.stderr.pipe(process.stderr);

    await openSimulator;

    core.info(`Simulator app was launched`)
};

exports.bootSimulator = bootSimulator;