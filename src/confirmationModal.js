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

const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const Dialog = imports.ui.dialog;
const ModalDialog = imports.ui.modalDialog;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.src.utils;

var ConfirmationModal = class ConfirmationModal extends ModalDialog.ModalDialog {

    _init(message, callback, callbackParams = []) {
        super._init();

        this.message = message;
        this.callback = callback;
        this.callbackParams = callbackParams;

        this._buildLayout();
        this.open();
    }

    _buildLayout() {
        const messageDialogContentParams = {
            title: "Confirm action"
        };
        Dialog.MessageDialogContent.prototype.hasOwnProperty("description")
            ? messageDialogContentParams.description = this.message
            : messageDialogContentParams.subtitle = this.message;
        const content = new Dialog.MessageDialogContent(messageDialogContentParams);
        this.contentLayout.add_actor(content);

        const cancelButton = {
            label: _("Cancel"),
            action: Lang.bind(this, this._cancelAction),
            key: Clutter.KEY_Escape || Clutter.Escape,
            default: true
        };
        const confirmButton = {
            label: _("Confirm"),
            action: Lang.bind(this, this._confirmAction)
        };
        this.setButtons([cancelButton, confirmButton]);
    }

    _confirmAction() {
        this.close();
        this.callback(...this.callbackParams);
    }

    _cancelAction() {
        this.close();
    }
}

if (!Utils.isGnomeShellVersionLegacy()) {
    ConfirmationModal = GObject.registerClass(
        { GTypeName: 'ConfirmationModal' },
        ConfirmationModal
    );
}
