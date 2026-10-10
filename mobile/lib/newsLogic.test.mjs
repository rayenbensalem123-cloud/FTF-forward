import assert from 'node:assert/strict';
import { parseRssItems, mergeNews, ago } from './newsLogic.ts';

const xml = `<rss><channel><item><title><![CDATA[Tunisia beat Ghana &amp; qualify]]></title><link>https://a.example/1</link><pubDate>Fri, 09 Oct 2026 10:00:00 GMT</pubDate><source url="x">BBC</source></item>
<item><title>Old story</title><link>https://a.example/2</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item>
<item><title>No link here</title></item></channel></rss>`;
const a = parseRssItems(xml);
assert.equal(a.length, 2);
assert.equal(a[0].title, 'Tunisia beat Ghana & qualify');
assert.equal(a[0].source, 'BBC');
assert.equal(a[1].source, 'Google News');
const m = mergeNews([a, [{ ...a[1] }]]);
assert.equal(m.length, 2, 'duplicates dropped');
assert.equal(m[0].link, 'https://a.example/1', 'newest first');
assert.equal(ago('Fri, 09 Oct 2026 10:00:00 GMT', Date.parse('Fri, 09 Oct 2026 13:00:00 GMT')), '3h');
console.log('news ok');
