<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  stats: {
    type: Object,
    default: null
  }
});

const hoveredIndex = ref(-1);

function onBarEnter(index) {
  hoveredIndex.value = index;
}

function onBarLeave() {
  hoveredIndex.value = -1;
}

const chartData = computed(() => {
  if (!props.stats?.dailyStats?.length) return null;

  const data = props.stats.dailyStats;

  const width = 460;
  const height = 200;
  const marginLeft = 40;
  const marginRight = 16;
  const marginTop = 20;
  const marginBottom = 36;
  const chartW = width - marginLeft - marginRight;
  const chartH = height - marginTop - marginBottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const maxAmount = Math.max(...data.map(d => d.totalAmount || 0), 1);
  const hasAmount = maxAmount > 0;

  const groupW = chartW / data.length;
  const gap = Math.max(1, groupW * 0.15);
  const bw = hasAmount ? (groupW - gap) / 2 : groupW * 0.6;

  const bars = data.map((d, i) => {
    const centerX = marginLeft + (i + 0.5) * groupW;
    const countH = (d.count / maxCount) * chartH;
    const amountH = hasAmount ? ((d.totalAmount || 0) / maxAmount) * chartH : 0;

    const dateObj = new Date(d.date + 'T00:00:00');
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const label = `${month}/${day}`;
    const showLabel = i === 0 || i === data.length - 1 || data.length <= 8 || i % Math.ceil(data.length / 6) === 0;

    return {
      centerX,
      countH,
      amountH,
      count: d.count,
      totalAmount: d.totalAmount,
      date: d.date,
      label,
      showLabel,
      countBarX: hasAmount ? centerX - bw - gap / 2 : centerX - bw / 2,
      amountBarX: centerX + gap / 2,
      bw
    };
  });

  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const val = Math.round((maxCount / (yTickCount - 1)) * i);
    const y = marginTop + chartH - (i / (yTickCount - 1)) * chartH;
    return { val, y };
  });

  return { bars, width, height, marginLeft, marginTop, chartH, yTicks, hasAmount };
});
</script>

