import ProductCard from "../home/ProductCard";

export default function RelatedProducts({ related = [] }) {
  if (!related?.length) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">You May Also Like</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {related.map((p, i) => (
          <ProductCard key={p._id} product={p} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}
