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

// run updatePanel() periodically
window.setInterval(
	function() {
		updatePanel(); 
	}, 10000); // update every ten seconds


/*****************************************************************************
 * GUI maintenance functions.
 ****************************************************************************/

function starUp() {
    updatePanel();
    if (!isBitmaskAccountConfigured()) {
        launchAccountWizard();
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
    var accountManager = Cc["@mozilla.org/messenger/account-manager;1"]
                         .getService(Ci.nsIMsgAccountManager);
    var existing = accountManager.findRealServer(
        "", IMAP_HOST, "imap", IMAP_PORT);
    return !!existing;
}
