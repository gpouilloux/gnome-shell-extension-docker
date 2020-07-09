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

    _init(message, action, actionParams = []) {
        super._init();

        this.action = action;
        this.actionParams = actionParams;

        this._buildLayout(message);
        this.open();
    }

    _buildLayout(message) {
        const content = new Dialog.MessageDialogContent({
            title: "Confirm action",
            description: message
        });
        this.contentLayout.add_actor(content);

        const cancelButton = {
            label: _("Cancel"),
            action: Lang.bind(this, this._cancelAction),
            key: Clutter.KEY_Escape || Clutter.Escape,
            default: true
        };
        const confirmButton = {
            label: _("Confirm"),
            action: Lang.bind(this, this._confirmAction),
            key: Clutter.KEY_Return || Clutter.Return
        };
        this.setButtons([cancelButton, confirmButton]);
    }

    _runAction() {
        this.action(...this.actionParams);
    }

    _confirmAction() {
        this.close();
        this._runAction();
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
