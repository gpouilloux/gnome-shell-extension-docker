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

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;
const DockerSubMenuMenuItem = Me.imports.src.dockerSubMenuMenuItem;

// Docker icon on status menu
const DockerMenu = new Lang.Class({
    Name: 'DockerMenu.DockerMenu',
    Extends: PanelMenu.Button,

    // Init the docker menu
    _init: function () {
        this.parent(0.0, _("Docker containers"));

        const hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        const gicon = Gio.icon_new_for_string(Me.path + "/docker.svg");
        const dockerIcon = new St.Icon({ gicon: gicon, icon_size: '24' });

        hbox.add_child(dockerIcon);
        this.actor.add_child(hbox);
        this.actor.connect('button_press_event', Lang.bind(this, this._refreshMenu));

        this._renderMenu();
    },

    // Refresh  the menu everytime the user click on it
    // It allows to have up-to-date information on docker containers
    _refreshMenu: function () {
        if (this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    // Show docker menu icon only if installed and append docker containers
    _renderMenu: function () {
        if (Docker.isDockerInstalled()) {
            if (Docker.isDockerRunning()) {
                this._feedMenu();
            } else {
                let errMsg = _("Docker daemon not started");
                this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
                log(errMsg);
            }
        } else {
            let errMsg = _("Docker binary not found in PATH ");
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
            log(errMsg);
        }
        this.actor.show();
    },

    // Append containers to menu
    _feedMenu: function () {
        try {
            const containers = Docker.getContainers();
            if (containers.length > 0) {
                containers.forEach((container) => {
                    const subMenu = new DockerSubMenuMenuItem.DockerSubMenuMenuItem(container.name, container.status);
                    this.menu.addMenuItem(subMenu);
                });
            } else {
                this.menu.addMenuItem(new PopupMenu.PopupMenuItem("No containers detected"));
            }
        } catch (err) {
            const errMsg = "Error occurred when fetching containers";
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
            log(errMsg);
            log(err);
        }
    }
});
