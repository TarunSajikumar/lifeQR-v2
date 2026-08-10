/**
 * Two-Way Frontend Synchronization Script (LifeQR)
 * Keeps `website/` and `app/` directories synchronized for ALL shared assets,
 * HTML views, stylesheets, scripts, Tailwind files, and components.
 */

const fs = require('fs');
const path = require('path');

const websiteDir = path.resolve(__dirname, '../website');
const appDir = path.resolve(__dirname, '../app');

/**
 * Recursively gets all relative file paths from a directory
 */
function getAllRelativeFiles(dirPath, baseDir = dirPath) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;

  const list = fs.readdirSync(dirPath);
  for (const item of list) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRelativeFiles(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Gets master list of all relative file paths across both website/ and app/
 */
function getCombinedFileList() {
  const websiteFiles = getAllRelativeFiles(websiteDir);
  const appFiles = getAllRelativeFiles(appDir);
  return Array.from(new Set([...websiteFiles, ...appFiles]));
}

/**
 * Ensures target directory exists for a file path
 */
function ensureDirExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

/**
 * Copies source file to destination if destination doesn't exist or is older
 */
function syncFile(fileRelative) {
  const pathWebsite = path.join(websiteDir, fileRelative);
  const pathApp = path.join(appDir, fileRelative);

  const websiteExists = fs.existsSync(pathWebsite);
  const appExists = fs.existsSync(pathApp);

  if (!websiteExists && !appExists) {
    return;
  }

  if (websiteExists && !appExists) {
    ensureDirExists(pathApp);
    try {
      fs.copyFileSync(pathWebsite, pathApp);
      console.log(`[Frontend Sync] Copied new file: website/${fileRelative} -> app/${fileRelative}`);
    } catch (err) {
      console.warn(`[Frontend Sync Warning] Locked/Busy copying website/${fileRelative} -> app/${fileRelative}`);
    }
    return;
  }

  if (!websiteExists && appExists) {
    ensureDirExists(pathWebsite);
    try {
      fs.copyFileSync(pathApp, pathWebsite);
      console.log(`[Frontend Sync] Copied new file: app/${fileRelative} -> website/${fileRelative}`);
    } catch (err) {
      console.warn(`[Frontend Sync Warning] Locked/Busy copying app/${fileRelative} -> website/${fileRelative}`);
    }
    return;
  }

  const statWebsite = fs.statSync(pathWebsite);
  const statApp = fs.statSync(pathApp);

  const diff = statWebsite.mtimeMs - statApp.mtimeMs;

  if (Math.abs(diff) > 100) {
    if (diff > 0) {
      // website file is newer
      try {
        fs.copyFileSync(pathWebsite, pathApp);
        console.log(`[Frontend Sync] Updated app/${fileRelative} from website/${fileRelative}`);
      } catch (err) {
        console.warn(`[Frontend Sync Warning] Locked/Busy updating website/${fileRelative} -> app/${fileRelative}`);
      }
    } else {
      // app file is newer
      try {
        fs.copyFileSync(pathApp, pathWebsite);
        console.log(`[Frontend Sync] Updated website/${fileRelative} from app/${fileRelative}`);
      } catch (err) {
        console.warn(`[Frontend Sync Warning] Locked/Busy updating app/${fileRelative} -> website/${fileRelative}`);
      }
    }
  }
}

/**
 * Runs one-time synchronization for all files
 */
function syncAll() {
  console.log('[Frontend Sync] Running two-way sync between website/ and app/...');
  const allFiles = getCombinedFileList();
  for (const relFile of allFiles) {
    syncFile(relFile);
  }
  console.log('[Frontend Sync] Sync complete.');
}

/**
 * Starts continuous real-time file watcher
 */
function startWatcher(onChangeCallback) {
  syncAll();
  console.log('[Frontend Sync] Watching website/ and app/ for live changes...');

  const watchOptions = { recursive: true };

  const handleWatchEvent = (sourceDirName, targetDirName, targetBaseDir, filename) => {
    if (!filename) return;
    const relFile = filename.replace(/\\/g, '/');
    syncFile(relFile);
    if (typeof onChangeCallback === 'function') {
      onChangeCallback(relFile);
    }
  };

  fs.watch(websiteDir, watchOptions, (eventType, filename) => {
    handleWatchEvent('website', 'app', appDir, filename);
  });

  fs.watch(appDir, watchOptions, (eventType, filename) => {
    handleWatchEvent('app', 'website', websiteDir, filename);
  });
}

// Execute if run directly
if (require.main === module) {
  const isWatch = process.argv.includes('--watch');
  if (isWatch) {
    startWatcher();
  } else {
    syncAll();
  }
}

module.exports = { syncAll, startWatcher, syncFile };
