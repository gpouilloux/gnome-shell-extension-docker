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
const St = imports.gi.St;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DockerMenuItem = Me.imports.src.dockerMenuItem;

// Menu entry representing a docker container
const DockerSubMenuMenuItem = new Lang.Class({
    Name: 'DockerMenu.DockerSubMenuMenuItem',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function (containerName, containerStatusMessage) {
        this.parent(containerName);
        let statusIcon = new St.Icon({icon_name: 'action-unavailable-symbolic', style_class: 'status-undefined', icon_size: '14'});

        let status = 'stopped';
        if(containerStatusMessage.indexOf("Up") > -1) status = 'running';
        if(containerStatusMessage.indexOf("Paused") > -1) status = 'paused';

        switch(status)
        {
            case "stopped":
                    statusIcon = new St.Icon({icon_name: 'process-stop-symbolic', style_class: 'status-stopped', icon_size: '14'});
                    this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "start"));
                    this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "rm"));
                break;

            case "running":
                    statusIcon = new St.Icon({icon_name: 'system-run-symbolic', style_class: 'status-running', icon_size: '14'});
                    this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "pause"));
                    this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "stop"));
                break;

            case "paused":
                    statusIcon = new St.Icon({icon_name: 'media-playback-pause-symbolic', style_class: 'status-paused', icon_size: '14'});
                    this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "unpause"));
                break;
        }

        this.actor.insert_child_at_index(statusIcon, 1);
    }
});
