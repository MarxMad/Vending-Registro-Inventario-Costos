import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Manifest } from '@farcaster/miniapp-core/src/manifest';
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_SPLASH_URL,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
  APP_ACCOUNT_ASSOCIATION,
} from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMiniAppEmbedMetadata(ogImageUrl?: string) {
  return {
    version: 'next',
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    ogTitle: APP_NAME,
    ogDescription: APP_DESCRIPTION,
    ogImageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: 'launch_frame',
        name: APP_NAME,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
      },
    },
  };
}

export async function getFarcasterDomainManifest(): Promise<Manifest> {
  const manifestBase: any = {
    miniapp: {
      version: '1',
      name: APP_NAME ?? 'Gestión de Máquinas Vending',
      homeUrl: APP_URL,
      iconUrl: APP_ICON_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? 'Empezar Vending',
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      // Campos adicionales del manifest
      description: APP_DESCRIPTION,
      subtitle: 'Gestiona tu negocio de máquinas vending de forma eficiente',
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      heroImageUrl: APP_OG_IMAGE_URL,
      tagline: 'Control total de tus máquinas vending',
      ogTitle: APP_NAME,
      ogDescription: APP_DESCRIPTION,
      ogImageUrl: APP_OG_IMAGE_URL,
      castShareUrl: `${APP_URL}/share`,
    },
  };

  // Solo incluir accountAssociation si está definido
  if (APP_ACCOUNT_ASSOCIATION) {
    manifestBase.accountAssociation = APP_ACCOUNT_ASSOCIATION;
  }

  return manifestBase as Manifest;
}
