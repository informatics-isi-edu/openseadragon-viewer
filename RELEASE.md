# Release Notes

This document is a summary of code changes in openseadragon-viewer. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Deprecated]`: removal (modification) of an existing feature that are not supported anymore.
  - `[Refactored]`: modifications to existing code to make it more maintainable.
  - `[Fixed]`: bug fixes.
  - `[No changes]` means that Chaise hasn't been changed in the described duration.

9/30/21
- [Changed] default behavior of channel panel to open by default in case of multi-channel images ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/268216b9938c0ca142441484a5e685e29453afe9)).
- [Added] channel names on top of the image (which can be turned off) ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/88)).
- [Fixed] a bug that was causing some confusion in the UI ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/commit/008d5efc2267f8017a6a6704daf3ff2dda209508)).

7/31/21
- [No changes]

5/31/21
- [Added] support for dynamic ACLs ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/91)).
- [Fixed] bugs in hsv2rgb and rgb2hsv functions that caused wrong default colors in images.
- [Changed] Channel controls UI ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/78)).
- [Added] ability to save channel config in the database (link above).
- [Added] image color historgram for debugging purposes (link above).
- [Added] intensity range inputs in place of brightness and contrast inputs (link above).

3/31/21
- [Added] Multi-z slider to navigate between images in the z-plane ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/89)).
- [Added] a button that allows users to update the default-z ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/86)).
- [Fixed] a bug related to save annotation feature ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/77)).
- [Added] a button to be able to reset the applied channel settings to what's stored in the database ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/71)).

1/31/21

- [Added] a z-plane at the bottom of the main image to allow users to browse images in the z-plane ([link](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/77)).
