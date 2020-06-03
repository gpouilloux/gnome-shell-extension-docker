"use strict";

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const ByteArray = imports.byteArray;

var dockerCommandsToLabels = {
  start: "Start",
  restart: "Restart",
  stop: "Stop",
  pause: "Pause",
  unpause: "Unpause",
  exec: "Exec",
  logs: "Logs"
};

/**
 * Check if docker is installed
 * @return {Boolean} whether docker is installed or not
 */
var isDockerInstalled = () => !!GLib.find_program_in_path("docker");

/**
 * Check if Linux user is in 'docker' group (to manage Docker without 'sudo')
 * @return {Boolean} whether current Linux user is in 'docker' group or not
 */
var isUserInDockerGroup = () => {
  const _userName = GLib.get_user_name();
  let _userGroups = GLib.spawn_command_line_sync("groups " + _userName)[1].toString();
  let _inDockerGroup = false;
  if (_userGroups.match(/\sdocker[\s\n]/g)) _inDockerGroup = true; // Regex search for ' docker ' or ' docker' in Linux user's groups

  return _inDockerGroup;
};

/**
 * Check if docker daemon is running
 * @return {Boolean} whether docker daemon is running or not
 */
var isDockerRunning = () => {
  const [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(
    null,
    ["/bin/ps", "cax"],
    null,
    0,
    null
  );

  const outReader = new Gio.DataInputStream({
    base_stream: new Gio.UnixInputStream({ fd: out_fd })
  });

  let dockerRunning = false;
  let hasLine = true;
  do {
    const [out, size] = outReader.read_line(null);
    if (out && ByteArray.toString(out).indexOf("docker") > -1) {
      dockerRunning = true;
    } else if (size <= 0) {
      hasLine = false;
    }
  } while (!dockerRunning && hasLine);

  return dockerRunning;
};

/**
 * Get an array of containers
 * @return {Array} The array of containers as { project, name, status }
 */
var getContainers = () => {
  const [res, out, err, status] = GLib.spawn_command_line_sync(
    "docker ps -a --format '{{.Names}},{{.Status}}'"
  );
  if (status !== 0) throw new Error("Error occurred when fetching containers");

  return String.fromCharCode
    .apply(String, out)
    .trim()
    .split("\n")
    .filter(string => string.length > 0)
    .map(string => {
      const values = string.split(",");

      // Get 'docker-compose' project name for the container
      let projectName = GLib.spawn_command_line_sync("docker inspect -f '{{index .Config.Labels \"com.docker.compose.project\"}}' " + values[0])[1].toString();
      projectName = projectName.replace("\n", "");
      projectName = projectName.toUpperCase();
      projectName = projectName;
      if (projectName != "" ) projectName = projectName + " ∘ ";

      return {
        project: projectName,
        name: values[0],
        status: values[1]
      };
    });
};

/**
 * Run a Docker command
 * @param {String} command The command to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
var runCommand = async (command, containerName, callback) => {
  var cmd = [""];
  switch (command) {
    case "exec":
      cmd = [
        "x-terminal-emulator",
        "-e",
        "bash",
        "-c",      
        "'docker exec -it " + containerName + " bash; exec $SHELL'"
      ];
      GLib.spawn_command_line_async(cmd.join(" "));
      break;
    case "logs":
      cmd = [
        "x-terminal-emulator",
        "-e",
        "bash",
        "-c",
        "'docker logs -f --tail 2000 " + containerName + "; exec $SHELL' "
      ];
      GLib.spawn_command_line_async(cmd.join(" "));
      break;
    default:
      cmd = ["docker", command, containerName];
      execCommand(cmd, callback);
  }
};

async function execCommand(
  argv,
  callback /*(status, command, err) */,
  cancellable = null
) {
  try {
    // There is also a reusable Gio.SubprocessLauncher class available
    let proc = new Gio.Subprocess({
      argv: argv,
      // There are also other types of flags for merging stdout/stderr,
      // redirecting to /dev/null or inheriting the parent's pipes
      flags: Gio.SubprocessFlags.STDOUT_PIPE
    });

    // Classes that implement GInitable must be initialized before use, but
    // an alternative in this case is to use Gio.Subprocess.new(argv, flags)
    //
    // If the class implements GAsyncInitable then Class.new_async() could
    // also be used and awaited in a Promise.
    proc.init(null);

    let stdout = await new Promise((resolve, reject) => {
      // communicate_utf8() returns a string, communicate() returns a
      // a GLib.Bytes and there are "headless" functions available as well
      proc.communicate_utf8_async(null, cancellable, (proc, res) => {
        let ok, stdout, stderr;

        try {
          [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
          callback && callback(ok, argv.join(" "), ok ? stdout : stderr);
          resolve(stdout);
        } catch (e) {
          reject(e);
        }
      });
    });

    return stdout;
  } catch (e) {
    logError(e);
  }
}