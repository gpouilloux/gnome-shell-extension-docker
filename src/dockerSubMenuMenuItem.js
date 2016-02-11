"use strict";

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
        let gicon;

        // Docker container is not running
        if(containerStatusMessage.indexOf("Exited") > -1) {
            gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_red.png");
            this.menu.addMenuItem(new DockerMenuItem.DockerMenuItem(containerName, "start"));
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
