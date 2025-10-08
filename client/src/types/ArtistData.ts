export type ArtistData = {
  name: string;
  bio: string;
  avatar: File | null;
  genres: string[];
  socialLinks: {
    spotify: string;
    instagram: string;
    twitter: string;
  } | null;
}

export type Artist = {
  _id: string;
  name: string;
  bio: string;
  avatar: string;
  albums: {name: string, coverUrl: string, _id: string}[];
  genres: string[];
  slug: string;
  isVerified: boolean;
  followerCount: number;
  socialLinks: {
    spotify: string;
    instagram: string;
    twitter: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}