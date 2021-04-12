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

const { Clutter, GObject, St } = imports.gi;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DockerActions = Me.imports.src.docker.DockerActions;
const DockerMenuItem = Me.imports.src.dockerMenuItem;
const Utils = Me.imports.src.utils;

/**
 * Create a St.Icon
 * @param {String} name The name of the icon 
 * @param {String} styleClass The style of the icon
 * @return {Object} an St.Icon instance
 */
const createIcon = (name, styleClass) => new St.Icon({ icon_name: name, style_class: styleClass, icon_size: '14' });

/**
 * Get the status of a container from the status message obtained with the docker command
 * @param {String} statusMessage The status message
 * @return {String} The status in ['running', 'paused', 'stopped'] 
 */
const getStatus = (statusMessage) => {
    let status = 'stopped';
    if (statusMessage.indexOf("Up") > -1)
        status = 'running';

    if (statusMessage.indexOf("Paused") > -1)
        status = 'paused';

    return status;
}

// Menu entry representing a docker container
var DockerSubMenuMenuItem = class DockerSubMenuMenuItem extends PopupMenu.PopupSubMenuMenuItem {

    _init(containerName, containerStatusMessage) {
        super._init(containerName);
        
        this.clutterActor = this instanceof Clutter.Actor ? this : this.actor;

        switch (getStatus(containerStatusMessage)) {
            case "stopped":
                this.clutterActor.insert_child_at_index(createIcon('process-stop-symbolic', 'status-stopped'), 1);
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.START));
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.REMOVE));
                break;
            case "running":
                this.clutterActor.insert_child_at_index(createIcon('system-run-symbolic', 'status-running'), 1);
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.OPEN_SHELL));
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.RESTART));
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.PAUSE));
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.STOP));
                break;
            case "paused":
                this.clutterActor.insert_child_at_index(createIcon('media-playback-pause-symbolic', 'status-paused'), 1);
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, DockerActions.UNPAUSE));
                break;
            default:
                this.clutterActor.insert_child_at_index(createIcon('action-unavailable-symbolic', 'status-undefined'), 1);
                break;
        }
    }
};

if (!Utils.isGnomeShellVersionLegacy()) {
    DockerSubMenuMenuItem = GObject.registerClass(
        { GTypeName: 'DockerSubMenuMenuItem' },
        DockerSubMenuMenuItem
    );
}
