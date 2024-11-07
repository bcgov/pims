const path = require('path');
const outputText = require(path.resolve(__dirname, `../../../outputText.json`));

/**
 * THIS FILE DOES NOT REQUIRE ANY EDITING.
 * Place within .github/helpers/npm-deps/
 */

// Get package.json paths and comment contents from env.
const packageJsonPaths = JSON.parse(process.env.packageJsonPaths);
const commentIn = JSON.parse(process.env.commentContents);

(async () => {
  const module = await import('../github-api/create-and-close-existing-issue.mjs');
  const createAndCloseExistingIssue = module.default;
  // Create an array of promises for each packageJsonPath.
  const promises = packageJsonPaths.map(async (packagePath) => {
    // get the comment for this folder
    const comment = {"Updates": commentIn[packagePath]};
    // create title
    const issueTitle =
      packagePath !== '.' ? `${packagePath} NPM Dependency Report` : 'NPM Dependency Report';
    // Await the completion of create and close existing issue.
    await createAndCloseExistingIssue(issueTitle, outputText[packagePath], comment);
  });

  // Wait for all issues to be created.
  await Promise.all(promises);
})();
