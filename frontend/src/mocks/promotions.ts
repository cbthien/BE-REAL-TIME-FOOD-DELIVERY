/**
 * API Contract: GET /api/promotions/banners
 *
 * Đây là cấu trúc response mà backend CẦN TRẢ VỀ cho các endpoint promotions.
 * Frontend sẽ thay thế bằng API call thực khi backend sẵn sàng.
 */

/**
 * GET /api/promotions/banners
 *
 * Danh sách banner xoay vòng trên hero section trang chủ.
 *
 * Fields:
 * @field id          - MongoDB ObjectId (string)
 * @field title       - Tiêu đề chính (in đậm lớn)
 * @field subtitle    - Phụ đề (% giảm giá, ưu đãi)
 * @field description - Mô tả ngắn sản phẩm
 * @field imageUrl    - URL hình ảnh banner
 * @field ctaText     - Text nút Call To Action
 * @field ctaLink     - Đường dẫn khi click nút CTA
 */
export const MOCK_HERO_SLIDES = [
  {
    id: '65f1b3c4d5e6f7a8b9c0e001',
    title: 'BIG DEAL',
    subtitle: '50% OFF',
    description: 'Crispy Chicken Bucket Family Feast',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=2070',
    ctaText: 'Order Now',
    ctaLink: '/menu',
  },
  {
    id: '65f1b3c4d5e6f7a8b9c0e002',
    title: 'WEEKEND SPECIAL',
    subtitle: 'BUY 1 GET 1',
    description: 'Delicious Burgers & Crispy Fries',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2070',
    ctaText: 'Get Offer',
    ctaLink: '/menu',
  },
  {
    id: '65f1b3c4d5e6f7a8b9c0e003',
    title: 'NEW LAUNCH',
    subtitle: 'FREE DELIVERY',
    description: 'Vietnamese Chicken Rice Bowl',
    imageUrl: 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?q=80&w=2074',
    ctaText: 'Try Now',
    ctaLink: '/menu',
  },
];

/**
 * GET /api/promotions/featured
 *
 * Danh sách promotional banner hiển thị cuối trang chủ.
 *
 * Fields:
 * @field id          - MongoDB ObjectId (string)
 * @field label       - Nhãn nhỏ phía trên (e.g. "Weekend Special")
 * @field title       - Tiêu đề lớn (e.g. "BUY 1 GET 1 FREE"), dùng \n để xuống dòng
 * @field imageUrl    - URL hình nền
 * @field ctaText     - Text nút CTA
 * @field ctaLink     - Đường dẫn nút CTA
 */
export const MOCK_PROMO_BANNERS = [
  {
    id: '65f1b3c4d5e6f7a8b9c0e004',
    label: 'Weekend Special',
    title: 'BUY 1 GET 1\nFREE',
    imageUrl: 'https://images.unsplash.com/photo-1562003389-902c26d86b0e?q=80&w=2070',
    ctaText: 'Get Code',
    ctaLink: '/promotions',
  },
  {
    id: '65f1b3c4d5e6f7a8b9c0e005',
    label: 'New Customers',
    title: 'FREE SHIPPING\nFIRST ORDER',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070',
    ctaText: 'Order Now',
    ctaLink: '/register',
  },
];
