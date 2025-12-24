import { Metadata } from "next";
import App from "./app";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    icons: {
      icon: '/VendingLogo3D.png',
      apple: '/VendingLogo3D.png',
    },
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: ['/VendingLogo3D.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: ['/VendingLogo3D.png'],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default function Home() {
  return (<App />);
}
