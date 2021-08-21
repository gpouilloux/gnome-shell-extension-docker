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

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Config = imports.misc.config;

var isGnomeShellVersionLegacy = () => {
    const gnomeShellMajor = parseInt(Config.PACKAGE_VERSION.split('.')[0]);
    const gnomeShellMinor = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

    return gnomeShellMajor < 3 ||
        (gnomeShellMajor === 3 && gnomeShellMinor <= 30);
};

/**
 * Run a function in asynchronous mode using GLib
 * @param {Function} fn The function to run
 * @param {Function} callback The callback to call after fn
 */
var async = (fn, callback) => GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => callback(fn()));

/**
 * Run a command asynchronously
 * @param {string} commandLine Command to execute
 * @param {(output: string) => void} callback The callback to call after shell return an output
 */
var spawnCommandLineAsync = (commandLine, callback) => {
    function readOutput(stream, lineBuffer) {
        stream.read_line_async(0, null, (stream, res) => {
            try {
                let line = stream.read_line_finish_utf8(res)[0];
    
                if (line !== null) {
                    lineBuffer.push(line);
                    readOutput(stream, lineBuffer);
                }
            } catch (e) {
                logError(e);
            }
        });
    }

    try {
        let [, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
            null,
            ['/bin/sh', '-c', `${commandLine}`],
            null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null
        );

        GLib.close(stdin);

        let stdoutStream = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({
                fd: stdout,
                close_fd: true
            }),
            close_base_stream: true
        });

        let stdoutLines = [];
        readOutput(stdoutStream, stdoutLines);

        let stderrStream = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({
                fd: stderr,
                close_fd: true
            }),
            close_base_stream: true,
        });
    
        let stderrLines = [];
        readOutput(stderrStream, stderrLines);

        GLib.child_watch_add(GLib.PRIORITY_DEFAULT_IDLE, pid, (pid, status) => {
            if (status === 0) {
                callback(stdoutLines.join('\n'));
            } else {
                logError(new Error(stderrLines.join('\n')));
            }
    
            stdoutStream.close(null);
            stderrStream.close(null);
            GLib.spawn_close_pid(pid);
        });
    } catch(err) {
        logError(err);
    }
}

/**
 * Creates/changes a file
 * @param {string} filename Filename of the file that will be created/changed
 * @param {string} content Content that will be written inside the file that will be created/changed
 */
var writeFile = (filename, content = '') => {
    if (!filename) {
        throw new Error('The filename is a required parameter');
    }

    content = content.split('"').join('\\\\\\"');

    GLib.spawn_command_line_async(`/bin/sh -c "echo \\"${content}\\" > ${filename}"`);
}

/**
 * Get custom shell commands to containers from storage
 * @param {(customShellCommandsToContainers: {[containerName: string]: string}) => void} callback The callback to call after get the custom shell commands
 */
var getCustomShellCommandsToContainersFromStorage = (callback) => {
    spawnCommandLineAsync(
        'cat ~/.dockerIntegrationCustomShellCommandsToContainers.json',
        (res) => {
            const customShellCommandsToContainers = JSON.parse(res);
            callback(customShellCommandsToContainers);
        }
    );
}

/**
 * Save custom shell commands to containers in storage
 * @param {{[containerName: string]: string}} customShellCommandsToContainers The custom shell commands to save in storage
 */
var saveCustomShellCommandsToContainers = (customShellCommandsToContainers) => {
    writeFile(
        '~/.dockerIntegrationCustomShellCommandsToContainers.json',
        JSON.stringify(customShellCommandsToContainers)
    );
}

/**
 * Opens a window with an input
 * @param {{title?: string, text?: string, entryText?: string}} textEntryProps The properties of the window elements
 * @param {(inputValue: string) => void} callback The callback to call after the user filled the input
 */
var openWindowTextEntry = (textEntryProps, callback) => {
    const { title = '', text = '', entryText = '' } = textEntryProps || {};

    const script = 'zenity --entry ' +
        `--title="${title}" ` +
        `--text="${text}" ` +
        `--entry-text "${entryText}"`;

    spawnCommandLineAsync(script, callback);
}
