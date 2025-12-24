"use client";

import { MaquinasList } from "./MaquinasList";

interface MaquinasTabProps {
  userId: string;
}

export function MaquinasTab({ userId }: MaquinasTabProps) {
  return (
    <MaquinasList
      userId={userId}
      onSelectMaquina={() => {}}
      onNuevaRecoleccion={() => {}}
    />
  );
}

