<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  weightLogs: {
    type: Array,
    default: () => []
  }
});

const hoveredIndex = ref(-1);
const timeRange = ref('all');
const customStartDate = ref('');
const customEndDate = ref('');
const showCustomRange = ref(false);

const timeRangeOptions = [
  { label: '30天', value: '30d' },
  { label: '3个月', value: '3m' },
  { label: '全部', value: 'all' },
  { label: '自定义', value: 'custom' }
];

function onPointEnter(index) {
  hoveredIndex.value = index;
}

function onPointLeave() {
  hoveredIndex.value = -1;
}

function handleRangeChange(value) {
  timeRange.value = value;
  if (value === 'custom') {
    showCustomRange.value = true;
    if (!customStartDate.value && !customEndDate.value && props.weightLogs?.length) {
      const sorted = [...props.weightLogs]
        .filter(l => l.logDate)
        .sort((a, b) => new Date(a.logDate) - new Date(b.logDate));
      if (sorted.length >= 2) {
        customStartDate.value = sorted[0].logDate.slice(0, 10);
        customEndDate.value = sorted[sorted.length - 1].logDate.slice(0, 10);
      }
    }
  } else {
    showCustomRange.value = false;
  }
}

watch(customStartDate, (val) => {
  if (val && customEndDate.value && val > customEndDate.value) {
    customEndDate.value = val;
  }
});

watch(customEndDate, (val) => {
  if (val && customStartDate.value && val < customStartDate.value) {
    customStartDate.value = val;
  }
});

