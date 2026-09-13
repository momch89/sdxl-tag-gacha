# Related tag data

Source: [newtextdoc1111/danbooru-tag-csv](https://huggingface.co/datasets/newtextdoc1111/danbooru-tag-csv),
revision `fdf2772213f13d46bff60fc5ebd876e1a811a053`, file `danbooru_tags_cooccurrence.csv`.
Retrieved 2026-09-14. Discovered through dr1610/a1111-sd-webui-jp-tag-assistant; no extension implementation or translations were copied.

Input SHA-256: `29bf95d3dd2f4b1038ac26b3fee371ebbe67d9b622b32d274c9486dbde56077a`.
Output: 3,762 source tags, 84,390 directed recommendations, 1,698,174 bytes before compression.

The source README states: “This dataset is released under the [MIT License](LICENSE).”
Its linked LICENSE file is absent at this revision. This notice preserves the source's attribution and stated license; it does not invent a copyright holder or grant rights to unrelated project code.

MIT permission notice:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Processing

Run `node --experimental-strip-types scripts/import-related-tags.mjs <downloaded-csv>`.
Only endpoints already in the application's dictionary are retained. Underscores are normalized to spaces, repeated undirected edges use the maximum count, self-links and counts below 20 are removed. Each source keeps up to 24 candidates, ordered by co-occurrence count divided by the geometric mean of dictionary post counts. These counts are from different snapshots, so the score is a ranking heuristic, not a probability.

Translations, dictionary categories, post counts and the random generation engine are not changed. Recommendations describe co-occurrence, not guaranteed compatibility. The UI checks the existing conflict rules before allowing an addition. Data is loaded on demand.
