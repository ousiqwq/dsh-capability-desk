import { PolicyError } from './policy.js';
const languages = [
  ['zh-CN', '简体中文', ['zh', 'zh-cn', 'zh-hans', '中文', '简体中文', '简体', 'simplified chinese']],
  ['zh-Hant', '繁體中文', ['zh-tw', 'zh-hk', 'zh-hant', '繁体中文', '繁體中文', '繁体', '繁體', 'traditional chinese']],
  ['en', 'English', ['en', 'en-us', 'en-gb', 'english', '英文', '英语']],
  ['ja', '日本語', ['ja', 'ja-jp', 'japanese', '日本語', '日语']],
  ['es', 'Español', ['es', 'spanish', 'español', '西班牙语']],
  ['fr', 'Français', ['fr', 'french', 'français', '法语']],
  ['de', 'Deutsch', ['de', 'german', 'deutsch', '德语']],
  ['ru', 'Русский', ['ru', 'russian', 'русский', '俄语']],
  ['pt', 'Português', ['pt', 'pt-br', 'pt-pt', 'portuguese', 'português', '葡萄牙语']],
];
/** A target is data, never a template or executable expression. Source language is automatic. */
export function resolveTranslationTarget(value = '', uiLocale = 'zh') {
  if (typeof value !== 'string' || value.length > 160 || /[\u0000-\u001f\u007f]/u.test(value)) throw new PolicyError('翻译目标语言无效，最多 160 字符。');
  const custom = value.normalize('NFC').trim(), requested = custom || (typeof uiLocale === 'string' ? uiLocale : 'zh');
  const normalized = requested.toLowerCase();
  const known = languages.find(row => row[2].includes(normalized)) ?? (!custom ? languages.find(row => row[0].toLowerCase() === normalized || row[2].includes(normalized.split('-')[0])) : null);
  return { label: known?.[1] ?? requested, key: known?.[0] ?? 'custom:' + requested, followInterface: !custom };
}
