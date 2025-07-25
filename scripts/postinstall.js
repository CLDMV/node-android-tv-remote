/**
 * Postinstall script to check for adb and print install instructions if missing.
 */
const { execSync } = require("child_process");
const os = require("os");

function hasAdb() {
	try {
		execSync("adb version", { stdio: "ignore" });
		return true;
	} catch (e) {
		return false;
	}
}

if (hasAdb()) {
	console.log("ADB is installed and available in your PATH.");
	process.exit(0);
}

console.log("\nADB is not installed or not in your PATH.");
console.log("Follow these instructions to install ADB:");

const platform = os.platform();
if (platform === "win32") {
	console.log("\nWindows:");
	console.log("1. Download the SDK Platform Tools for Windows: https://developer.android.com/studio/releases/platform-tools");
	console.log("2. Extract the ZIP file.");
	console.log("3. Add the extracted folder to your system PATH.");
	console.log('4. Test by running "adb version" in Command Prompt.');
} else if (platform === "darwin") {
	console.log("\nmacOS:");
	console.log("1. Download the SDK Platform Tools for Mac: https://developer.android.com/studio/releases/platform-tools");
	console.log("2. Extract the ZIP file.");
	console.log("3. Move the extracted folder to /usr/local/bin or add it to your PATH.");
	console.log('4. Test by running "adb version" in Terminal.');
} else if (platform === "linux") {
	console.log("\nLinux:");
	console.log("1. Download the SDK Platform Tools for Linux: https://developer.android.com/studio/releases/platform-tools");
	console.log("2. Extract the ZIP file.");
	console.log("3. Move the extracted folder to /usr/local/bin or add it to your PATH.");
	console.log("4. Or install via your package manager:");
	console.log("   - Ubuntu/Debian: sudo apt-get install android-tools-adb");
	console.log("   - Fedora/Red Hat: sudo dnf install android-tools");
	console.log("   - CentOS/yum: sudo yum install android-tools");
	console.log('5. Test by running "adb version" in your shell.');
}
console.log("\nYou must accept the ADB authorization prompt on your Android TV device the first time you connect.");
