/**
 * 공통 애니메이션 클래스 및 설정
 * 모든 탭 컴포넌트에서 재사용 가능한 애니메이션 정의
 */

// Tailwind 애니메이션 클래스 조합
export const animations = {
    // 페이드 효과
    fadeIn: "animate-in fade-in duration-500",
    fadeOut: "animate-out fade-out duration-300",

    // 슬라이드 효과
    slideInFromBottom: "animate-in slide-in-from-bottom-2 duration-300",
    slideInFromTop: "animate-in slide-in-from-top-2 duration-300",
    slideInFromLeft: "animate-in slide-in-from-left-2 duration-300",
    slideInFromRight: "animate-in slide-in-from-right-2 duration-300",

    // 스케일 효과
    scaleIn: "animate-in zoom-in-95 duration-300",
    scaleOut: "animate-out zoom-out-95 duration-200",
} as const;

// 트랜지션 클래스
export const transitions = {
    // 기본 트랜지션
    default: "transition-all duration-300",
    fast: "transition-all duration-150",
    slow: "transition-all duration-500",

    // 특정 속성 트랜지션
    colors: "transition-colors duration-300",
    opacity: "transition-opacity duration-300",
    transform: "transition-transform duration-300",
    shadow: "transition-shadow duration-300",
} as const;

// 호버 효과
export const hoverEffects = {
    // 카드 호버
    cardLift: "hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
    cardGlow: "hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300",

    // 버튼 호버
    buttonScale: "hover:scale-105 active:scale-95 transition-transform duration-200",
    buttonBrightness: "hover:brightness-110 transition-all duration-200",

    // 텍스트 호버
    textColor: "hover:text-emerald-600 transition-colors duration-200",
    textUnderline: "hover:underline decoration-2 underline-offset-4 transition-all duration-200",
} as const;

// 그룹 호버 효과 (부모 hover 시 자식 애니메이션)
export const groupHoverEffects = {
    scale: "group-hover:scale-110 transition-transform duration-300",
    rotate: "group-hover:rotate-6 transition-transform duration-300",
    opacity: "group-hover:opacity-100 transition-opacity duration-300",
    brightness: "group-hover:brightness-110 transition-all duration-300",
} as const;

// 애니메이션 딜레이 헬퍼
export const getAnimationDelay = (index: number, baseDelay: number = 50): string => {
    return `animation-delay-${index * baseDelay}`;
};

// 스태거 애니메이션을 위한 인라인 스타일 생성
export const getStaggerStyle = (index: number, baseDelay: number = 100) => ({
    animationDelay: `${index * baseDelay}ms`,
});

// 조건부 애니메이션 클래스 헬퍼
export const conditionalAnimation = (
    condition: boolean,
    trueAnimation: string,
    falseAnimation: string = ""
): string => {
    return condition ? trueAnimation : falseAnimation;
};
