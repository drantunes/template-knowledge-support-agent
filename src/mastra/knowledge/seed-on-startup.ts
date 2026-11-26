import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { datasets } from '../../examples/datasets.ts';
import { runtimeExample } from '../../examples/runtime.ts';
import { seedDatasetOnce } from './seed.ts';

export async function seedHostedExample() {
  const dataset = datasets[runtimeExample.initialDataset]!;
  const { default: packagedDatasets } = await import('./startup-datasets.generated.mjs');
  const files = packagedDatasets[basename(dataset.directory)];
  if (!files?.length) throw new Error(`Missing bundled files for seed dataset ${dataset.id}`);

  // The packaged files stay in the server bundle. Use a private directory so the normal seeder can validate them.
  const directory = await mkdtemp(join(tmpdir(), 'support-seed-'));
  try {
    for (const [name, contents] of files) {
      const path = join(directory, name);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, contents, 'utf8');
    }
    await seedDatasetOnce({ ...dataset, directory });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
