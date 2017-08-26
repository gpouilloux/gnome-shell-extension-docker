// Docker menu extension
// @author Guillaume Pouilloux <gui.pouilloux@gmail.com>

/**
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

'use strict';

const GLib = imports.gi.GLib;

const dockerCommandsToLabels = {
    'start': 'Start',
    'stop': 'Stop',
    'pause': 'Pause',
    'unpause': 'Unpause',
    'rm': 'Remove',
    'exec': 'Open Terminal'
};

// Lets you run a function in asynchronous mode using GLib
// @parameter fn : the function to run
// @parameter callback : the function to call after fn
function async(fn, callback) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, function () {
        let funRes = fn();
        callback(funRes);
    }, null);
}

/**
 * Get's the system's default terminal according to Gnome Shell DConf value
 *
 * @returns {string}
 */
function getDefaultTerminal() {
    let terminal = '';
    let res, out, err, status;
    let gsettingsCmd = 'gsettings get org.gnome.desktop.default-applications.terminal exec';
    [res, out, err, status] = GLib.spawn_command_line_sync(gsettingsCmd);

    if( status === 0 ) {
        let outStr = String.fromCharCode.apply(String, out);
        terminal = outStr.split('\n')[0].replace(/'/g, "");
    }

    return terminal;
}