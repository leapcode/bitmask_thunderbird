Bitmask Thunderbird Extension
=============================

The Bitmask Thunderbird Extension provides:

* A wizard for creating email accounts with IMAP/SMTP configuration targeted
  to localhost and the default Bitmask client ports. There are different ways to
  launch the wizard for configuring a Bitmask Account:
  - Clicking on the statusbar notification.
  - File -> New -> Bitmask account.
  - Edit -> Account Settings... -> Account Actions -> Add Bitmask Accont.
* Caching prevention: accounts are created with caching turned off and the
  UI is modified to prevent users from turning on caching for these
  accounts.

Development/testing
-------------------

For development/testing purposes you can create a text file in Thunderbird's
extension directory whose contents point to the repository dir:

* The file must be created in the `~/.thunderbird/<profile>/extensions/`
  directory.
* The file name must be `bitmask-thunderbird@leap.se`.
* The file contents must be the path for this repository.

XPI Package
-----------

To generate an unsigned XPI package, type the following inside the root of the
repository:

  make DEFAULTKEY=<key id>

This command will:

* Generate a `.xpi` file inside the `build/` directory.
* Create a `build/SHA512SUMS` file containing the sha512 hash of the `.xpi` file.
* Sign that file with the given `DEFAULTKEY` and create a `build/SHA512SUMS.gpg` file.

You can now use the generated `.xpi` file install the package as a normal
Thunderbird extension.

Signed XPI package
------------------

To generate a signed XPI package you must first have a certificate and then do
the following:

  make signed CERTDIR=<path to cert dir> CERTNAME=<cert name> DEFAULTKEY=<key id>

This command will:

* Generate a signed `.xpi` file inside the `build/` directory using the
  `CERTNAME` certificate contained in `CERTDIR`.
* Create a `build/SHA512SUMS` file containing the sha512 hash of the `.xpi` file.
* Sign that file with the given `DEFAULTKEY` and create a `build/SHA512SUMS.gpg` file.

For more information about signed `.xpi` files, see:
https://developer.mozilla.org/en-US/docs/Signing_a_XPI
