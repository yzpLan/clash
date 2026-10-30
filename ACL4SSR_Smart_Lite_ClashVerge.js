// Clash Verge Rev / Mihomo extension script
// ACL4SSR_Smart_Lite.ini -> script; preserve original SNTP dns and nodes.
function main(config) {

// 添加自己的 ZGO VPS Hysteria2 节点
  // config.proxies = config.proxies || [];

  // if (!config.proxies.some(p => p.name === '🇺🇸 美国-ZGO-HY2')) {
  //   config.proxies.push({
  //     name: '🇺🇸 美国-ZGO-HY2',
  //     type: 'hysteria2',
  //     server: 'xui.582063.xyz',
  //     port: 13990,
  //     password: '',
  //     sni: 'hy2.582063.xyz',
  //     'client-fingerprint': 'chrome',
  //     udp: true
  //   });
  // }

  const nodeNames = (config.proxies || []).map(p => p.name).filter(Boolean);
  const providers = Object.keys(config['proxy-providers'] || {});
  const providerUses = providers.length ? { use: providers } : {};
  const url = 'http://www.gstatic.com/generate_204';
  const makePool = () => ({ ...providerUses, proxies: nodeNames.length ? [...nodeNames] : ['DIRECT'] });
  const region = [
    ['🇭🇰 香港', '(?i)(港|hk|hong.?kong)'],
    ['🇯🇵 日本', '(?i)(日本|川日|东京|大阪|泉日|埼玉|沪日|深日|jp|japan)'],
    ['🇺🇲 美国', '(?i)(美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|us|united.?states)'],
    ['🇸🇬 狮城', '(?i)(新加坡|坡|狮城|sg|singapore)'],
    ['🇨🇳 台湾', '(?i)(台|新北|彰化|tw|taiwan)'],
    ['🇰🇷 韩国', '(?i)(kr|korea|kor|首尔|韩|韓)']
  ];
  const groups = [];
  const add = (name, type, proxies, extra = {}) => groups.push({ name, type, proxies, ...extra });
  const regions = region.map(([label]) => `${label}节点`);
  add('🚀 节点选择', 'select', ['♻️ 自动选择', '📌 手动切换', ...regions, 'DIRECT']);
  add('📌 手动切换', 'select', makePool().proxies, providerUses);
  add('♻️ 自动选择', 'url-test', makePool().proxies, { ...providerUses, url, interval: 300, tolerance: 50 });
  const general = ['🚀 节点选择', '📌 手动切换', ...regions, 'DIRECT'];
  add('🎬 EMBY影院', 'select', general);
  add('📲 电报消息', 'select', general);
  add('💬 Ai平台', 'select', ['🚀 节点选择', '📌 手动切换', '🇺🇲 美国节点', '🇯🇵 日本节点', '🇸🇬 狮城节点', '🇭🇰 香港节点', '🇨🇳 台湾节点', '🇰🇷 韩国节点', 'DIRECT']);
  add('📹 油管视频', 'select', general);
  add('🎯 全球直连', 'select', ['DIRECT', '🚀 节点选择']);
  add('🛑 广告拦截', 'select', ['REJECT', 'DIRECT']);
  add('🐟 漏网之鱼', 'select', ['🚀 节点选择', 'DIRECT']);
  const allNames = nodeNames;
  for (const [label, filter] of region) {
    const key = `${label}节点`, auto = `${label}自动`;
    const reg = new RegExp(filter.replace(/^\(\?i\)/, ''), 'i');
    const matched = allNames.filter(n => reg.test(n));
    const regionOpt = providers.length ? { ...providerUses, filter } : {};
    // Keep empty regions valid and selectable even if airport has no such nodes.
    add(key, 'select', [auto, ...(matched.length ? matched : ['DIRECT'])], regionOpt);
    add(auto, 'url-test', matched.length ? matched : ['DIRECT'], { ...regionOpt, url, interval: 300, tolerance: label.includes('美国') ? 150 : 50 });
  }
  const base = 'https://raw.githubusercontent.com/';
  const own = base + 'yzpLan/clash/refs/heads/main/';
  const acl = base + 'ACL4SSR/ACL4SSR/master/Clash/';
  const ruleSets = [
    ['mydirect', own + 'MyDirect.list', '🎯 全球直连'],
    ['myemby', own + 'MyEmby.list', '🎬 EMBY影院'],
    ['myproxy', own + 'MyProxy.list', '🚀 节点选择'],
    ['banad', acl + 'BanAD.list', '🛑 广告拦截'],
    ['telegram', acl + 'Telegram.list', '📲 电报消息'],
    ['ai', acl + 'Ruleset/AI.list', '💬 Ai平台'],
    ['youtube', acl + 'Ruleset/YouTube.list', '📹 油管视频'],
    ['gfw', acl + 'ProxyGFWlist.list', '🚀 节点选择'],
    ['china', acl + 'ChinaDomain.list', '🎯 全球直连']
  ];
  const ruleProviders = {};
  for (const [id, url, _group] of ruleSets) {
    ruleProviders['acl_' + id] = { type: 'http', behavior: 'classical', format: 'text', url, path: './ruleset/acl_' + id + '.list', interval: 86400 };
  }
  config['proxy-groups'] = groups;
  config['rule-providers'] = { ...(config['rule-providers'] || {}), ...ruleProviders };
  config.rules = [
    ...ruleSets.map(([id, _url, group]) => `RULE-SET,acl_${id},${group}`),
    'GEOIP,CN,🎯 全球直连',
    'MATCH,🐟 漏网之鱼'
  ];
  config.mode = 'rule';
  // Deliberately do not modify dns, hosts, proxies, proxy-providers or tun.
  return config;
}
