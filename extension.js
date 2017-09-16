/*
 * Gnome3 Docker Menu Extension
 * Copyright (C) 2017 Guillaume Pouilloux <gui.pouilloux@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
'use strict';

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DockerMenu = Me.imports.src.dockerMenu;

// Triggered when extension has been initialized
function init() {
}

// The docker indicator
let _indicator;

// Triggered when extension is enabled
function enable() {
    _indicator = new DockerMenu.DockerMenu;
    Main.panel.addToStatusArea('docker-menu', _indicator);
}

// Triggered when extension is disabled
function disable() {
    _indicator.destroy();
}
