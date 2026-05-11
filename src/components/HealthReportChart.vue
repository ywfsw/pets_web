<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  report: { type: Object, required: true },
  loading: { type: Boolean, default: false }
});

const months = computed(() => {
  if (!props.report?.monthlyData) return [];
  return props.report.monthlyData.filter(m =>
    m.weightRecords > 0 || m.healthEventsTotal > 0 || m.feedingRecords > 0 ||
    m.bathingRecords > 0 || m.medicationRecords > 0
  );
});

const hasData = computed(() => months.value.length > 0);

// Weight chart dimensions
const chartW = 600;
const chartH = 220;
const padL = 50, padR = 20, padT = 20, padB = 40;
const plotW = chartW - padL - padR;
const plotH = chartH - padT - padB;

const weightData = computed(() => {
  return months.value
    .filter(m => m.weightLast != null)
    .map(m => ({ month: m.month, weight: Number(m.weightLast) }));
});

const weightRange = computed(() => {
  const vals = weightData.value.map(d => d.weight);
  if (!vals.length) return { min: 0, max: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.15 || 0.5;
  return { min: min - pad, max: max + pad };
});

const weightPoints = computed(() => {
  const data = weightData.value;
  if (data.length < 2) return [];
  const { min, max } = weightRange.value;
  const step = plotW / (data.length - 1);
  return data.map((d, i) => ({
    x: padL + i * step,
    y: padT + plotH - ((d.weight - min) / (max - min || 1)) * plotH,
    weight: d.weight,
    month: d.month
  }));
});

const weightPath = computed(() => {
  const pts = weightPoints.value;
  if (pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
});

const weightAreaPath = computed(() => {
  const pts = weightPoints.value;
  if (pts.length < 2) return '';
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${pts[pts.length - 1].x},${padT + plotH} L${pts[0].x},${padT + plotH} Z`;
});

const yTicks = computed(() => {
  const { min, max } = weightRange.value;
  const count = 4;
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const val = min + (max - min) * (i / count);
    ticks.push({
      value: val.toFixed(1),
      y: padT + plotH - (i / count) * plotH
    });
  }
  return ticks;
});

const hoveredPoint = ref(null);

function formatMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${y}年${parseInt(mo)}月`;
}

function shortMonth(m) {
  if (!m) return '';
  const [, mo] = m.split('-');
  return `${parseInt(mo)}月`;
}

// Activity bars
const maxActivity = computed(() => {
  let max = 1;
  for (const m of months.value) {
    const total = m.feedingRecords + m.bathingRecords + m.medicationRecords;
    if (total > max) max = total;
  }
  return max;
});

// Summary stats
const summaryStats = computed(() => {
  const data = months.value;
  if (!data.length) return null;
  const totalEvents = data.reduce((s, m) => s + m.healthEventsTotal, 0);
  const totalCompleted = data.reduce((s, m) => s + m.healthEventsCompleted, 0);
  const totalFeeding = data.reduce((s, m) => s + m.feedingRecords, 0);
  const totalBathing = data.reduce((s, m) => s + m.bathingRecords, 0);
  const totalMeds = data.reduce((s, m) => s + m.medicationRecords, 0);
  const withWeight = data.filter(m => m.weightLast != null);
  let weightChange = null;
  if (withWeight.length >= 2) {
    const first = Number(withWeight[0].weightFirst);
    const last = Number(withWeight[withWeight.length - 1].weightLast);
    weightChange = (last - first).toFixed(2);
  }
  return { totalEvents, totalCompleted, totalFeeding, totalBathing, totalMeds, weightChange, months: data.length };
});

// Event chart
const maxEvents = computed(() => {
  let max = 1;
  for (const m of months.value) {
    if (m.healthEventsTotal > max) max = m.healthEventsTotal;
  }
  return max;
});
</script>

<template>
  <div class="health-report">
    <!-- Loading skeleton -->
    <div v-if="loading" class="report-skeleton">
      <div class="skeleton-summary">
        <div v-for="i in 5" :key="i" class="skeleton-stat" />
      </div>
      <div class="skeleton-chart" />
    </div>

    <!-- No data -->
    <div v-else-if="!hasData" class="report-empty">
      <div class="empty-icon">📊</div>
      <p class="empty-title">暂无报告数据</p>
      <p class="empty-desc">当您为 {{ report?.petName || '宠物' }} 记录更多健康数据后，这里将展示月度健康趋势</p>
    </div>

    <!-- Report content -->
    <template v-else>
      <!-- Summary stats -->
      <div v-if="summaryStats" class="report-summary">
        <div class="summary-stat">
          <span class="summary-icon">📅</span>
          <span class="summary-value">{{ summaryStats.months }}</span>
          <span class="summary-label">统计月份</span>
        </div>
        <div class="summary-stat">
          <span class="summary-icon">🩺</span>
          <span class="summary-value">{{ summaryStats.totalEvents }}</span>
          <span class="summary-label">健康事件</span>
        </div>
        <div class="summary-stat">
          <span class="summary-icon">✅</span>
          <span class="summary-value">{{ summaryStats.totalCompleted }}</span>
          <span class="summary-label">已完成</span>
        </div>
        <div class="summary-stat">
          <span class="summary-icon">🍽️</span>
          <span class="summary-value">{{ summaryStats.totalFeeding }}</span>
          <span class="summary-label">喂养次数</span>
        </div>
        <div class="summary-stat" v-if="summaryStats.weightChange !== null">
          <span class="summary-icon">⚖️</span>
          <span class="summary-value" :class="{
            'trend-up': Number(summaryStats.weightChange) > 0,
            'trend-down': Number(summaryStats.weightChange) < 0
          }">
            {{ Number(summaryStats.weightChange) > 0 ? '+' : '' }}{{ summaryStats.weightChange }}kg
          </span>
          <span class="summary-label">体重变化</span>
        </div>
      </div>

      <!-- Weight trend chart -->
      <div v-if="weightPoints.length >= 2" class="chart-section">
        <h3 class="chart-title">⚖️ 体重趋势</h3>
        <div class="chart-wrapper">
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="weight-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Grid lines -->
            <line v-for="tick in yTicks" :key="tick.value"
              :x1="padL" :x2="chartW - padR" :y1="tick.y" :y2="tick.y"
              stroke="var(--chart-grid, rgba(0,0,0,0.06))" stroke-dasharray="4 4" />
            <!-- Y axis labels -->
            <text v-for="tick in yTicks" :key="'l-' + tick.value"
              :x="padL - 8" :y="tick.y + 4"
              text-anchor="end" class="axis-label">{{ tick.value }}</text>
            <!-- Area fill -->
            <path :d="weightAreaPath" fill="url(#weightGradient)" opacity="0.3" />
            <!-- Line -->
            <path :d="weightPath" fill="none" stroke="url(#weightLineGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <!-- Data points -->
            <g v-for="(p, i) in weightPoints" :key="i"
              @mouseenter="hoveredPoint = i" @mouseleave="hoveredPoint = null">
              <circle :cx="p.x" :cy="p.y" r="16" fill="transparent" class="point-hit" />
              <circle :cx="p.x" :cy="p.y"
                :r="hoveredPoint === i ? 6 : 4"
                :fill="hoveredPoint === i ? '#FF9BA8' : '#fff'"
                :stroke="hoveredPoint === i ? '#FF6B85' : 'url(#weightLineGrad)'"
                :stroke-width="hoveredPoint === i ? 3 : 2"
                class="point-dot" />
              <!-- X labels -->
              <text v-if="i % Math.max(1, Math.floor(weightPoints.length / 6)) === 0 || i === weightPoints.length - 1"
                :x="p.x" :y="chartH - 8"
                text-anchor="middle" class="axis-label">{{ shortMonth(p.month) }}</text>
            </g>
            <!-- Tooltip -->
            <g v-if="hoveredPoint !== null && weightPoints[hoveredPoint]">
              <line :x1="weightPoints[hoveredPoint].x" :x2="weightPoints[hoveredPoint].x"
                :y1="padT" :y2="padT + plotH"
                stroke="var(--chart-grid, rgba(0,0,0,0.1))" stroke-dasharray="3 3" />
              <rect :x="weightPoints[hoveredPoint].x - 45" :y="weightPoints[hoveredPoint].y - 38"
                width="90" height="28" rx="8" class="tooltip-bg" />
              <text :x="weightPoints[hoveredPoint].x" :y="weightPoints[hoveredPoint].y - 20"
                text-anchor="middle" class="tooltip-text">
                {{ weightPoints[hoveredPoint].weight }}kg · {{ shortMonth(weightPoints[hoveredPoint].month) }}
              </text>
            </g>
            <!-- Gradient defs -->
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FF9BA8" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#FF9BA8" stop-opacity="0.02" />
              </linearGradient>
              <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#FF9BA8" />
                <stop offset="100%" stop-color="#C084FC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- Monthly activity breakdown -->
      <div class="chart-section">
        <h3 class="chart-title">📋 月度活动明细</h3>
        <div class="activity-grid">
          <div v-for="m in months" :key="m.month" class="month-card">
            <div class="month-header">
              <span class="month-label">{{ formatMonth(m.month) }}</span>
              <span v-if="m.weightLast" class="month-weight">{{ m.weightLast }}kg</span>
            </div>
            <div class="month-bars">
              <div class="bar-row" v-if="m.healthEventsTotal > 0">
                <span class="bar-icon">🩺</span>
                <div class="bar-track">
                  <div class="bar-fill health" :style="{ width: (m.healthEventsTotal / maxEvents * 100) + '%' }" />
                </div>
                <span class="bar-val">{{ m.healthEventsCompleted }}/{{ m.healthEventsTotal }}</span>
              </div>
              <div class="bar-row" v-if="m.feedingRecords > 0">
                <span class="bar-icon">🍽️</span>
                <div class="bar-track">
                  <div class="bar-fill feeding" :style="{ width: (m.feedingRecords / maxActivity * 100) + '%' }" />
                </div>
                <span class="bar-val">{{ m.feedingRecords }}次</span>
              </div>
              <div class="bar-row" v-if="m.bathingRecords > 0">
                <span class="bar-icon">🛁</span>
                <div class="bar-track">
                  <div class="bar-fill bathing" :style="{ width: (m.bathingRecords / maxActivity * 100) + '%' }" />
                </div>
                <span class="bar-val">{{ m.bathingRecords }}次</span>
              </div>
              <div class="bar-row" v-if="m.medicationRecords > 0">
                <span class="bar-icon">💊</span>
                <div class="bar-track">
                  <div class="bar-fill medication" :style="{ width: (m.medicationRecords / maxActivity * 100) + '%' }" />
                </div>
                <span class="bar-val">{{ m.medicationRecords }}种</span>
              </div>
              <div v-if="!m.healthEventsTotal && !m.feedingRecords && !m.bathingRecords && !m.medicationRecords" class="bar-empty">
                本月无活动记录
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.health-report {
  padding: 4px 0;
}

/* Summary stats */
.report-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.summary-stat {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 155, 168, 0.1);
  transition: all 0.3s ease;
}

.summary-stat:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.12);
}

