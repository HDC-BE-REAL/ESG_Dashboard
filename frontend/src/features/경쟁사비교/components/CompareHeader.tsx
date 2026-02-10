import React, { memo } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const CompareHeader = memo(() => {
    return (
        <div className="flex flex-col gap-4 mb-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">업계 벤치마킹 분석</h2>
                    <p className="text-slate-500 text-sm mt-1">경쟁사 비교</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download size={16} /> 리포트 내보내기
                </Button>
            </div>
        </div>
    );
});

CompareHeader.displayName = 'CompareHeader';
