export function accessDeniedMessage(menuName?: string) {
  return {
    title: 'Akses ditolak',
    description: menuName ? `Anda tidak memiliki izin untuk membuka menu "${menuName}".` : 'Anda tidak memiliki izin untuk membuka menu ini.',
    variant: 'destructive' as const
  };
}
