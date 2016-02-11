"use strict";

const GLib = imports.gi.GLib;

// Lets you run a function in asynchronous mode using GLib
// @parameter fn : the function to run
// @parameter callback : the function to call after fn
function async(fn, callback) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, function() {
        let funRes = fn();
        callback(funRes);
    }, null);
}
