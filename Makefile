EXTNAME  := bitmask-thunderbird
XPINAME  := bitmask.xpi  # debian package will use this name
PREFIX   := .
FILES_TO_PACKAGE := chrome,chrome.manifest,install.rdf
RSA_FILE := META-INF/zigbert.rsa

# the following variables are updated automatically
COMMIT   := $(shell git --no-pager log -1 --format=format:%h)
VERSION  := $(shell head -n1 CHANGELOG | cut -d" " -f1)
PKGNAME  := $(EXTNAME)-$(VERSION)-$(COMMIT).xpi
TARGET   := $(CURDIR)/build/$(PKGNAME)
TEMPDIR  := $(shell mktemp -d -u)

XPI_CONTENTS := $(shell find chrome -name "*.html" -o -name "*.xhtml" -o -name "*.css" -o -name "*.png" -o -name "*.gif" -o -name "*.js" -o -name "*.jsm" -o -name "*.dtd" -o -name "*.xul" -o -name "messages" -o -name "*.properties") chrome.manifest install.rdf COPYING


#-----------------------------------------------------------------------------
# debhelper targets
#-----------------------------------------------------------------------------

$(XPINAME): $(XPI_CONTENTS)
	zip $@ $(XPI_CONTENTS)

install.rdf: install.rdf.template Changelog
	sed 's/__VERSION__/$(VERSION)/' < $< > $@

xpi_release:
	ln -s $(XPINAME) $(PKGNAME) 

debian-package:
	git buildpackage -us -uc


#-----------------------------------------------------------------------------
# unsigned XPI file
#-----------------------------------------------------------------------------

# make sure DEFAULTKEY is defined to sign the calculated hashes
ifeq ($(MAKECMDGOALS),unsigned)
ifndef DEFAULTKEY
  $(error "Usage: make DEFAULTKEY=<key id>")
endif
endif

unsigned: clean install.rdf
	mkdir -p $(TEMPDIR)
	mkdir -p `dirname $@`
	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
	rm -rf $(TEMPDIR)/.gitignore
	(cd $(TEMPDIR) && zip -r $(TARGET) ./)
	rm -rf $(TEMPDIR)
	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg -a --default-key $(DEFAULTKEY) --detach-sign SHA512SUMS)


#-----------------------------------------------------------------------------
# signed XPI file
#-----------------------------------------------------------------------------

# make sure CERTDIR, CERTNAME and DEFAULTKEY are defined for signing
ifeq ($(MAKECMDGOALS),signed)
USAGE    := "Usage: make CERTDIR=<certificate directory> CERTNAME=<certificate name> DEFAULTKEY=<key id>"
ifndef CERTDIR
  $(error $(USAGE))
endif
ifndef CERTNAME
  $(error $(USAGE))
endif
ifndef DEFAULTKEY
  $(error $(USAGE))
endif
endif

signed: clean install.rdf
	mkdir -p $(TEMPDIR)
	mkdir -p `dirname $@`
	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
	rm -rf $(TEMPDIR)/.gitignore
	signtool -d $(CERTDIR) -k $(CERTNAME) $(TEMPDIR)/
	(cd $(TEMPDIR) && zip $(TARGET) ./$(RSA_FILE) && zip -D $@ $(XPI_CONTENTS) -x ./$(RSA_FILE))
	rm -rf $(TEMPDIR)
	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg -a --default-key $(DEFAULTKEY) --detach-sign SHA512SUMS)

upload:
	ssh downloads.leap.se rm -rf /var/www/leap-downloads/public/thunderbird_extension/*
	scp build/* downloads.leap.se:/var/www/leap-downloads/public/thunderbird_extension/

clean:
	rm -f $(TARGET) build/*
	rm -f *.xpi
	rm -f install.rdf

.PHONY: all clean xpi_release unsigned signed upload debian-package
