import { NextRequest, NextResponse } from 'next/server';
import { getUsuario, verificarPassword } from '~/lib/authStorage';
import { signToken } from '~/lib/authUtils';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const usuario = await getUsuario(email.toLowerCase());

    if (!usuario) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const passwordValida = await verificarPassword(password, usuario.passwordHash);

    if (!passwordValida) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Generar token
    const token = signToken(usuario.id);

    return NextResponse.json({
      success: true,
      token,
      userId: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

