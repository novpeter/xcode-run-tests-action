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
        let value = String(pair[1]).replace(/./g, '-');
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


    await execa('xcrun', ['simctl', 'boot', udid])
    await execa('open', ['/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/'])
};

exports.bootSimulator = bootSimulator;