/*
 * Gnome3 Docker Menu Extension
 * Copyright (C) 2017 Guillaume Pouilloux <gui.pouilloux@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.src.utils;

/**
 * Dictionary for Docker actions
 * @readonly
 * @type {{Object.<String, {label: String, isInteractive: Boolean}>}}
 */
var DockerActions = Object.freeze({
    START: {
        label: "Start",
        isInteractive: false
    },
    REMOVE: {
        label: "Remove",
        isInteractive: false
    },
    OPEN_SHELL: {
        label: "Open shell",
        isInteractive: true
    },
    RESTART: {
        label: "Restart",
        isInteractive: false
    },
    PAUSE: {
        label: "Pause",
        isInteractive: false
    },
    STOP: {
        label: "Stop",
        isInteractive: false
    },
    UNPAUSE: {
        label: "Unpause",
        isInteractive: false
    },
});

/**
 * Return the command associated to the given Docker action
 * @param {DockerActions} dockerAction The Docker action
 * @param {String} containerName The name of the container on which to run the command
 * @returns {String} The complete Docker command to run
 * @throws {Error}
 */

const getDockerActionCommand = (dockerAction, containerName) => {
    switch (dockerAction) {
        case DockerActions.START:
            return "docker start " + containerName;
        case DockerActions.REMOVE:
            return "docker rm " + containerName;
        case DockerActions.OPEN_SHELL:
            return "docker exec -it " + containerName + " /bin/bash; "
                + "if [ $? -ne 0 ]; then docker exec -it " + containerName + " /bin/sh; fi;";
        case DockerActions.RESTART:
            return "docker restart " + containerName;
        case DockerActions.PAUSE:
            return "docker pause " + containerName;
        case DockerActions.STOP:
            return "docker stop " + containerName;
        case DockerActions.UNPAUSE:
            return "docker unpause " + containerName;
        default:
            throw new Error("Docker action not valid");
    }
};

/**
 * Check if docker is installed
 * @return {Boolean} whether docker is installed or not
 */
var isDockerInstalled = () => !!GLib.find_program_in_path('docker');

/**
 * Check if docker daemon is running
 * @return {Boolean} whether docker daemon is running or not
 */
var isDockerRunning = () => {
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
var getContainers = () => {
    const [res, out, err, status] = GLib.spawn_command_line_sync("docker ps -a --format '{{.Names}},{{.Status}}'");
    if (status !== 0)
        throw new Error("Error occurred when fetching containers");

    return String.fromCharCode.apply(String, out).trim().split('\n')
        .filter((string) => string.length > 0)
        .map((string) => {
            const values = string.split(',');
            return {
                name: values[0],
                status: values[1]
            };
        });
};

/**
 * Run the specified command in the background
 * @param {String} dockerCommand The Docker command to run
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
const runBackgroundCommand = (dockerCommand, callback) => {
    Utils.async(
        () => GLib.spawn_command_line_async(dockerCommand),
        (res) => callback(res)
    );
};

/**
 * Spawn a new terminal emulator and run the specified command within it
 * @param {String} dockerCommand The Docker command to run
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
const runInteractiveCommand = (dockerCommand, callback) => {
    const defaultShell = GLib.getenv("SHELL");

    const terminalCommand = "gnome-terminal -- "
        + defaultShell + " -c '"
        + dockerCommand
        + "if [ $? -ne 0 ]; then " + defaultShell + "; fi'";

    Utils.async(
        () => GLib.spawn_command_line_async(terminalCommand),
        (res) => callback(res)
    );
};

/**
 * Run a Docker action
 * @param {String} dockerAction The action to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, action, and stdErr
 */
var runAction = (dockerAction, containerName, callback) => {
    const dockerCommand = getDockerActionCommand(dockerAction, containerName);

    dockerAction.isInteractive ?
        runInteractiveCommand(dockerCommand, callback)
        : runBackgroundCommand(dockerCommand, callback);
};
