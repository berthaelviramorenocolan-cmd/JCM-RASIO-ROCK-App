export interface SplashAd {
  enabled: boolean;
  imageUrl: string;
  duration: number;
}

export interface StickyBanner {
  imageUrl: string;
  link: string;
}

export interface SocialLinks {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  facebook: string;
}

export interface PopupAlert {
  enabled: boolean;
  title: string;
  message: string;
}

export interface QuickLink {
  label: string;
  url: string;
}

export interface AppConfig {
  splashAd: SplashAd;
  stickyBanner: StickyBanner;
  tvLink: string;
  socialLinks: SocialLinks;
  popupAlert?: PopupAlert;
  quickLinks: QuickLink[];
  authorizedAdmins: string[];
}

export interface NotificationRecord {
  id?: string;
  title: string;
  body: string;
  sentAt: string;
}
