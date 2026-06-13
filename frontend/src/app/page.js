import ImageSlider from "../../components/home/ImageSlider";
import HomeAllProduct from "../../components/home/HomeAllProduct";
import HomeSEO from "../../components/seo/HomeSEO";
import VisitorTracker from "../../components/VisitorTracker";


export default function HomePage() {
  return (
    <section className="bg-pink-50">
      <HomeSEO />
      <div>
        <VisitorTracker />
        <ImageSlider />
        <HomeAllProduct />
      </div>
    </section>
  );
}
 