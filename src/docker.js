"use strict";

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ByteArray = imports.byteArray;

var dockerCommandsToLabels = {
  start: "Start",
  restart: "Restart",
  stop: "Stop",
  pause: "Pause",
  unpause: "Unpause",
  exec: "Exec"
};

/**
 * Check if docker is installed
 * @return {Boolean} whether docker is installed or not
 */
var isDockerInstalled = () => !!GLib.find_program_in_path("docker");

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
      //if (out && out.toString().indexOf("docker") > -1) {
      dockerRunning = true;
    } else if (size <= 0) {
      hasLine = false;
    }
  } while (!dockerRunning && hasLine);

  return dockerRunning;
};

/**
 * Get an array of containers
 * @return {Array} The array of containers as { name, status }
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
      return {
        name: values[0],
        status: values[1]
      };
    });
};

/**
 * Run a docker command
 * @param {String} command The command to run
 * @param {String} containerName The container
 * @param {Function} callback A callback that takes the status, command, and stdErr
 */
var runCommand = async (command, containerName, callback) => {
  var cmd = [""];
  if (command == "exec") {
    // cmd =
    //   "gnome-terminal -- sh -c 'docker exec -it " +
    //   containerName +
    //   " bash; exec $SHELL' ";
    cmd = [
      "gnome-terminal",
      "--",
      "sh",
      "-c",
      "'docker exec -it " + containerName + " bash; exec $SHELL' "
    ];
  } else {
    cmd = ["docker", command, containerName];
  }
  execCommand(cmd, callback);
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
          callback(ok, argv.join(" "), ok ? stdout : stderr);
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
