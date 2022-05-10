'use strict';

const { Adw, Gio, Gtk, GObject } = imports.gi;

const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const BOX_PADDING = 8;
const MARGIN_BOTTOM = 8;
const WIDGET_PADDING = 16;

const settings = ExtensionUtils.getSettings(
  'red.software.systems.easy_docker_containers');

const getMarginAll = (value) => ({
    margin_start: value,
    margin_top: value,
    margin_end: value,
    margin_bottom: value,
});

const addToBox = (box, element) => {
    if (shellVersion < 40) {
        box.add(element);
    } else {
        box.append(element);
    }
}

const getIntervalSpinButton = () => {
  const spin = new Gtk.SpinButton({
    valign: Gtk.Align.CENTER,
    climb_rate: 10,
    digits: 0,
    snap_to_ticks: true,
    adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 3600,
        step_increment: 1,
        page_size: 0,
    }),
  });
  settings.bind(
    'refresh-delay',
    spin,
    'value',
    Gio.SettingsBindFlags.DEFAULT
  );
  return spin;
}

// Heavily inspired by https://github.com/MichalW/gnome-bluetooth-battery-indicator/blob/6b769eacd5b58eaef9d4fd7160cbd5fef9723731/settingsWidget.js
const SettingsWidget = GObject.registerClass(
    class SettingsWidget extends Gtk.Box {
        _init(params) {
            super._init(params);

            this.set_orientation(Gtk.Orientation.VERTICAL);
            if (shellVersion < 40) {
                this.set_border_width(WIDGET_PADDING);
            }
            addToBox(this, this._getIndicatorSettingsFrame());
        }

        _getIndicatorSettingsFrame() {
            const hBox1 = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(hBox1, this._getIntervalLabel());
            addToBox(hBox1, getIntervalSpinButton());

            const vBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                ...getMarginAll(BOX_PADDING),
            });

            addToBox(vBox, hBox1);

            const frame = new Gtk.Frame({
                margin_bottom: MARGIN_BOTTOM,
            });

            if (shellVersion < 40) {
                frame.add(vBox);
            } else {
                frame.set_child(vBox);
            }

            return frame;
        }

        _getIntervalLabel() {
            return new Gtk.Label({
                label: 'Container count refresh interval (seconds). Set to 0 to disable',
                xalign: 0,
                hexpand: true,
            });
        }
    }
);

function init() {}

// Used on GNOME < 42 only, uses classical GTK4 Window and widgets
function buildPrefsWidget () {
  const prefsWidget = new SettingsWidget();
    if (shellVersion < 40) {
        prefsWidget.show_all();
    } else {
        prefsWidget.show();
    }
  return prefsWidget;
}

// // Takes precedence over buildPrefsWidget in GNOME 42+, uses Adw.PreferencesWindow
function fillPreferencesWindow(window) {  
  const page = new Adw.PreferencesPage();
  const group = new Adw.PreferencesGroup();
  page.add(group);

  const row = new Adw.ActionRow({ title: 'Container count refresh interval. Set to 0 to disable' });
  group.add(row);

  const delayInput = getIntervalSpinButton();

  row.add_suffix(delayInput);
  row.activatable_widget = delayInput;

  window.add(page);
  return window;
}
