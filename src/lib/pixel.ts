// Facebook Pixel Utility
export const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

declare global {
  interface Window {
    fbq: any;
  }
}

export const pageview = () => {
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// https://developers.facebook.com/docs/facebook-pixel/reference
export const event = (name: string, options = {}) => {
  if (window.fbq) {
    window.fbq('track', name, options);
  }
};
