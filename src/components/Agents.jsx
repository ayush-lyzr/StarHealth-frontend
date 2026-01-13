import { useState, useMemo } from 'react';
import { useAgentsData } from '../contexts/AgentsDataContext';
import { useTheme } from '../contexts/ThemeContext';
import BarChartApex from './charts/BarChartApex';
import StarLoader from './ui/StarLoader';

const Agents = () => {
  const { isDark } = useTheme();
  const { agentsData, loading, error, refreshData } = useAgentsData();
  const [selectedTab, setSelectedTab] = useState('Traces');
  const [selectedAgentCode, setSelectedAgentCode] = useState('all');

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    return d.toLocaleDateString();
  };

  const timeSeries = useMemo(() => {
    const days = [];
    const productData = [];
    const salesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // 🔒 FIX: Use local date format (YYYY-MM-DD) instead of UTC
      // This aligns with backend's IST timezone handling
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      days.push(dateStr);
      productData.push(agentsData.timeSeries.product?.[dateStr] || 0);
      salesData.push(agentsData.timeSeries.sales?.[dateStr] || 0);
    }
    return { days, productData, salesData };
  }, [agentsData.timeSeries]);

  const agentDirectory = agentsData.agentDirectory || [];
  const agentCodes = useMemo(() => {
    const codesFromDir = agentDirectory.map((a) => a.agentCode).filter(Boolean);
    const codesFromTraces = Array.from(new Set((agentsData.traces || []).map((t) => t.agentCode).filter(Boolean)));
    return Array.from(new Set([...codesFromDir, ...codesFromTraces])).sort();
  }, [agentDirectory, agentsData.traces]);

  const filteredTraces = useMemo(() => {
    if (selectedAgentCode === 'all') return agentsData.traces;
    return (agentsData.traces || []).filter((trace) => trace.agentCode === selectedAgentCode);
  }, [agentsData.traces, selectedAgentCode]);

  const filteredMetrics = useMemo(() => {
    const tracesToProcess = (selectedAgentCode === 'all' ? agentsData.traces : filteredTraces) || [];
    const productTraces = tracesToProcess.filter(t => t.agentType === 'product_recommendation');
    const salesTraces = tracesToProcess.filter(t => t.agentType === 'sales_pitch');
    // Sum up llmCalls from each trace to match what's displayed in the table
    const productLlmCalls = productTraces.reduce((sum, t) => sum + (t.llmCalls || 0), 0);
    const salesLlmCalls = salesTraces.reduce((sum, t) => sum + (t.llmCalls || 0), 0);
    const productTokens = productTraces.reduce((sum, t) => sum + (t.totalTokens || 0), 0);
    const salesTokens = salesTraces.reduce((sum, t) => sum + (t.totalTokens || 0), 0);
    return {
      productRuns: productTraces.length,
      salesRuns: salesTraces.length,
      productLlmCalls,
      salesLlmCalls,
      productTokens,
      salesTokens,
    };
  }, [agentsData.traces, selectedAgentCode, filteredTraces]);

  const llmDonutData = [filteredMetrics.productLlmCalls, filteredMetrics.salesLlmCalls];
  const tokenDonutData = [filteredMetrics.productTokens, filteredMetrics.salesTokens];


  if (loading && agentsData.agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <StarLoader size="large" text="Loading agents..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Agents</h2>
          <p className="text-gray-600">{error.message}</p>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] p-6 transition-colors duration-200 w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#333333] dark:text-[#f8fafc] mb-2">Agent Traces</h1>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                Last updated: {formatDate(new Date())}
                <span className="ml-2 inline-flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                  Live
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Traces Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedTab('Traces')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'Traces'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-[#374151]'
                  }`}
              >
                Traces
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                  Agent Code
                </label>
                <select
                  value={selectedAgentCode}
                  onChange={(e) => setSelectedAgentCode(e.target.value)}
                  className="px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-lg text-xs font-medium text-[#333333] dark:text-[#f8fafc]"
                >
                  <option value="all">All Agents</option>
                  {agentCodes.map((code) => {
                    const entry = agentDirectory.find((a) => a.agentCode === code)
                    const label = entry && entry.agentName
                      ? `${code} - ${entry.agentName}`
                      : code
                    return (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
              <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                {filteredTraces.length} {filteredTraces.length === 1 ? 'trace' : 'traces'}
              </span>
            </div>
          </div>

          {selectedTab === 'Traces' && (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#374151]">
                <thead className="bg-gray-50 dark:bg-[#111827]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                      AGENT CODE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                      AGENT NAME
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                      TYPE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                      LLM CALLS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
                      TOTAL TOKENS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#374151]">
                      TIMESTAMP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#FFFFFF] dark:bg-[#1F2937] divide-y divide-gray-200 dark:divide-[#374151]">
                  {filteredTraces.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">No traces found</p>
                        <p className="text-[#9CA3AF] dark:text-[#6B7280] text-sm mt-1">Traces will appear here as agents process requests</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTraces.map((trace, idx) => {
                      const typeLabel =
                        trace.agentType === 'product_recommendation'
                          ? 'Product Recommendation'
                          : trace.agentType === 'sales_pitch'
                            ? 'Sales Pitch'
                            : 'Unknown'
                      const isProduct = typeLabel === 'Product Recommendation'

                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                              {trace.agentCode || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-[#333333] dark:text-[#FFFFFF]">
                              {trace.agentName || 'Agent'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isProduct
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}
                            >
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                              {trace.llmCalls}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                              {trace.totalTokens || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                              {formatDate(trace.timestamp)}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        <div className="mb-8"></div>

        {/* Metrics Row - LLM Calls, Tokens Used */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LLM Calls */}
          <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#333333] dark:text-[#f8fafc]">LLM Calls</h3>
            </div>
            <div className="mb-4">
              <BarChartApex
                data={llmDonutData}
                labels={['Product Agent', 'Sales Agent']}
                colors={['#3B82F6', '#F97316']}
                height={180}
                isDark={isDark}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#3B82F6] rounded mr-2"></div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Product Agent</span>
                <span className="ml-2 font-semibold text-[#333333] dark:text-[#f8fafc]">
                  {filteredMetrics.productLlmCalls}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#F97316] rounded mr-2"></div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Sales Agent</span>
                <span className="ml-2 font-semibold text-[#333333] dark:text-[#f8fafc]">
                  {filteredMetrics.salesLlmCalls}
                </span>
              </div>
            </div>
          </div>

          {/* Tokens Used */}
          <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#333333] dark:text-[#f8fafc]">Tokens Used</h3>
            </div>
            <div className="mb-4">
              <BarChartApex
                data={tokenDonutData}
                labels={['Product Agent', 'Sales Agent']}
                colors={['#3B82F6', '#F97316']}
                height={180}
                isDark={isDark}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#3B82F6] rounded mr-2"></div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Product Agent</span>
                <span className="ml-2 font-semibold text-[#333333] dark:text-[#f8fafc]">
                  ~{Math.round(filteredMetrics.productTokens / 1000)}k
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#F97316] rounded mr-2">
                </div>
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Sales Agent</span>
                <span className="ml-2 font-semibold text-[#333333] dark:text-[#f8fafc]">
                  ~{Math.round(filteredMetrics.salesTokens / 1000)}k
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Agents;