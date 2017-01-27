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

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.src.util;

// Docker actions for each container
const DockerMenuItem = new Lang.Class({
    Name: 'DockerMenu.DockerMenuItem',
    Extends: PopupMenu.PopupMenuItem,

    _init : function(containerName, dockerCommand) {
        let itemLabel = Util.dockerCommandsToLabels[dockerCommand];
      	this.parent(itemLabel);

      	this.containerName = containerName;
        this.dockerCommand = dockerCommand;

        this.connect('activate', Lang.bind(this, this._dockerAction));
    },

    _callbackDockerAction : function(funRes) {
        if(funRes['status'] == 0) {
            let msg = "`" + funRes['cmd'] + "` terminated successfully";
            log(msg);
        } else {
            let errMsg = "Error occurred when running `" + funRes['cmd'] + "`";
            Main.notify(errMsg);
            log(errMsg);
            log(funRes['err']);
      }
    },

    _dockerAction : function() {
        let dockerCmd = "docker " + this.dockerCommand + " " + this.containerName;
        let res, out, err, status;
        Util.async(function() {
            [res, out, err, status] = GLib.spawn_command_line_sync(dockerCmd);
            return {
              cmd: dockerCmd,
              res: res,
              out: out,
              err: err,
              status: status
            };
        }, this._callbackDockerAction);
    }

});
