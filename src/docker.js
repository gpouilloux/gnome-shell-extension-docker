'use strict';

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const dockerCommandsToLabels = {
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    unpause: 'Unpause',
    rm: 'Remove'
};

/**
 * Check if docker is installed
 * @return {Boolean} whether docker is installed or not
 */
const isDockerInstalled = () => !!GLib.find_program_in_path('docker');

/**
 * Check if docker daemon is running
 * @return {Boolean} whether docker daemon is running or not
 */
const isDockerRunning = () => {
    const [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(null, ['/bin/ps', 'cax'], null, 0, null);

    const outReader = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({ fd: out_fd })
    });

    let dockerRunning = false;
    let hasLine = true;
    do {
        const [out, size] = outReader.read_line(null);
        if (out && out.toString().indexOf("docker") > -1) {
            dockerRunning = true;
        } else if (size <= 0) {
            hasLine = false;
        }

    } while (!dockerRunning && hasLine);

    return dockerRunning;
};

/**
 * Get an array of containers
 * @return {Array} The array of containers as { name, status }
 */
const getContainers = () => {
    const [res, out, err, status] = GLib.spawn_command_line_sync("docker ps -a --format '{{.Names}},{{.Status}}'");
    if (status !== 0)
        throw new Error("Error occurred when fetching containers");

    return String.fromCharCode.apply(String, out).trim().split('\n')
        .map((string) => {
            const values = string.split(',');
            return {
                name: values[0],
                status: values[1]
            };
        });
};

/**
 * Run a docker command
 * @param {String} command The command to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
const runCommand = (command, containerName, callback) => {
    const cmd = "docker " + command + " " + containerName;
    async(() => {
        const [res, out, err, status] = GLib.spawn_command_line_sync(cmd);
        return { cmd, err, status };
    }, (res) => callback(res.status, res.cmd, res.err));
}

/**
 * Run a function in asynchronous mode using GLib
 * @param {Function} fn The function to run
 * @param {Function} callback The callback to call after fn
 */
const async = (fn, callback) => GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => callback(fn()));