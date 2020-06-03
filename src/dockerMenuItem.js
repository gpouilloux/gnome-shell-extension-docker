"use strict";

const { PopupMenuItem } = imports.ui.popupMenu;
const Main = imports.ui.main;
const extensionUtils = imports.misc.extensionUtils;
const Me = extensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;
const GObject = imports.gi.GObject;

// Docker actions for each container
var DockerMenuItem = GObject.registerClass(
  class DockerMenuItem extends PopupMenuItem {
    _init(containerName, dockerCommand, icon) {
      super._init(Docker.dockerCommandsToLabels[dockerCommand]);
      if (icon) {
        this.insert_child_at_index(icon, 1);
      }

      this.connect("activate", () =>
        this._dockerAction(containerName, dockerCommand)
      );
    }
    _dockerAction(containerName, dockerCommand) {
      Docker.runCommand(dockerCommand, containerName, (ok, command, err) => {
        if (ok) {
          Main.notify("Command `" + command + "` successful");
        } else {
          let errMsg = _("Error occurred when running `" + command + "`");
          Main.notifyError(errMsg);
          logError(errMsg);
          logError(err);
        }
      });
    }
  }
);