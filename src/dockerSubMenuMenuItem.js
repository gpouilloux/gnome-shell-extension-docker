"use strict";

const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DockerMenuItem = Me.imports.src.dockerMenuItem;
const GObject = imports.gi.GObject;

/**
 * Create a St.Icon
 * @param {String} name The name of the icon
 * @param {String} styleClass The style of the icon
 * @return {Object} an St.Icon instance
 */
const createIcon = (name, styleClass = "status-undefined") =>
  new St.Icon({ icon_name: name, style_class: styleClass, icon_size: "14" });

/**
 * Get the status of a container from the status message obtained with the docker command
 * @param {String} statusMessage The status message
 * @return {String} The status in ['running', 'paused', 'stopped']
 */
const getStatus = statusMessage => {
  let status = "stopped";
  if (statusMessage.indexOf("Up") > -1) status = "running";

  if (statusMessage.indexOf("Paused") > -1) status = "paused";

  return status;
};

// Menu entry representing a docker container
var DockerSubMenu = GObject.registerClass(
  class DockerSubMenu extends PopupMenu.PopupSubMenuMenuItem {
    _init(containerName, containerStatusMessage) {
      super._init(containerName);

      switch (getStatus(containerStatusMessage)) {
        case "stopped":
          this.insert_child_at_index(
            createIcon("process-stop-symbolic", "status-stopped"),
            1
          );
          this.menu.addMenuItem(
            new DockerMenuItem.DockerMenuItem(
              containerName,
              "start",
              createIcon("media-playback-start-symbolic")
            )
          );
          break;
        case "running":
          this.insert_child_at_index(
            createIcon("system-run-symbolic", "status-running"),
            1
          );
          this.menu.addMenuItem(
            new DockerMenuItem.DockerMenuItem(
              containerName,
              "pause",
              createIcon("media-playback-pause-symbolic")
            )
          );
          this.menu.addMenuItem(
            new DockerMenuItem.DockerMenuItem(
              containerName,
              "stop",
              createIcon("system-shutdown-symbolic")
            )
          );
          this.menu.addMenuItem(
            new DockerMenuItem.DockerMenuItem(
              containerName,
              "restart",
              createIcon("system-reboot-symbolic")
            )
          );
          this.menu.addMenuItem(
            new DockerMenuItem.DockerMenuItem(
              containerName,
              "exec",
              createIcon("system-run-symbolic")
            )
          );
          break;
        case "paused":
          this.insert_child_at_index(
            createIcon("media-playback-pause-symbolic", "status-paused"),
            1
          );
          this.menu.addMenuItem(
            new DockerMenuItem.DockerMenuItem(
              containerName,
              "unpause",
              createIcon("system-refresh-symbolic")
            )
          );
          break;
        default:
          this.insert_child_at_index(
            createIcon("action-unavailable-symbolic", "status-undefined"),
            1
          );
          break;
      }
    }
  }
);
