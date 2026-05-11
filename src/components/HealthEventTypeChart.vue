<script setup>
import { computed, ref } from 'vue';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';

const props = defineProps({
  stats: {
    type: Object,
    default: null
  }
});

const hoveredIndex = ref(-1);

const chartData = computed(() => {
  if (!props.stats?.typeBreakdown?.length) return null;

  const data = [...props.stats.typeBreakdown].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const barHeight = 28;
  const gap = 12;
  const labelWidth = 100;
  const countWidth = 48;
  const padding = 16;
  const barAreaPadding = 8;
  const height = data.length * (barHeight + gap) - gap + padding * 2;
  const width = 460;
  const barMaxWidth = width - labelWidth - countWidth - padding * 2 - barAreaPadding * 2;

  const colors = [
    ['#059669', '#34D399'],
    ['#047857', '#6EE7B7'],
    ['#065F46', '#A7F3D0'],
    ['#0D9488', '#5EEAD4'],
    ['#0F766E', '#99F6E4'],
    ['#115E59', '#6EE7B7'],
    ['#134E4A', '#5EEAD4'],
    ['#14532D', '#4ADE80']
  ];

  const bars = data.map((d, i) => {
    const barW = (d.count / maxCount) * barMaxWidth;
    const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
    const y = padding + i * (barHeight + gap);
    const icon = getEventTypeIcon(d.eventTypeName);
    const [c1, c2] = colors[i % colors.length];

    return {
      eventTypeName: d.eventTypeName,
      count: d.count,
      pct,
      barW: Math.max(barW, 4),
      y,
      icon,
      color1: c1,
      color2: c2,
      gradientId: `healthGrad${i}`
    };
  });

  return { bars, width, height, labelWidth, countWidth, padding, barHeight, barMaxWidth };
});
</script>

<template>
  <div class="health-type-chart">
    <div v-if="chartData" class="chart-wrapper">
      <div class="chart-header">
        <div class="chart-summary">
          <div class="summary-item">
            <span class="summary-label">总事件</span>
            <span class="summary-value">{{ stats.totalCount }} 次</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">事件类型</span>
            <span class="summary-value">{{ stats.typeBreakdown?.length || 0 }} 种</span>
          </div>
          <div class="summary-item" v-if="stats.typeBreakdown?.length">
            <span class="summary-label">最常见</span>
            <span class="summary-value">{{ stats.typeBreakdown.reduce((a, b) => a.count > b.count ? a : b).eventTypeName }}</span>
          </div>
        </div>
      </div>
      <svg
        :viewBox="`0 0 ${chartData.width} ${chartData.height}`"
        class="chart-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            v-for="bar in chartData.bars"
            :key="bar.gradientId"
            :id="bar.gradientId"
            x1="0%" y1="0%" x2="100%" y2="0%"
          >
            <stop offset="0%" :stop-color="bar.color1" stop-opacity="0.9" />
            <stop offset="100%" :stop-color="bar.color2" stop-opacity="0.7" />
          </linearGradient>
        </defs>

        <g v-for="(bar, i) in chartData.bars" :key="i">
          <!-- Label -->
          <text
            :x="chartData.padding + chartData.labelWidth - 8"
            :y="bar.y + chartData.barHeight / 2 + 1"
            text-anchor="end"
            dominant-baseline="middle"
            fill="currentColor"
            fill-opacity="0.7"
            font-size="12"
            font-weight="500"
            style="cursor: pointer"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = -1"
          >{{ bar.icon }} {{ bar.eventTypeName }}</text>

          <!-- Bar background track -->
          <rect
            :x="chartData.padding + chartData.labelWidth + 8"
            :y="bar.y"
            :width="chartData.barMaxWidth"
            :height="chartData.barHeight"
            :rx="6"
            fill="currentColor"
            fill-opacity="0.06"
          />

          <!-- Bar fill -->
          <rect
            :x="chartData.padding + chartData.labelWidth + 8"
            :y="bar.y"
            :width="bar.barW"
            :height="chartData.barHeight"
            :rx="6"
            :fill="`url(#${bar.gradientId})`"
            :fill-opacity="hoveredIndex === i ? 1 : 0.85"
            style="cursor: pointer; transition: fill-opacity 0.2s"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = -1"
          />

          <!-- Count label -->
          <text
            :x="chartData.padding + chartData.labelWidth + chartData.barMaxWidth + 16"
            :y="bar.y + chartData.barHeight / 2 + 1"
            dominant-baseline="middle"
            fill="currentColor"
            fill-opacity="0.6"
            font-size="11"
            font-weight="600"
          >{{ bar.count }}</text>

          <!-- Percentage badge (on bar if wide enough) -->
          <text
            v-if="bar.barW > 50"
            :x="chartData.padding + chartData.labelWidth + 16"
            :y="bar.y + chartData.barHeight / 2 + 1"
            dominant-baseline="middle"
            fill="white"
            font-size="10"
            font-weight="600"
            fill-opacity="0.9"
          >{{ bar.pct }}%</text>
        </g>
      </svg>
    </div>
    <div v-else class="chart-empty">
      <span class="chart-empty-icon">📊</span>
      <span class="chart-empty-text">暂无统计数据，添加健康事件后将显示分布图</span>
    </div>
  </div>
</template>

<style scoped>
.health-type-chart {
  margin-bottom: 8px;
}

.chart-wrapper {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(52, 211, 153, 0.08) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

:root[data-theme="dark"] .chart-wrapper {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.1) 100%);
  border-color: rgba(52, 211, 153, 0.12);
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 11px;
  color: #94A3B8;
  font-weight: 500;
}

.summary-value {
  font-size: 14px;
  font-weight: 700;
  color: #059669;
}

:root[data-theme="dark"] .summary-value {
  color: #34D399;
}

.chart-svg {
  width: 100%;
  height: auto;
  color: #334155;
}

:root[data-theme="dark"] .chart-svg {
  color: #CBD5E1;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #94A3B8;
  font-size: 13px;
  background: rgba(16, 185, 129, 0.04);
  border-radius: 14px;
  border: 1px dashed rgba(16, 185, 129, 0.2);
}

:root[data-theme="dark"] .chart-empty {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(52, 211, 153, 0.15);
  color: #6EE7B7;
}

.chart-empty-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .chart-wrapper {
    padding: 12px;
  }

  .chart-header {
    flex-direction: column;
    gap: 8px;
  }

  .chart-summary {
    gap: 12px;
  }
}
</style>
