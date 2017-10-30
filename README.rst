Bitmask Thunderbird Extension
=============================

The Bitmask Thunderbird Extension provides:

* A wizard for creating email accounts with IMAP/SMTP configuration targeted
  to localhost and the default Bitmask client ports. There are different ways to
  launch the wizard for configuring a Bitmask Account:
  - File -> New -> Bitmask account.
  - Edit -> Account Settings... -> Account Actions -> Add Bitmask Accont.
* Caching prevention: accounts are created with caching turned off and the
  UI is modified to prevent users from turning on caching for these
  accounts.

Releasing a new version
-----------------------

To release a new version of the extension, do the following:

1.  Update the CHANGELOG file and make sure the new version is correct. The
    makefile will extract the version from there to create the XPI package.
2.  Generate a XPI package by running `make`. This will generate a
    `bitmask.xpi` file.
3.  Go to https://addons.mozilla.org/
4.  Login with the LEAP user (mozilla-addons@leap.se).
5.  Go to Tools -> Manage My Submissions -> Bitmask Thunderbird Extension.
6.  Choose "Upload New Version" and accept agreements.
7.  Click "Select a file..." and select the `bitmask.xpi` file.
8.  Check if there validation was successful, fix any problems.
9.  Click "Continue".
10. Get up and go have some fun while you wait for a review of the extension.

Development/testing
-------------------

For development/testing purposes you can create a text file in Thunderbird's
extension directory whose contents point to the repository dir:

* The file must be created in the `~/.thunderbird/<profile>/extensions/`
  directory.
* The file name must be `bitmask-thunderbird@leap.se`.
* The file contents must be the path for this repository.

Unsigned XPI Package
--------------------

To generate an unsigned XPI package, type the following inside the root of the
repository:

  make

If you want, you can generate a file with the SHA512 checksum of the XPI package, by running:

  make unsigned DEFAULTKEY=<key id>

This command will:

* Generate a `.xpi` file inside the `build/` directory.
* Create a `build/SHA512SUMS` file containing the sha512 hash of the `.xpi` file.
* Sign that file with the given `DEFAULTKEY` and create a `build/SHA512SUMS.gpg` file.

You can now use the generated `.xpi` file install the package as a normal
Thunderbird extension.

Certificates
------------

For generating signed XPI packages you need a code signing certificate. In
order to do that you will need Network Security Services ("nss") and Netscape
Portable Runtime ("nspr"). If you are running debian, you can do:

  apt install libnss3-dev libnspr4-dev libnss3-tools

Initialize some variables:

  CERTDIR=/path/to/cert/dir
  CERTNICK=myCertificateNickname

Initialize the certificate database:

  certutil -N -d ${CERTDIR}

Generate a signing certificate:

  signtool -G ${CERTNICK} -d ${CERTDIR} -p"<password>"

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
