import React, { useState } from "react";

const StatsCards = ({ recruits }) => {
  const [histogramMetric, setHistogramMetric] = useState('heights');
  const totalRecruits = recruits.length;

  const getTagDistribution = () => {
    const tagCounts = {};
    recruits.forEach(recruit => {
      const tag = recruit.tag || 'unscouted';
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const sorted = Object.entries(tagCounts).sort(([, a], [, b]) => b - a);
    return sorted;
  };

  const getPositionDistribution = () => {
    const positionCounts = {};
    recruits.forEach(recruit => {
      if (recruit.positions && recruit.positions.length > 0) {
        recruit.positions.forEach(pos => {
          positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });
      }
    });
    const sorted = Object.entries(positionCounts).sort(([, a], [, b]) => b - a);
    return sorted;
  };

  const getClassDistribution = () => {
    const classCounts = {};
    recruits.forEach(recruit => {
      if (recruit.graduationYear) {
        classCounts[recruit.graduationYear] = (classCounts[recruit.graduationYear] || 0) + 1;
      }
    });
    const sorted = Object.entries(classCounts).sort(([a], [b]) => a - b);
    return sorted;
  };

  const getHeightDistribution = () => {
    const heights = recruits
      .map(r => r.measurables?.height)
      .filter(h => h !== null && h !== undefined && h !== '')
      .map(h => {
        if (typeof h === 'number') {
          if (h < 10) {
            return null;
          }
          return h >= 60 && h <= 80 ? h : null;
        }
        
        const heightStr = String(h).trim();
        
        if (heightStr.includes("'")) {
          const parts = heightStr.replace(/"/g, '').split("'");
          if (parts.length === 2) {
            const feet = parseInt(parts[0], 10);
            const inches = parseInt(parts[1], 10);
            if (!isNaN(feet) && !isNaN(inches)) {
              const totalInches = feet * 12 + inches;
              return totalInches >= 60 && totalInches <= 80 ? totalInches : null;
            }
          }
        }
        
        const cleaned = heightStr.replace(/"/g, '').replace(/[^\d.]/g, '');
        const totalInches = parseFloat(cleaned);
        if (!isNaN(totalInches) && totalInches >= 60 && totalInches <= 80) {
          return Math.round(totalInches);
        }
        
        return null;
      })
      .filter(h => h !== null && !isNaN(h) && h >= 60 && h <= 80);

    const bins = {};
    for (let start = 60; start <= 78; start += 3) {
      bins[start] = 0;
    }

    heights.forEach(h => {
      const bin = Math.floor((h - 60) / 3) * 3 + 60;
      if (bin >= 60 && bin <= 78) {
        bins[bin] = (bins[bin] || 0) + 1;
      }
    });

    return { bins, total: heights.length };
  };

  const getWeightDistribution = () => {
    const weights = recruits
      .map(r => r.measurables?.weight)
      .filter(w => w !== null && w !== undefined && w !== '')
      .map(w => {
        const weight = typeof w === 'number' ? w : parseFloat(String(w).replace(/[^\d.]/g, ''));
        return !isNaN(weight) && weight >= 100 && weight <= 300 ? Math.round(weight) : null;
      })
      .filter(w => w !== null && !isNaN(w) && w >= 100 && w <= 300);

    const bins = {};
    for (let start = 100; start <= 250; start += 30) {
      bins[start] = 0;
    }

    weights.forEach(w => {
      const bin = Math.floor((w - 100) / 30) * 30 + 100;
      if (bin >= 100 && bin <= 250) {
        bins[bin] = (bins[bin] || 0) + 1;
      }
    });

    return { bins, total: weights.length };
  };

  const getGPADistribution = () => {
    const gpas = recruits
      .map(r => r.gpa)
      .filter(g => g !== null && g !== undefined && g !== '')
      .map(g => {
        const gpa = typeof g === 'number' ? g : parseFloat(String(g).replace(/[^\d.]/g, ''));
        return !isNaN(gpa) && gpa >= 0 && gpa <= 4.0 ? gpa : null;
      })
      .filter(g => g !== null && !isNaN(g) && g >= 0 && g <= 4.0);

    const bins = {};
    for (let start = 0; start <= 3.0; start += 0.5) {
      bins[start.toFixed(1)] = 0;
    }
    bins['3.5'] = 0;

    gpas.forEach(g => {
      let bin;
      if (g >= 3.5) {
        bin = 3.5;
      } else {
        bin = Math.floor(g / 0.5) * 0.5;
      }
      const binKey = bin.toFixed(1);
      if (bins.hasOwnProperty(binKey)) {
        bins[binKey] = (bins[binKey] || 0) + 1;
      }
    });

    return { bins, total: gpas.length };
  };

  const getExitVelocityDistribution = () => {
    const velocities = recruits
      .map(r => r.measurables?.exitVelocity)
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => {
        const vel = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
        return !isNaN(vel) && vel >= 50 && vel <= 120 ? Math.round(vel) : null;
      })
      .filter(v => v !== null && !isNaN(v) && v >= 50 && v <= 120);

    const bins = {};
    for (let start = 50; start <= 110; start += 10) {
      bins[start] = 0;
    }

    velocities.forEach(v => {
      const bin = Math.floor((v - 50) / 10) * 10 + 50;
      if (bin >= 50 && bin <= 110) {
        bins[bin] = (bins[bin] || 0) + 1;
      }
    });

    return { bins, total: velocities.length };
  };

  const getInfieldVelocityDistribution = () => {
    const velocities = recruits
      .map(r => r.measurables?.infieldVelocity)
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => {
        const vel = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
        return !isNaN(vel) && vel >= 50 && vel <= 100 ? Math.round(vel) : null;
      })
      .filter(v => v !== null && !isNaN(v) && v >= 50 && v <= 100);

    const bins = {};
    for (let start = 50; start <= 90; start += 10) {
      bins[start] = 0;
    }

    velocities.forEach(v => {
      const bin = Math.floor((v - 50) / 10) * 10 + 50;
      if (bin >= 50 && bin <= 90) {
        bins[bin] = (bins[bin] || 0) + 1;
      }
    });

    return { bins, total: velocities.length };
  };

  const getOutfieldVelocityDistribution = () => {
    const velocities = recruits
      .map(r => r.measurables?.outfieldVelocity)
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => {
        const vel = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
        return !isNaN(vel) && vel >= 60 && vel <= 100 ? Math.round(vel) : null;
      })
      .filter(v => v !== null && !isNaN(v) && v >= 60 && v <= 100);

    const bins = {};
    for (let start = 60; start <= 90; start += 10) {
      bins[start] = 0;
    }

    velocities.forEach(v => {
      const bin = Math.floor((v - 60) / 10) * 10 + 60;
      if (bin >= 60 && bin <= 90) {
        bins[bin] = (bins[bin] || 0) + 1;
      }
    });

    return { bins, total: velocities.length };
  };

  const getSixtyYardDashDistribution = () => {
    const times = recruits
      .map(r => r.measurables?.sixtyYardDash)
      .filter(t => t !== null && t !== undefined && t !== '')
      .map(t => {
        const time = typeof t === 'number' ? t : parseFloat(String(t).replace(/[^\d.]/g, ''));
        return !isNaN(time) && time >= 5.5 && time <= 8.0 ? time : null;
      })
      .filter(t => t !== null && !isNaN(t) && t >= 5.5 && t <= 8.0);

    const bins = {};
    for (let start = 5.5; start <= 7.5; start += 0.3) {
      bins[start.toFixed(1)] = 0;
    }

    times.forEach(t => {
      const bin = Math.floor((t - 5.5) / 0.3) * 0.3 + 5.5;
      const binKey = bin.toFixed(1);
      if (bins.hasOwnProperty(binKey)) {
        bins[binKey] = (bins[binKey] || 0) + 1;
      }
    });

    return { bins, total: times.length };
  };

  const getMoundVelocityDistribution = () => {
    const velocities = recruits
      .map(r => r.measurables?.moundVelocity)
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => {
        const vel = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
        return !isNaN(vel) && vel >= 60 && vel <= 100 ? Math.round(vel) : null;
      })
      .filter(v => v !== null && !isNaN(v) && v >= 60 && v <= 100);

    const bins = {};
    for (let start = 60; start <= 95; start += 5) {
      bins[start] = 0;
    }

    velocities.forEach(v => {
      const bin = Math.floor((v - 60) / 5) * 5 + 60;
      if (bin >= 60 && bin <= 95) {
        bins[bin] = (bins[bin] || 0) + 1;
      }
    });

    return { bins, total: velocities.length };
  };

  const tagDistribution = getTagDistribution();
  const positionDistribution = getPositionDistribution();
  const classDistribution = getClassDistribution();
  const heightDistribution = getHeightDistribution();
  const weightDistribution = getWeightDistribution();
  const gpaDistribution = getGPADistribution();
  const exitVelocityDistribution = getExitVelocityDistribution();
  const infieldVelocityDistribution = getInfieldVelocityDistribution();
  const outfieldVelocityDistribution = getOutfieldVelocityDistribution();
  const sixtyYardDashDistribution = getSixtyYardDashDistribution();
  const moundVelocityDistribution = getMoundVelocityDistribution();

  const getCurrentDistribution = () => {
    switch (histogramMetric) {
      case 'weights':
        return weightDistribution;
      case 'gpas':
        return gpaDistribution;
      case 'exit-velocity':
        return exitVelocityDistribution;
      case 'infield-velocity':
        return infieldVelocityDistribution;
      case 'outfield-velocity':
        return outfieldVelocityDistribution;
      case 'sixty-yard-dash':
        return sixtyYardDashDistribution;
      case 'mound-velocity':
        return moundVelocityDistribution;
      default:
        return heightDistribution;
    }
  };

  const formatWeightRange = (startWeight) => {
    const endWeight = startWeight + 29;
    return `${startWeight}-${endWeight}`;
  };

  const formatGPARange = (startGPA) => {
    if (startGPA === '3.5') {
      return '3.5+';
    }
    const endGPA = (parseFloat(startGPA) + 0.5).toFixed(1);
    return `${startGPA}-${endGPA}`;
  };

  const formatVelocityRange = (startVel) => {
    const endVel = startVel + 9;
    return `${startVel}-${endVel}`;
  };

  const formatMoundVelocityRange = (startVel) => {
    const endVel = startVel + 4;
    return `${startVel}-${endVel}`;
  };

  const formatTimeRange = (startTime) => {
    const endTime = (parseFloat(startTime) + 0.3).toFixed(1);
    return `${startTime}-${endTime}s`;
  };

  const getHistogramBins = () => {
    const distribution = getCurrentDistribution();
    if (!distribution || !distribution.bins) return null;
    
    if (histogramMetric === 'heights') {
      return Object.entries(distribution.bins)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([key, value]) => ({ key, value, label: formatHeightRange(parseInt(key)) }));
    } else if (histogramMetric === 'weights') {
      return Object.entries(distribution.bins)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([key, value]) => ({ key, value, label: formatWeightRange(parseInt(key)) }));
    } else if (histogramMetric === 'gpas') {
      return Object.entries(distribution.bins)
        .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
        .map(([key, value]) => ({ key, value, label: formatGPARange(key) }));
    } else if (histogramMetric === 'exit-velocity' || histogramMetric === 'infield-velocity' || histogramMetric === 'outfield-velocity') {
      return Object.entries(distribution.bins)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([key, value]) => ({ key, value, label: formatVelocityRange(parseInt(key)) }));
    } else if (histogramMetric === 'mound-velocity') {
      return Object.entries(distribution.bins)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([key, value]) => ({ key, value, label: formatMoundVelocityRange(parseInt(key)) }));
    } else if (histogramMetric === 'sixty-yard-dash') {
      return Object.entries(distribution.bins)
        .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
        .map(([key, value]) => ({ key, value, label: formatTimeRange(key) }));
    }
    return null;
  };

  const formatHeightRange = (startInches) => {
    const startFeet = Math.floor(startInches / 12);
    const startInch = startInches % 12;
    return `${startFeet}'${startInch}"`;
  };

  const renderSegmentedBar = (items, total, maxItems = 3) => {
    const topItems = items.slice(0, maxItems);
    const othersCount = items.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);
    const allItems = othersCount > 0 ? [...topItems, ['others', othersCount]] : topItems;

    return (
      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {allItems.map(([key, count], idx) => {
            const percentage = (count / total) * 100;
            const colors = ['bg-blue-600', 'bg-orange-500', 'bg-green-600', 'bg-gray-400'];
            return (
              <div
                key={key}
                className={colors[idx] || 'bg-gray-400'}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {topItems.map(([key, count], idx) => {
            const percentage = (count / total) * 100;
            const dotColors = ['bg-blue-600', 'bg-orange-500', 'bg-green-600'];
            return (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColors[idx] || 'bg-gray-400'}`} />
                <span className="text-[10px] text-gray-600 capitalize">
                  {key.replace('-', ' ')}: {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
          {othersCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-[10px] text-gray-500">
                +{items.length - maxItems} more
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPositionBar = (items, totalPositions) => {
    const topItems = items.slice(0, 3);
    const othersCount = items.slice(3).reduce((sum, [, count]) => sum + count, 0);
    const allItems = othersCount > 0 ? [...topItems, ['others', othersCount]] : topItems;

    return (
      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {allItems.map(([key, count], idx) => {
            const percentage = (count / totalPositions) * 100;
            const colors = ['bg-emerald-600', 'bg-red-500', 'bg-amber-600', 'bg-gray-400'];
            return (
              <div
                key={key}
                className={colors[idx] || 'bg-gray-400'}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {topItems.map(([key, count], idx) => {
            const percentage = (count / totalPositions) * 100;
            const dotColors = ['bg-emerald-600', 'bg-red-500', 'bg-amber-600'];
            return (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColors[idx] || 'bg-gray-400'}`} />
                <span className="text-[10px] text-gray-600 capitalize">
                  {key}: {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
          {othersCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-[10px] text-gray-500">
                +{items.length - 3} more
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClassBar = (items) => {
    const topItems = items.slice(0, 3);
    const othersCount = items.slice(3).reduce((sum, [, count]) => sum + count, 0);
    const allItems = othersCount > 0 ? [...topItems, ['others', othersCount]] : topItems;

    return (
      <div className="space-y-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {allItems.map(([key, count], idx) => {
            const percentage = (count / totalRecruits) * 100;
            const colors = ['bg-purple-600', 'bg-pink-500', 'bg-indigo-600', 'bg-gray-400'];
            return (
              <div
                key={key}
                className={colors[idx] || 'bg-gray-400'}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {topItems.map(([key, count], idx) => {
            const percentage = (count / totalRecruits) * 100;
            const dotColors = ['bg-purple-600', 'bg-pink-500', 'bg-indigo-600'];
            return (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColors[idx] || 'bg-gray-400'}`} />
                <span className="text-[10px] text-gray-600">
                  {key}: {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
          {othersCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-[10px] text-gray-500">
                +{items.length - 3} more
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="bg-white/60 backdrop-blur-sm rounded border border-blue-200/30 p-4">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-0.5">Total Recruits</p>
          <p className="text-xl font-medium text-gray-900">{totalRecruits}</p>
        </div>
        {totalRecruits > 0 && tagDistribution.length > 0 && (
          renderSegmentedBar(tagDistribution, totalRecruits)
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded border border-emerald-200/30 p-4">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-0.5">Positions</p>
          <p className="text-xl font-medium text-gray-900">{positionDistribution.length}</p>
        </div>
        {positionDistribution.length > 0 && (
          renderPositionBar(positionDistribution, positionDistribution.reduce((sum, [, count]) => sum + count, 0))
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded border border-violet-200/30 p-4">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-0.5">Classes</p>
          <p className="text-xl font-medium text-gray-900">{classDistribution.length}</p>
        </div>
        {classDistribution.length > 0 && (
          renderClassBar(classDistribution)
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded border border-slate-200/30 p-4 col-span-2">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">
              {histogramMetric === 'gpas' ? 'GPAs' : 
               histogramMetric === 'heights' ? 'Heights' : 
               histogramMetric === 'weights' ? 'Weights' :
               histogramMetric === 'exit-velocity' ? 'Exit Velocity' :
               histogramMetric === 'infield-velocity' ? 'Infield Velocity' :
               histogramMetric === 'outfield-velocity' ? 'Outfield Velocity' :
               histogramMetric === 'mound-velocity' ? 'Mound Velocity' :
               histogramMetric === 'sixty-yard-dash' ? '60 Yard Dash' :
               histogramMetric}
            </p>
            <p className="text-xl font-medium text-gray-900">
              {getCurrentDistribution() ? getCurrentDistribution().total : 0}
            </p>
          </div>
          <select
            value={histogramMetric}
            onChange={(e) => setHistogramMetric(e.target.value)}
            className="text-xs text-gray-600 bg-white/80 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="heights">Heights</option>
            <option value="weights">Weights</option>
            <option value="gpas">GPAs</option>
            <option value="exit-velocity">Exit Velocity</option>
            <option value="infield-velocity">Infield Velocity</option>
            <option value="outfield-velocity">Outfield Velocity</option>
            <option value="mound-velocity">Mound Velocity</option>
            <option value="sixty-yard-dash">60 Yard Dash</option>
          </select>
        </div>
        <div className="mt-3">
          <div className={`flex items-end h-20 mb-7 ${histogramMetric === 'heights' ? 'gap-1.5' : histogramMetric === 'exit-velocity' || histogramMetric === 'infield-velocity' || histogramMetric === 'outfield-velocity' || histogramMetric === 'mound-velocity' || histogramMetric === 'sixty-yard-dash' ? 'gap-1.5' : 'gap-2'}`}>
            {(() => {
              const bins = getHistogramBins();
              const distribution = getCurrentDistribution();
              if (!bins || bins.length === 0) {
                const emptyBins = histogramMetric === 'heights' ? 7 : 
                                 histogramMetric === 'weights' ? 6 : 
                                 histogramMetric === 'gpas' ? 8 :
                                 histogramMetric === 'exit-velocity' ? 7 :
                                 histogramMetric === 'infield-velocity' ? 5 :
                                 histogramMetric === 'outfield-velocity' ? 4 :
                                 histogramMetric === 'mound-velocity' ? 8 :
                                 histogramMetric === 'sixty-yard-dash' ? 7 : 7;
                return Array.from({ length: emptyBins }, (_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center min-w-0 h-full justify-end">
                    <div className="w-full rounded-t bg-gray-100" style={{ height: '4px' }} />
                  </div>
                ));
              }
              
              const maxCount = distribution.total > 0 
                ? Math.max(...bins.map(b => b.value)) 
                : 1;
              const maxBarHeight = 80;
              
              return bins.map(({ key, value: count }) => {
                const heightPercentage = maxCount > 0 ? (count / maxCount) * maxBarHeight : 0;
                const barHeight = count > 0 ? Math.max(heightPercentage, 14) : 4;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center min-w-0 h-full justify-end">
                    {count > 0 && (
                      <span className="text-xs text-gray-800 font-semibold mb-1.5 leading-none">
                        {count}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t transition-all ${count > 0 ? 'bg-slate-800' : 'bg-gray-100'}`}
                      style={{ height: `${barHeight}%`, minHeight: count > 0 ? '14px' : '4px' }}
                    />
                  </div>
                );
              });
            })()}
          </div>
          <div className={`flex items-center justify-between px-0.5 ${histogramMetric === 'heights' ? 'gap-1.5' : histogramMetric === 'exit-velocity' || histogramMetric === 'infield-velocity' || histogramMetric === 'outfield-velocity' || histogramMetric === 'mound-velocity' || histogramMetric === 'sixty-yard-dash' ? 'gap-1.5' : 'gap-2'}`}>
            {(() => {
              const bins = getHistogramBins();
              if (!bins || bins.length === 0) {
                const emptyBins = histogramMetric === 'heights' ? 7 : 
                                 histogramMetric === 'weights' ? 6 : 
                                 histogramMetric === 'gpas' ? 8 :
                                 histogramMetric === 'exit-velocity' ? 7 :
                                 histogramMetric === 'infield-velocity' ? 5 :
                                 histogramMetric === 'outfield-velocity' ? 4 :
                                 histogramMetric === 'mound-velocity' ? 8 :
                                 histogramMetric === 'sixty-yard-dash' ? 7 : 7;
                return Array.from({ length: emptyBins }, (_, i) => {
                  let label = '';
                  if (histogramMetric === 'heights') {
                    label = formatHeightRange(60 + (i * 3));
                  } else if (histogramMetric === 'weights') {
                    label = formatWeightRange(100 + (i * 30));
                  } else if (histogramMetric === 'gpas') {
                    label = formatGPARange((i * 0.5).toFixed(1));
                  } else if (histogramMetric === 'exit-velocity') {
                    label = formatVelocityRange(50 + (i * 10));
                  } else if (histogramMetric === 'infield-velocity') {
                    label = formatVelocityRange(50 + (i * 10));
                  } else if (histogramMetric === 'outfield-velocity') {
                    label = formatVelocityRange(60 + (i * 10));
                  } else if (histogramMetric === 'mound-velocity') {
                    label = formatMoundVelocityRange(60 + (i * 5));
                  } else if (histogramMetric === 'sixty-yard-dash') {
                    label = formatTimeRange((5.5 + (i * 0.3)).toFixed(1));
                  }
                  return (
                    <div key={i} className="flex-1 text-center min-w-0">
                      <span className={`${histogramMetric === 'heights' ? 'text-xs' : 'text-[10px]'} text-gray-600 font-medium leading-tight`}>{label}</span>
                    </div>
                  );
                });
              }
              
              return bins.map(({ key, label }) => (
                <div key={key} className="flex-1 text-center min-w-0">
                  <span className={`${histogramMetric === 'heights' ? 'text-xs' : 'text-[10px]'} text-gray-600 font-medium leading-tight`}>{label}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
