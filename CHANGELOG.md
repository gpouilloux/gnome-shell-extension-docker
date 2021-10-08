# Changelog

All notable changes to this project will be documented in this file. *(The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).)*

## [11] - 2021-10-08
### Fix
- Remove deprecated Lang
## [10] - 2021-10-08
### Fix
- Fix ps binary path
- _containers attribute fix for DockerMenu

## [9] - 2021-04-27
### Fix

- Enabling all gnome-shell version 40
## [8] - 2021-04-22
### Fix

- Enabling version 40.0

### Fix

- Moving sync code to async. This will fix freezing issues

## [6] - 2021-02-05

### Added

- Count on running intances
- Compatibility for podman with docker alias

### Fix

- Terminal issue for non ubuntu distro. Fallback to gnome-terminal
- St.Label deallocation problem

## [4] - 2020-05-25

### Added

- Added user in `docker` group verification as one more error handler.
- Added `docker-compose` project name before the container in the Panel menu if available.

### Changed

- Code consolidation *(icon variable name)*.

### Removed

## [3] - 2020-05-16

### Added

- README consolidation to show almost all relevant informations about the extension
	- New: Contributors; License
	- Changed: Name *(to follow the real name of extension)*; Description; Screenshot; Usage; Installation
- New short description file: EXTENSIONS.GNOME.ORG.md

### Changed

- New icon handling method.
- New custom GNOME Panel - Docker icon with 16px raster aligned structure.
  - Needed to slightly change the official visuals to sharp as possible results as there is no official low resolution version*.
  - Designed with taking into account the official GNOME design guidelines.
- New custom GNOME Menu - Docker container like container icons *(based on official container visuals)*.
- New custom GNOME Menu - Docker container state icons *(aligned to official container visual)*.
- Slightly fresher icon color palette for containers and their states.
- New more universal '*terminal*' application management to use generic '*x-terminal-emulator*' *(instead of hard-coded 'gnome-terminal')* to show logs or give interactive console for containers.
- New screenshot with almost general and modern GNOME environment *(without any non-required frippery)*.
- Consolidation of resources and their path *(icons, screenshots)*.
- `metadata.json` refreshment with README 'shared' description and expanded with new GNOME version.

### Removed

- Removed discrete license file as the README now handle this aspect of the extension.

## [2] - 2019-11-2

### Added

- Credits section to the README.md file
- Added `Logs` submenu item to allow logging display for containers. Logs
  have a 2000 rows history and execution is in tail mode.
- This changelog.

### Changed

- `Exec` submenu icon
- Use of GLib.spawn_command_line_async instead of Gio.Subprocess to fix
  executon of gnome-terminal when running `Exec` and `Logs` commands.

### Removed

## [1] - 2019-10-13

### Added

- Added `Exec` submenu item to allow `docker exec -it ${CONTAINER_NAME} bash`
- Added sub menu icons
- Added notify messages

### Changed

- Code migration to fit GNOME 3.34 API

### Removed

- Docker `Remove` command removed because it was to risky

[unreleased]: https://github.com/RedSoftwareSystems/easy_docker_containers/tree/master
[1]: https://github.com/RedSoftwareSystems/easy_docker_containers/tree/v1
[2]: https://github.com/RedSoftwareSystems/easy_docker_containers/tree/v2
