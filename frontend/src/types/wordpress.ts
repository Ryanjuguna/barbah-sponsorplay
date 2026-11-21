export interface WPPost {
  id: number;
  date: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  categories: number[];
  featured_media?: number;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}
