import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import BarChartApex from './charts/BarChartApex';
import StarLoader from './ui/StarLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProductTraces = () => {
  const { isDark } = useTheme();
  const [selectedTab, setSelectedTab] = useState('Stats');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProductName, setNewProductName] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'productRecommendationCount', direction: 'desc' });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    // Local duplicate check before even calling API
    const isDuplicate = products.some(p => p.productName.toLowerCase() === newProductName.trim().toLowerCase());
    if (isDuplicate) {
      alert(`Product "${newProductName}" already exists!`);
      return;
    }

    try {
      setAddingProduct(true);
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: newProductName.trim() })
      });

      if (!response.ok) throw new Error('Failed to add product');

      const data = await response.json();
      if (data.success && data.product) {
        if (data.product.already_exists) {
          alert(`Product "${newProductName}" already exists in the database!`);
          fetchProducts(); // Refresh to ensure we have the latest
        } else {
          setProducts([data.product, ...products]);
        }
        setNewProductName('');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This will also remove all its trace history.')) return;

    try {
      setDeletingProductId(productId);
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    } finally {
      setDeletingProductId(null);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    let filteredData = products;
    if (selectedProductId !== 'all') {
      filteredData = products.filter(p => p._id === selectedProductId);
    }

    const totalRec = filteredData.reduce((sum, p) => sum + (p.productRecommendationCount || 0), 0);
    const totalSales = filteredData.reduce((sum, p) => sum + (p.salesPitchCount || 0), 0);
    return {
      totalProducts: filteredData.length,
      productRecommendationTotal: totalRec,
      salesPitchTotal: totalSales,
      chartData: [totalRec, totalSales]
    };
  }, [products, selectedProductId]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = useMemo(() => {
    let items = selectedProductId === 'all'
      ? [...products]
      : products.filter(p => p._id === selectedProductId);

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key] || 0;
        const bValue = b[sortConfig.key] || 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [products, selectedProductId, sortConfig]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <StarLoader size="large" text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#111827] transition-colors duration-200 min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h2>
          <p className="text-gray-600">{error.message}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] p-6 transition-colors duration-200 w-full min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-[#f8fafc] mb-2">Product Traces</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
            Track product mentions across agent conversations
          </p>
        </div>

        {/* Tab Buttons & Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTab('Stats')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'Stats'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-[#374151]'
                }`}
            >
              Stats
            </button>
            <button
              onClick={() => setSelectedTab('Add Products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === 'Add Products'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-[#374151]'
                }`}
            >
              Add Products
            </button>
          </div>

          {selectedTab === 'Stats' && (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider mb-1 px-1">
                  Filter by Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-[#f8fafc] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-[#f8fafc] text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-64 p-2 transition-all"
                >
                  <option value="all">All Products</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Stats Tab */}
        {selectedTab === 'Stats' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Total Products</p>
                <p className="text-3xl font-bold text-[#333333] dark:text-[#f8fafc]">{stats.totalProducts}</p>
              </div>
              <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Product Recommendation Mentions</p>
                <p className="text-3xl font-bold text-blue-600">{stats.productRecommendationTotal}</p>
              </div>
              <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Sales Pitch Mentions</p>
                <p className="text-3xl font-bold text-orange-500">{stats.salesPitchTotal}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
                <h3 className="text-sm font-semibold text-[#333333] dark:text-[#f8fafc] mb-4">Product Mentions by Agent Type</h3>
                <BarChartApex
                  data={stats.chartData}
                  labels={['Product Recommendation', 'Sales Pitch']}
                  colors={['#3B82F6', '#F97316']}
                  height={200}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f8fafc] mb-4">All Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#374151]">
                  <thead className="bg-gray-50 dark:bg-[#111827]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">Product Name (English)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">Product Name (Tamil)</th>
                      <th
                        onClick={() => requestSort('productRecommendationCount')}
                        className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Rec Count
                          {sortConfig.key === 'productRecommendationCount' && (
                            <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => requestSort('salesPitchCount')}
                        className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Sales Count
                          {sortConfig.key === 'salesPitchCount' && (
                            <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFFFFF] dark:bg-[#1F2937] divide-y divide-gray-200 dark:divide-[#374151]">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-12 text-center">
                          <p className="text-[#6B7280] dark:text-[#9CA3AF]">No products found</p>
                        </td>
                      </tr>
                    ) : (
                      sortedProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors border-b border-gray-100 dark:border-[#374151] last:border-0">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF]">
                              {product.productName}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                              {product.productNameTamil || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                              {product.productRecommendationCount || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                              {product.salesPitchCount || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Add Products Tab */}
        {selectedTab === 'Add Products' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] p-6">
            <h3 className="text-lg font-semibold text-[#333333] dark:text-[#f8fafc] mb-4">Add New Product</h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-4">
              Enter the product name in English. Tamil translation will be generated automatically.
            </p>

            <form onSubmit={handleAddProduct} className="flex gap-4 mb-8">
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Enter product name (English)"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#111827] text-[#333333] dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={addingProduct || !newProductName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {addingProduct ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : 'Add Product'}
              </button>
            </form>

            {/* Existing Products List */}
            <h4 className="text-md font-semibold text-[#333333] dark:text-[#f8fafc] mb-4">Existing Products</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#374151]">
                <thead className="bg-gray-50 dark:bg-[#111827]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">Product Name (English)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">Product Name (Tamil)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[#FFFFFF] dark:bg-[#1F2937] divide-y divide-gray-200 dark:divide-[#374151]">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors border-b border-gray-100 dark:border-[#374151] last:border-0">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-[#333333] dark:text-[#FFFFFF]">
                          {product.productName}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                          {product.productNameTamil || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          disabled={deletingProductId === product._id}
                          className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {deletingProductId === product._id ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default ProductTraces;
