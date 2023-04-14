# Page Loader:
[![Actions Status](https://github.com/julish13/backend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/julish13/backend-project-lvl3/actions)
[![Node CI](https://github.com/julish13/backend-project-lvl3/actions/workflows/tests.yml/badge.svg)](https://github.com/julish13/backend-project-lvl3/actions/workflows/tests.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/7e6647d4fcd76cadfde3/maintainability)](https://codeclimate.com/github/julish13/backend-project-lvl3/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/7e6647d4fcd76cadfde3/test_coverage)](https://codeclimate.com/github/julish13/backend-project-lvl3/test_coverage)

## Project description:

Page Loader is a CLI application that allows users to download web pages and their content easily. With Page Loader, you can quickly and efficiently download entire web pages, including CSS, images, and JavaScript, and save them to your local machine for offline use.

## System requirements

- bash / zsh
- Make
- Git
- Node.js

## Installation:

To install, run the following commands:

```bash
git clone git@github.com:julish13/page-loader.git
cd page-loader
make
npm link
```
## Usage:

To use Page Loader, follow the instructions below:

1. Open your terminal and navigate to the directory where you want to save the downloaded web page.

2. To download the web page run the following command:

```bash
page-loader <url>
```
This will download the web page and all of its assets to your current working directory.

3. To specify the output directory for the downloaded web page, use the `--output` flag followed by the desired output directory:

```bash
page-loader --output <output directory> <url>
```

4. To enable debugging, use the `--debug` flag:

```bash
page-loader --debug <url>
```
This will output additional information about the download process, including any errors that occur.

5. To get help information about Page Loader, run the following command:

```bash
page-loader -h
```
