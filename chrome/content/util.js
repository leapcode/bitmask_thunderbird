/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/**
 * Some common, generic functions
 */

try {
  var Cc = Components.classes;
  var Ci = Components.interfaces;
} catch (e) { ddump(e); } // if already declared, as in xpcshell-tests
try {
  var Cu = Components.utils;
} catch (e) { ddump(e); }

Cu.import("resource:///modules/errUtils.js");

/**
 * Create a subtype
 */
function extend(child, supertype)
{
  child.prototype.__proto__ = supertype.prototype;
}

function assert(test, errorMsg)
{
  if (!test)
    throw new NotReached(errorMsg ? errorMsg :
          "Programming bug. Assertion failed, see log.");
}

function makeCallback(obj, func)
{
  return function()
  {
    return func.apply(obj, arguments);
  }
}

/**
 * @param bundleURI {String}   chrome URL to properties file
 * @return nsIStringBundle
 */
function getStringBundle(bundleURI)
{
  try {
    return Cc["@mozilla.org/intl/stringbundle;1"]
           .getService(Ci.nsIStringBundleService)
           .createBundle(bundleURI);
  } catch (e) {
    throw new Exception("Failed to get stringbundle URI <" + bundleURI +
                        ">. Error: " + e);
  }
}

function Exception(msg)
{
  this._message = msg;

  // get stack
  try {
    not.found.here += 1; // force a native exception ...
  } catch (e) {
    this.stack = e.stack; // ... to get the current stack
  }
}
Exception.prototype =
{
  get message()
  {
    return this._message;
  },
  toString : function()
  {
    return this._message;
  }
}

function NotReached(msg)
{
  Exception.call(this, msg);
  logException(this);
}
extend(NotReached, Exception);


function deepCopy(org)
{
  if (typeof(org) == "undefined")
    return undefined;
  if (org == null)
    return null;
  if (typeof(org) == "string")
    return org;
  if (typeof(org) == "number")
    return org;
  if (typeof(org) == "boolean")
    return org == true;
  if (typeof(org) == "function")
    return org;
  if (typeof(org) != "object")
    throw "can't copy objects of type " + typeof(org) + " yet";

  //TODO still instanceof org != instanceof copy
  //var result = new org.constructor();
  var result = new Object();
  if (typeof(org.length) != "undefined")
    var result = new Array();
  for (var prop in org)
    result[prop] = deepCopy(org[prop]);
  return result;
}

let kDebug = false;
function ddump(text)
{
  if (kDebug)
    dump(text + "\n");
}

function debugObject(obj, name, maxDepth, curDepth)
{
  if (curDepth == undefined)
    curDepth = 0;
  if (maxDepth != undefined && curDepth > maxDepth)
    return "";

  var result = "";
  var i = 0;
  for (let prop in obj)
  {
    i++;
    try {
      if (typeof(obj[prop]) == "object")
      {
        if (obj[prop] && obj[prop].length != undefined)
          result += name + "." + prop + "=[probably array, length " +
                obj[prop].length + "]\n";
        else
          result += name + "." + prop + "=[" + typeof(obj[prop]) + "]\n";
        result += debugObject(obj[prop], name + "." + prop,
                              maxDepth, curDepth + 1);
      }
      else if (typeof(obj[prop]) == "function")
        result += name + "." + prop + "=[function]\n";
      else
        result += name + "." + prop + "=" + obj[prop] + "\n";
    } catch (e) {
      result += name + "." + prop + "-> Exception(" + e + ")\n";
    }
  }
  if (!i)
    result += name + " is empty\n";
  return result;
}

function alertPrompt(alertTitle, alertMsg)
{
  Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Ci.nsIPromptService)
      .alert(window, alertTitle, alertMsg);
}
