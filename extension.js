"use strict";

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DockerMenu = Me.imports.src.dockerMenu;

// Triggered when extension has been initialized
function init() {}

// The docker indicator
let _indicator;

// Triggered when extension is enabled
function enable() {
  _indicator = new DockerMenu.DockerMenu(0.0, _("Docker containers"));
  Main.panel.addToStatusArea("docker-menu", _indicator);
}

// Triggered when extension is disabled
function disable() {
  _indicator.clearLoop();
  _indicator.destroy();
}
