import { NextRequest, NextResponse } from 'next/server';
import { getUsuario, crearUsuario } from '~/lib/authStorage';
import { signToken } from '~/lib/authUtils';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await getUsuario(email.toLowerCase());

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Crear nuevo usuario
    const nuevoUsuario = await crearUsuario({
      email: email.toLowerCase(),
      password,
      nombre: nombre || email.split('@')[0],
    });

    // Generar token
    const token = signToken(nuevoUsuario.id);

    return NextResponse.json({
      success: true,
      token,
      userId: nuevoUsuario.id,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
    });
  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

