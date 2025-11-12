export const findMostRecentDataYear = (playerData, dataType) => {
  if (!playerData?.yearsPlayed?.length) return null;
  
  const sortedYears = [...playerData.yearsPlayed].sort((a, b) => b - a);
  const statsKey = dataType === 'batting' ? 'battingStats' : 'pitchingStats';
  const stats = playerData[statsKey];
  
  if (!stats || !stats.length) return null;
  
  for (const year of sortedYears) {
    const yearData = stats.filter(stat => stat.year === year);
    if (yearData && yearData.length > 0) {
      return year;
    }
  }
  
  return null;
};

export const isBattingTab = (tab) => {
  const battingTabs = ['batting', 'situational', 'baserunning', 'batted_ball', 'splits'];
  return battingTabs.includes(tab);
};

export const determinePlayerView = (playerData, selectedYear, activeTab) => {
  if (!playerData) return null;
  
  const battingYear = findMostRecentDataYear(playerData, 'batting');
  const pitchingYear = findMostRecentDataYear(playerData, 'pitching');
  
  if (!battingYear && !pitchingYear) return null;
  
  if (isBattingTab(activeTab)) {
    return { type: 'batting', year: battingYear };
  } else {
    return { type: 'pitching', year: pitchingYear };
  }
};
