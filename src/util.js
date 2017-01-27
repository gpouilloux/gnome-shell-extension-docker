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

// Lets you run a function in asynchronous mode using GLib
// @parameter fn : the function to run
// @parameter callback : the function to call after fn
function async(fn, callback) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, function() {
        let funRes = fn();
        callback(funRes);
    }, null);
}

const dockerCommandsToLabels = {
  'start': 'Start',
  'stop': 'Stop',
  'pause': 'Pause',
  'unpause': 'Unpause',
  'rm': 'Remove'
};
