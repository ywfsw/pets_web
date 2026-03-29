// 宠物管理系统 - 温馨可爱主题配置
import { computed } from 'vue';

export const petTheme = {
  // 主色调 - 温馨奶油色系
  primaryColor: '#FF9BA8',        // 柔和粉
  primaryColorHover: '#FF7A8A',   // 悬停粉
  primaryColorPressed: '#FF5A6A', // 按压粉
  primaryColorSuppl: '#FFBFC5',   // 补充色

  // 辅助色
  infoColor: '#7DD3FC',           // 天空蓝
  successColor: '#86EFAC',        // 薄荷绿
  warningColor: '#FCD34D',        // 暖黄
  errorColor: '#FCA5A5',          // 珊瑚红

  // 背景色
  bodyColor: '#FFF9F5',           // 奶油白
  cardColor: '#FFFFFF',           // 纯白卡片
  modalColor: '#FFFFFF',          // 弹窗白

  // 文字色
  textColorBase: '#4A4A4A',       // 深灰
  textColor1: '#2D2D2D',          // 主文字
  textColor2: '#6B6B6B',          // 次文字
  textColor3: '#9CA3AF',          // 辅助文字

  // 边框色
  borderColor: '#F0E6E0',         // 柔和边框
  dividerColor: '#F5EDE8',        // 分割线

  // 圆角
  borderRadius: '16px',           // 大圆角
  borderRadiusSmall: '8px',       // 小圆角

  // 阴影
  boxShadow: '0 4px 20px rgba(255, 155, 168, 0.15)',
  boxShadowHover: '0 8px 30px rgba(255, 155, 168, 0.25)',

  // 字体
  fontFamily: '"Nunito", "PingFang SC", "Microsoft YaHei", sans-serif',
};

// 渐变按钮样式
export const gradientButtonStyle = `
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%);
  border: none;
  border-radius: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.3);
`;

export const gradientButtonHoverStyle = `
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4);
`;

// 卡片样式
export const cardStyle = `
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid #F0E6E0;
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.1);
  transition: all 0.3s ease;
`;

export const cardHoverStyle = `
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(255, 155, 168, 0.2);
`;

// 宠物头像圆角
export const avatarStyle = `
  border-radius: 50%;
  border: 3px solid #FFE4E9;
  box-shadow: 0 2px 10px rgba(255, 155, 168, 0.2);
`;

// 点赞按钮样式
export const likeButtonStyle = `
  color: #FF6B8A;
  background: #FFF0F3;
  border-radius: 20px;
  padding: 4px 12px;
  transition: all 0.3s ease;
`;

export const likeButtonHoverStyle = `
  background: #FF6B8A;
  color: white;
  transform: scale(1.05);
`;

// 输入框样式
export const inputStyle = `
  border-radius: 12px;
  border: 2px solid #F0E6E0;
  transition: all 0.3s ease;
`;

export const inputFocusStyle = `
  border-color: #FF9BA8;
  box-shadow: 0 0 0 3px rgba(255, 155, 168, 0.1);
`;

// 标签样式
export const tagStyle = `
  border-radius: 12px;
  padding: 2px 10px;
  font-weight: 500;
`;

// 背景装饰
export const backgroundDecorations = `
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255, 155, 168, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(125, 211, 252, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(134, 239, 172, 0.08) 0%, transparent 40%);
`;
