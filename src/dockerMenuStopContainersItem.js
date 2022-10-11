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
const Docker = Me.imports.src.docker;
const Utils = Me.imports.src.utils;

var DockerMenuStopContainersItem = class DockerMenuStopContainersItem extends PopupMenu.PopupMenuItem {
    _init(itemLabel, allContainers) {
        super._init(itemLabel);

        this.connect('activate', this._dockerAction.bind(this));
    }

    _dockerAction() {
        let allContainers;
        try{
            allContainers = Docker.getContainers();
        }catch (err) {
            allContainers = [];
            log('Error while fetching docker containers')
            return;
        }

        for (let i=0;i< allContainers.length;i++) {
            
            if(this._isContainerStarted(allContainers[i].status) == false){
                continue;
            }

            const dockerCmd = 'docker stop ' + allContainers[i].name;
            Utils.async(
                () => GLib.spawn_command_line_async(dockerCmd),
                (res) => {
                    if(!!res) {
                        log('Docker container `' + allContainers[i].name + '` has been stopped.');
                    } else {
                        const errMsg = "Docker: error occurred when stopping container `" + allContainers[i].name + "`";

                        Main.notify(errMsg);
                        log(errMsg);
                    }

                    return GLib.SOURCE_REMOVE;
                }
            );
        }
    }


    _isContainerStarted(status) {
        if (status.indexOf('Up') > -1) {
            return true;
        }
        if (status.indexOf('Paused') > -1) {
            return true;
        }

        return false;

    }
};

if (!Utils.isGnomeShellVersionLegacy()) {
    DockerMenuStopContainersItem = GObject.registerClass(
        { GTypeName: 'DockerMenuStopContainersItem' },
        DockerMenuStopContainersItem
    );
}
