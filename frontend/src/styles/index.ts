/**
 * 스타일 시스템 통합 export
 * 모든 공통 스타일 유틸리티를 한 곳에서 import 가능
 */

export * from './animations';
export * from './variants';

// 유틸리티 함수: 여러 클래스를 조건부로 결합
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
    return classes.filter(Boolean).join(' ');
};

// 유틸리티 함수: variant와 추가 클래스 결합
export const withVariant = (
    variant: string,
    additionalClasses: string = ""
): string => {
    return cn(variant, additionalClasses);
};
