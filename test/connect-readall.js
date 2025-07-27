// Test script to connect to an ADB device and read settings.
// Usage: node test/connect-readall.js <ip> [port] [get|set] [--quiet]
const AndroidTVSetup = require("../src/lib/adb/setup");
const readline = require("readline");

async function main() {
	const ip = process.argv[2];
	const port = process.argv[3] ? parseInt(process.argv[3], 10) : 5555;
	const mode = process.argv[4] === "set" ? "set" : "get";
	const quiet = process.argv.includes("--quiet");

	if (!ip) {
		console.error("Usage: node test/connect-readall.js <ip> [port] [get|set] [--quiet]");
		process.exit(1);
	}

	if (!quiet) console.log(`Running in ${mode} mode on ${ip}:${port}`);

	   const setup = new AndroidTVSetup({ ip, port, quiet });
	   try {
			   /**
				* Check if already connected to the device. If not, connect.
				* @returns {Promise<void>}
				*/
			   const isConnected = typeof setup.isConnected === 'function' ? await setup.isConnected() : false;
			   if (!isConnected) {
					   await setup.connect();
			   } else if (!quiet) {
					   console.log(`Already connected to ${ip}:${port}`);
			   }
			   if (mode === "set") {
					   await setup.setSettings();
			   }
			   await setup.ensureAwake();
			   await setup.disconnect();
	   } catch (err) {
			   setup.errorWithTime("Error:", err.message || err);
			   process.exit(1);
	   }

	if (!quiet) console.log(`Ran in ${mode} mode on ${ip}:${port}`);
}

main();
