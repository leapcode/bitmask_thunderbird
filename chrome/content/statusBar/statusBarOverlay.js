/**
 * statusBar.js
 * Copyright (C) 2013 LEAP
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along
 */


Components.utils.import("resource:///modules/mailServices.js");
Components.utils.import("resource://gre/modules/Services.jsm");

var accountNotConfigured = getStringBundle(
    "chrome://bitmask/locale/statusBar.properties")
        .GetStringFromName("account_not_configured");
var accountConfigured = getStringBundle(
    "chrome://bitmask/locale/statusBar.properties")
        .GetStringFromName("account_configured");


/*****************************************************************************
 * Schedule initialization and update functions.
 ****************************************************************************/

// run startUp() once when window loads
window.addEventListener("load", function(e) {
	starUp();
}, false);

/**
 * We don't want a message with the bitmask account status in the status bar
 * for now (see https://leap.se/code/issues/4871).
 */
// run updatePanel() periodically
//window.setInterval(
//	function() {
//		updatePanel();
//	}, 10000); // update every ten seconds


/*****************************************************************************
 * GUI maintenance functions.
 ****************************************************************************/

function starUp() {
    // TODO: uncomment when we want messages in the status bar again.
    //updatePanel();
    if (!isBitmaskAccountConfigured()) {
        launchAccountWizard();
    } else {
        var server = getBitmaskServer();
        // TODO: add an alert that there exists a bitmask account with caching
        // enabled.
        //if (server.offlineDownload == true)
        //    alertPrompt('WARNING!');
    }
}

/**
 * Update the status bar panel with information about bitmask accounts.
 */
function updatePanel() {
    var statusBarPanel = document.getElementById("bitmask-status-bar");
    if (isBitmaskAccountConfigured())
        statusBarPanel.label = accountConfigured;
    else
        statusBarPanel.label = accountNotConfigured;
}

/**
 * Handle a click on the status bar panel. For now, just launch the new
 * account wizard if there's no account configured.
 */
function handleStatusBarClick() {
    if (!isBitmaskAccountConfigured())
        launchAccountWizard();
}


/*****************************************************************************
 * Account management functions
 ****************************************************************************/

/**
 * Return true if there exists an account with incoming server hostname equal
 * to IMAP_HOST and port equal to IMAP_PORT.
 *
 * TODO: also verify for SMTP configuration?
 */
function isBitmaskAccountConfigured() {
    return !!getBitmaskServer();
}

/**
 * Get a configured bitmask account
 */
function getBitmaskServer() {
    var accountManager = Cc["@mozilla.org/messenger/account-manager;1"]
                         .getService(Ci.nsIMsgAccountManager);
    return accountManager.findRealServer(
        "", IMAP_HOST, "imap", IMAP_PORT);
}
