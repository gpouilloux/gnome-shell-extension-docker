"use strict";

const St = imports.gi.St;
const Gio = imports.gi.Gio; // For custom icons
const panelMenu = imports.ui.panelMenu;
const { arrowIcon, PopupMenuItem } = imports.ui.popupMenu;
const extensionUtils = imports.misc.extensionUtils;
const Me = extensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;
const { DockerSubMenu } = Me.imports.src.dockerSubMenuMenuItem;
const GObject = imports.gi.GObject;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

// Docker icon as panel menu
var DockerMenu = GObject.registerClass(
  class DockerMenu extends panelMenu.Button {
    _init(menuAlignment, nameText) {
      super._init(menuAlignment, nameText);

      // Custom Docker icon as menu button
      const hbox = new St.BoxLayout({ style_class: "panel-status-menu-box" });
      const gicon = Gio.icon_new_for_string(
        Me.path + "/icons/docker-symbolic.svg"
      );
      //const panelIcon = (name = "docker-symbolic", styleClass = "system-status-icon") => new St.Icon({ gicon: gioIcon(name), style_class: styleClass, icon_size: "16" });
      const dockerIcon = new St.Icon({
        gicon: gicon,
        style_class: "system-status-icon",
        icon_size: "16",
      });

      this.buttonText = new St.Label({
        text: _("Loading..."),
        style: "margin-top:4px;",
      });

      hbox.add_child(dockerIcon);
      hbox.add_child(arrowIcon(St.Side.BOTTOM));
      hbox.add_child(this.buttonText);
      this.add_child(hbox);
      this.connect("button_press_event", this._refreshMenu.bind(this));

      this._renderMenu();
      this._refreshCount();
    }

    // Refresh  the menu everytime the user click on it
    // It allows to have up-to-date information on docker containers
    _refreshMenu() {
      if (this.menu.isOpen) {
        this.menu.removeAll();
        this._renderMenu();
      }
    }

    // Show docker menu icon only if installed, append docker containers, and manageable with current user without 'sudo'
    _renderMenu() {
      if (Docker.isDockerInstalled() || Docker.isPodmanInstalled()) {
        if (Docker.isUserInDockerGroup() || Docker.isPodmanInstalled()) {
          if (Docker.isDockerRunning() || Docker.isPodmanInstalled()) {
            this._feedMenu();
          } else {
            let errMsg = _(
              "Please start your Docker service first!\n(Seems Docker daemon not started yet.)"
            );
            this.menu.addMenuItem(new PopupMenuItem(errMsg));
            log(errMsg);
          }
        } else {
          let errMsg = _(
            "Please put your Linux user into `docker` group first!\n(Seems not in that yet.)"
          );
          this.menu.addMenuItem(new PopupMenuItem(errMsg));
          log(errMsg);
        }
      } else {
        let errMsg = _(
          "Please properly install Docker service first!\n(Seems Docker binary not found in PATH yet.)"
        );
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        log(errMsg);
      }
      this.show();
    }

    _refreshCount() {
      let dockerCount = 0;
      try {
        let containers = Docker.getContainers();
        if (containers.length > 0) {
          containers.forEach((container) => {
            if (container.status.indexOf("Up") > -1) {
              dockerCount++;
            }
          });
        }
      
        this.buttonText.set_text(dockerCount + "");

        if (this._timeout) {
          Mainloop.source_remove(this._timeout);
          this._timeout = null;
        }

        this._timeout = Mainloop.timeout_add_seconds(
          2,
          Lang.bind(this, this._refreshCount)
        );
      } catch (err) {}
    }
    // Append containers to menu
    _feedMenu() {
      try {
        const containers = Docker.getContainers();
        if (containers.length > 0) {
          containers.forEach((container) => {
            const subMenu = new DockerSubMenu(
              container.project,
              container.name,
              container.status
            );
            this.menu.addMenuItem(subMenu);
          });
        } else {
          this.menu.addMenuItem(new PopupMenuItem("No containers detected"));
        }
      } catch (err) {
        const errMsg = "Error occurred when fetching containers";
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        log(errMsg);
        log(err);
      }
    }
  }
);
