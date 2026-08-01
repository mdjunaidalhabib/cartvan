import ImageSlider from "../../components/home/ImageSlider";
import HomeAllProduct from "../../components/home/HomeAllProduct";
import HomeSEO from "../../components/seo/HomeSEO";
import VisitorTracker from "../../components/VisitorTracker";
import HomepagePopup from "../../components/home/HomepagePopup";
import { serverFetch } from "../../lib/serverApi";

async function getHomeData() {
  const [productsRes, categoriesRes, badgesRes, sliderRes] =
    await Promise.allSettled([
      serverFetch("/products"),
      serverFetch("/categories"),
      serverFetch("/homeBadges"),
      serverFetch("/slider-images"),
    ]);

  return {
    products: productsRes.status === "fulfilled" ? productsRes.value : [],
    categories:
      categoriesRes.status === "fulfilled" ? categoriesRes.value : [],
    badges:
      badgesRes.status === "fulfilled" ? badgesRes.value?.badges || [] : [],
    slides:
      sliderRes.status === "fulfilled" ? sliderRes.value?.slides || [] : [],
  };
}

export default async function HomePage() {
  const { products, categories, badges, slides } = await getHomeData();

  return (
    <section className="bg-pink-50">
      <HomeSEO />
      <div>
        <VisitorTracker />
        <HomepagePopup />
        <ImageSlider images={slides} />
        <HomeAllProduct
          initialProducts={products}
          initialCategories={categories}
          initialBadges={badges}
        />
      </div>
    </section>
  );
}
 