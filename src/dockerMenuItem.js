"use strict";

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

    _init: function(containerName, dockerCommand) {
        let itemLabel = dockerCommand.charAt(0).toUpperCase() + dockerCommand.slice(1);
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
