import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/axiosConfig';
import { getDashboardWebSocket } from '../utils/websocket';

const AgentsDataContext = createContext();

export const useAgentsData = () => {
    return useContext(AgentsDataContext);
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // Start with 1 second
    maxRetryDelay: 10000, // Max 10 seconds
    timeout: 30000, // 30 seconds per request
};

// Request deduplication
const pendingRequests = new Map();

const fetchWithRetry = async (url, config = {}, retryCount = 0) => {
    const requestKey = `${url}-${JSON.stringify(config)}`;

    // Check if request is already pending
    if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey);
    }

    const requestPromise = (async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeout);

            const response = await apiClient.get(url, {
                ...config,
                signal: controller.signal,
                timeout: RETRY_CONFIG.timeout,
            });

            clearTimeout(timeoutId);
            pendingRequests.delete(requestKey);
            return response;
        } catch (error) {
            pendingRequests.delete(requestKey);

            // Don't retry on abort (timeout) or 4xx errors
            if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
                if (retryCount < RETRY_CONFIG.maxRetries) {
                    const delay = Math.min(
                        RETRY_CONFIG.retryDelay * Math.pow(2, retryCount),
                        RETRY_CONFIG.maxRetryDelay
                    );
                    // console.log(`⏱️ Request timeout, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return fetchWithRetry(url, config, retryCount + 1);
                }
                throw new Error('Request timeout: Unable to fetch agents data after multiple retries');
            }

            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw error; // Don't retry client errors
            }

            // Retry on network errors or 5xx errors
            if (retryCount < RETRY_CONFIG.maxRetries) {
                const delay = Math.min(
                    RETRY_CONFIG.retryDelay * Math.pow(2, retryCount),
                    RETRY_CONFIG.maxRetryDelay
                );
                // console.log(`🔄 Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}):`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(url, config, retryCount + 1);
            }

            throw error;
        }
    })();

    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
};

export const AgentsDataProvider = ({ children }) => {
    const [agentsData, setAgentsData] = useState({
        agents: [],
        metrics: { totalRuns: 0, totalErrors: 0 },
        issues: [],
        traces: [],
        agentDirectory: [],
        timeSeries: { product: {}, sales: {} },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);

    const fetchAgentsData = useCallback(async (silent = false) => {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (!silent) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await fetchWithRetry('/agents/stats', {
                signal: abortControllerRef.current.signal,
            });

            if (!isMountedRef.current) return;

            if (response.data) {
                setAgentsData({
                    agents: response.data.agents || [],
                    metrics: response.data.metrics || { totalRuns: 0, totalErrors: 0 },
                    issues: response.data.issues || [],
                    traces: response.data.traces || [],
                    agentDirectory: response.data.agentDirectory || [],
                    timeSeries: response.data.timeSeries || { product: {}, sales: {} },
                });

                // 🔒 PERSISTENCE: Save to LocalStorage
                localStorage.setItem('agents_stats_cache', JSON.stringify({
                    data: response.data,
                    timestamp: new Date().getTime()
                }));
            }
        } catch (err) {
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                // Request was cancelled, don't update state
                return;
            }

            if (!isMountedRef.current) return;

            if (!silent) {
                setError(err);
            }
            console.error('Error fetching agents data:', err.message);

            // Only reset to defaults if we have no previous data
            if (agentsData.agents.length === 0) {
                setAgentsData({
                    agents: [],
                    metrics: { totalRuns: 0, totalErrors: 0 },
                    issues: [],
                    traces: [],
                    agentDirectory: [],
                    timeSeries: { product: {}, sales: {} },
                });
            }
        } finally {
            if (!silent && isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [agentsData.agents.length]);

    useEffect(() => {
        isMountedRef.current = true;

        // 🔒 PERSISTENCE: Try to load from localStorage first
        const cached = localStorage.getItem('agents_stats_cache');
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 86400000) {
                    console.log('✅ Loaded agents stats from localStorage');
                    setAgentsData({
                        agents: data.agents || [],
                        metrics: data.metrics || { totalRuns: 0, totalErrors: 0 },
                        issues: data.issues || [],
                        traces: data.traces || [],
                        agentDirectory: data.agentDirectory || [],
                        timeSeries: data.timeSeries || { product: {}, sales: {} },
                    });
                    setLoading(false);
                }
            } catch (e) {
                console.warn('Failed to parse agents cache');
            }
        }

        fetchAgentsData();

        // Listen for WebSocket events - throttled refresh
        const ws = getDashboardWebSocket();
        let lastRefresh = 0;
        const THROTTLE_MS = 2000; // 2 seconds throttle (was 60s) for better real-time feel

        const handleRefresh = (data) => {
            const now = Date.now();
            if (isMountedRef.current && (now - lastRefresh > THROTTLE_MS)) {
                console.log('🔄 Throttled agents refresh (WS)');
                fetchAgentsData(true);
                lastRefresh = now;
            }
        };

        ws.on('dashboard:refresh', handleRefresh);
        ws.on('dashboard:event', handleRefresh);
        ws.on('dashboard:activity_update', handleRefresh); // ENABLED: Real-time traces
        ws.on('agents:refresh', handleRefresh);

        // Polling fallback (60s)
        const pollInterval = setInterval(() => {
            if (isMountedRef.current) {
                fetchAgentsData(true);
            }
        }, 60000);

        return () => {
            isMountedRef.current = false;
            clearInterval(pollInterval);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            ws.off('dashboard:refresh', handleRefresh);
            ws.off('dashboard:event', handleRefresh);
            ws.off('agents:refresh', handleRefresh);
        };
    }, [fetchAgentsData]);

    const value = {
        agentsData,
        loading,
        error,
        refreshData: () => fetchAgentsData(false),
    };

    return (
        <AgentsDataContext.Provider value={value}>
            {children}
        </AgentsDataContext.Provider>
    );
};
