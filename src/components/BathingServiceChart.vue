<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  stats: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:days']);

const hoveredIndex = ref(-1);
const timeRange = ref('30');

const timeRangeOptions = [
  { label: '30天', value: '30' },
  { label: '90天', value: '90' },
  { label: '全部', value: 'all' }
];

const serviceTypeIcons = {
  '洗澡': '🛁',
  '美容': '✂️',
  '梳毛': '🪮',
  '剪指甲': '💅',
  '清洁耳朵': '👂',
  '刷牙': '🪥',
  '修剪毛发': '💇',
  '药浴': '💊'
};

function onTimeRangeChange(val) {
  timeRange.value = val;
  emit('update:days', val === 'all' ? null : Number(val));
}

const chartData = computed(() => {
  if (!props.stats?.typeStats?.length) return null;

  const data = props.stats.typeStats;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const barHeight = 28;
  const gap = 12;
  const labelWidth = 90;
  const countWidth = 40;
  const padding = 16;
  const barAreaPadding = 8;
  const height = data.length * (barHeight + gap) - gap + padding * 2;
  const width = 460;
  const barMaxWidth = width - labelWidth - countWidth - padding * 2 - barAreaPadding * 2;

  const colors = [
    ['#06B6D4', '#22D3EE'],
    ['#0891B2', '#67E8F9'],
    ['#0E7490', '#A5F3FC'],
    ['#155E75', '#CFFAFE'],
    ['#164E63', '#67E8F9'],
    ['#0C4A6E', '#22D3EE'],
    ['#083344', '#A5F3FC'],
    ['#1E3A5F', '#67E8F9']
  ];

  const bars = data.map((d, i) => {
    const barW = (d.count / maxCount) * barMaxWidth;
    const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
    const y = padding + i * (barHeight + gap);
    const icon = serviceTypeIcons[d.serviceType] || '🛁';
    const [c1, c2] = colors[i % colors.length];

    return {
      serviceType: d.serviceType,
      count: d.count,
      pct,
      barW: Math.max(barW, 4),
      y,
      icon,
      color1: c1,
      color2: c2,
      gradientId: `bathGrad${i}`
    };
  });

  return { bars, width, height, labelWidth, countWidth, padding, barHeight, barMaxWidth };
});
</script>

<template>
  <div class="bathing-chart">
    <div v-if="chartData" class="chart-wrapper">
      <div class="chart-header">
        <div class="chart-summary">
          <div class="summary-item">
            <span class="summary-label">总记录</span>
            <span class="summary-value">{{ stats.totalRecords }} 次</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">服务种类</span>
            <span class="summary-value">{{ stats.uniqueTypes }} 种</span>
          </div>
          <div class="summary-item" v-if="stats.topType">
            <span class="summary-label">最常服务</span>
            <span class="summary-value">{{ stats.topType }}</span>
          </div>
        </div>
      </div>
      <div class="time-range-selector">
        <button
          v-for="opt in timeRangeOptions"
          :key="opt.value"
          class="time-range-btn"
          :class="{ active: timeRange === opt.value }"
          @click="onTimeRangeChange(opt.value)"
        >{{ opt.label }}</button>
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
          >{{ bar.icon }} {{ bar.serviceType }}</text>

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
      <span class="chart-empty-text">暂无统计数据，添加洗澡美容记录后将显示分布图</span>
    </div>
  </div>
</template>

<style scoped>
.bathing-chart {
  margin-bottom: 8px;
}

.chart-wrapper {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(34, 211, 238, 0.08) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(6, 182, 212, 0.15);
}

:root[data-theme="dark"] .chart-wrapper {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(14, 116, 144, 0.1) 100%);
  border-color: rgba(6, 182, 212, 0.12);
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
  color: #0891B2;
}

:root[data-theme="dark"] .summary-value {
  color: #22D3EE;
}

.time-range-selector {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  justify-content: flex-end;
}

.time-range-btn {
  padding: 3px 10px;
  font-size: 11px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 12px;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.4;
}

.time-range-btn:hover {
  color: #0891B2;
  border-color: rgba(6, 182, 212, 0.4);
}

.time-range-btn.active {
  background: rgba(6, 182, 212, 0.15);
  border-color: #06B6D4;
  color: #0891B2;
  font-weight: 600;
}

:root[data-theme="dark"] .time-range-btn {
  border-color: rgba(34, 211, 238, 0.15);
  color: #7DD3FC;
}

:root[data-theme="dark"] .time-range-btn:hover {
  color: #22D3EE;
  border-color: rgba(34, 211, 238, 0.3);
}

:root[data-theme="dark"] .time-range-btn.active {
  background: rgba(34, 211, 238, 0.15);
  border-color: #22D3EE;
  color: #22D3EE;
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
  background: rgba(6, 182, 212, 0.04);
  border-radius: 14px;
  border: 1px dashed rgba(6, 182, 212, 0.2);
}

:root[data-theme="dark"] .chart-empty {
  background: rgba(6, 182, 212, 0.06);
  border-color: rgba(34, 211, 238, 0.15);
  color: #7DD3FC;
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
