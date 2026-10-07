export const site = {
  title: "Jesse's Blog",
  author: 'Jesse Chen',
  description: '记录一点技术，也留住一些日常。学习笔记、论文阅读和不定期的生活记录。',
  url: 'https://jesse-plcx.github.io',
  github: 'https://github.com/Jesse-Plcx',
  profile: {
    introduction: '平时会写点代码、读读论文，也记录游戏与生活的体验。',
    description: '写作没有固定主题或更新频率。想把学到的东西、折腾过的工具和日常里的想法，慢慢整理在这里。',
    interests: ['编程与算法', '论文阅读', '游戏与设备', '日常记录'],
  },
};

export const topicLabels: Record<string, string> = {
  Study: '学习', Research: '研究', Interest: '兴趣', Life: '日常',
  study: '学习', life: '日常', interest: '兴趣',
};
export const topicLabel = (value: string) => topicLabels[value] ?? value;
