/** El sello del CRM: la «c» de Calidev sobre el acento. */
export function LogoCrm({ tamano = 26 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="var(--acento)" />
      <path d="M17 9.2a5.5 5.5 0 1 0 0 7.6" fill="none" stroke="var(--sobre-acento)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
