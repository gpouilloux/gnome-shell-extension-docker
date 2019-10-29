# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

### Changed

### Removed

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

- Code migration to fit Gnome 3.34 API

### Removed

- Docker `Remove` command removed because it was to risky

[unreleased]: https://github.com/RedSoftwareSystems/easy_docker_containers/tree/master
[1]: https://github.com/RedSoftwareSystems/easy_docker_containers/tree/v1
[2]: https://github.com/RedSoftwareSystems/easy_docker_containers/tree/v2
