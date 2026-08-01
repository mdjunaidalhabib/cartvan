import Link from "next/link";

export default function ProductBreadcrumb({ product, categories = [] }) {
  const category = Array.isArray(categories) ? categories[0] : null;
  return (
    <nav className="text-xs md:text-sm text-gray-500 mb-4">
      <Link href="/" className="hover:underline">
        Home
      </Link>
      <span className="mx-2">/</span>

      {category && (
        <>
          <Link
            href={`/categories/${category._id}`}
            className="hover:underline"
          >
            {category.name}
          </Link>
          <span className="mx-2">/</span>
        </>
      )}

      <span className="text-gray-700">{product.name}</span>
    </nav>
  );
}
