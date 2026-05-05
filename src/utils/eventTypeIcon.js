const eventTypeIconMap = [
  { keywords: ['疫苗', '接种', '免疫'], icon: '💉' },
  { keywords: ['驱虫', '体内驱虫', '体外驱虫', '除虫'], icon: '🐛' },
  { keywords: ['体检', '检查', '年度检查'], icon: '🩺' },
  { keywords: ['洗澡', '美容', '清洁'], icon: '🛁' },
  { keywords: ['绝育', '手术', '节育'], icon: '✂️' },
  { keywords: ['洗牙', '牙齿', '口腔'], icon: '🦷' },
  { keywords: ['眼', '眼睛'], icon: '👁️' },
  { keywords: ['皮肤', '皮毛'], icon: '🐾' },
  { keywords: ['血', '血液', '化验', '检验'], icon: '🧪' },
  { keywords: ['喂', '喂养', '饮食', '粮'], icon: '🍖' },
];

export function getEventTypeIcon(label) {
  if (!label) return '📋';
  for (const mapping of eventTypeIconMap) {
    if (mapping.keywords.some(kw => label.includes(kw))) {
      return mapping.icon;
    }
  }
  return '📋';
}
