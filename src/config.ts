export const site = {
  title: "Jesse's Blog",
  author: 'Jesse Chen',
  description: '记录一点技术，也留住一些日常。学习笔记、论文阅读和不定期的生活记录。',
  url: 'https://jesse-plcx.github.io',
  github: 'https://github.com/Jesse-Plcx',
};

export const topicLabels: Record<string, string> = {
  Study: '学习', Research: '研究', Interest: '兴趣', Life: '日常',
  study: '学习', life: '日常', interest: '兴趣',
};
export const topicLabel = (value: string) => topicLabels[value] ?? value;
