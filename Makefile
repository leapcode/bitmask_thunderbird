EXTNAME  := bitmask-thunderbird
PREFIX   := .
FILES_TO_PACKAGE := chrome,chrome.manifest,install.rdf
RSA_FILE := META-INF/zigbert.rsa

# the following variables are updated automatically
COMMIT   := $(shell git --no-pager log -1 --format=format:%h)
VERSION  := $(shell grep \<em:version\> $(PREFIX)/install.rdf | sed -e s/[^\>]\\\+\>// -e s/\<[^\>]\\\+\>//)
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

# main target: .xpi file

$(TARGET): clean
	mkdir -p $(TEMPDIR)
	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
	(cd $(TEMPDIR) && zip -r $(TARGET) ./)
	rm -rf $(TEMPDIR)
	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg --default-key $(DEFAULTKEY) --sign SHA512SUMS)

signed: clean
	mkdir -p $(TEMPDIR)
	cp -r $(PREFIX)/{$(FILES_TO_PACKAGE)} $(TEMPDIR)/
	signtool -d $(CERTDIR) -k $(CERTNAME) $(TEMPDIR)/
	(cd $(TEMPDIR) && zip $(TARGET) ./$(RSA_FILE) && zip -r -D $(TARGET) ./ -x ./$(RSA_FILE))
	rm -rf $(TEMPDIR)
	(cd build/ && sha512sum $(PKGNAME) > SHA512SUMS && gpg --default-key $(DEFAULTKEY) --sign SHA512SUMS)

clean:
	rm -f $(TARGET) build/*

upload:
	scp build/* downloads.leap.se:~/public/thunderbird_extension/

.PHONY: all clean signed
