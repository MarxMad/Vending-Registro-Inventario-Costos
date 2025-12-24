import { NextResponse } from 'next/server';
import { getFarcasterDomainManifest } from '~/lib/utils';

export async function GET() {
  try {
    const config: any = await getFarcasterDomainManifest();
    
    if (!config.miniapp) {
      return NextResponse.json(
        { error: 'Mini app configuration is missing' },
        { status: 500 }
      );
    }
    
    // Normalizar URLs para asegurar que sean absolutas
    const baseUrl = config.miniapp.homeUrl.startsWith('http') 
      ? config.miniapp.homeUrl 
      : `https://${config.miniapp.homeUrl}`;
    
    const normalizeUrl = (url: string) => {
      if (url.startsWith('http')) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/${url}`;
    };

    // Construir manifest sin accountAssociation si es undefined
    const manifest: any = {
      miniapp: {
        version: config.miniapp.version,
        name: config.miniapp.name,
        homeUrl: baseUrl,
        iconUrl: normalizeUrl(config.miniapp.iconUrl),
        imageUrl: normalizeUrl(config.miniapp.imageUrl),
        buttonTitle: config.miniapp.buttonTitle,
        splashImageUrl: config.miniapp.splashImageUrl ? normalizeUrl(config.miniapp.splashImageUrl) : undefined,
        splashBackgroundColor: config.miniapp.splashBackgroundColor,
        webhookUrl: config.miniapp.webhookUrl,
        // Campos adicionales del manifest (acceder de forma segura)
        ...(config.miniapp.description && { description: config.miniapp.description }),
        ...(config.miniapp.subtitle && { subtitle: config.miniapp.subtitle }),
        ...(config.miniapp.primaryCategory && { primaryCategory: config.miniapp.primaryCategory }),
        ...(config.miniapp.tags && { tags: config.miniapp.tags }),
        ...(config.miniapp.heroImageUrl && { heroImageUrl: normalizeUrl(config.miniapp.heroImageUrl) }),
        ...(config.miniapp.tagline && { tagline: config.miniapp.tagline }),
        ...(config.miniapp.ogTitle && { ogTitle: config.miniapp.ogTitle }),
        ...(config.miniapp.ogDescription && { ogDescription: config.miniapp.ogDescription }),
        ...(config.miniapp.ogImageUrl && { ogImageUrl: normalizeUrl(config.miniapp.ogImageUrl) }),
        ...(config.miniapp.castShareUrl && { castShareUrl: normalizeUrl(config.miniapp.castShareUrl) }),
      },
    };

    // Solo incluir accountAssociation si existe
    if (config.accountAssociation) {
      manifest.accountAssociation = config.accountAssociation;
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