<template>
  <div class="feeding-trend-chart">
    <div v-if="chartData" class="chart-wrapper">
      <div class="chart-header">
        <div class="chart-summary">
          <div class="summary-item">
            <span class="summary-label">总记录</span>
            <span class="summary-value">{{ stats.totalRecords }} 次</span>
          </div>
          <div class="summary-item" v-if="stats.avgDailyAmount">
            <span class="summary-label">日均食量</span>
            <span class="summary-value">{{ stats.avgDailyAmount }}g</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">活跃天数</span>
            <span class="summary-value">{{ stats.dailyStats.length }} 天</span>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot legend-count"></span>
            次数
          </span>
          <span class="legend-item" v-if="chartData.hasAmount">
            <span class="legend-dot legend-amount"></span>
            食量
          </span>
        </div>
      </div>
      <svg
        :viewBox="`0 0 ${chartData.width} ${chartData.height}`"
        class="trend-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Y-axis grid lines -->
        <line
          v-for="tick in chartData.yTicks"
          :key="tick.val"
          :x1="chartData.marginLeft"
          :y1="tick.y"
          :x2="chartData.width - 16"
          :y2="tick.y"
          stroke="currentColor"
          stroke-opacity="0.08"
          stroke-dasharray="4 4"
        />

        <!-- Y-axis labels -->
        <text
          v-for="tick in chartData.yTicks"
          :key="'l-' + tick.val"
          :x="chartData.marginLeft - 6"
          :y="tick.y + 4"
          text-anchor="end"
          fill="currentColor"
          fill-opacity="0.45"
          font-size="10"
        >{{ tick.val }}</text>

        <!-- Bars -->
        <g v-for="(bar, i) in chartData.bars" :key="i">
          <!-- Count bar (blue) -->
          <rect
            :x="bar.countBarX"
            :y="chartData.marginTop + chartData.chartH - bar.countH"
            :width="bar.bw"
            :height="bar.countH"
            :rx="2"
            :fill="hoveredIndex === i ? '#3B82F6' : '#93C5FD'"
            fill-opacity="0.85"
            style="cursor: pointer"
            @mouseenter="onBarEnter(i)"
            @mouseleave="onBarLeave"
          />
          <!-- Amount bar (orange) -->
          <rect
            v-if="chartData.hasAmount"
            :x="bar.amountBarX"
            :y="chartData.marginTop + chartData.chartH - bar.amountH"
            :width="bar.bw"
            :height="bar.amountH"
            :rx="2"
            :fill="hoveredIndex === i ? '#F59E0B' : '#FCD34D'"
            fill-opacity="0.85"
            style="cursor: pointer"
            @mouseenter="onBarEnter(i)"
            @mouseleave="onBarLeave"
          />

          <!-- Date labels -->
          <text
            v-if="bar.showLabel"
            :x="bar.centerX"
            :y="chartData.height - 8"
            text-anchor="middle"
            fill="currentColor"
            fill-opacity="0.4"
            font-size="9"
          >{{ bar.label }}</text>
        </g>

        <!-- Tooltip -->
        <g v-if="hoveredIndex >= 0 && hoveredIndex < chartData.bars.length">
          <rect
            :x="Math.max(2, Math.min(chartData.width - 110, chartData.bars[hoveredIndex].centerX - 54))"
            :y="Math.max(2, chartData.marginTop + chartData.chartH - Math.max(chartData.bars[hoveredIndex].countH, chartData.bars[hoveredIndex].amountH) - 52)"
            width="108"
            :height="chartData.bars[hoveredIndex].totalAmount ? 44 : 30"
            rx="6"
            ry="6"
            fill="#1E293B"
            fill-opacity="0.92"
          />
          <text
            :x="Math.max(56, Math.min(chartData.width - 56, chartData.bars[hoveredIndex].centerX))"
            :y="Math.max(18, chartData.marginTop + chartData.chartH - Math.max(chartData.bars[hoveredIndex].countH, chartData.bars[hoveredIndex].amountH) - 36)"
            text-anchor="middle"
            fill="white"
            font-size="10"
            font-weight="600"
          >{{ chartData.bars[hoveredIndex].count }} 次 · {{ chartData.bars[hoveredIndex].date }}</text>
          <text
            v-if="chartData.bars[hoveredIndex].totalAmount"
            :x="Math.max(56, Math.min(chartData.width - 56, chartData.bars[hoveredIndex].centerX))"
            :y="Math.max(28, chartData.marginTop + chartData.chartH - Math.max(chartData.bars[hoveredIndex].countH, chartData.bars[hoveredIndex].amountH) - 18)"
            text-anchor="middle"
            fill="#FCD34D"
            font-size="10"
          >食量 {{ chartData.bars[hoveredIndex].totalAmount }}g</text>
        </g>
      </svg>
    </div>
    <div v-else class="chart-empty">
      <span class="chart-empty-icon">📊</span>
      <span class="chart-empty-text">暂无喂养数据，添加喂养记录后将显示趋势图</span>
    </div>
  </div>
</template>

<style scoped>
.feeding-trend-chart {
  margin-bottom: 8px;
}

.chart-wrapper {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #FDE68A;
}

:global(.dark-mode) .chart-wrapper {
  background: linear-gradient(135deg, #292524 0%, #1C1917 100%);
  border-color: #44403C;
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
  color: #334155;
}

:global(.dark-mode) .summary-value {
  color: #E2E8F0;
}

.chart-legend {
  display: flex;
  gap: 12px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-count {
  background: #93C5FD;
}

.legend-amount {
  background: #FCD34D;
}

.trend-svg {
  width: 100%;
  height: auto;
  color: #334155;
}

:global(.dark-mode) .trend-svg {
  color: #CBD5E1;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #94A3B8;
  font-size: 13px;
}

.chart-empty-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
