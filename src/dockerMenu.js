"use strict";

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;
const DockerSubMenuMenuItem = Me.imports.src.dockerSubMenuMenuItem;
const GObject = imports.gi.GObject;

// Docker icon on status menu
var DockerMenu = GObject.registerClass(
  class DockerMenu extends PanelMenu.Button {
    _init(menuAlignment, nameText) {
      super._init(menuAlignment, nameText);

      const hbox = new St.BoxLayout({ style_class: "panel-status-menu-box" });
      const gicon = Gio.icon_new_for_string(Me.path + "/docker.svg");
      const dockerIcon = new St.Icon({ gicon: gicon, icon_size: "24" });

      hbox.add_child(dockerIcon);
      hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
      this.add_child(hbox);
      this.connect("button_press_event", this._refreshMenu.bind(this));

      this._renderMenu();
    }

    // Refresh  the menu everytime the user click on it
    // It allows to have up-to-date information on docker containers
    _refreshMenu() {
      if (this.menu.isOpen) {
        this.menu.removeAll();
        this._renderMenu();
      }
    }

    // Show docker menu icon only if installed and append docker containers
    _renderMenu() {
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
      this.show();
    }

    // Append containers to menu
    _feedMenu() {
      try {
        const containers = Docker.getContainers();
        if (containers.length > 0) {
          containers.forEach(container => {
            const subMenu = new DockerSubMenuMenuItem.DockerSubMenu(
              container.name,
              container.status
            );
            this.menu.addMenuItem(subMenu);
          });
        } else {
          this.menu.addMenuItem(
            new PopupMenu.PopupMenuItem("No containers detected")
          );
        }
      } catch (err) {
        const errMsg = "Error occurred when fetching containers";
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
        log(errMsg);
        log(err);
      }
    }
  }
);
