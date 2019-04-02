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

const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;

// Docker actions for each container
const DockerMenuItem = class DockerMenu_DockerMenuItem extends PopupMenu.PopupMenuItem {

    constructor(containerName, dockerCommand) {
        super(Docker.dockerCommandsToLabels[dockerCommand]);

        this.containerName = containerName;
        this.dockerCommand = dockerCommand;

        this.connect('activate', this._dockerAction.bind(this));
    }

    _dockerAction() {
        Docker.runCommand(this.dockerCommand, this.containerName, (status, command, err) => {
            if (status === 0) {
                log("`" + command + "` terminated successfully");
            } else {
                let errMsg = _("Error occurred when running `" + command + "`");
                Main.notify(errMsg);
                log(errMsg);
                log(err);
            }
        });
    }
};
