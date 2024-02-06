# Release Notes

This document is a summary of code changes in openseadragon-viewer. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Deprecated]`: removal (modification) of an existing feature that are not supported anymore.
  - `[Refactored]`: modifications to existing code to make it more maintainable.
  - `[Fixed]`: bug fixes.
  - `[No changes]` means that Chaise hasn't been changed in the described duration.

# 1/31/24

- [Improved] use the latest version of fontawesome ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/110))

# 11/30/23

- [Fixed] properly set the width/height for the textbox drawing tool ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/56d88ecb65a5ef8be839c7e33d4e4178c8301972))
- [Fixed] make sure text annotation is saved if we're calling save while there is still a text annotation that is not fully "saved" ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/b58ebdf9e0e3a2baa321f33cda1dbb5b69170992))
- [Fixed] remove the newline change since it was causing issues on Firefox this change is actually not needed based on my testing (link above)
- [Improved] use similar tooltip throughout osd-viewer ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/4ac3b46637bb6f9606cbe623e2d699c4fff19748))

# 9/30/23

- [Fixed] issues related to textbox drawing tool ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/108))
- [Added] `root-install` make target ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/8b270b09b1f949c34da3159e627b2a5a59dade07))

# 7/31/23

- [No changes]

# 5/31/23

- [Added] support for textbox drawing tool ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/105)).

# 3/31/23

- [No changes]

# 1/31/23
- [No changes]

# 11/31/22
- [No changes]

# 9/30/22
- [Changed] included fontawesome to version 6 ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/08aa6d7ef9efdcdc29b7712d7c50c80a3ad32399)).

# 7/31/22
- [Added] arrowline annotation darwing tool ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/100))
- [Added] `make dist` target to be consistent with the rest of frontend repositories ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/71a0a2c6e949a071893fd4a91598006190c98ed1)).

# 5/31/22
- Removed the unused files and code related to toolbar and annotation feature.
- [Changed] makefile targets related to installation ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/97)).
- [Changed] how pseudoColor is used and stored ((link)[https://github.com/informatics-isi-edu/openseadragon-viewer/pull/96]).

# 3/31/22
- Cleaned up the repository by removing all the unused folders and files (`old_viewer` folder and all of its dependencies).

# 1/31/22
- [No changes]

# 11/31/21
- [No changes]

# 9/30/21
- [Changed] default behavior of channel panel to open by default in case of multi-channel images ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/268216b9938c0ca142441484a5e685e29453afe9)).
- [Added] channel names on top of the image (which can be turned off) ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/88)).
- [Fixed] a bug that was causing some confusion in the UI ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/008d5efc2267f8017a6a6704daf3ff2dda209508)).

# 7/31/21
- [No changes]

# 5/31/21
- [Added] support for dynamic ACLs ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/91)).
- [Fixed] bugs in hsv2rgb and rgb2hsv functions that caused wrong default colors in images.
- [Changed] Channel controls UI ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/78)).
- [Added] ability to save channel config in the database (link above).
- [Added] image color historgram for debugging purposes (link above).
- [Added] intensity range inputs in place of brightness and contrast inputs (link above).

# 3/31/21
- [Added] Multi-z slider to navigate between images in the z-plane ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/89)).
- [Added] a button that allows users to update the default-z ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/86)).
- [Fixed] a bug related to save annotation feature ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/77)).
- [Added] a button to be able to reset the applied channel settings to what's stored in the database ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/71)).

# 1/31/21

- [Added] a z-plane at the bottom of the main image to allow users to browse images in the z-plane ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/77)).
