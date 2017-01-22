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

    _init: function(containerName, containerStatusMessage) {
        this.parent(containerName);
        let gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_red.png");

        // Docker container is not running
        if(containerStatusMessage.indexOf("Exited") > -1 || containerStatusMessage.indexOf("Created") > -1) {
            this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "start"));
            this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "rm"));
        }
        // Docker container is up
        else if(containerStatusMessage.indexOf("Up") > -1) {
            if(containerStatusMessage.indexOf("Paused") > -1) {
                gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_yellow.png");
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "unpause"));
            } else {
                gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_green.png");
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "pause"));
                this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "stop"));
            }
        }

        let statusIcon = new St.Icon({ gicon: gicon, icon_size: '10'});
        this.actor.insert_child_at_index(statusIcon, 1);
    }
});
