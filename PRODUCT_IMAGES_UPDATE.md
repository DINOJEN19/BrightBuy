# Product picture update

Added 80 locally bundled, AI-generated illustrative pictures for the fictional catalogue. Images appear on product cards, with two selectable pictures on every seeded product detail page. No database migration is needed.

## Apply to your existing project

1. Extract BrightBuy-product-images.zip.
2. Copy its frontend folder into C:\Users\LENOVO\Desktop\BrightBuy-prototype\BrightBuy-main, merging folders and replacing matching files.
3. In your frontend terminal, stop the development server with Ctrl+C and restart with npm run dev. Refresh the browser.

Keep your existing backend and environment settings. Production users should run npm run build in frontend.

## Files in this update

- frontend/public/products/*.webp — 80 product pictures (two per product).
- frontend/public/products/image-prompts.json — image descriptions and filenames.
- frontend/public/products/README.md — picture documentation.
- frontend/src/features/catalogue/data/productImages.js — product-name-to-image mapping.
- frontend/src/features/catalogue/components/ProductImage.jsx — reusable image and fallback.
- frontend/src/features/catalogue/components/ProductCard.jsx — card pictures.
- frontend/src/features/catalogue/pages/ProductDetailPage.jsx — larger detail picture.
- frontend/src/styles.css — responsive image styling.
- frontend/package.json — image verification command.
- frontend/tests/product-images.cjs — browser check for all 80 assets and thumbnail switching for all 40 products, detail, mobile and fallback.

Validation: frontend production build passed. Browser checks passed using real image assets with fixture API responses. Live database connectivity was not part of this image check.
