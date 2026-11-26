import { readdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../knowledge-datasets/', import.meta.url));
const datasets: Record<string, [string, string][]> = Object.create(null);

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = resolve(root, entry.name);
  const files: [string, string][] = [];
  for (const file of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (file.isDirectory()) continue;
    const path = resolve(file.parentPath, file.name);
    if (!file.isFile()) throw new Error(`Unexpected example dataset entry: ${relative(root, path)}`);
    files.push([relative(directory, path).split(sep).join('/'), await readFile(path, 'utf8')]);
  }
  datasets[entry.name] = files.sort(([left], [right]) => left.localeCompare(right, 'en'));
}

const output = new URL('../src/mastra/knowledge/startup-datasets.generated.mjs', import.meta.url);
await writeFile(output, `export default ${JSON.stringify(datasets)};\n`);
