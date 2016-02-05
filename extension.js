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
        async(function() {
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

        let statusIcon = new St.Icon({ gicon: gicon, icon_size: '10'});
        this.actor.insert_child_at_index(statusIcon, 1);
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
        let dockerIcon = new St.Icon({ gicon: gicon, icon_size: '30'});

        hbox.add_child(dockerIcon);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(hbox);
        this.actor.connect('button_press_event', Lang.bind(this, this._refreshMenu));

        this._renderMenu();
    },

    _refreshMenu : function() {
        if(this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    // Checks if docker is installed on the host machine
    _isDockerInstalled: function() {
        let isDockerInstalled = false;
        try {
            let [res, out, err, status] = GLib.spawn_command_line_sync("docker -v");
            // FIXME maybe we can use GLib method
            //GLib.find_program_in_path
            isDockerInstalled = (status == 0);
        }
        catch(err) {
            log(err);
        }

        return isDockerInstalled;
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

          // foreach container, add an entry in the menu
          for(let i = 0; i < numberContainers; i++) {
              let [containerName, containerStatusMessage] = dockerContainers[i].split(delimiter);
              let subMenu = new DockerSubMenuMenuItem(containerName, containerStatusMessage);
              this.menu.addMenuItem(subMenu);
          }
      } else {
          let errMsg = "Error occurred when fetching containers";
          this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
          log(errMsg);
          log(err);
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

// Lets you run a function in asynchronous mode
// @parameter fn : the function to run
// @parameter callback : the function to call after fn
function async(fn, callback) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, function() {
        let funRes = fn();
        callback(funRes);
    }, null);
}
