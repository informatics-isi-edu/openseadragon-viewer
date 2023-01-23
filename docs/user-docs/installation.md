# Installation

## Dependencies

### Runtime Dependencies

- **Web server**: openseadragon can be hosted on any HTTP web server. Most likely you
  will want to deploy the app on the same host as your images. If it is deployed
  on a separate host, you will need to enable [CORS] on the web server on which
  the images are deployed.

### Development Dependencies

* [Make](https://en.wikipedia.org/wiki/Make_%28software%29): usually present on any unix/linux/osx host.
* [Rsync](https://en.wikipedia.org/wiki/Rsync): usually present on any unix/linux/osx host.

## Deploying
1. Ensure the environment variables are properly set. The following are the variables and their default values:

    ```
    WEB_URL_ROOT=/
    WEB_INSTALL_ROOT=/var/www/html/
    OSD_VIEWER_REL_PATH=openseadragon-viewer/
    ```
    Which means openseadragon-viewer folder will be copied to `/var/www/html/openseadragon-viewer/` location by default. And the URL path of openseadragon-viewer is `/openseadragon-viewer/`. If that is not the case in your deployment, you should modify the variables accordingly.

    Notes:
    - All the variables MUST have a trailing `/`.

    - If you're installing remotely, since we're using the `WEB_INSTALL_ROOT` in `rsync` command, you can use a remote location `username@host:public_html/` for this variable.
3. After making sure the variables are properly set, run the following command:

    ```sh
    make deploy
    ```

    Notes:
      - If the given directory does not exist, it will first create it. So you may need to run `make deploy` with _super user_ privileges depending on the installation directory you choose.

## Usage

openseadragon can be used as a standalone web application, or inside an iframe to communicate with its parent web application. See [openseadargon-viewer usage](usage.md) for more details.
