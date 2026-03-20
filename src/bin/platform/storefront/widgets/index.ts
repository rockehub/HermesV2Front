import StoreHeaderWidget from './StoreHeader/StoreHeaderWidget';
import HeroBannerWidget from './HeroBanner/HeroBannerWidget';
import CategoryGridWidget from './CategoryGrid/CategoryGridWidget';
import ProductShelfWidget from './ProductShelf/ProductShelfWidget';
import ProductDetailsWidget from './ProductDetails/ProductDetailsWidget';
import CartItemsWidget from './CartItems/CartItemsWidget';
import CheckoutSummaryWidget from './CheckoutSummary/CheckoutSummaryWidget';
import StoreFooterWidget from './StoreFooter/StoreFooterWidget';
import RichTextWidget from './RichText/RichTextWidget';
import ImageWidget from './Image/ImageWidget';
import CtaWidget from './Cta/CtaWidget';
import FaqWidget from './Faq/FaqWidget';
import SpacerWidget from './Spacer/SpacerWidget';

export const storefrontWidgets = [
  new StoreHeaderWidget(),
  new HeroBannerWidget(),
  new CategoryGridWidget(),
  new ProductShelfWidget(),
  new ProductDetailsWidget(),
  new CartItemsWidget(),
  new CheckoutSummaryWidget(),
  new StoreFooterWidget(),
  new RichTextWidget(),
  new ImageWidget(),
  new CtaWidget(),
  new FaqWidget(),
  new SpacerWidget(),
];

export function findStorefrontWidget(name: string) {
  return storefrontWidgets.find((widget) => widget.name === name);
}
