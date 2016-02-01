// Docker menu extension
// @author Guillaume Pouilloux <gui.pouilloux@gmail.com>

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const St = imports.gi.St;
const Shell = imports.gi.Shell;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

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

      //print("DEBUG : Displaying docker containers");
      //print(out);

      let outStr = String.fromCharCode.apply(String, out);
      let dockerContainers = outStr.split('\n');

      for(var i = 0; i < dockerContainers.length-1; i++) {
          let [name, status] = dockerContainers[i].split(delimiter);

          let subMenu = new PopupMenu.PopupSubMenuMenuItem(name);
          let gicon;

          // Docker container is not running
          if(status.indexOf("Exited") > -1) {
              gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_red.png");
              subMenu.menu.addAction("Start", _handleStartEvent);
          }
          // Docker container is up
          else if(status.indexOf("Up") > -1) {
              if(status.indexOf("Paused") > -1) {
                  gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_yellow.png");
                  subMenu.menu.addAction("Unpause", function(event) {
                      GLib.spawn_command_line_sync("docker unpause " + name);

                  });

              } else {
                  gicon = Gio.icon_new_for_string(Me.path + "/icons/circle_green.png");

                  subMenu.menu.addAction("Pause", function(event) {
                      GLib.spawn_command_line_sync("docker pause " + name);
                  });

                  subMenu.menu.addAction("Stop", function(event) {
                      GLib.spawn_command_line_sync("docker stop " + name);
                  });
              }
          }

          let dockerIcon = new St.Icon({ gicon: gicon, icon_size: '10'});
          this.menu.addMenuItem(subMenu);
          subMenu.actor.insert_child_at_index(dockerIcon, 1);

      }
    },

    // Destroy menu
    destroy: function() {
        this.parent();
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

function _handleStartEvent(event) {
    let name = "mongo-flights";
    // TODO get action (e.g Start) and name (e.g mongo-flights)
    print(event.get_source().get_label_actor());
    print(event.get_source().get_parent().get_parent().get_parent().get_parent().get_label_actor());
  //GLib.spawn_command_line_sync("docker start " + name);
    disable();
    enable();
}
