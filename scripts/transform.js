#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Broader category set, matched via word-boundary regex against ALL meanings
// (not just forms[0]), so short keywords don't false-positive on substrings.
const CATEGORY_KEYWORDS = {
  travel: [
    'hotel','train','bus','airport','flight','ticket','map','road',
    'direction','station','restaurant','travel','trip','journey','tour',
    'visit','sail','climb','mountain','beach','sea','river','lake','park',
    'temple','museum','city','country','street','avenue','bridge','port',
    'dock','ferry','luggage','passport','visa','border','customs','inn',
    'hostel','resort','scenic','sightseeing','compass','abroad','overseas',
    'boat','ship','airplane','plane','taxi','subway','platform','depart',
    'arrive','luggage','suitcase','itinerary','passenger',
  ],
  business: [
    'business','company','office','employee','boss','manager','director',
    'president','sales','marketing','contract','meeting','conference',
    'negotiation','deal','transaction','profit','loss','investment',
    'stock','bank','account','loan','debt','invoice','receipt','payment',
    'salary','wage','bonus','commission','expense','budget','finance',
    'tax','tariff','duty','import','export','trade','commerce','market',
    'customer','client','supplier','vendor','deliver','shipping',
    'warehouse','inventory','production','manufacture','strategy',
    'deadline','schedule','report','proposal','enterprise','corporation',
    'colleague','resign','hire','promotion','industry','factory',
  ],
  chat: [
    'chat','conversation','dialogue','discussion','debate','argue','agree',
    'disagree','opinion','joke','laugh','funny','boring','listen','sound',
    'voice','word','language','sentence','phrase','grammar','meaning',
    'hello','goodbye','thanks','thank you','sorry','please','yes','no',
    'maybe','certainly','definitely','probably','perhaps','really',
    'actually','exactly','indeed','greet','greeting','wow','oh','alas',
    'ah','ha','well','hmm','right','okay','excuse me',
  ],
  study: [
    'study','learn','teach','school','student','teacher','class',
    'lesson','book','read','write','homework','exam','test','grade',
    'university','college','degree','graduate','education','knowledge',
    'research','professor','textbook','dictionary','vocabulary',
    'library','lecture','course','subject','major','tuition','scholar',
  ],
  'daily-life': [
    'home','house','room','morning','evening','sleep','wake','clean',
    'wash','cook','cleaning','furniture','clothes','wear','shower',
    'chore','neighbor','family','parent','child','friend','husband',
    'wife','habit','routine','weekend','holiday','rest','relax',
  ],
  food: [
    'food','eat','drink','restaurant','meal','breakfast','lunch',
    'dinner','cook','recipe','ingredient','fruit','vegetable','meat',
    'rice','noodle','soup','tea','coffee','wine','beer','sweet','sour',
    'spicy','salty','delicious','taste','flavor','kitchen','chef',
    'menu','dish','snack',
  ],
  shopping: [
    'shop','store','buy','sell','price','discount','sale','money',
    'pay','cash','credit card','receipt','clothes','shoe','size',
    'bargain','expensive','cheap','mall','market','cashier','refund',
    'return','wallet','purse',
  ],
  health: [
    'health','doctor','hospital','medicine','sick','ill','disease',
    'pain','hurt','fever','cough','headache','nurse','clinic','pharmacy',
    'treatment','symptom','injury','exercise','fitness','diet','rest',
    'recover','emergency',
  ],
};

// Compile word-boundary regexes once
const CATEGORY_REGEXES = {};
for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
  CATEGORY_REGEXES[cat] = keywords.map(
    (k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  );
}

function getHSKLevel(levels) {
  if (!levels || levels.length === 0) return 0;
  const newLevel = levels.find((l) => l.startsWith('new-'));
  if (newLevel) return parseInt(newLevel.split('-')[1]);
  const oldLevel = levels.find((l) => l.startsWith('old-'));
  if (oldLevel) return parseInt(oldLevel.split('-')[1]);
  return 0;
}

// Pick the best form: skip forms whose first meaning is a surname-only
// or "variant of" entry, if a better form exists.
function pickBestForm(forms) {
  if (!forms || forms.length === 0) return null;
  const isWeak = (m) =>
    !m || /^surname\b/i.test(m) || /^variant of\b/i.test(m) || /^old variant of\b/i.test(m);
  const good = forms.find((f) => f.meanings && f.meanings.length && !isWeak(f.meanings[0]));
  return good || forms[0];
}

function getPinyin(form) {
  return form?.transcriptions?.pinyin || '';
}

function getAllMeaningsText(forms) {
  const all = [];
  (forms || []).forEach((f) => {
    (f.meanings || []).forEach((m) => all.push(m));
  });
  return all.join(' | ').toLowerCase();
}

function categorizeWord(meaningsText) {
  const categories = [];
  for (const [cat, regexes] of Object.entries(CATEGORY_REGEXES)) {
    if (regexes.some((re) => re.test(meaningsText))) {
      categories.push(cat);
    }
  }
  return categories.length > 0 ? categories : ['general'];
}

function transformVocabulary(data) {
  const transformed = [];
  const seenIds = new Set();
  let skippedNoLevel = 0;
  let skippedNoData = 0;
  let surnameFixed = 0;

  for (const word of data) {
    if (!word.simplified) continue;
    const id = word.simplified;
    if (seenIds.has(id)) continue;

    const level = getHSKLevel(word.level);
    if (level === 0) { skippedNoLevel++; continue; }

    const bestForm = pickBestForm(word.forms);
    if (!bestForm) { skippedNoData++; continue; }

    const pinyin = getPinyin(bestForm);
    const meaning = bestForm.meanings?.[0] || '';
    if (!pinyin || !meaning) { skippedNoData++; continue; }

    if (word.forms && word.forms[0] !== bestForm) surnameFixed++;

    seenIds.add(id);

    const meaningsText = getAllMeaningsText(word.forms);

    transformed.push({
      id,
      hanzi: word.simplified,
      pinyin,
      translation: meaning,
      level,
      categories: categorizeWord(meaningsText),
    });
  }

  console.log(`Skipped (no HSK level): ${skippedNoLevel}`);
  console.log(`Skipped (no pinyin/meaning): ${skippedNoData}`);
  console.log(`Words where surname-reading was skipped in favor of real meaning: ${surnameFixed}`);

  return transformed;
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'complete.json'), 'utf8'));
  console.log(`Loaded ${data.length} raw entries. Transforming...`);

  const transformed = transformVocabulary(data);
  console.log(`\nTransformed ${transformed.length} words into app schema.`);

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'words.json');
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`\n✓ Saved to ${outputPath}`);

  const byLevel = {};
  transformed.forEach((w) => { byLevel[w.level] = (byLevel[w.level] || 0) + 1; });
  console.log('\nWords by HSK level:');
  Object.keys(byLevel).sort((a, b) => a - b).forEach((l) => console.log(`  Level ${l}: ${byLevel[l]}`));

  const byCategory = {};
  transformed.forEach((w) => w.categories.forEach((c) => { byCategory[c] = (byCategory[c] || 0) + 1; }));
  console.log('\nWords by category (words can be in multiple):');
  Object.keys(byCategory).sort().forEach((c) => console.log(`  ${c}: ${byCategory[c]}`));
}

main();
