#!/usr/bin/env node

/**
 * Add YAML frontmatter to all documentation files
 * Marks historical docs as legacy, active docs as current
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

/**
 * Recursively find all .md files in a directory
 */
async function findMarkdownFiles(dir, fileList = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      await findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Check if file already has frontmatter
 */
function hasFrontmatter(content) {
  return content.trim().startsWith('---');
}

/**
 * Determine if a file should be marked as legacy
 */
function isLegacy(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.includes('/history/') ||
         normalized.includes('/completion-summaries/') ||
         normalized.includes('/phases/') ||
         normalized.includes('/status/');
}

/**
 * Add frontmatter to a file
 */
async function addFrontmatter(filePath) {
  const content = await readFile(filePath, 'utf8');

  // Skip if already has frontmatter
  if (hasFrontmatter(content)) {
    console.log(`⏭️  Skipping (has frontmatter): ${path.basename(filePath)}`);
    return { skipped: true };
  }

  const status = isLegacy(filePath) ? 'legacy' : 'current';

  const frontmatter = `---
status: ${status}
last_verified: ${today}
updated_by: Claude Code
---

`;

  const newContent = frontmatter + content;
  await writeFile(filePath, newContent, 'utf8');

  console.log(`✅ Added frontmatter (${status}): ${path.basename(filePath)}`);
  return { status, added: true };
}

/**
 * Main execution
 */
async function main() {
  const docsDir = path.join(__dirname, '..', 'docs');

  console.log('🔍 Finding all markdown files in docs/...\n');

  const files = await findMarkdownFiles(docsDir);

  console.log(`📝 Found ${files.length} markdown files\n`);
  console.log('➕ Adding frontmatter...\n');

  const results = {
    added: 0,
    skipped: 0,
    current: 0,
    legacy: 0
  };

  for (const file of files) {
    try {
      const result = await addFrontmatter(file);
      if (result.skipped) {
        results.skipped++;
      } else if (result.added) {
        results.added++;
        if (result.status === 'current') {
          results.current++;
        } else {
          results.legacy++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Total files: ${files.length}`);
  console.log(`   Frontmatter added: ${results.added}`);
  console.log(`   - Current: ${results.current}`);
  console.log(`   - Legacy: ${results.legacy}`);
  console.log(`   Skipped (already had frontmatter): ${results.skipped}`);
  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
