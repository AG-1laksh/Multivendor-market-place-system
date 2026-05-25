import { Link } from 'react-router-dom';

const getBrand = (product) => {
  const explicitBrand = product.Brand || product.brand;
  if (explicitBrand) return explicitBrand;

  const name = String(product.Name || '').trim();
  return name ? name.split(' ')[0] : 'N/A';
};

const getCondition = (product) => {
  const explicitCondition = product.Condition || product.condition;
  if (explicitCondition) return explicitCondition;

  const description = String(product.Description || '').toLowerCase();
  if (description.includes('refurbished') || description.includes('used')) return 'Refurbished';
  return 'New';
};

const getRating = (product) => Number(product.Rating || product.Average_Rating || 4.5).toFixed(1);

const ProductComparePanel = ({ products = [], onRemove, onClear }) => {
  if (products.length < 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#121218]/95 p-4 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Compare Products ({products.length})</h3>
          <button
            onClick={onClear}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#d3d3d8] transition hover:border-[#FFC107]/55 hover:text-[#FFC107]"
          >
            Clear All
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] muted-text">Metric</th>
                {products.map((product) => (
                  <th key={product.Product_ID} className="min-w-48 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/products/${product.Product_ID}`} className="line-clamp-1 text-white hover:text-[#FFC107]">
                        {product.Name}
                      </Link>
                      <button
                        onClick={() => onRemove(product.Product_ID)}
                        className="text-xs text-rose-300 transition hover:text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2 muted-text">Price</td>
                {products.map((product) => (
                  <td key={`price-${product.Product_ID}`} className="px-3 py-2 text-white">₹{Number(product.Price).toFixed(2)}</td>
                ))}
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2 muted-text">Brand</td>
                {products.map((product) => (
                  <td key={`brand-${product.Product_ID}`} className="px-3 py-2 text-white">{getBrand(product)}</td>
                ))}
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2 muted-text">Rating</td>
                {products.map((product) => (
                  <td key={`rating-${product.Product_ID}`} className="px-3 py-2 text-white">⭐ {getRating(product)}</td>
                ))}
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2 muted-text">Condition</td>
                {products.map((product) => (
                  <td key={`condition-${product.Product_ID}`} className="px-3 py-2 text-white">{getCondition(product)}</td>
                ))}
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2 muted-text">Description</td>
                {products.map((product) => (
                  <td key={`desc-${product.Product_ID}`} className="px-3 py-2 text-white">
                    <span className="line-clamp-2 block">{product.Description || 'No description available'}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductComparePanel;
