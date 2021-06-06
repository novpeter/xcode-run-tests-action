const core = require('@actions/core');
const execa = require('execa');

const { parseDestination, encodeDestinationOption } = require('./destinations');
const { bootSimulator } = require('./simulators');


const getProjectInfo = async ({workspace, project}) => {
    const options = [];
    if (workspace != "") {
        options.push("-workspace", workspace);
    }
    if (project != "") {
        options.push("-project", project);
    }

    const xcodebuild = execa('xcodebuild', [...options, '-list', '-json']);
    const { stdout } = await xcodebuild;

    return JSON.parse(stdout);
};

const testProject = async ({
    workspace, 
    project, 
    scheme, 
    configuration, 
    sdk, 
    arch, 
    destination, 
    codeSignIdentity, 
    developmentTeam,
    resultBundlePath}) => {
        
    let options = []
    
    if (workspace != "") { options.push("-workspace", workspace); }
    if (project != "") { options.push("-project", project); }
    if (scheme != "") { options.push("-scheme", scheme); }
    if (configuration != "") { options.push("-configuration", configuration); }
    if (destination != "") { options.push("-destination", encodeDestinationOption(destination) ); }
    if (sdk != "") {  options.push("-sdk", sdk); }
    if (arch != "") { options.push("-arch", arch); }

    let buildOptions = []

    if (codeSignIdentity !== "") { buildOptions.push(`CODE_SIGN_IDENTITY=${codeSignIdentity}`); }
    if (developmentTeam !== "") { buildOptions.push(`DEVELOPMENT_TEAM=${developmentTeam}`); }

    let testOptions = []

    if (resultBundlePath !== "") { testOptions = [...testOptions, '-resultBundlePath', resultBundlePath]; }

    console.log("EXECUTING:", 'xcodebuild', [...options, 'build', ...buildOptions]);

    const xcodebuild = execa('xcodebuild', [...options, 'test', ...testOptions, ...buildOptions], {
        reject: false,
        env: {"NSUnbufferedIO": "YES"},
    });

    xcodebuild.stdout.pipe(process.stdout);
    xcodebuild.stderr.pipe(process.stderr);

    let { exitCode } = await xcodebuild;

    if (exitCode != 0 && exitCode != 65) {
        throw Error(`xcodebuild test failed with unexpected exit code ${exitCode}`);
    }
};


const parseConfiguration = async () => {
    const configuration = {
        workspace: core.getInput("workspace"),
        project: core.getInput("project"),
        scheme: core.getInput("scheme"),
        configuration: core.getInput("configuration"),
        sdk: core.getInput("sdk"),
        arch: core.getInput("arch"),
        destination: core.getInput("destination"),
        codeSignIdentity: core.getInput('code-sign-identity'),
        developmentTeam: core.getInput('development-team'),
        resultBundlePath: core.getInput("result-bundle-path"),
        resultBundleName: core.getInput("result-bundle-name"),
        screenRecordBundlePath: core.getInput("screen-record-bundle-path"),
        screenRecordBundleName: core.getInput("screen-record-bundle-name"),
    };

    if (configuration.destination !== "") {
        configuration.destination = parseDestination(configuration.destination);
    }

    if (configuration.scheme === "") {
        const projectInfo = await getProjectInfo(configuration);
        if (configuration.scheme === "") {
            configuration.scheme = projectInfo.project.schemes[0];
        }
    }

    return configuration;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
    try {
        const configuration = await parseConfiguration();
        const destination = encodeDestinationOption(configuration.destination);

        console.log(destination);

        await bootSimulator(destination);
        await sleep(12000)
        await testProject(configuration);
    } catch (err) {
        core.setFailed(`Testing failed with an unexpected error: ${err.message}`);
    }
};


main();