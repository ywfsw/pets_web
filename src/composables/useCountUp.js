import { ref, watch } from 'vue'

/**
 * 数字滚动动画 composable
 * @param {import('vue').Ref<number>} source - 目标数字的响应式源
 * @param {Object} options - 配置项
 * @param {number} options.duration - 动画时长(ms)，默认 1200
 * @param {number} options.delay - 延迟启动(ms)，默认 0
 * @returns {{ displayValue: import('vue').Ref<number> }}
 */
export function useCountUp(source, options = {}) {
  const { duration = 1200, delay = 0 } = options
  const displayValue = ref(0)
  let animFrameId = null

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

  const animate = (from, to) => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    if (to === 0) {
      displayValue.value = 0
      return
    }
    const start = performance.now()
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      displayValue.value = Math.round(from + (to - from) * easeOutExpo(progress))
      if (progress < 1) {
        animFrameId = requestAnimationFrame(step)
      } else {
        displayValue.value = to
        animFrameId = null
      }
    }
    animFrameId = requestAnimationFrame(step)
  }

  watch(source, (newVal) => {
    if (newVal == null) return
    if (delay > 0) {
      setTimeout(() => animate(0, newVal), delay)
    } else {
      animate(0, newVal)
    }
  }, { immediate: true })

  return { displayValue }
}
