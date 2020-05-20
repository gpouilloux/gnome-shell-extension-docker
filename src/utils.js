/*
 * Gnome3 Docker Menu Extension
 * Copyright (C) 2020 Guillaume Pouilloux <gui.pouilloux@gmail.com>
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

const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;
const Config = imports.misc.config;

var isGnomeShellVersionLegacy = () => {
    const gnomeShellMajor = parseInt(Config.PACKAGE_VERSION.split('.')[0]);
    const gnomeShellMinor = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

    return gnomeShellMajor < 3 ||
        (gnomeShellMajor === 3 && gnomeShellMinor < 30);
};

/**
 * Run a function in asynchronous mode using GLib
 * @param {Function} fn The function to run
 * @param {Function} callback The callback to call after fn
 */
var async = (fn, callback) => GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => callback(fn()));

/**
 * Return a string representation of the given byteArray
 * 
 * This is necessary for compatibility with older Gnome Shell versions,
 * where GJS introspected methods handed back instances of the custom ByteArray
 * type. Newer versions replace this behaviour by having methods return
 * instances of JS Uint8Array type, whose "toString" method has a different
 * purpose, hence an explicit call to ByteArray toString method is required.
 * @param {Uint8Array|ByteArray} byteArray
 * @return {String} The string representation of byteArray
 */
var getByteArrayString = (byteArray) => {
    return byteArray instanceof Uint8Array ?
        ByteArray.toString(byteArray)
        : byteArray.toString();
};