.summary-icon {
  font-size: 20px;
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--pet-text, #2D2D2D);
}

.summary-value.trend-up { color: #EF4444; }
.summary-value.trend-down { color: #10B981; }

.summary-label {
  font-size: 11px;
  color: var(--pet-text-tertiary, #9CA3AF);
  font-weight: 500;
}

/* Chart section */
.chart-section {
  margin-bottom: 24px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--pet-text, #2D2D2D);
  margin: 0 0 12px;
}

.chart-wrapper {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(255, 155, 168, 0.1);
  padding: 16px;
  overflow: hidden;
}

.weight-svg {
  width: 100%;
  height: auto;
  display: block;
}

.axis-label {
  font-size: 10px;
  fill: var(--pet-text-tertiary, #9CA3AF);
  font-weight: 500;
}

.point-dot {
  transition: all 0.2s ease;
  filter: drop-shadow(0 2px 4px rgba(255, 155, 168, 0.3));
}

.point-hit {
  cursor: pointer;
}

.tooltip-bg {
  fill: var(--pet-text, #2D2D2D);
  opacity: 0.92;
}

.tooltip-text {
  fill: #fff;
  font-size: 11px;
  font-weight: 600;
}

/* Activity grid */
.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.month-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  border: 1px solid rgba(255, 155, 168, 0.08);
  padding: 14px;
  transition: all 0.3s ease;
}

.month-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 155, 168, 0.1);
}

.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.month-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--pet-text, #2D2D2D);
}

.month-weight {
  font-size: 12px;
  font-weight: 600;
  color: #C084FC;
  background: rgba(192, 132, 252, 0.1);
  padding: 2px 8px;
  border-radius: 8px;
}

.month-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar-icon {
  font-size: 13px;
  width: 18px;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 6px;
  background: var(--pet-bg, #F3F4F6);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 4px;
}

.bar-fill.health { background: linear-gradient(90deg, #10B981, #34D399); }
.bar-fill.feeding { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.bar-fill.bathing { background: linear-gradient(90deg, #06B6D4, #22D3EE); }
.bar-fill.medication { background: linear-gradient(90deg, #8B5CF6, #A78BFA); }

.bar-val {
  font-size: 11px;
  font-weight: 600;
  color: var(--pet-text-secondary, #6B7280);
  min-width: 40px;
  text-align: right;
}

.bar-empty {
  font-size: 11px;
  color: var(--pet-text-tertiary, #9CA3AF);
  text-align: center;
  padding: 4px 0;
}

/* Empty state */
.report-empty {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: sparkleFloat 3s ease-in-out infinite;
}

@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--pet-text, #2D2D2D);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 13px;
  color: var(--pet-text-tertiary, #9CA3AF);
  margin: 0;
}

/* Skeleton */
.report-skeleton {
  padding: 16px 0;
}

.skeleton-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.skeleton-stat {
  flex: 1;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(90deg, var(--pet-bg, #F3F4F6) 25%, var(--pet-bg-secondary, #E5E7EB) 50%, var(--pet-bg, #F3F4F6) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-chart {
  height: 200px;
  border-radius: 16px;
  background: linear-gradient(90deg, var(--pet-bg, #F3F4F6) 25%, var(--pet-bg-secondary, #E5E7EB) 50%, var(--pet-bg, #F3F4F6) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Dark theme */
:root[data-theme="dark"] .summary-stat {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(255, 255, 255, 0.06);
}

:root[data-theme="dark"] .summary-value {
  color: #F3F4F6;
}

:root[data-theme="dark"] .chart-wrapper {
  background: rgba(30, 30, 40, 0.4);
  border-color: rgba(255, 255, 255, 0.06);
}

:root[data-theme="dark"] .month-card {
  background: rgba(30, 30, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
}

:root[data-theme="dark"] .month-label {
  color: #F3F4F6;
}

:root[data-theme="dark"] .bar-track {
  background: #2A2A3A;
}

:root[data-theme="dark"] .tooltip-bg {
  fill: #1E1E28;
  opacity: 0.95;
}

:root[data-theme="dark"] .skeleton-stat,
:root[data-theme="dark"] .skeleton-chart {
  background: linear-gradient(90deg, #1E1E28 25%, #2A2A3A 50%, #1E1E28 75%);
  background-size: 200% 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .report-summary {
    gap: 8px;
  }

  .summary-stat {
    min-width: 80px;
    padding: 12px 8px;
  }

  .summary-value {
    font-size: 18px;
  }

  .activity-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .report-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .summary-stat {
    padding: 10px 6px;
    min-width: 0;
  }

  .summary-value {
    font-size: 16px;
  }

  .summary-label {
    font-size: 10px;
  }
}
</style>
