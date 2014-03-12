EXTNAME  := bitmask-thunderbird
PREFIX   := .
FILES_TO_PACKAGE := chrome,chrome.manifest,install.rdf
RSA_FILE := META-INF/zigbert.rsa

# the following variables are updated automatically
COMMIT   := $(shell git --no-pager log -1 --format=format:%h)
VERSION = $(shell head -n1 CHANGELOG | cut -d" " -f1)
PKGNAME  := $(EXTNAME)-$(VERSION)-$(COMMIT).xpi
TARGET   := $(CURDIR)/build/$(PKGNAME)
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
ifndef DEFAULTKEY
  $(error "Usage: make DEFAULTKEY=<key id>")
endif
endif
endif


# main rule
all: clean $(TARGET)


#-----------------------------------------------------------------------------
# debhelper targets
#-----------------------------------------------------------------------------

XPI_CONTENTS:=$(shell find chrome -name "*.html" -o -name "*.xhtml" -o -name "*.css" -o -name "*.png" -o -name "*.gif" -o -name "*.js" -o -name "*.jsm" -o -name "*.dtd" -o -name "*.xul" -o -name "messages" -o -name "*.properties") chrome.manifest install.rdf COPYING

bitmask.xpi: $(XPI_CONTENTS)
	zip $@ $(XPI_CONTENTS)

xpi_release:
	ln -s $(XPINAME) $(PKGNAME) 


#-----------------------------------------------------------------------------
# unsigned XPI file
#-----------------------------------------------------------------------------

$(TARGET): clean install.rdf
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

signed: clean install.rdf
	mkdir -p $(TEMPDIR)
	mkdir -p `dirname $@`
	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
	rm -rf $(TEMPDIR)/.gitignore
	signtool -d $(CERTDIR) -k $(CERTNAME) $(TEMPDIR)/
	(cd $(TEMPDIR) && zip $(TARGET) ./$(RSA_FILE) && zip -r -D $(TARGET) ./ -x ./$(RSA_FILE))
	rm -rf $(TEMPDIR)
	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg -a --default-key $(DEFAULTKEY) --detach-sign SHA512SUMS)

clean:
	rm -f $(TARGET) build/*
	rm -f install.rdf

upload:
	ssh downloads.leap.se rm -rf /var/www/leap-downloads/public/thunderbird_extension/*
	scp build/* downloads.leap.se:/var/www/leap-downloads/public/thunderbird_extension/

debian-package:
	git buildpackage -us -uc

install.rdf: install.rdf.template Changelog
	sed 's/__VERSION__/$(VERSION)/' < $< > $@


.PHONY: all clean signed
