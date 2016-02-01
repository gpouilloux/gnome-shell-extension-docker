// Docker menu extension
// @author Guillaume Pouilloux <gui.pouilloux@gmail.com>

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const St = imports.gi.St;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

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

    _dockerAction : function() {
        // TODO check if command line succeeded and if not display the error message
        GLib.spawn_command_line_sync("docker " + this.dockerCommand + " " + this.containerName);

        // refresh the menu
        disable();
        enable();
    }
});

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
            this.menu.addMenuItem(new DockerMenuItem(containerName, "start"));
        }
        // Docker container is up
        else if(containerStatusMessage.indexOf("Up") > -1) {
            if(containerStatusMessage.indexOf("Paused") > -1) {
                gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_yellow.png");
                this.menu.addMenuItem(new DockerMenuItem(containerName, "unpause"));
            } else {
                gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_green.png");
                this.menu.addMenuItem(new DockerMenuItem(containerName, "pause"));
                this.menu.addMenuItem(new DockerMenuItem(containerName, "stop"));
            }
        }

        let dockerIcon = new St.Icon({ gicon: gicon, icon_size: '10'});
        this.actor.insert_child_at_index(dockerIcon, 1);
    }
});

// Docker icon on status menu
const DockerMenu = new Lang.Class({
    Name: 'DockerMenu.DockerMenu',
    Extends: PanelMenu.Button,

    // Init the docker menu
    _init: function() {
        this.parent(0.0, _("Docker containers"));

        let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        let gicon = Gio.icon_new_for_string(Me.path + "/icons/docker.png");
        let dockerIcon = new St.Icon({ gicon: gicon});

        hbox.add_child(dockerIcon);
        this.actor.add_child(hbox);

      	this._renderMenu();
    },

    // Show docker menu icon only if installed and append docker containers
    _renderMenu: function() {
       let [res, out, err, status] = GLib.spawn_command_line_sync("docker -v");
       if(status == 0) {
          this.actor.show();
          this._feedMenu();
       } else {
          this.actor.hide();
       }
    },

    // Append containers to menu
    _feedMenu: function() {
      let delimiter = ',';
      let [res, out, err, status] = GLib.spawn_command_line_sync("docker ps -a --format '{{.Names}}" + delimiter + "{{.Status}}'");

      let outStr = String.fromCharCode.apply(String, out);
      let dockerContainers = outStr.split('\n');

      // foreach container, add an entry in the menu
      for(let i = 0; i < dockerContainers.length-1; i++) {
          let [containerName, containerStatusMessage] = dockerContainers[i].split(delimiter);
          let subMenu = new DockerSubMenuMenuItem(containerName, containerStatusMessage);
          this.menu.addMenuItem(subMenu);
      }
    }

});

// Triggered when extension has been initialized
function init() {
}

// The docker indicator
let _indicator;

// Triggered when extension is enabled
function enable() {
    _indicator = new DockerMenu;
    Main.panel.addToStatusArea('docker-menu', _indicator);
}

// Triggered when extension is disabled
function disable() {
    _indicator.destroy();
}
