# openseadragon-viewer (OSD viewer)

## Overview

  A 2D viewer based on [OpenSeadragon](https://openseadragon.github.io/) with image annotation capability,
  in-time filtering, and in-view scalebar.
  This application is mainly used in combination with
  [Chaise viewer app](https://github.com/informatics-isi-edu/chaise/tree/master/docs/user-docs/viewer/viewer-app.md).

## Installation

See [OSD viewer installation](docs/user-docs/installation.md).

## Usage

openseadragon can be used as a standalone web application, or inside an iframe to communicate with its parent web application. It's mainly designed to work with [the Chaise viewer app](https://github.com/informatics-isi-edu/chaise/tree/master/docs/user-docs/viewer.md).

See [openseadargon-viewer usage](docs/user-docs/usage.md) for more details.

## Code Contribute

When developing new code for OSD viewer, please make sure you're following these steps:

1. create a new branch and make your updates to the code in the branch (avoid changing master branch directly);
2. do your own quality assurance;
4. update the regression tests (if applicable);
6. make sure you can deploy your code without any issues (`make deploy` should not fail);
7. make sure that all regression tests are passing before submitting the pull request;
8. make your pull request, assign it to yourself, and ask someone to review your code.
  - Try to provide as much information as you can on your PR. Explain the issues that the PR is fixing, and the changes that you've done in the PR.
  - Provide examples if applicable.
  - Deploy your changes to a server if applicable and provide links. You should not expect reviewers to deploy your code.
  - Resolve the conflicts with master before merging the code (and go through the process of making sure tests are good to go).


## Help and Contact

Please direct questions and comments to the [project issue tracker](https://github.com/informatics-isi-edu/openseadragon-viewer/issues) at GitHub.

## License

openseadragon-viewer is made available as open source under the Apache License,
Version 2.0. Please see the [LICENSE file](LICENSE) for more information.

## About Us

openseadragon-viewer is developed in the
[Informatics Systems Research Division](http://isrd.isi.edu/)
at the [USC Information Sciences Institute](http://www.isi.edu).
