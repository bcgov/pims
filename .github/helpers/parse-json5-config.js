import * as fs from "node:fs";
import * as os from "node:os";
import { JSON5 as json5 } from "json5";

/**
 * THIS FILE DOES NOT REQUIRE ANY EDITING.
 * Place within .github/helpers/
 */

// Check if a file path is provided.
if (process.argv.length < 3) {
	console.log("Usage: node parse-json5-config <path_to_json5_file>");
	process.exit(1);
}
const filePath = process.argv[2];

fs.readFile(filePath, "utf8", (err, data) => {
	if (err) {
		console.error("Error reading the file:", err);
		return;
	}

	try {
		// Parse the JSON5 data
		const jsonData = json5.parse(data);

		// Set each key-value pair as an environment variable
		for (const [key, value] of Object.entries(jsonData)) {
			// Serialize arrays and objects to JSON strings
			const envValue =
				typeof value === "object" ? JSON.stringify(value) : value;

			const output = process.env.GITHUB_OUTPUT;

			// Output each key-value pair for GitHub Actions
			fs.appendFileSync(output, `${key}=${envValue}${os.EOL}`);
		}
	} catch (parseError) {
		console.error("Error parsing JSON5:", parseError);
	}
});
