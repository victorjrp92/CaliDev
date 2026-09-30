import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Panel } from '@/components/senal/panel';
import { alternatesDe } from '@/lib/canonica';
import { textoLegal } from '@/lib/legal';

/**
 * Política de privacidad.
 *
 * La URL de esta página está registrada en las apps de Meta (developers.facebook.com)
 * como su política de privacidad: moverla o renombrarla rompe esas apps.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const texto = textoLegal('privacy', locale);
  if (!texto) return {};
  return {
    title: texto.titulo,
    description: texto.descripcion,
    alternates: alternatesDe(locale, '/privacy'),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const texto = textoLegal('privacy', locale);
  if (!texto) notFound();
  const t = await getTranslations({ locale, namespace: 'legal' });

  return (
    <main>
      <Panel fondo="verde">
        <p className="mono text-[var(--lima)]">
          {t('effective')}: {texto.vigencia}
        </p>
        {/* `hyphens-auto`: «Datenschutzerklärung» es una sola palabra y a 360 px
            no cabe en una línea; así se parte por sílaba con guion. */}
        <h1 className="mt-6 max-w-[22ch] text-[clamp(2.1rem,5vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance hyphens-auto [overflow-wrap:anywhere]">
          {texto.titulo}
        </h1>
        <p className="mt-6 max-w-[58ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.6] opacity-75">
          {texto.descripcion}
        </p>
      </Panel>

      <Panel fondo="hueso">
        <article className="articulo articulo-legal mx-auto max-w-[68ch]">
          <MDXRemote
            source={texto.contenido}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
          />
        </article>
      </Panel>
    </main>
  );
}
