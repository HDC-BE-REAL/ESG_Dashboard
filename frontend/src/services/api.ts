import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const MarketService = {
    /**
     * AI ?? (????)
     */
    async chatStream(
        params: {
            message: string;
            history?: Array<{ role: string; text: string }>;
            companyName?: string;
            companyKey?: string;
            reportScope?: string;
            reportYear?: number | null;
        },
        onChunk: (chunk: string) => void
    ) {
        const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.body) {
            throw new Error('ReadableStream not supported');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk);
        }
    }
};

