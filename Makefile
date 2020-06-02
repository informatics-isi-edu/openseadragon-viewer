# Makefile rules

# Disable built-in rules
.SUFFIXES:

# set the default target to install
.DEFAULT_GOAL:=install

# env variables needed for installation
WEB_URL_ROOT?=/
WEB_INSTALL_ROOT?=/var/www/html/
OSD_VIEWER_REL_PATH?=openseadragon-viewer/

# where osd-viewer will be installed
OSD_VIEWER_DIR:=$(WEB_INSTALL_ROOT)$(OSD_VIEWER_REL_PATH)

# the url location of viewer
OSD_VIEWER_BASE_PATH:=$(WEB_URL_ROOT)$(OSD_VIEWER_REL_PATH)


.PHONY: install
install: print_variables
	$(info - deploying the package)
	@rsync -avz --exclude='.*' --exclude='Makefile' . $(OSD_VIEWER_DIR)

print_variables:
	$(info =================)
	$(info deploying to: $(OSD_VIEWER_DIR))
	$(info osd viewer will be accesible using: $(OSD_VIEWER_BASE_PATH))
	$(info =================)