const chartData = computed(() => {
  if (!props.weightLogs?.length) return null;

  let filtered = [...props.weightLogs].filter(l => l.logDate && l.weightKg != null);

  if (timeRange.value !== 'all') {
    const now = new Date();
    if (timeRange.value === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(l => new Date(l.logDate) >= cutoff);
    } else if (timeRange.value === '3m') {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 3);
      filtered = filtered.filter(l => new Date(l.logDate) >= cutoff);
    } else if (timeRange.value === 'custom') {
      if (customStartDate.value) {
        const start = new Date(customStartDate.value + 'T00:00:00');
        filtered = filtered.filter(l => new Date(l.logDate) >= start);
      }
      if (customEndDate.value) {
        const end = new Date(customEndDate.value + 'T23:59:59');
        filtered = filtered.filter(l => new Date(l.logDate) <= end);
      }
    }
  }

  const sorted = filtered.sort((a, b) => new Date(a.logDate) - new Date(b.logDate));

  if (sorted.length < 2) return null;

  const weights = sorted.map(l => parseFloat(l.weightKg));
  const dates = sorted.map(l => {
    const d = new Date(l.logDate);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = (maxW - minW) * 0.2 || 0.5;
  const yMin = Math.max(0, minW - padding);
  const yMax = maxW + padding;

  // Chart dimensions
  const width = 460;
  const height = 180;
  const marginLeft = 42;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 30;
  const chartW = width - marginLeft - marginRight;
  const chartH = height - marginTop - marginBottom;

  const fullDates = sorted.map(l => {
    const d = new Date(l.logDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const points = sorted.map((l, i) => {
    const x = marginLeft + (i / (sorted.length - 1)) * chartW;
    const y = marginTop + chartH - ((parseFloat(l.weightKg) - yMin) / (yMax - yMin)) * chartH;
    return { x, y, weight: l.weightKg, date: dates[i], fullDate: fullDates[i] };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = linePath +
    ` L ${points[points.length - 1].x} ${marginTop + chartH}` +
    ` L ${points[0].x} ${marginTop + chartH} Z`;

  // Y-axis ticks
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const val = yMin + (i / (yTickCount - 1)) * (yMax - yMin);
    const y = marginTop + chartH - (i / (yTickCount - 1)) * chartH;
    return { val: val.toFixed(1), y };
  });

  // Trend direction
  const trend = weights[weights.length - 1] - weights[0];
  const trendPercent = weights[0] > 0 ? ((trend / weights[0]) * 100).toFixed(1) : 0;

  return {
    points,
    linePath,
    areaPath,
    yTicks,
    width,
    height,
    marginLeft,
    marginTop,
    chartH,
    minW: minW.toFixed(1),
    maxW: maxW.toFixed(1),
    latest: weights[weights.length - 1].toFixed(1),
    trend,
    trendPercent,
    count: sorted.length
  };
});
</script>

<template>
  <div class="weight-trend-chart">
    <div v-if="chartData" class="chart-wrapper">
      <div class="chart-header">
        <div class="chart-summary">
        <div class="summary-item">
          <span class="summary-label">最新</span>
          <span class="summary-value">{{ chartData.latest }} kg</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">趋势</span>
          <span
            class="summary-value"
            :class="{
              'trend-up': chartData.trend > 0,
              'trend-down': chartData.trend < 0,
              'trend-stable': chartData.trend === 0
            }"
          >
            {{ chartData.trend > 0 ? '↑' : chartData.trend < 0 ? '↓' : '→' }}
            {{ Math.abs(chartData.trendPercent) }}%
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">记录</span>
          <span class="summary-value">{{ chartData.count }} 次</span>
        </div>
      </div>
        <div class="chart-range-selector">
          <button
            v-for="opt in timeRangeOptions"
            :key="opt.value"
            class="range-btn"
            :class="{ active: timeRange === opt.value }"
            @click="handleRangeChange(opt.value)"
          >{{ opt.label }}</button>
        </div>
      </div>
      <Transition name="custom-range-fade">
        <div v-if="showCustomRange" class="custom-date-range">
          <span class="custom-range-label">📅</span>
          <div class="custom-range-inputs">
            <input
              v-model="customStartDate"
              type="date"
              class="custom-date-input"
              :max="customEndDate || undefined"
            />
            <span class="custom-range-sep">至</span>
            <input
              v-model="customEndDate"
              type="date"
              class="custom-date-input"
              :min="customStartDate || undefined"
            />
          </div>
        </div>
      </Transition>
      <svg
        :viewBox="`0 0 ${chartData.width} ${chartData.height}`"
        class="trend-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7DD3FC" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#7DD3FC" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#7DD3FC" />
            <stop offset="100%" stop-color="#38BDF8" />
          </linearGradient>
        </defs>

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

        <!-- Area fill -->
        <path :d="chartData.areaPath" fill="url(#areaGradient)" />

        <!-- Line -->
        <path
          :d="chartData.linePath"
          fill="none"
          stroke="url(#lineGradient)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Vertical guide line on hover -->
        <line
          v-if="hoveredIndex >= 0 && hoveredIndex < chartData.points.length"
          :x1="chartData.points[hoveredIndex].x"
          :y1="chartData.marginTop"
          :x2="chartData.points[hoveredIndex].x"
          :y2="chartData.marginTop + chartData.chartH"
          stroke="#7DD3FC"
          stroke-opacity="0.5"
          stroke-width="1"
          stroke-dasharray="3 3"
        />

        <!-- Data points -->
        <g v-for="(p, i) in chartData.points" :key="i">
          <circle
            :cx="p.x"
            :cy="p.y"
            fill="white"
            stroke="#7DD3FC"
            :stroke-width="hoveredIndex === i ? 3 : 2"
            :r="hoveredIndex === i ? 5 : 4"
          />
          <!-- Hover hit area (invisible larger circle) -->
          <circle
            :cx="p.x"
            :cy="p.y"
            r="16"
            fill="transparent"
            style="cursor: pointer"
            @mouseenter="onPointEnter(i)"
            @mouseleave="onPointLeave"
          />
          <!-- Date labels (show every other or first/last) -->
          <text
            v-if="i === 0 || i === chartData.points.length - 1 || chartData.points.length <= 6 || i % 2 === 0"
            :x="p.x"
            :y="chartData.height - 6"
            text-anchor="middle"
            fill="currentColor"
            fill-opacity="0.4"
            font-size="9"
          >{{ p.date }}</text>
        </g>

        <!-- Tooltip -->
        <g
          v-if="hoveredIndex >= 0 && hoveredIndex < chartData.points.length"
          class="chart-tooltip"
        >
          <rect
            :x="Math.max(2, Math.min(chartData.width - 94, chartData.points[hoveredIndex].x - 46))"
            :y="Math.max(2, chartData.points[hoveredIndex].y - 36)"
            width="92"
            height="28"
            rx="6"
            ry="6"
            fill="#1E293B"
            fill-opacity="0.92"
          />
          <polygon
            :points="`${chartData.points[hoveredIndex].x - 5},${chartData.points[hoveredIndex].y - 8} ${chartData.points[hoveredIndex].x + 5},${chartData.points[hoveredIndex].y - 8} ${chartData.points[hoveredIndex].x},${chartData.points[hoveredIndex].y - 2}`"
            fill="#1E293B"
            fill-opacity="0.92"
          />
          <text
            :x="Math.max(48, Math.min(chartData.width - 48, chartData.points[hoveredIndex].x))"
            :y="Math.max(20, chartData.points[hoveredIndex].y - 22)"
            text-anchor="middle"
            fill="white"
            font-size="10"
            font-weight="600"
          >{{ chartData.points[hoveredIndex].weight }} kg</text>
          <text
            :x="Math.max(48, Math.min(chartData.width - 48, chartData.points[hoveredIndex].x))"
            :y="Math.max(30, chartData.points[hoveredIndex].y - 12)"
            text-anchor="middle"
            fill="#94A3B8"
            font-size="9"
          >{{ chartData.points[hoveredIndex].fullDate }}</text>
        </g>
      </svg>
    </div>
    <div v-else class="chart-empty">
      <span class="chart-empty-icon">📊</span>
      <span class="chart-empty-text" v-if="timeRange === 'custom' && props.weightLogs?.length >= 2">该日期范围内记录不足 2 次</span>
      <span class="chart-empty-text" v-else-if="timeRange !== 'all' && props.weightLogs?.length >= 2">该时间段内记录不足 2 次</span>
      <span class="chart-empty-text" v-else>记录 2 次以上体重后将显示趋势图</span>
    </div>
  </div>
</template>

<style scoped>
.weight-trend-chart {
  margin-bottom: 8px;
}

.chart-wrapper {
  background: linear-gradient(135deg, #F0F9FF 0%, #F5F3FF 100%);
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #E0F2FE;
}

:global(.dark-mode) .chart-wrapper {
  background: linear-gradient(135deg, #1E293B 0%, #1E1B4B 100%);
  border-color: #334155;
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

.trend-up {
  color: #EF4444;
}

.trend-down {
  color: #22C55E;
}

.trend-stable {
  color: #94A3B8;
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

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-range-selector {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 3px;
  flex-shrink: 0;
}

:global(.dark-mode) .chart-range-selector {
  background: rgba(255, 255, 255, 0.08);
}

.range-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.range-btn:hover {
  color: #334155;
}

.range-btn.active {
  background: white;
  color: #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

:global(.dark-mode) .range-btn {
  color: #94A3B8;
}

:global(.dark-mode) .range-btn:hover {
  color: #E2E8F0;
}

:global(.dark-mode) .range-btn.active {
  background: #334155;
  color: #E2E8F0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.custom-date-range {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 6px;
  padding: 10px 14px;
  background: rgba(125, 211, 252, 0.06);
  border: 1px solid rgba(125, 211, 252, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

:global(.dark-mode) .custom-date-range {
  background: rgba(125, 211, 252, 0.05);
  border-color: rgba(125, 211, 252, 0.1);
}

.custom-range-label {
  font-size: 16px;
  flex-shrink: 0;
}

.custom-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.custom-date-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid rgba(125, 211, 252, 0.25);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  color: #334155;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  min-width: 0;
}

.custom-date-input:focus {
  border-color: #7DD3FC;
  box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.custom-date-input:hover {
  border-color: rgba(125, 211, 252, 0.4);
}

:global(.dark-mode) .custom-date-input {
  background: rgba(30, 41, 59, 0.8);
  color: #E2E8F0;
  border-color: rgba(125, 211, 252, 0.15);
}

:global(.dark-mode) .custom-date-input:focus {
  background: rgba(30, 41, 59, 0.95);
  border-color: #7DD3FC;
  box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.1);
}

.custom-range-sep {
  color: #94A3B8;
  font-size: 12px;
  flex-shrink: 0;
}

:global(.dark-mode) .custom-range-sep {
  color: #64748B;
}

.custom-range-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.custom-range-fade-leave-active {
  transition: all 0.18s ease;
}

.custom-range-fade-enter-from,
.custom-range-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
