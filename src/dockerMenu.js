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

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DockerSubMenuMenuItem = Me.imports.src.dockerSubMenuMenuItem;

// Docker icon on status menu
const DockerMenu = new Lang.Class({
    Name: 'DockerMenu.DockerMenu',
    Extends: PanelMenu.Button,

    // Init the docker menu
    _init: function() {
        this.parent(0.0, _("Docker containers"));

        let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        let gicon = Gio.icon_new_for_string(Me.path + "/icons/docker.svg");
        let dockerIcon = new St.Icon({ gicon: gicon, icon_size: '24'});

        hbox.add_child(dockerIcon);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(hbox);
        this.actor.connect('button_press_event', Lang.bind(this, this._refreshMenu));

        this._renderMenu();
    },

    // Refresh  the menu everytime the user click on it
    // It allows to have up-to-date information on docker containers
    _refreshMenu : function() {
        if(this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    // Checks if docker is installed on the host machine
    _isDockerInstalled: function() {
        return GLib.find_program_in_path('docker') != undefined;
    },

    // Checks if the docker daemon is running or not
    _isDockerRunning: function() {
        let [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(null, ['/bin/ps', 'cax'], null, 0, null);

        let out_reader = new Gio.DataInputStream({
          base_stream: new Gio.UnixInputStream({fd: out_fd})
        });

        // Look for the docker process running
        let dockerRunning = false;
        let hasLine = true;
        do {
            let [out, size] = out_reader.read_line(null);
            if(out != null && out.toString().indexOf("docker") > -1) {
                dockerRunning = true;
            } else if(size <= 0) {
                hasLine = false;
            }

        } while(!dockerRunning && hasLine);

        return dockerRunning;
    },

    // Show docker menu icon only if installed and append docker containers
    _renderMenu: function() {
        if(this._isDockerInstalled()) {
          if(this._isDockerRunning()) {
              this._feedMenu();
          } else {
                  let errMsg = "Docker daemon not started";
                  this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
                  log(errMsg);
          }
        } else {
              let errMsg = "Docker binary not found in PATH ";
              this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
              log(errMsg);
        }
        this.actor.show();
    },

    // Append containers to menu
    _feedMenu: function() {

        let delimiter = ',';
        let [res, out, err, status] = GLib.spawn_command_line_sync("docker ps -a --format '{{.Names}}" + delimiter + "{{.Status}}'");

        if(status == 0) {
            let outStr = String.fromCharCode.apply(String, out);
            let dockerContainers = outStr.split('\n');
            let numberContainers = dockerContainers.length-1;

            if (numberContainers) {
              // foreach container, add an entry in the menu
              for(let i = 0; i < numberContainers; i++) {
                  let [containerName, containerStatusMessage] = dockerContainers[i].split(delimiter);
                  let subMenu = new DockerSubMenuMenuItem.DockerSubMenuMenuItem(containerName, containerStatusMessage);
                  this.menu.addMenuItem(subMenu);
              }
            } else {
              let noContainersMsg = "No containers detected";
              this.menu.addMenuItem(new PopupMenu.PopupMenuItem(noContainersMsg));
            }
        } else {
            let errMsg = "Error occurred when fetching containers";
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
            log(errMsg);
            log(err);
        }
    }
});
