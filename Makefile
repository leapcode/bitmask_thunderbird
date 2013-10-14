EXTNAME  := bitmask-thunderbird
PREFIX   := .
FILES_TO_PACKAGE := chrome,chrome.manifest,install.rdf
RSA_FILE := META-INF/zigbert.rsa

# the following variables are updated automatically
COMMIT   := $(shell git --no-pager log -1 --format=format:%h)
VERSION = $(shell head -n1 Changelog | sed -e 's/^.*(//' -e 's/).*$$//')
PKGNAME  := $(EXTNAME)-$(VERSION)-$(COMMIT).xpi
# XXX for debian makefile it's simpler to pick a fixed name.
# XXX we could build it and rename in another goal.
XPINAME  := bitmask.xpi
TARGET   := $(CURDIR)/$(XPINAME)
#TARGET   := $(CURDIR)/build/$(PKGNAME)
TEMPDIR  := $(shell mktemp -d -u)

# make sure CERTDIR and CERTNAME are defined for signing
USAGE    := "Usage: make CERTDIR=<certificate directory> CERTNAME=<certificate name> DEFAULTKEY=<key id>"
ifeq ($(MAKECMDGOALS),signed)
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

# make sure DEFAULTKEY was given to sign the calculated hashes
ifneq ($(MAKECMDGOALS),clean)
ifneq ($(MAKECMDGOALS),upload)
ifneq ($(MAKECMDGOALS),bitmask.xpi)
ifneq ($(MAKECMDGOALS),install.rdf)
ifndef DEFAULTKEY
# XXX need to remove signed from default build, debian chokes otherwise
# $(error "Usage: make DEFAULTKEY=<key id>")
endif
endif
endif
endif
endif

XPI_CONTENTS:=$(shell find chrome -name "*.html" -o -name "*.xhtml" -o -name "*.css" -o -name "*.png" -o -name "*.gif" -o -name "*.js" -o -name "*.jsm" -o -name "*.dtd" -o -name "*.xul" -o -name "messages") chrome.manifest install.rdf COPYING

bitmask.xpi: $(XPI_CONTENTS)
	zip $@ $(XPI_CONTENTS)

install.rdf: install.rdf.template Changelog
	sed 's/__VERSION__/$(VERSION)/' < $< > $@   

xpi_release:
	ln -s $(XPINAME) $(PKGNAME) 

# main rule
#all: clean $(TARGET)

# main target: .xpi file

#$(TARGET):
#	mkdir -p $(TEMPDIR)
#	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
#	(cd $(TEMPDIR) && zip $@ $(XPI_CONTENTS))
#	rm -rf $(TEMPDIR)
#	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg --default-key $(DEFAULTKEY) --sign SHA512SUMS)

signed: clean
	mkdir -p $(TEMPDIR)
	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
	signtool -d $(CERTDIR) -k $(CERTNAME) $(TEMPDIR)/
	(cd $(TEMPDIR) && zip $(TARGET) ./$(RSA_FILE) && zip -D $@ $(XPI_CONTENTS) -x ./$(RSA_FILE))
	rm -rf $(TEMPDIR)
	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg --default-key $(DEFAULTKEY) --sign SHA512SUMS)

upload:
	scp build/* downloads.leap.se:~/public/thunderbird_extension/

debian-package:
	git buildpackage -us -uc

clean:
	#rm -f $(TARGET) build/*
	rm -f *.xpi
	rm -f install.rdf


.PHONY: all clean
