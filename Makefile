# Makefile rules

# Disable built-in rules
.SUFFIXES:

# env variables needed for deploying
WEB_URL_ROOT?=/
WEB_INSTALL_ROOT?=/var/www/html/
OSD_VIEWER_REL_PATH?=openseadragon-viewer/

# where osd-viewer will be deployed
OSD_VIEWER_DIR:=$(WEB_INSTALL_ROOT)$(OSD_VIEWER_REL_PATH)

# the url location of viewer
OSD_VIEWER_BASE_PATH:=$(WEB_URL_ROOT)$(OSD_VIEWER_REL_PATH)

# TODO while we're not doing anything to "build" we should eventually do
#      so we created this placeholder that in the future will be implemented
.PHONY: dist
dist: ;

.PHONY: deploy
deploy: print_variables dont_deploy_in_root
	$(info - deploying the package)
	@rsync -avz --exclude='.*' --exclude='Makefile' . $(OSD_VIEWER_DIR)

# run dist and deploy with proper uesrs (GNU). only works with root user
.PHONY: root-install
root-install:
	su $(shell stat -c "%U" Makefile) -c "make dist"
	make deploy

# run dist and deploy with proper uesrs (FreeBSD and MAC OS X). only works with root user
.PHONY: root-install-alt
root-install-alt:
	su $(shell stat -f '%Su' Makefile) -c "make dist"
	make deploy

# make sure OSD_VIEWER_DIR is not the root
dont_deploy_in_root:
	@echo "$(OSD_VIEWER_DIR)" | egrep -vq "^/$$|.*:/$$"

print_variables:
	$(info =================)
	$(info deploying to: $(OSD_VIEWER_DIR))
	$(info osd viewer will be accesible using: $(OSD_VIEWER_BASE_PATH))
	$(info =================)

#Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Usage: make [target]"
	@echo "Available targets:"
	@echo "  dist              - empty target preserved for local install of node dependencies, and building the package"
	@echo "  deploy            - deploy openseadragon-viewer"
	@echo "  root-install      - should only be used as root. will use dist with proper user and then deploy, for GNU systems"
	@echo "  root-install-alt  - should only be used as root. will use dist with proper user and then deploy, for FreeBSD and MAC OS X"
