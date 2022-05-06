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
const { GLib } = imports.gi;
const { debounce } = Me.imports.src.utils;

const isContainerUp = (container) => container.status.indexOf("Up") > -1;

// Docker icon as panel menu
var DockerMenu = GObject.registerClass(
  class DockerMenu extends panelMenu.Button {
    _containers = null;
    _init(menuAlignment, nameText) {
      super._init(menuAlignment, nameText);
      this._refreshCount = this._refreshCount.bind(this);
      this._refreshMenu = this._refreshMenu.bind(this);
      this._feedMenu = this._feedMenu.bind(this);
      this._updateCountLabel = this._updateCountLabel.bind(this);
      this._refreshDelayChanged = this._refreshDelayChanged.bind(this);
      this._debouncedRefreshCount = debounce(this._refreshCount, 500).bind(this);
      this._timeout = null;

      this.settings = extensionUtils.getSettings(
        'red.software.systems.easy_docker_containers'
      );

      this._refreshDelay = this.settings.get_int('refresh-delay');
      this.settings.connect(
        'changed::refresh-delay',
        this._refreshDelayChanged,
      );

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
      const loading = _("Loading...");
      this.buttonText = new St.Label({
        text: loading,
        style: "margin-top:4px;",
      });

      hbox.add_child(dockerIcon);
      hbox.add_child(arrowIcon(St.Side.BOTTOM));
      hbox.add_child(this.buttonText);
      this.add_child(hbox);
      this.menu.connect("open-state-changed", this._refreshMenu.bind(this));
      this.menu.addMenuItem(new PopupMenuItem(loading));

      this._refreshCount();
      if (Docker.hasPodman || Docker.hasDocker) {
        this.show();
      }
    }

    _refreshDelayChanged() {
      this._refreshDelay = this.settings.get_int('refresh-delay');
      // Use a debounced function to avoid running the refresh every time the user changes the value
      this._debouncedRefreshCount();
    }

    _updateCountLabel(count) {
      if (this.buttonText.get_text() !== count) {
        this.buttonText.set_text(count.toString(10));
      }
    }

    // Refresh  the menu everytime the user opens it
    // It allows to have up-to-date information on docker containers
    async _refreshMenu() {
      if (this.menu.isOpen) {        
        const containers = await Docker.getContainers();
        this._updateCountLabel(
          containers.filter(
            (container) => isContainerUp(container)).length
          );
        this._feedMenu(containers).catch( (e) => this.menu.addMenuItem(new PopupMenuItem(e.message)));
      }     
    }

    _checkServices() {
      if (!Docker.hasPodman && !Docker.hasDocker) {
        let errMsg = _(
          "Please install Docker or Podman to use this plugin"
        );
        this.menu.addMenuItem(new PopupMenuItem(errMsg));
        throw new Error(errMsg);
      }
    }

    async _checkDockerRunning() {
      if (!Docker.hasPodman && !(await Docker.isDockerRunning())) {
        let errMsg = _(
          "Please start your Docker service first!\n(Seems Docker daemon not started yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _checkUserInDockerGroup() {
      if (!Docker.hasPodman && !(await Docker.isUserInDockerGroup)) {
        let errMsg = _(
          "Please put your Linux user into `docker` group first!\n(Seems not in that yet.)"
        );
        throw new Error(errMsg);
      }
    }

    async _check() {
      return Promise.all(
        [
          this._checkServices(),
          this._checkDockerRunning(),
          //this._checkUserInDockerGroup()
        ]
      );
    }
    
    clearLoop() {
      if (this._timeout) {
        GLib.source_remove(this._timeout);
        this._timeout = null;
      }
    }

    async _refreshCount() {
      try {       
        // If the extension is not enabled but we have already set a timeout, it means this function
        // is called by the timeout after the extension was disabled, we should just bail out and
        // clear the loop to avoid a race condition infinitely spamming logs about St.Label not longer being accessible
        if (Me.state !== extensionUtils.ExtensionState.ENABLED && this._timeout !== null) {
          this.clearLoop();
          return;
        }
        
        this.clearLoop();

        const dockerCount = await Docker.getContainerCount();        
        this._updateCountLabel(dockerCount);
        
        // Allow setting a value of 0 to disable background refresh in the settings
        if (this._refreshDelay > 0) {
          this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT_IDLE,
            this._refreshDelay,
            this._refreshCount
          );
        }
          // else log('DockerMenu: refresh disabled');
      } catch (err) {
        logError(err);
        this.clearLoop();
      }
    }
    
    // Append containers to menu
    async _feedMenu(dockerContainers) {      
      await this._check();  
      if (
        !this._containers ||
        dockerContainers.length !== this._containers.length ||
        dockerContainers.some( (currContainer, i) => {
          const container = this._containers[i];
          
          return currContainer.project !== container.project ||
          currContainer.name !== container.name ||
          isContainerUp(currContainer) !== isContainerUp(container)
        })
        ) {
          this.menu.removeAll(); 
          this._containers = dockerContainers;
          this._containers.forEach((container) => {
            const subMenu = new DockerSubMenu(
              container.project,
              container.name,
              container.status
            );
            this.menu.addMenuItem(subMenu);
          });
          if (!this._containers.length) {
            this.menu.addMenuItem(new PopupMenuItem("No containers detected"));
          }  
      }   
        
    }
  }
);
