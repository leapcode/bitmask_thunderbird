// bitmask.js
// Copyright (C) 2016 LEAP
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/**
 * bitmask object
 *
 * Contains all the bitmask API mapped by sections
 * - user. User management like login, creation, ...
 * - mail. Email service control.
 * - keys. Keyring operations.
 * - events. For registering to events.
 *
 * Every function returns a Promise that will be triggered once the request is
 * finished or will fail if there was any error. Errors are always user readable
 * strings.
 */

try {
    // Use Promises in non-ES6 compliant engines.
    eval('import "babel-polyfill";')
}
catch (err) {}

var bitmask = function(){
    var event_handlers = {};
    var api_url = '/API/';
    var api_token = null;
    var last_uid = null;
    var last_uuid = null;

    if (window.location.protocol === "file:") {
        api_url = 'http://localhost:7070/API/';
    }
    if (window.location.hash) {
        api_token = window.location.hash.replace('#', '')
    }

    // If the script is running from a Firefox (or Thunderbird) extension, get
    // the api_token from ~/.config/leap/authtoken, and also set the api_url.
    if (window.location.protocol === "chrome:") {
        // Use the correct URL for the API.
        api_url = 'http://localhost:7070/API/';

        // Now fetch the token file and set api_token.
        Components.utils.import("resource://gre/modules/osfile.jsm")

        let tokenPath = OS.Path.join(OS.Constants.Path.homeDir, ".config", "leap", "authtoken")
        let decoder = new TextDecoder();

        setInterval(function get_token_file() {
          let promise = OS.File.read(tokenPath);
          promise = promise.then(array => {
            api_token = decoder.decode(array);
          }, ex => {
            api_token = null;
          });
          return get_token_file;
        }(), 3000);
    }

    function call(command) {
        var url = api_url  + command.slice(0, 3).join('/');
        var data = JSON.stringify(command.slice(3));

        return new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();

            req.open('POST', url);
            if (api_token) {
                req.setRequestHeader("X-Bitmask-Auth", api_token)
            }

            req.onload = function() {
                if (req.status == 200) {
                    parseResponse(req.response, resolve, reject);
                }
                else {
                    reject(Error(req.statusText));
                }
            };

            req.onerror = function() {
                reject(Error("Network Error"));
            };

            req.send(data);
        });
    };

    function parseResponse(raw_response, resolve, reject) {
        var response = JSON.parse(raw_response);
        if (response.error === null) {
            resolve(response.result);
        } else {
            reject(response.error);
        }
    };

    function event_polling() {
        if (api_token) {
            call(['events', 'poll']).then(function(response) {
                if (response !== null) {
                    var event = response[0];
                    var content = response[1];
                    if (event in event_handlers) {
                        Object.values(event_handlers[event]).forEach(function(handler) {
                            handler(event, content);
                        })
                    }
                }
                event_polling();
            }, function(error) {
                setTimeout(event_polling, 5000);
            });
        }
    };
    event_polling();

    function private_str(priv) {
        if (priv) {
            return 'private'
        }
        return 'public'
    };

    return {
        api_token: function() {return api_token},

        core: {
            /**
             * Get bitmaskd version
             *
             * @return {Promise<json>} {'version_core': str}
             */
            version: function() {
                return call(['core', 'version']);
            },

            /**
             * Stop bitmaskd
             */
            stop: function() {
                return call(['core', 'stop']);
            },

            /**
             * Get bitmaskd status
             */
            status: function() {
                return call(['core', 'status']);
            }
        },

        bonafide: {
            provider: {
                create: function(domain) {
                    return call(['bonafide', 'provider', 'create', domain]);
                },

                read: function(domain, service) {
                    if (typeof service !== 'string') {
                        service  = "";
                    }
                    return call(['bonafide', 'provider', 'read', domain, service]);
                },

                delete: function(domain) {
                    return call(['bonafide', 'provider', 'delete', domain]);
                },

                list: function(seeded) {
                    if (typeof seeded !== 'boolean') {
                        seeded = false;
                    }
                    return call(['bonafide', 'provider', 'list', seeded]);
                }
            },

            /**
             * uids are of the form user@provider.net
             */
            user: {
                /**
                 * Register a new user
                 *
                 * @param {string} uid The uid to be created
                 * @param {string} password The user password
                 * @param {boolean} autoconf If the provider should be autoconfigured if it's not already known
                 *                           If it's not provided it will default to false
                 */
                create: function(uid, password, invite, autoconf) {
                    if (typeof autoconf !== 'boolean') {
                        autoconf = false;
                    }
                    return call(['bonafide', 'user', 'create', uid, password, invite, autoconf]);
                },

                /**
                 * Login
                 *
                 * @param {string} uid The uid to log in
                 * @param {string} password The user password
                 * @param {boolean} autoconf If the provider should be autoconfigured if it's not already known
                 *                           If it's not provided it will default to false
                 */
                auth: function(uid, password, autoconf) {
                    if (typeof autoconf !== 'boolean') {
                        autoconf = false;
                    }
                    return call(['bonafide', 'user', 'authenticate', uid, password, autoconf]).then(function(response) {
                        last_uuid = response.uuid
                        last_uid = uid
                        return response;
                    });
                },

                /**
                 * Logout
                 *
                 * @param {string} uid The uid to log out.
                 */
                logout: function(uid) {
                    return call(['bonafide', 'user', 'logout', uid]);
                },

                /**
                 * List users
                 *
                 * @return {Promise<json>} [{'userid': str, 'authenticated': boolean}]
                 */
                list: function() {
                    return call(['bonafide', 'user', 'list']);
                },

                /**
                 * Change password
                 *
                 * @param {string} uid The uid to log in
                 * @param {string} current_password The current user password
                 * @param {string} new_password The new user password
                 */
                update: function(uid, current_password, new_password) {
                    return call(['bonafide', 'user', 'update', uid, current_password, new_password]);
                }
            }
        },

        /**
         * For now the VPN setup is not really streamlined
         *
         * src/leap/bitmask/vpn/README.rst for more info
         */
        vpn: {
            enable: function() {
                return call(['vpn', 'enable'])
            },

            disable: function() {
                return call(['vpn', 'disable'])
            },

            status: function() {
                return call(['vpn', 'status'])
            },

            start: function(provider) {
                return call(['vpn', 'start', provider])
            },

            stop: function() {
                return call(['vpn', 'stop'])
            },

            /**
             * Check if the VPN is ready to start and has the cert downloaded
             *
             * @return {Promise<{'vpn_ready': bool,
             *                   'installed': bool}>}
             */
            check: function(provider) {
                if (typeof provider !== 'string') {
                    provider = "";
                }
                return call(['vpn', 'check', provider]);
            },

            /**
             * Download VPN cert
             *
             * @param {string} userid the userid to be used
             */
            get_cert: function(userid) {
                return call(['vpn', 'get_cert', userid])
            },

            /**
             * Install helpers in the system
             */
            install: function() {
                return call(['vpn', 'install'])
            },

            /**
             * Uninstall helpers in the system
             */
            uninstall: function() {
                return call(['vpn', 'uninstall'])
            },

            /**
             * List VPN gateways
             *
             * They will be sorted in the order that they will be used
             *
             * @return {Promise<{provider_name: [{'name': string,
             *                                    'country_code': string,
             *                                    'location': string,
             *                                    ...}]}>
             */
            list: function() {
                return call(['vpn', 'list'])
            },

            /**
             * Get/set the location preference for the gateways
             *
             * @param {list<strings>} Order of preference of locations.
             *                        If it's missing it will return the existing location list
             */
            locations: function(locations) {
                if (typeof locations !== 'list') {
                    locations = [];
                }
                return call(['vpn', 'locations'].concat(locations))
            },

            /**
             * Get/set the country preference for the gateways
             *
             * @param {list<strings>} Order of preference of countries.
             *                        If it's missing it will return the existing country list
             */
            countries: function(countries) {
                if (typeof countries !== 'list') {
                    countries = [];
                }
                return call(['vpn', 'countries'].concat(countries))
            }
        },

        mail: {
            enable: function() {
                return call(['mail', 'enable'])
            },

            disable: function() {
                return call(['mail', 'disable'])
            },

            /**
             * Check the status of the email service
             *
             * @param {string} uid The uid to get status about
             *
             * @return {Promise<string>} User readable status
             */
            status: function(uid) {
                return call(['mail', 'status', uid]);
            },

            /**
             * Get the token of the active user.
             *
             * This token is used as password to authenticate in the IMAP and SMTP services.
             *
             * @param {string} uid The uid to get status about
             *
             * @return {Promise<{'token': string}>} The token
             */
            get_token: function(uid) {
                return call(['mail', 'get_token', uid]);
            },

            /**
             * Get message status of one email
             *
             * @param {string} uid The uid to get status about
             * @param {string} mbox The name of the mailbox where the message is stored
             * @param {string} message_id The Message-Id from the headers of the email
             *
             * @return {Promise<{'secured': bool}>} Returns the status of the email
             */
            msg_status: function(uid, mbox, message_id) {
                return call(['mail', 'msg_status', uid, mbox, message_id]);
            },

            /**
             * Get status on the mixnet for an address.
             *
             * @param {string} uid The uid to get status about
             * @param {string} address The recipient address to be mixed
             *
             * @return {Promise<{'status': string}>} Where the status string can be 'ok',
             *                                       'unsuported' or 'disabled'
             */
            mixnet_status: function(uid, address) {
                return call(['mail', 'mixnet_status', uid, address]);
            }
        },

        /**
         * A KeyObject have the following attributes:
         *   - address {string} the email address for wich this key is active
         *   - fingerprint {string} the fingerprint of the key
         *   - length {number} the size of the key bits
         *   - private {bool} if the key is private
         *   - uids {[string]} the uids in the key
         *   - key_data {string} the key content
         *   - validation {string} the validation level which this key was found
         *   - expiry_date {string} date when the key expires
         *   - refreshed_at {string} date of the last refresh of the key
         *   - audited_at {string} date of the last audit (unused for now)
         *   - sign_used {bool} if has being used to checking signatures
         *   - enc_used {bool} if has being used to encrypt
         */
        keys: {
            /**
             * List all the keys in the keyring
             *
             * @param {string} uid The uid of the keyring.
             * @param {boolean} priv Should list private keys?
             *                       If it's not provided the public ones will be listed.
             *
             * @return {Promise<[KeyObject]>} List of keys in the keyring
             */
            list: function(uid, priv) {
                return call(['keys', 'list', uid, private_str(priv)]);
            },

            /**
             * Export key
             *
             * @param {string} uid The uid of the keyring.
             * @param {string} address The email address of the key
             * @param {boolean} priv Should get the private key?
             *                       If it's not provided the public one will be fetched.
             * @param {boolean} fetch If the key is not in keymanager, should we fetch it remotely.
             *                        If it's not provided keys will not be fetched remotely
             *
             * @return {Promise<KeyObject>} The key
             */
            exprt: function(uid, address, priv, fetch) {
                var privstr = private_str(priv);
                if ((typeof fetch === 'bool') && fetch) {
                    privstr = 'fetch';
                }
                return call(['keys', 'export', uid, address, privstr]);
            },

            /**
             * Fetch key by fingerprint
             *,
             * @param {string} uid The uid of the keyring.
             * @param {string} address The email address of the key.
             * @param {string} fingerprint The key fingerprnit.
             *
             * @return {Promise<KeyObject>} The key
             */
            fetch: function(uid, address, fingerprint) {
                return call(['keys', 'fetch', address, fingerprint]);
            },

            /**
             * Insert key
             *
             * @param {string} uid The uid of the keyring.
             * @param {string} address The email address of the key
             * @param {string} rawkey The key material
             * @param {string} validation The validation level of the key
             *                            If it's not provided 'Fingerprint' level will be used.
             *
             * @return {Promise<KeyObject>} The key
             */
            insert: function(uid, address, rawkey, validation) {
                if (typeof validation !== 'string') {
                    validation = 'Fingerprint';
                }
                return call(['keys', 'insert', uid, address, validation, rawkey]);
            },

            /**
             * Delete a key
             *
             * @param {string} uid The uid of the keyring.
             * @param {string} address The email address of the key
             * @param {boolean} priv Should get the private key?
             *                       If it's not provided the public one will be deleted.
             *
             * @return {Promise<KeyObject>} The key
             */
            del: function(uid, address, priv) {
                return call(['keys', 'delete', uid, address, private_str(priv)]);
            }
        },

        events: {
            /**
             * Register func for an event
             *
             * @param {string} event The event to register
             * @param {string} name The unique name for the callback
             * @param {function} func The function that will be called on each event.
             *                        It has to be like: function(event, content) {}
             *                        Where content will be a list of strings.
             */
            register: function(event, name, func) {
                event_handlers[event] = event_handlers[event] || {}
                if (event_handlers[event][name]) {
                    return null;
                } else {
                    event_handlers[event][name] = func;
                    return call(['events', 'register', event])
                }
            },

            /**
             * Unregister from an event
             *
             * @param {string} event The event to unregister
             * @param {string} name The unique name of the callback to remove
             */
            unregister: function(event, name) {
                event_handlers[event] = event_handlers[event] || {}
                delete event_handlers[event][name]
                if (Object.keys(event_handlers[event]).length == 0) {
                  return call(['events', 'unregister', event]);
                } else {
                  return null;
                }
            }
        }
    };
}();

try {
    module.exports = bitmask
} catch(err) {}
