export type FieldType = 'text' | 'textarea' | 'image' | 'color' | 'url' | 'toggle' | 'number';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
}

export interface SectionSchema {
  name: string;
  icon: string;
  color: string;
  fields: FieldDef[];
  defaultContent: Record<string, unknown>;
}

export interface PageConfig {
  label: string;
  slug: string;
  previewPath: string;
  indexKey: string; // '_homepage_index' or '_section_index'
  sections: SectionSchema[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */

const ICON_PATHS: Record<string, string> = {
  header: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  footer: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  image: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z',
  banner: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5',
  text: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12',
  faq: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  video: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z',
  testimonials: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  grid: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  table: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-3.75c-.621 0-1.125.504-1.125 1.125m1.125-1.125c.621 0 1.125.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0c0 .621-.504 1.125-1.125 1.125',
  steps: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H5.625a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
  dragon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z',
  heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  book: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HOMEPAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const HOMEPAGE_SECTIONS: SectionSchema[] = [
  {
    name: 'Header', icon: ICON_PATHS.header, color: 'bg-deep-green',
    fields: [
      { key: 'logo_text', label: 'Logo Text', type: 'text', placeholder: 'PURE' },
      { key: 'cta_text', label: 'CTA Button Text', type: 'text', placeholder: 'Create plan' },
      { key: 'cta_url', label: 'CTA Button URL', type: 'url', placeholder: '/signup' },
      { key: 'nav_1_label', label: 'Nav Item 1 — Label', type: 'text', placeholder: 'About' },
      { key: 'nav_1_url', label: 'Nav Item 1 — URL', type: 'url', placeholder: '/about' },
      { key: 'nav_2_label', label: 'Nav Item 2 — Label', type: 'text', placeholder: 'Our dog food' },
      { key: 'nav_2_url', label: 'Nav Item 2 — URL', type: 'url', placeholder: '/recipes' },
      { key: 'nav_3_label', label: 'Nav Item 3 — Label', type: 'text', placeholder: 'Shop' },
      { key: 'nav_3_url', label: 'Nav Item 3 — URL', type: 'url', placeholder: '/products' },
      { key: 'nav_4_label', label: 'Nav Item 4 — Label', type: 'text', placeholder: 'Reviews' },
      { key: 'nav_4_url', label: 'Nav Item 4 — URL', type: 'url', placeholder: '/reviews' },
      { key: 'nav_5_label', label: 'Nav Item 5 — Label', type: 'text', placeholder: 'Health & breeds' },
      { key: 'nav_5_url', label: 'Nav Item 5 — URL', type: 'url', placeholder: '/benefits' },
      { key: 'help_url', label: 'Help Link URL', type: 'url', placeholder: '/help' },
      { key: 'login_url', label: 'Login Link URL', type: 'url', placeholder: '/login' },
    ],
    defaultContent: {
      logo_text: 'PURE', cta_text: 'Create plan', cta_url: '/signup',
      nav_1_label: 'About', nav_1_url: '/about',
      nav_2_label: 'Our dog food', nav_2_url: '/recipes',
      nav_3_label: 'Shop', nav_3_url: '/products',
      nav_4_label: 'Reviews', nav_4_url: '/reviews',
      nav_5_label: 'Health & breeds', nav_5_url: '/benefits',
      help_url: '/help', login_url: '/login',
    },
  },
  {
    name: 'Hero Section', icon: ICON_PATHS.image, color: 'bg-blue-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'textarea', placeholder: 'Main headline...' },
      { key: 'heading_highlight', label: 'Highlighted Text (Gold)', type: 'text', placeholder: 'Text shown in gold...' },
      { key: 'subheading', label: 'Subheading', type: 'text', placeholder: 'Supporting text...' },
      { key: 'button_text', label: 'Button Text', type: 'text', placeholder: 'Get started today' },
      { key: 'button_url', label: 'Button URL', type: 'url', placeholder: '/signup' },
      { key: 'background_image', label: 'Hero Image', type: 'image' },
    ],
    defaultContent: {
      heading: 'The easiest way to feed healthy,', heading_highlight: 'natural dog food',
      subheading: 'Enjoy fresh food without the fuss, from only 89p a day',
      button_text: 'Get started today', button_url: '/signup', background_image: '',
    },
  },
  {
    name: 'Offer Banner', icon: ICON_PATHS.banner, color: 'bg-purple-600',
    fields: [
      { key: 'primary_text', label: 'Primary Offer', type: 'text', placeholder: '25% off your first box' },
      { key: 'secondary_text', label: 'Secondary Offer', type: 'text', placeholder: '10% off your next box' },
      { key: 'link_url', label: 'Link URL', type: 'url', placeholder: '/signup' },
      { key: 'background_color', label: 'Background Color', type: 'color' },
    ],
    defaultContent: { primary_text: '25% off your first box', secondary_text: '10% off your next box', link_url: '/signup', background_color: '#5F295E' },
  },
  {
    name: 'What is Pure', icon: ICON_PATHS.check, color: 'bg-emerald-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Section Image', type: 'image' },
    ],
    defaultContent: {
      heading: 'What is Pure dog food?',
      description: 'A natural, healthy dog food designed to take the stress out of meal times.\n\nSimply add water and stir to quickly rehydrate the food and create a healthy, nutritious meal your pup will love.',
      image: '',
    },
  },
  {
    name: 'Benefits Bar', icon: ICON_PATHS.star, color: 'bg-amber-500',
    fields: [
      { key: 'benefit_1', label: 'Benefit 1', type: 'text' },
      { key: 'benefit_2', label: 'Benefit 2', type: 'text' },
      { key: 'benefit_3', label: 'Benefit 3', type: 'text' },
      { key: 'benefit_4', label: 'Benefit 4', type: 'text' },
    ],
    defaultContent: { benefit_1: 'Store in the cupboard', benefit_2: 'From only 89p per day', benefit_3: 'Just add water and serve', benefit_4: 'Ready in 10 seconds' },
  },
  {
    name: 'Product Highlights', icon: ICON_PATHS.grid, color: 'bg-deep-green',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'show_prices', label: 'Show Prices', type: 'toggle' },
    ],
    defaultContent: { heading: 'Handpicked for Your Pup', subheading: 'Fresh, natural ingredients your dog will love.', show_prices: true },
  },
  {
    name: 'Trending Products', icon: ICON_PATHS.grid, color: 'bg-orange-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'max_products', label: 'Max Products', type: 'number' },
    ],
    defaultContent: { heading: 'What Pet Parents Love', max_products: 8 },
  },
  {
    name: 'Video Testimonials', icon: ICON_PATHS.video, color: 'bg-red-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
    ],
    defaultContent: { heading: "Don't just take our word for it", subheading: 'Listen to what others have to say about it' },
  },
  {
    name: 'How It Works', icon: ICON_PATHS.steps, color: 'bg-teal-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'step_1_title', label: 'Step 1 Title', type: 'text' },
      { key: 'step_1_description', label: 'Step 1 Description', type: 'textarea' },
      { key: 'step_2_title', label: 'Step 2 Title', type: 'text' },
      { key: 'step_2_description', label: 'Step 2 Description', type: 'textarea' },
      { key: 'step_3_title', label: 'Step 3 Title', type: 'text' },
      { key: 'step_3_description', label: 'Step 3 Description', type: 'textarea' },
    ],
    defaultContent: {
      heading: 'How does a Pure plan work?',
      step_1_title: 'Tell us about your dog', step_1_description: 'Tell us about your dog',
      step_2_title: 'Choose your tailored recipes', step_2_description: 'Choose your tailored recipes',
      step_3_title: 'Delivered to your door for free', step_3_description: 'Delivered to your door for free',
    },
  },
  {
    name: 'Stats', icon: ICON_PATHS.chart, color: 'bg-indigo-500',
    fields: [
      { key: 'meals_served', label: 'Meals Served Count', type: 'number' },
      { key: 'stat_1_value', label: 'Stat 1 Value', type: 'text', placeholder: '95%' },
      { key: 'stat_1_label', label: 'Stat 1 Label', type: 'text' },
      { key: 'stat_2_value', label: 'Stat 2 Value', type: 'text', placeholder: '93%' },
      { key: 'stat_2_label', label: 'Stat 2 Label', type: 'text' },
    ],
    defaultContent: {
      meals_served: 92905251,
      stat_1_value: '94%', stat_1_label: "of customers have seen an improvement in their dog's ailment",
      stat_2_value: '91%', stat_2_label: 'of customers have seen overall health improvements since switching to Pure',
    },
  },
  {
    name: 'Comparison Table', icon: ICON_PATHS.table, color: 'bg-gray-600',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'col_1_header', label: 'Column 1 Header', type: 'text', placeholder: 'PURE' },
      { key: 'col_2_header', label: 'Column 2 Header', type: 'text', placeholder: 'Dry & wet' },
      { key: 'col_3_header', label: 'Column 3 Header', type: 'text', placeholder: 'Raw & fresh' },
      { key: 'row_1_label', label: 'Row 1 Label', type: 'text', placeholder: 'Cost' },
      { key: 'row_1_pure', label: 'Row 1 — Pure value', type: 'text', placeholder: '££' },
      { key: 'row_1_dry', label: 'Row 1 — Col 2 value', type: 'text', placeholder: '£' },
      { key: 'row_1_raw', label: 'Row 1 — Col 3 value', type: 'text', placeholder: '£££' },
      { key: 'row_2_label', label: 'Row 2 Label', type: 'text', placeholder: 'No/low processing' },
      { key: 'row_2_pure', label: 'Row 2 — Pure (check)', type: 'toggle' },
      { key: 'row_2_dry', label: 'Row 2 — Col 2 (check)', type: 'toggle' },
      { key: 'row_2_raw', label: 'Row 2 — Col 3 (check)', type: 'toggle' },
      { key: 'row_3_label', label: 'Row 3 Label', type: 'text', placeholder: 'High quality ingredients' },
      { key: 'row_3_pure', label: 'Row 3 — Pure (check)', type: 'toggle' },
      { key: 'row_3_dry', label: 'Row 3 — Col 2 (check)', type: 'toggle' },
      { key: 'row_3_raw', label: 'Row 3 — Col 3 (check)', type: 'toggle' },
      { key: 'row_4_label', label: 'Row 4 Label', type: 'text', placeholder: 'Easy to store' },
      { key: 'row_4_pure', label: 'Row 4 — Pure (check)', type: 'toggle' },
      { key: 'row_4_dry', label: 'Row 4 — Col 2 (check)', type: 'toggle' },
      { key: 'row_4_raw', label: 'Row 4 — Col 3 (check)', type: 'toggle' },
      { key: 'row_5_label', label: 'Row 5 Label', type: 'text', placeholder: 'No risk of harmful pathogens' },
      { key: 'row_5_pure', label: 'Row 5 — Pure (check)', type: 'toggle' },
      { key: 'row_5_dry', label: 'Row 5 — Col 2 (check)', type: 'toggle' },
      { key: 'row_5_raw', label: 'Row 5 — Col 3 (check)', type: 'toggle' },
    ],
    defaultContent: {
      heading: 'How Pure compares', col_1_header: 'PURE', col_2_header: 'Dry & wet', col_3_header: 'Raw & fresh',
      row_1_label: 'Cost', row_1_pure: '££', row_1_dry: '£', row_1_raw: '£££',
      row_2_label: 'No/low processing', row_2_pure: true, row_2_dry: false, row_2_raw: true,
      row_3_label: 'High quality ingredients', row_3_pure: true, row_3_dry: false, row_3_raw: true,
      row_4_label: 'Easy to store', row_4_pure: true, row_4_dry: true, row_4_raw: false,
      row_5_label: 'No risk of harmful pathogens', row_5_pure: true, row_5_dry: true, row_5_raw: false,
    },
  },
  {
    name: 'Yorkshire Vet', icon: ICON_PATHS.check, color: 'bg-green-600',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'quote', label: 'Testimonial Quote', type: 'textarea' },
      { key: 'author', label: 'Author Name', type: 'text' },
      { key: 'image', label: 'Author Image', type: 'image' },
    ],
    defaultContent: { heading: 'Backed by The Yorkshire Vet', quote: "I've been a vet for almost 30 years. Recently I've suggested Pure for some of my patients, often with great results.", author: 'Julian Norton', image: '' },
  },
  {
    name: 'Dragons Den', icon: ICON_PATHS.dragon, color: 'bg-rose-600',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Section Image', type: 'image' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
      { key: 'button_url', label: 'Button URL', type: 'url' },
    ],
    defaultContent: { heading: "Dog food so good we ate it on Dragons' Den", description: 'Pure is complete nutrition from the inside out, and dogs totally love the taste!', image: '', button_text: 'Get started today', button_url: '/signup' },
  },
  {
    name: 'FAQ', icon: ICON_PATHS.faq, color: 'bg-violet-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
    ],
    defaultContent: { heading: 'Frequently Asked Questions', subheading: 'Everything else you need to know about Pure' },
  },
  {
    name: 'Footer', icon: ICON_PATHS.footer, color: 'bg-gray-800',
    fields: [
      { key: 'vip_heading', label: 'VIP Section Heading', type: 'text' },
      { key: 'vip_description', label: 'VIP Description', type: 'textarea' },
      { key: 'signup_button_text', label: 'Sign Up Button Text', type: 'text' },
      { key: 'social_heading', label: 'Social Section Heading', type: 'text' },
      { key: 'instagram_url', label: 'Instagram URL', type: 'url' },
      { key: 'facebook_url', label: 'Facebook URL', type: 'url' },
      { key: 'tiktok_url', label: 'TikTok URL', type: 'url' },
      { key: 'col1_heading', label: 'Column 1 Heading', type: 'text' },
      { key: 'col2_heading', label: 'Column 2 Heading', type: 'text' },
      { key: 'col3_heading', label: 'Column 3 Heading', type: 'text' },
      { key: 'copyright_text', label: 'Copyright Text', type: 'text' },
      { key: 'logo_image', label: 'Footer Logo', type: 'image' },
    ],
    defaultContent: {
      vip_heading: 'Join our VIP list', vip_description: 'Be the first to hear about new product launches.',
      signup_button_text: 'Sign up', social_heading: 'Follow us on social media',
      instagram_url: '#', facebook_url: '#', tiktok_url: '#',
      col1_heading: 'Pure', col2_heading: 'Help', col3_heading: 'Information',
      copyright_text: '© Pure Pet Food Ltd 2020-2026', logo_image: '',
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const ABOUT_SECTIONS: SectionSchema[] = [
  {
    name: 'Hero', icon: ICON_PATHS.image, color: 'bg-blue-500',
    fields: [
      { key: 'hero_image', label: 'Hero Image', type: 'image' },
    ],
    defaultContent: { hero_image: '' },
  },
  {
    name: '2012 — Our Story', icon: ICON_PATHS.book, color: 'bg-amber-600',
    fields: [
      { key: 'year', label: 'Year', type: 'text', placeholder: '2012' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'content_1', label: 'Paragraph 1 (italic)', type: 'textarea' },
      { key: 'content_2', label: 'Paragraph 2', type: 'textarea' },
    ],
    defaultContent: {
      year: '2012', title: 'It started with a simple question',
      content_1: '"Little brown biscuits – we wouldn\'t eat these for every meal, every day, so why should our pets?"',
      content_2: 'This is the question that led us on a journey to change the face of pet food for the better.',
    },
  },
  {
    name: '2013 — Revelation', icon: ICON_PATHS.book, color: 'bg-amber-600',
    fields: [
      { key: 'year', label: 'Year', type: 'text', placeholder: '2013' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'title_highlight', label: 'Title Highlight (Gold)', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: {
      year: '2013', title: 'A food', title_highlight: 'revelation',
      content: 'Months of research led us to an age-old preservation method of removing the moisture from food.',
      image: '',
    },
  },
  {
    name: '2014 — Milestones', icon: ICON_PATHS.book, color: 'bg-amber-600',
    fields: [
      { key: 'year', label: 'Year', type: 'text', placeholder: '2014' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'title_highlight', label: 'Title Highlight (Gold)', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: {
      year: '2014', title: 'Memorable', title_highlight: 'milestones',
      content: "In 2014, our co-founders entered the Dragons' Den and we were lucky enough to win over two dragons!",
      image: '',
    },
  },
  {
    name: '2017 — Royal Visit', icon: ICON_PATHS.book, color: 'bg-amber-600',
    fields: [
      { key: 'year', label: 'Year', type: 'text', placeholder: '2017' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'title_highlight', label: 'Title Highlight (Gold)', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: {
      year: '2017', title: 'Hosting a', title_highlight: 'royal visit',
      content: 'Her Royal Highness Princess Anne visited us here in West Yorkshire in 2017.',
      image: '',
    },
  },
  {
    name: '2024 — Today', icon: ICON_PATHS.book, color: 'bg-amber-600',
    fields: [
      { key: 'year', label: 'Year', type: 'text', placeholder: '2024' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'title_highlight', label: 'Title Highlight (Gold)', type: 'text' },
      { key: 'content_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'content_2', label: 'Paragraph 2', type: 'textarea' },
    ],
    defaultContent: {
      year: '2024', title: 'Where we are', title_highlight: 'today',
      content_1: "We've come a long way from creating recipes in Dan's kitchen.",
      content_2: 'So you could say that in many ways, this is only the beginning!',
    },
  },
  {
    name: 'Stats', icon: ICON_PATHS.chart, color: 'bg-deep-green',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'number', label: 'Number', type: 'text', placeholder: '92,871,751' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    defaultContent: { heading: 'Since 2012', subtitle: "we've delivered", number: '92,871,751', description: 'meals and changed the lives of thousands of pets for the better' },
  },
  {
    name: 'Learn More', icon: ICON_PATHS.text, color: 'bg-emerald-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Learn more', subtitle: 'about Pure', description: 'Our dogs are a part of the family, so they deserve the best food.', image: '' },
  },
  {
    name: 'Personalise CTA', icon: ICON_PATHS.heart, color: 'bg-purple-600',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
      { key: 'button_url', label: 'Button URL', type: 'url' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Personalise your', subtitle: "dog's food", description: "Proactively invest in your pet's health.", button_text: "Discover your dog's menu", button_url: '/signup', image: '' },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   BENEFITS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const BENEFITS_SECTIONS: SectionSchema[] = [
  {
    name: 'Hero', icon: ICON_PATHS.image, color: 'bg-blue-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'heading_highlight', label: 'Heading Highlight (Gold)', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
      { key: 'hero_image', label: 'Hero Image', type: 'image' },
    ],
    defaultContent: { heading: 'What are the benefits', heading_highlight: 'to your pet?', subheading: 'Our natural, healthy pet food has led to thousands of success stories.', button_text: 'Create a tailored plan', hero_image: '' },
  },
  {
    name: 'Offer Banner', icon: ICON_PATHS.banner, color: 'bg-orange-500',
    fields: [
      { key: 'primary_text', label: 'Primary Text', type: 'text' },
      { key: 'secondary_text', label: 'Secondary Text', type: 'text' },
      { key: 'link_url', label: 'Link URL', type: 'url' },
    ],
    defaultContent: { primary_text: '25% off your first box', secondary_text: '10% off your next box', link_url: '/signup' },
  },
  {
    name: 'Pure Common Sense', icon: ICON_PATHS.text, color: 'bg-emerald-500',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { title: 'Pure common sense', text: "We work on facts and common sense over here in Yorkshire.", image: '' },
  },
  {
    name: 'No Hidden Nasties', icon: ICON_PATHS.text, color: 'bg-emerald-500',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'cta_label', label: 'CTA Label', type: 'text' },
      { key: 'cta_href', label: 'CTA URL', type: 'url' },
    ],
    defaultContent: { title: 'No hidden nasties', text: "We preserve our high quality natural ingredients by removing the water.", image: '', cta_label: 'Read about our food', cta_href: '/recipes' },
  },
  {
    name: 'Long Healthy Lives', icon: ICON_PATHS.text, color: 'bg-emerald-500',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { title: 'Long healthy lives', text: "Studies have found that puppies fed a processed diet initially appeared to be healthy.", image: '' },
  },
  {
    name: 'Testimonials', icon: ICON_PATHS.testimonials, color: 'bg-deep-green',
    fields: [
      { key: 't1_name', label: 'Testimonial 1 — Name', type: 'text' },
      { key: 't1_quote', label: 'Testimonial 1 — Quote', type: 'textarea' },
      { key: 't1_image', label: 'Testimonial 1 — Image', type: 'image' },
      { key: 't2_name', label: 'Testimonial 2 — Name', type: 'text' },
      { key: 't2_quote', label: 'Testimonial 2 — Quote', type: 'textarea' },
      { key: 't2_image', label: 'Testimonial 2 — Image', type: 'image' },
      { key: 't3_name', label: 'Testimonial 3 — Name', type: 'text' },
      { key: 't3_quote', label: 'Testimonial 3 — Quote', type: 'textarea' },
      { key: 't3_image', label: 'Testimonial 3 — Image', type: 'image' },
    ],
    defaultContent: {
      t1_name: 'Dr Lucy Williamson BVM&S', t1_quote: 'My experience shows that the effects of feeding a highly-processed diet start to show most in later life.', t1_image: '',
      t2_name: 'Lloyd, Peta & Lulu', t2_quote: 'We rescued Lulu, she had a whole host of stomach and digestive issues.', t2_image: '',
      t3_name: 'Sarah, Tim & Biscuit', t3_quote: "We've seen a real difference in our dog's coat and energy levels since switching to Pure.", t3_image: '',
    },
  },
  {
    name: 'Better Bellies', icon: ICON_PATHS.heart, color: 'bg-amber-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    defaultContent: { heading: 'Better bellies', subtitle: 'Improved smell', description: "Switching to a highly digestible, high quality food will improve smell and stool consistency." },
  },
  {
    name: 'Combat Obesity', icon: ICON_PATHS.heart, color: 'bg-amber-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'text_2', label: 'Paragraph 2', type: 'textarea' },
    ],
    defaultContent: { heading: 'Combat obesity', text_1: 'According to the PFMA, 51% of dogs are overweight or obese.', text_2: "Switching to a healthier, natural diet helps maintain a healthy body weight." },
  },
  {
    name: 'Personalise CTA', icon: ICON_PATHS.heart, color: 'bg-purple-600',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
      { key: 'button_url', label: 'Button URL', type: 'url' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Personalise your', subtitle: "dog's food", description: "Proactively invest in your pet's health.", button_text: "Discover your dog's menu", button_url: '/signup', image: '' },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   RECIPES PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const RECIPES_SECTIONS: SectionSchema[] = [
  {
    name: 'Hero', icon: ICON_PATHS.image, color: 'bg-blue-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'heading_highlight', label: 'Heading Highlight (Gold)', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'hero_image', label: 'Hero Image', type: 'image' },
    ],
    defaultContent: { heading: 'Real goodness', heading_highlight: 'Real food', subheading: 'After all, your pet should be eating like one of the family too.', hero_image: '' },
  },
  {
    name: 'Offer Banner', icon: ICON_PATHS.banner, color: 'bg-orange-500',
    fields: [
      { key: 'primary_text', label: 'Primary Text', type: 'text' },
      { key: 'secondary_text', label: 'Secondary Text', type: 'text' },
      { key: 'link_url', label: 'Link URL', type: 'url' },
    ],
    defaultContent: { primary_text: '25% off your first box', secondary_text: '10% off your next box', link_url: '/signup' },
  },
  {
    name: 'Personalised Section', icon: ICON_PATHS.text, color: 'bg-emerald-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Personalised', subtitle: 'to your dog', description: "We'll create your dog's tailored menu.", image: '' },
  },
  {
    name: 'Natural Health', icon: ICON_PATHS.heart, color: 'bg-deep-green',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Natural health', subtitle: 'just add water', description: "Lovingly prepared in Yorkshire.", image: '' },
  },
  {
    name: 'Recipe Grid', icon: ICON_PATHS.grid, color: 'bg-amber-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
    ],
    defaultContent: { heading: 'Our drool-worthy menu of recipes', subheading: "We'll tailor your menu specifically to your needs." },
  },
  {
    name: 'Carefully Prepared', icon: ICON_PATHS.text, color: 'bg-deep-green',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'text_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'text_2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Carefully prepared', subtitle: 'with your dog in mind', text_1: 'We take delicious, natural ingredients.', text_2: 'The nutrients in the food are carefully protected.', image: '' },
  },
  {
    name: 'Dogs Deserve Better', icon: ICON_PATHS.text, color: 'bg-emerald-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    defaultContent: { heading: 'Dogs deserve better', description: "Other pet foods contain additives, preservatives and things you just wouldn't want to feed your dog." },
  },
  {
    name: 'Dry Food Q&A', icon: ICON_PATHS.faq, color: 'bg-violet-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'text_2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'text_3', label: 'Paragraph 3', type: 'textarea' },
    ],
    defaultContent: { heading: 'What if my dry dog food has good ingredients?', text_1: 'Good ingredients are at the very core of good food.', text_2: 'The ingredients are processed beyond recognition using extrusion.', text_3: 'Our gently air-dried process locks in up to 5x more nutrients.' },
  },
  {
    name: 'Personalise CTA', icon: ICON_PATHS.heart, color: 'bg-purple-600',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
      { key: 'button_url', label: 'Button URL', type: 'url' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Personalise your', subtitle: "dog's food", description: "Proactively invest in your pet's health.", button_text: "Discover your dog's menu", button_url: '/signup', image: '' },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const REVIEWS_SECTIONS: SectionSchema[] = [
  {
    name: 'Hero', icon: ICON_PATHS.image, color: 'bg-blue-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'heading_highlight', label: 'Heading Highlight (Gold)', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
      { key: 'hero_image', label: 'Hero Image', type: 'image' },
    ],
    defaultContent: { heading: "Pet's lives we've", heading_highlight: 'changed for the better', subheading: "Investing in your pet's diet can have a transformational impact.", button_text: 'Create a tailored plan', hero_image: '' },
  },
  {
    name: 'Offer Banner', icon: ICON_PATHS.banner, color: 'bg-orange-500',
    fields: [
      { key: 'primary_text', label: 'Primary Text', type: 'text' },
      { key: 'secondary_text', label: 'Secondary Text', type: 'text' },
      { key: 'link_url', label: 'Link URL', type: 'url' },
    ],
    defaultContent: { primary_text: '25% off your first box', secondary_text: '10% off your next box', link_url: '/signup' },
  },
  {
    name: "Lulu's Story", icon: ICON_PATHS.heart, color: 'bg-emerald-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'text_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'text_2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Lulu is now', subtitle: 'a different dog', text_1: 'We rescued Lulu from the Pro Dogs Direct charity.', text_2: "Within just 2 days her issues had eased.", image: '' },
  },
  {
    name: 'Backed by Vets', icon: ICON_PATHS.check, color: 'bg-deep-green',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
      { key: 'vet_1_name', label: 'Vet 1 — Name', type: 'text' },
      { key: 'vet_1_quote', label: 'Vet 1 — Quote', type: 'textarea' },
      { key: 'vet_1_image', label: 'Vet 1 — Image', type: 'image' },
      { key: 'vet_2_name', label: 'Vet 2 — Name', type: 'text' },
      { key: 'vet_2_quote', label: 'Vet 2 — Quote', type: 'textarea' },
      { key: 'vet_2_image', label: 'Vet 2 — Image', type: 'image' },
    ],
    defaultContent: {
      heading: 'Backed by vets', subtitle: 'Formulated by nutritionists',
      vet_1_name: 'Dr Julian Norton MA VetMB GPcertSAP MRCVS', vet_1_quote: "I've been a vet for over 30 years.", vet_1_image: '',
      vet_2_name: 'Dr Brendan Clark MRCVS', vet_2_quote: 'What is often not considered is how the food is processed.', vet_2_image: '',
    },
  },
  {
    name: 'Nelly & Polly', icon: ICON_PATHS.heart, color: 'bg-emerald-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'text_2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'text_3', label: 'Paragraph 3', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: 'Meet Nelly & Polly', text_1: 'I rescued Nelly two years ago. She came to me with alopecia.', text_2: "I couldn't even stroke her.", text_3: 'We switched from brown biscuits to Pure.', image: '' },
  },
  {
    name: "We've Helped 1000s", icon: ICON_PATHS.users, color: 'bg-amber-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle (Gold)', type: 'text' },
    ],
    defaultContent: { heading: "We've helped", subtitle: "1000's of dogs" },
  },
  {
    name: "Diesel's Story", icon: ICON_PATHS.heart, color: 'bg-deep-green',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'text_2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
    defaultContent: { heading: "Diesel's much healthier", text_1: 'For the first two years, he was a happy and healthy pup.', text_2: 'We switched to Pure as it\'s nutritious.', image: '' },
  },
  {
    name: 'Stats', icon: ICON_PATHS.chart, color: 'bg-indigo-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'number', label: 'Meals Number', type: 'text', placeholder: '92,871,751' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'stat_1_value', label: 'Stat 1 Value', type: 'text', placeholder: '94%' },
      { key: 'stat_1_label', label: 'Stat 1 Label', type: 'text' },
      { key: 'stat_2_value', label: 'Stat 2 Value', type: 'text', placeholder: '91%' },
      { key: 'stat_2_label', label: 'Stat 2 Label', type: 'text' },
    ],
    defaultContent: {
      heading: "We've delivered", number: '92,871,751', description: 'meals and changed the lives of thousands of pets',
      stat_1_value: '94%', stat_1_label: "of customers have seen an improvement in their dog's ailment",
      stat_2_value: '91%', stat_2_label: 'of customers have seen overall health improvements',
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SIGNUP PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const SIGNUP_SECTIONS: SectionSchema[] = [
  {
    name: 'Header', icon: ICON_PATHS.header, color: 'bg-deep-green',
    fields: [
      { key: 'offer_text', label: 'Offer Badge Text', type: 'text' },
    ],
    defaultContent: { offer_text: '25% off your first box + 10% off your next box' },
  },
  {
    name: 'Main Content', icon: ICON_PATHS.text, color: 'bg-blue-500',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'label', label: 'Input Label', type: 'text' },
      { key: 'add_more_text', label: 'Add More Dogs Text', type: 'text' },
      { key: 'button_text', label: 'Button Text', type: 'text' },
    ],
    defaultContent: { heading: "Let's get started", subtitle: 'It only takes 2-3 minutes', label: "What's your dogs name?", add_more_text: 'You can add more dogs\nlater if you need to', button_text: 'Continue' },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ALL PAGES CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */

export const ALL_PAGE_CONFIGS: PageConfig[] = [
  { label: 'Homepage', slug: '/', previewPath: '/', indexKey: '_homepage_index', sections: HOMEPAGE_SECTIONS },
  { label: 'About', slug: '/about', previewPath: '/about', indexKey: '_section_index', sections: ABOUT_SECTIONS },
  { label: 'Benefits', slug: '/benefits', previewPath: '/benefits', indexKey: '_section_index', sections: BENEFITS_SECTIONS },
  { label: 'Recipes', slug: '/recipes', previewPath: '/recipes', indexKey: '_section_index', sections: RECIPES_SECTIONS },
  { label: 'Reviews', slug: '/reviews', previewPath: '/reviews', indexKey: '_section_index', sections: REVIEWS_SECTIONS },
  { label: 'Signup', slug: '/signup', previewPath: '/signup', indexKey: '_section_index', sections: SIGNUP_SECTIONS },
];
