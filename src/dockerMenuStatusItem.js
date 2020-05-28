/*
 * Gnome3 Docker Menu Extension
 * Copyright (C) 2020 Guillaume Pouilloux <gui.pouilloux@gmail.com>
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
const GObject = imports.gi.GObject;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.src.utils;

var DockerMenuStatusItem = class DockerMenuStatusItem extends PopupMenu.PopupSwitchMenuItem {

    _init(itemLabel) {
        this.dockerStatus = this._getDockerStatus();

        super._init(itemLabel, this.dockerStatus);

        this.connect('activate', this._dockerAction.bind(this));
    }

    _getDockerStatus() {
    	const statusCmd = "systemctl is-active docker.service --system";
    	const [res, out, err, status] = GLib.spawn_command_line_sync(statusCmd);

        return (status == 0);
	}

    _dockerAction() {
    	const serviceAction = this.dockerStatus ? 'stop' : 'start';
        const dockerCmd = 'sh -c "pkexec --user root systemctl ' + serviceAction + ' docker.service --system"';

        Utils.async(
            () => GLib.spawn_command_line_async(dockerCmd),
            (res) => {
                if(!!res) {
                    log("Docker: `daemon " + serviceAction + "` action successfully dispatched");
                } else {
                    const errMsg = "Docker: error occurred when dispatching `daemon " + serviceAction + "` action";

                    Main.notify(errMsg);
                    log(errMsg);
                }

                return GLib.SOURCE_REMOVE;
            }
        );
    }
};

if (!Utils.isGnomeShellVersionLegacy()) {
    DockerMenuStatusItem = GObject.registerClass(
        { GTypeName: 'DockerMenuStatusItem' },
        DockerMenuStatusItem
    );
}
