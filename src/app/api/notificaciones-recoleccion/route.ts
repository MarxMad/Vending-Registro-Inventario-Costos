import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMaquinasParaRecoleccion } from '~/lib/vendingStorage';
import { sendNeynarMiniAppNotification } from '~/lib/neynar';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    const notificaciones = await getMaquinasParaRecoleccion(userId);
    
    return NextResponse.json({ notificaciones });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const fid = body.fid || 0; // FID opcional para notificaciones de Neynar
    
    const notificaciones = await getMaquinasParaRecoleccion(userId);
    
    // Las notificaciones de Neynar requieren FID, así que solo las enviamos si hay FID
    if (!fid || fid === 0) {
      return NextResponse.json({ 
        enviado: false,
        mensaje: 'Se requiere conexión a Farcaster para enviar notificaciones',
        notificaciones,
      });
    }
    const notificacionesAltas = notificaciones.filter(n => n.prioridad === 'alta');
    
    if (notificacionesAltas.length > 0) {
      const maquinasList = notificacionesAltas
        .map(n => `• ${n.maquinaNombre} (${n.ubicacion})`)
        .join('\n');
      
      const resultado = await sendNeynarMiniAppNotification({
        fid,
        title: '⚠️ Máquinas listas para recolección',
        body: `Tienes ${notificacionesAltas.length} máquina(s) que necesitan recolección:\n\n${maquinasList}`,
      });
      
      return NextResponse.json({ 
        enviado: resultado.state === 'success',
        resultado,
        notificaciones: notificacionesAltas,
      });
    }
    
    return NextResponse.json({ 
      enviado: false,
      mensaje: 'No hay máquinas que requieran recolección urgente',
      notificaciones: [],
    });
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificaciones' },
      { status: 500 }
    );
  }
}

