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


.PHONY: deploy
deploy: print_variables dont_install_in_root
	$(info - deploying the package)
	@rsync -avz --exclude='.*' --exclude='Makefile' . $(OSD_VIEWER_DIR)

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
	@echo "  deploy     	deploy openseadragon-viewer"