# openseadragon-viewer (OSD viewer)

## Overview

  A 2D viewer based on OpenSeadragon with image annotation capability,
  in-time filtering, in-view scalebar.

 >  There are two separate versions of viewer implemented in this repository.
  In this document we are mainly focused on the newest version. For more information about
  the legacy version please refer to [this document](docs/user-docs/previous-version.md).

## Installation

See [OSD viewer installation](docs/user-docs/installation.md)

## Usage

openseadragon can be used as a standalone web application, or inside an iframe to communicate with its parent web application. See [openseadargon-viewer usage](docs/user-docs/usage.md) for more details.

## Code Contribute

When developing new code for OSD viewer, please make sure you're following these steps:

1. create a new branch and make your updates to the code in the branch (avoid changing master branch directly);
2. do your own quality assurance;
4. update the regression tests (if applicable);
6. make sure you can deploy your code without any issues (`make install` should not fail);
7. make sure that all regression tests are passing before submitting the pull request;
8. make your pull request, assign it to yourself, and ask someone to review your code.
  - Try to provide as much information as you can on your PR. Explain the issues that the PR is fixing, and the changes that you've done in the PR.
  - Provide examples if applicable.
  - Deploy your changes to a server if applicable and provide links. You should not expect reviewers to deploy your code.
  - Resolve the conflicts with master before merging the code (and go through the process of making sure tests are good to go).


## Help and Contact

Please direct questions and comments to the [project issue tracker](https://github.com/informatics-isi-edu/openseadragon-viewer/issues) at GitHub.

## License

Chaise is made available as open source under the Apache License, Version 2.0. Please see the [LICENSE file](LICENSE) for more information.

## About Us

openseadragon-viewer is developed in the
[Informatics group](http://www.isi.edu/research_groups/informatics/home)
at the [USC Information Sciences Institute](http://www.isi.edu).
