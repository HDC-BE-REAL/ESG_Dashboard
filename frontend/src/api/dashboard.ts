import { CompanyConfig, IntensityType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface DashboardData {
    companies: CompanyConfig[];
    benchmarks: {
        revenue: { top10: number; median: number };
        production: { top10: number; median: number };
    };
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
    try {
        const [companiesRes, benchmarksRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/v1/dashboard/companies`),
            fetch(`${API_BASE_URL}/api/v1/dashboard/benchmarks`)
        ]);

        if (!companiesRes.ok || !benchmarksRes.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const companies = await companiesRes.json();
        const benchmarks = await benchmarksRes.json();

        return { companies, benchmarks };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
};
