import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const client = join('dist', 'client');
const prerendered = join('dist', 'server', 'prerendered-routes');

cpSync(join(prerendered, 'index.html'), join(client, 'index.html'));
cpSync(join(prerendered, '404.html'), join(client, '404.html'));

for (const file of ['index.html', '404.html']) {
  const path = join(client, file);
  const html = readFileSync(path, 'utf8')
    .replaceAll('/_next/', '/sdxl-tag-gacha/_next/')
    .replaceAll('/favicon.svg', '/sdxl-tag-gacha/favicon.svg');
  writeFileSync(path, html);
}

writeFileSync(join(client, '.nojekyll'), '');
