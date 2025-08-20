import frontmatter from 'front-matter';
import fs from 'fs';
import path from 'path';
import { u as make } from 'unist-builder';
import { URL, fileURLToPath } from 'url';

import { VERSIONS } from './versions.js';
// import navigationConfig from './navigation-config.json' assert { type: "json" };
const navigationConfig = JSON.parse(
  fs.readFileSync(new URL('./navigation-config.json', import.meta.url))
);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.resolve(dirname, '../pages');

// TODO(cedric): refactor docs to get rid of the directory lists

/** Manual list of directories to categorize as "Home" */
const homeDirectories = [];
/** Manual list of directories to categorize as "Learn" */
const learnDirectories = [];
/** Manual list of directories to categorize as "Archive" */
const archiveDirectories = [];
/** Manual list of directories to categorize as "Reference" */
const referenceDirectories = ['versions'];
/** Private preview section which isn't linked in the documentation */
const previewDirectories = [];
const resourcesDirectories = [];

/** All other unlisted directories */
const generalDirectories = fs
  .readdirSync(PAGES_DIR, { withFileTypes: true })
  .filter(entity => entity.isDirectory())
  .map(dir => dir.name)
  .filter(
    name =>
      name !== 'api' &&
      name !== 'versions' &&
      ![
        ...homeDirectories,
        ...archiveDirectories,
        ...referenceDirectories,
        ...learnDirectories,
        ...previewDirectories,
      ].includes(name)
  );

// --- Navigation ---

const home = [];


const general = [
  makeSection('入门指南', [
    makePage('guides/getting-started/quick-start.mdx'),
    makePage('guides/getting-started/basic-configuration.mdx'),

    makePage('guides/debugging/debug-panel/debug-panel.mdx'),


  ]),

  makeSection('目录结构', [
    makePage('guides/getting-started/bundle-folder.mdx'),
    makePage('guides/getting-started/native-folder.mdx'),
  ]),

  makeSection('热更新', [
    makePage('guides/codepush/basic.mdx'),
  ]),

  makeSection('CLI 工具', [
    makePage('guides/cli-tools/app-startup-script.mdx'),
    makePage('guides/cli-tools/create-xrn-script.mdx'),
  ]),

  makeSection('多Bundle', [
    makePage('guides/multi-bundle/basic.mdx'),
  ]),

];

const resources = [
];

const featurePreview = [];

const versionsReference = VERSIONS.reduce(
  (all, version) => ({
    ...all,
    [version]: navigationConfig.sdk.map(section =>
      makeSection(section.name, pagesFromDir(`versions/${version}/sdk/${section.directory}`), {
        expanded: section.expanded,
        directory: section.directory,
      })
    ),
  }),
  {}
);

const reference = { ...versionsReference, latest: versionsReference['latest'] };

export default {
  home,
  general,
  resources,
  featurePreview,
  reference,
  generalDirectories,
  previewDirectories,
  referenceDirectories,
  archiveDirectories,
  homeDirectories,
  learnDirectories,
  resourcesDirectories,
};

// --- MDX methods ---

function makeSection(name, children = [], props = {}) {
  return make('section', { name, ...{ expanded: false, ...props } }, children);
}

function makeGroup(name, children = [], props = {}) {
  return make('group', { name, ...props }, children);
}

/**
 * Parse the MDX page and extract the frontmatter/yaml page information.
 * It will only look for the frontmatter/yaml block in the root nodes.
 * This requires the `remark-frontmatter` MDX plugin.
 *
 * @param {string} file
 */
function makePage(file) {
  const filePath = path.resolve(PAGES_DIR, file);
  const contents = fs.readFileSync(filePath, 'utf-8');
  const url = pageUrl(filePath);
  const data = frontmatter(contents).attributes;

  if (!data) {
    console.error('Page YAML block is unreadable:', file);
  } else if (!data.title) {
    console.error('Page does not have a `title`:', file);
    data.title = '';
  }

  const result = {
    // TODO(cedric): refactor name into title
    name: data.title,
    // TODO(cedric): refactor href into url
    href: url,
  };
  // TODO(cedric): refactor sidebarTitle into metadata
  if (data.sidebar_title) {
    result.sidebarTitle = data.sidebar_title;
  }
  // TODO(cedric): refactor hidden into `isHidden` and move it to metadata
  if (data.hidden) {
    result.hidden = data.hidden;
  }
  return make('page', result);
}

// --- Other helpers ---

/**
 * Load all pages from a single directory.
 */
function pagesFromDir(dir) {
  const resolvedPageDirectory = path.resolve(PAGES_DIR, dir);
  if (!fs.existsSync(resolvedPageDirectory)) {
    return [];
  }
  return fs
    .readdirSync(resolvedPageDirectory, { withFileTypes: true })
    .filter(entity => entity.isFile())
    .map(file => makePage(path.join(dir, file.name)));
}

/**
 * Create the page url using the absolute file path.
 * This parses the URL, relatively from PAGES_DIR.
 * It also strips the file extension, and name if its `index`.
 * These urls are pathnames, without trailing slashes.
 */
function pageUrl(file) {
  const filePath = path.parse(file);
  const { pathname } = new URL(path.relative(PAGES_DIR, file), 'https://xtransferorg.github.io/');
  return pathname
    .replace(filePath.base, filePath.name === 'index' ? '' : filePath.name)
    .replace(/\/$/, '');
}

function shiftEntryToFront(array, findFunction) {
  return [...array.filter(findFunction), ...array.filter(item => !findFunction(item))];
}
